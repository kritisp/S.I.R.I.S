package com.crimelens.evidence.service;

import com.crimelens.audit.service.AuditService;

import com.crimelens.evidence.dto.request.CreateEvidenceRequest;
import com.crimelens.evidence.dto.response.EvidenceDTO;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.evidence.entity.Evidence;
import com.crimelens.access.entity.enums.RequestStatus;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.evidence.repository.EvidenceRepository;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
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
    private final StationSecurityEvaluator securityEvaluator;
    private final AuditService auditService;

    public EvidenceService(EvidenceRepository evidenceRepository,
                           CaseRecordRepository caseRepository,
                           AccessRequestRepository accessRequestRepository,
                           StationSecurityEvaluator securityEvaluator,
                           AuditService auditService) {
        this.evidenceRepository = evidenceRepository;
        this.caseRepository = caseRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.securityEvaluator = securityEvaluator;
        this.auditService = auditService;
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

        Evidence evidence = new Evidence(
                evidenceId,
                caseRecord,
                request.getDescription(),
                request.getType(),
                Instant.now(),
                request.getEntitiesExtracted()
        );

        Evidence saved = evidenceRepository.save(evidence);

        // Also add the evidence reference string to the CaseRecord
        caseRecord.getEvidenceRefs().add(evidenceId);
        caseRepository.save(caseRecord);

        auditService.logUserAction(actor, "ADD_EVIDENCE", "EVIDENCE", saved.getId(),
                "Added evidence element to case " + caseRecord.getId());

        return EvidenceDTO.fromEntity(saved);
    }
}
