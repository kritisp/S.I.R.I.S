package com.crimelens.audit.service;

import com.crimelens.audit.dto.response.AuditChainRecordDTO;
import com.crimelens.audit.dto.response.ChainVerificationResultDTO;
import com.crimelens.audit.dto.response.RecordVerificationItemDTO;
import com.crimelens.audit.entity.AuditChainRecord;
import com.crimelens.audit.repository.AuditChainRepository;
import com.crimelens.audit.security.HashChainUtils;
import com.crimelens.evidence.entity.Evidence;
import com.crimelens.evidence.repository.EvidenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuditChainService {

    private static final Logger logger = LoggerFactory.getLogger(AuditChainService.class);

    private final AuditChainRepository auditChainRepository;
    private final EvidenceRepository evidenceRepository;

    public AuditChainService(AuditChainRepository auditChainRepository, EvidenceRepository evidenceRepository) {
        this.auditChainRepository = auditChainRepository;
        this.evidenceRepository = evidenceRepository;
    }

    /**
     * Thread-safely records a cryptographically linked event into the specified chain scope.
     */
    @Transactional
    public synchronized AuditChainRecord appendToChain(
            String chainScopeInput,
            String eventType,
            String caseId,
            String evidenceId,
            String actorId,
            String actorName,
            String actorRole,
            String stationId,
            String contentHashInput,
            String details
    ) {
        String chainScope = (chainScopeInput != null && !chainScopeInput.isBlank()) ? chainScopeInput.trim() : "GLOBAL";

        Optional<AuditChainRecord> latestOpt = auditChainRepository.findFirstByChainScopeOrderBySequenceIndexDesc(chainScope);

        long sequenceIndex = 1L;
        String previousHash = HashChainUtils.GENESIS_PREVIOUS_HASH;

        if (latestOpt.isPresent()) {
            AuditChainRecord latest = latestOpt.get();
            sequenceIndex = latest.getSequenceIndex() + 1;
            previousHash = latest.getCurrentHash();
        }

        String recordId = "ACR-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        Instant now = Instant.now();

        String canonicalPayload = HashChainUtils.buildCanonicalPayload(eventType, actorId, caseId, evidenceId, contentHashInput, details);
        String currentHash = HashChainUtils.calculateCurrentHash(canonicalPayload, previousHash, sequenceIndex, now);

        AuditChainRecord record = new AuditChainRecord(
                recordId,
                chainScope,
                sequenceIndex,
                caseId,
                evidenceId,
                eventType,
                actorId,
                actorName,
                actorRole,
                stationId,
                now,
                canonicalPayload,
                contentHashInput,
                previousHash,
                currentHash
        );

        AuditChainRecord saved = auditChainRepository.saveAndFlush(record);
        logger.info("HASH-CHAIN [{}]: Seq #{} Record [{}] Action [{}] Hash [{}]",
                chainScope, sequenceIndex, recordId, eventType, currentHash);

        return saved;
    }

    /**
     * Verifies sequential cryptographic integrity for the specified chain scope.
     */
    @Transactional(readOnly = true)
    public ChainVerificationResultDTO verifyChain(String chainScopeInput) {
        String chainScope = (chainScopeInput != null && !chainScopeInput.isBlank()) ? chainScopeInput.trim() : "GLOBAL";
        List<AuditChainRecord> records = auditChainRepository.findByChainScopeOrderBySequenceIndexAsc(chainScope);

        ChainVerificationResultDTO result = new ChainVerificationResultDTO(chainScope);
        result.setTotalRecords(records.size());

        if (records.isEmpty()) {
            result.setVerifiedRecords(0);
            result.setStatus("VERIFIED");
            return result;
        }

        String expectedPreviousHash = HashChainUtils.GENESIS_PREVIOUS_HASH;
        long expectedSequence = 1L;
        int verifiedCount = 0;

        for (AuditChainRecord rec : records) {
            RecordVerificationItemDTO item = new RecordVerificationItemDTO();
            item.setRecordId(rec.getRecordId());
            item.setSequenceIndex(rec.getSequenceIndex());
            item.setEventType(rec.getEventType());
            item.setStoredPreviousHash(rec.getPreviousHash());
            item.setExpectedPreviousHash(expectedPreviousHash);
            item.setStoredCurrentHash(rec.getCurrentHash());

            // 1. Sequence continuity check
            if (!rec.getSequenceIndex().equals(expectedSequence)) {
                item.setPreviousHashValid(false);
                item.setStatus("COMPROMISED");
                item.setFailureDetails("Sequence discontinuity: Expected #" + expectedSequence + " but found #" + rec.getSequenceIndex());

                markVerificationFailed(result, rec, item, "Sequence discontinuity detected at index #" + rec.getSequenceIndex());
                result.getItems().add(item);
                break;
            }

            // 2. Previous Hash linkage check
            if (!Objects.equals(rec.getPreviousHash(), expectedPreviousHash)) {
                item.setPreviousHashValid(false);
                item.setStatus("COMPROMISED");
                item.setFailureDetails("Broken previous hash link: Expected " + expectedPreviousHash + " but found " + rec.getPreviousHash());

                markVerificationFailed(result, rec, item, "Cryptographic hash chain broken at record " + rec.getRecordId());
                result.getItems().add(item);
                break;
            }

            // 3. Current Hash integrity re-computation check
            String recalculatedHash = HashChainUtils.calculateCurrentHash(
                    rec.getCanonicalPayload(),
                    rec.getPreviousHash(),
                    rec.getSequenceIndex(),
                    rec.getTimestamp()
            );
            item.setCalculatedCurrentHash(recalculatedHash);

            if (!Objects.equals(rec.getCurrentHash(), recalculatedHash)) {
                item.setCurrentHashValid(false);
                item.setStatus("COMPROMISED");
                item.setFailureDetails("Canonical record content tampered: Stored hash " + rec.getCurrentHash() + " != Calculated " + recalculatedHash);

                markVerificationFailed(result, rec, item, "Tampering detected in record content for " + rec.getRecordId());
                result.getItems().add(item);
                break;
            }

            // Record passed all checks
            verifiedCount++;
            result.getItems().add(item);

            expectedPreviousHash = rec.getCurrentHash();
            expectedSequence++;
        }

        result.setVerifiedRecords(verifiedCount);
        return result;
    }

    /**
     * Verifies cryptographic integrity of a specific evidence item against the audit chain.
     */
    @Transactional(readOnly = true)
    public ChainVerificationResultDTO verifyEvidenceIntegrity(String evidenceId) {
        Evidence evidence = evidenceRepository.findById(evidenceId).orElse(null);
        List<AuditChainRecord> evidenceRecords = auditChainRepository.findByEvidenceIdOrderBySequenceIndexAsc(evidenceId);

        ChainVerificationResultDTO result = new ChainVerificationResultDTO("EVIDENCE:" + evidenceId);
        result.setTotalRecords(evidenceRecords.size());

        if (evidence == null) {
            result.setStatus("COMPROMISED");
            result.setFailureReason("Evidence record " + evidenceId + " not found in database.");
            return result;
        }

        // Recompute content hash from live evidence description / metadata / source
        String liveContent = (evidence.getDescription() != null ? evidence.getDescription() : "") + "|" +
                             (evidence.getSource() != null ? evidence.getSource() : "") + "|" +
                             (evidence.getFileMetadata() != null ? evidence.getFileMetadata() : "");
        String liveContentHash = HashChainUtils.sha256(liveContent);

        int verifiedCount = 0;
        for (AuditChainRecord rec : evidenceRecords) {
            RecordVerificationItemDTO item = new RecordVerificationItemDTO();
            item.setRecordId(rec.getRecordId());
            item.setSequenceIndex(rec.getSequenceIndex());
            item.setEventType(rec.getEventType());
            item.setStoredPreviousHash(rec.getPreviousHash());
            item.setStoredCurrentHash(rec.getCurrentHash());

            if (rec.getContentHash() != null && !rec.getContentHash().isBlank()) {
                if (!rec.getContentHash().equals(liveContentHash)) {
                    item.setContentHashValid(false);
                    item.setStatus("COMPROMISED");
                    item.setFailureDetails("Live evidence content modified after registration. Stored hash: " + rec.getContentHash() + " vs Live: " + liveContentHash);

                    result.setStatus("COMPROMISED");
                    result.setBrokenRecordId(rec.getRecordId());
                    result.setBrokenSequenceIndex(rec.getSequenceIndex());
                    result.setFailureReason("Evidence content hash mismatch for " + evidenceId);
                    result.getItems().add(item);
                    return result;
                }
            }
            verifiedCount++;
            result.getItems().add(item);
        }

        result.setVerifiedRecords(verifiedCount);
        result.setStatus("VERIFIED");
        return result;
    }

    private void markVerificationFailed(ChainVerificationResultDTO result, AuditChainRecord record, RecordVerificationItemDTO item, String reason) {
        result.setStatus("COMPROMISED");
        result.setBrokenRecordId(record.getRecordId());
        result.setBrokenSequenceIndex(record.getSequenceIndex());
        result.setFailureReason(reason);
    }

    @Transactional(readOnly = true)
    public List<AuditChainRecordDTO> getChainRecordsForScope(String chainScope) {
        return auditChainRepository.findByChainScopeOrderBySequenceIndexAsc(chainScope)
                .stream()
                .map(AuditChainRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditChainRecordDTO> getChainRecordsForCase(String caseId) {
        return auditChainRepository.findByCaseIdOrderBySequenceIndexAsc(caseId)
                .stream()
                .map(AuditChainRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
