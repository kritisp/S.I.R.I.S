package com.crimelens.evidence.service;

import com.crimelens.audit.service.AuditService;
import com.crimelens.audit.service.AuditChainService;
import com.crimelens.audit.dto.response.ChainVerificationResultDTO;
import com.crimelens.audit.security.HashChainUtils;
import com.crimelens.evidence.dto.request.CreateEvidenceRequest;
import com.crimelens.evidence.dto.response.EvidenceDTO;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.evidence.entity.Evidence;
import com.crimelens.user.entity.User;
import com.crimelens.access.entity.enums.RequestStatus;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.evidence.repository.EvidenceRepository;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
import com.crimelens.security.crypto.EvidenceCryptoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final CaseRecordRepository caseRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final UserRepository userRepository;
    private final StationSecurityEvaluator securityEvaluator;
    private final AuditService auditService;
    private final AuditChainService auditChainService;
    private final EvidenceCryptoService cryptoService;

    public EvidenceService(EvidenceRepository evidenceRepository,
                           CaseRecordRepository caseRepository,
                           AccessRequestRepository accessRequestRepository,
                           UserRepository userRepository,
                           StationSecurityEvaluator securityEvaluator,
                           AuditService auditService,
                           AuditChainService auditChainService,
                           EvidenceCryptoService cryptoService) {
        this.evidenceRepository = evidenceRepository;
        this.caseRepository = caseRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.userRepository = userRepository;
        this.securityEvaluator = securityEvaluator;
        this.auditService = auditService;
        this.auditChainService = auditChainService;
        this.cryptoService = cryptoService;
    }

    @Transactional(readOnly = true)
    public List<EvidenceDTO> getEvidence(String caseId, UserPrincipal actor) {
        if (caseId != null && !caseId.isBlank()) {
            return getEvidenceByCaseId(caseId, actor);
        }

        if (actor.getRole() == com.crimelens.user.entity.enums.UserRole.SUPER_ADMIN) {
            return evidenceRepository.findAll().stream()
                    .map(EvidenceDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        String userStation = actor.getStationId();
        if (userStation == null) {
            return List.of();
        }

        return evidenceRepository.findByCaseRecordStationId(userStation).stream()
                .map(EvidenceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EvidenceDTO> getEvidenceByCaseId(String caseId, UserPrincipal actor) {
        CaseRecord caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", caseId));

        boolean hasAccess = securityEvaluator.canAccessCase(actor, caseRecord) ||
                accessRequestRepository.existsByRequestingOfficerIdAndTargetCaseIdAndStatus(
                        actor.getUsername(), caseId, RequestStatus.APPROVED);

        if (!hasAccess) {
            throw new UnauthorizedAccessException("Access denied: You do not have permission to view evidence for this case.");
        }

        return evidenceRepository.findByCaseRecordId(caseId).stream()
                .map(EvidenceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public EvidenceDTO getEvidenceById(String evidenceId, UserPrincipal actor) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence", "id", evidenceId));

        boolean hasAccess = securityEvaluator.canAccessCase(actor, evidence.getCaseRecord()) ||
                accessRequestRepository.existsByRequestingOfficerIdAndTargetCaseIdAndStatus(
                        actor.getUsername(), evidence.getCaseRecord().getId(), RequestStatus.APPROVED);

        if (!hasAccess) {
            throw new UnauthorizedAccessException("Access denied: You do not have permission to access evidence " + evidenceId);
        }

        auditService.logUserAction(actor, "EVIDENCE_ACCESSED", "EVIDENCE", evidenceId,
                "Accessed evidence " + evidenceId + " for case " + evidence.getCaseRecord().getId());

        auditChainService.appendToChain(
                "EVIDENCE:" + evidenceId,
                "EVIDENCE_ACCESSED",
                evidence.getCaseRecord().getId(),
                evidenceId,
                actor.getUsername(),
                actor.getName(),
                actor.getRole().name(),
                actor.getStationId(),
                null,
                "Accessed evidence details"
        );

        return EvidenceDTO.fromEntity(evidence);
    }

    @Transactional
    public EvidenceDTO addEvidence(CreateEvidenceRequest request, UserPrincipal actor) {
        CaseRecord caseRecord = caseRepository.findById(request.getCaseId())
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", request.getCaseId()));

        boolean hasAccess = securityEvaluator.canAccessCase(actor, caseRecord);
        if (!hasAccess) {
            throw new UnauthorizedAccessException("Access denied: You can only upload evidence to cases owned by your station.");
        }

        String evidenceId = request.getId();
        if (evidenceId == null || evidenceId.isBlank()) {
            evidenceId = "EVID-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        User uploader = userRepository.findById(actor.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actor.getUsername()));

        // Calculate cryptographic SHA-256 hash of original evidence content before storage
        String rawContent = (request.getDescription() != null ? request.getDescription() : "") + "|" +
                            (request.getSource() != null ? request.getSource() : "") + "|" +
                            (request.getFileMetadata() != null ? request.getFileMetadata() : "");
        String contentHash = HashChainUtils.sha256(rawContent);

        // Protect file metadata at rest using AES-256-GCM with AAD bound to evidence ID
        String encryptedMetadata = request.getFileMetadata();
        if (request.getFileMetadata() != null && !request.getFileMetadata().isBlank()) {
            encryptedMetadata = cryptoService.encryptToString(request.getFileMetadata(), "EVIDENCE:" + evidenceId);
        }

        Evidence evidence = new Evidence(
                evidenceId,
                caseRecord,
                uploader,
                request.getSource(),
                encryptedMetadata,
                request.getDescription(),
                request.getType(),
                Instant.now(),
                request.getEntitiesExtracted()
        );

        Evidence saved = evidenceRepository.save(evidence);

        // Add evidence reference string to CaseRecord
        caseRecord.getEvidenceRefs().add(evidenceId);
        caseRepository.save(caseRecord);

        auditService.logUserAction(actor, "ADD_EVIDENCE", "EVIDENCE", saved.getId(),
                "Added evidence element to case " + caseRecord.getId());

        // Record evidence registered and hashed in tamper-evident hash chain
        auditChainService.appendToChain(
                "CASE:" + caseRecord.getId(),
                "EVIDENCE_REGISTERED",
                caseRecord.getId(),
                saved.getId(),
                actor.getUsername(),
                actor.getName(),
                actor.getRole().name(),
                actor.getStationId(),
                contentHash,
                "Registered evidence " + saved.getId() + " (" + saved.getType() + ")"
        );

        auditChainService.appendToChain(
                "EVIDENCE:" + saved.getId(),
                "EVIDENCE_HASHED",
                caseRecord.getId(),
                saved.getId(),
                actor.getUsername(),
                actor.getName(),
                actor.getRole().name(),
                actor.getStationId(),
                contentHash,
                "Calculated SHA-256 content hash: " + contentHash
        );

        return EvidenceDTO.fromEntity(saved);
    }

    @Transactional
    public ChainVerificationResultDTO verifyEvidenceIntegrity(String evidenceId, UserPrincipal actor) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence", "id", evidenceId));

        ChainVerificationResultDTO result = auditChainService.verifyEvidenceIntegrity(evidenceId);

        boolean isMatched = "VERIFIED".equalsIgnoreCase(result.getStatus());
        String eventType = isMatched ? "EVIDENCE_VERIFIED" : "EVIDENCE_VERIFY_FAILED";
        String note = isMatched
                ? "Integrity verification PASSED: SHA-256 content hash matched cryptographically linked chain."
                : "Integrity verification FAILED: " + result.getFailureReason();

        auditService.logUserAction(actor, eventType, "EVIDENCE", evidenceId, note);

        auditChainService.appendToChain(
                "EVIDENCE:" + evidenceId,
                eventType,
                evidence.getCaseRecord().getId(),
                evidenceId,
                actor != null ? actor.getUsername() : "SYSTEM",
                actor != null ? actor.getName() : "Audit System",
                actor != null ? actor.getRole().name() : "SYSTEM",
                actor != null ? actor.getStationId() : "HQ",
                null,
                note
        );

        return result;
    }

    @Transactional
    public EvidenceDTO sealEvidence(String evidenceId, String reason, UserPrincipal actor) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence", "id", evidenceId));

        if (!securityEvaluator.canAccessCase(actor, evidence.getCaseRecord())) {
            throw new UnauthorizedAccessException("Access denied: You cannot seal evidence for station " + evidence.getCaseRecord().getStation().getId());
        }

        String sealNote = "SEALED: " + (reason != null && !reason.isBlank() ? reason.trim() : "Withdrawn from active investigation custody");
        evidence.setDescription(sealNote + " | " + evidence.getDescription());

        Evidence saved = evidenceRepository.save(evidence);

        auditService.logUserAction(actor, "EVIDENCE_SEALED", "EVIDENCE", evidenceId, sealNote);

        auditChainService.appendToChain(
                "EVIDENCE:" + evidenceId,
                "EVIDENCE_SEALED",
                evidence.getCaseRecord().getId(),
                evidenceId,
                actor.getUsername(),
                actor.getName(),
                actor.getRole().name(),
                actor.getStationId(),
                null,
                sealNote
        );

        return EvidenceDTO.fromEntity(saved);
    }
}
