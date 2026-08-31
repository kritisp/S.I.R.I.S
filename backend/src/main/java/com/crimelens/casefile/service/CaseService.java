package com.crimelens.casefile.service;

import com.crimelens.audit.service.AuditService;

import com.crimelens.casefile.dto.request.AssignInvestigatorRequest;
import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.casefile.dto.request.UpdateCaseRequest;
import com.crimelens.casefile.dto.response.CaseDTO;
import com.crimelens.common.dto.PagedResponse;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.user.entity.User;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.common.exceptions.BadRequestException;
import com.crimelens.common.exceptions.DuplicateResourceException;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
import com.crimelens.access.entity.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CaseService {

    private final CaseRecordRepository caseRepository;
    private final PoliceStationRepository stationRepository;
    private final UserRepository userRepository;
    private final StationSecurityEvaluator securityEvaluator;
    private final AuditService auditService;
    private final AccessRequestRepository accessRequestRepository;
    private final com.crimelens.intelligence.ml.client.FirIntelligenceClient firBnsClient;

    public CaseService(CaseRecordRepository caseRepository,
                       PoliceStationRepository stationRepository,
                       UserRepository userRepository,
                       StationSecurityEvaluator securityEvaluator,
                       AuditService auditService,
                       AccessRequestRepository accessRequestRepository,
                       com.crimelens.intelligence.ml.client.FirIntelligenceClient firBnsClient) {
        this.caseRepository = caseRepository;
        this.stationRepository = stationRepository;
        this.userRepository = userRepository;
        this.securityEvaluator = securityEvaluator;
        this.auditService = auditService;
        this.accessRequestRepository = accessRequestRepository;
        this.firBnsClient = firBnsClient;
    }

    @Transactional
    public CaseDTO createCase(CreateCaseRequest request, UserPrincipal actor) {
        // Determine Station ID
        String resolvedStationId = request.getStationId();
        if (resolvedStationId == null || resolvedStationId.isBlank()) {
            resolvedStationId = actor.getStationId();
        }

        if (resolvedStationId == null) {
            throw new BadRequestException("Station ID must be specified for case registration");
        }

        final String targetStationId = resolvedStationId;

        // Verify actor authorization for this station
        if (!securityEvaluator.canAccessStation(actor, targetStationId)) {
            throw new UnauthorizedAccessException("Unauthorized to lodge FIR for station: " + targetStationId);
        }

        PoliceStation station = stationRepository.findById(targetStationId)
                .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", targetStationId));

        // Determine Investigator
        User investigator = null;
        String targetInvestigatorId = request.getInvestigatorId();
        if (targetInvestigatorId == null || targetInvestigatorId.isBlank()) {
            targetInvestigatorId = actor.getUsername();
        }

        if (targetInvestigatorId != null && !targetInvestigatorId.isBlank()) {
            investigator = userRepository.findById(targetInvestigatorId).orElse(null);
            if (investigator != null && investigator.getStation() != null) {
                if (!investigator.getStation().getId().equalsIgnoreCase(targetStationId)) {
                    throw new BadRequestException("Investigator [" + targetInvestigatorId + "] does not belong to station: " + targetStationId);
                }
            }
        }

        // Validate FIR Number
        if (caseRepository.existsByFirNumber(request.getFirNumber())) {
            throw new DuplicateResourceException("Case with FIR Number '" + request.getFirNumber() + "' already exists");
        }

        // Generate ID if not provided
        String caseId = request.getId();
        if (caseId == null || caseId.isBlank()) {
            caseId = generateCaseId(targetStationId);
        } else if (caseRepository.existsById(caseId)) {
            throw new DuplicateResourceException("Case with ID '" + caseId + "' already exists");
        }

        CaseRecord caseRecord = new CaseRecord(
                caseId,
                request.getFirNumber(),
                station,
                investigator,
                request.getTitle(),
                request.getDescription(),
                request.getCrimeType(),
                request.getStatus() != null ? request.getStatus() : CaseStatus.PENDING,
                request.getPriority() != null ? request.getPriority() : CasePriority.MEDIUM,
                request.getIncidentDate() != null ? request.getIncidentDate() : Instant.now()
        );

        if (request.getBnsSections() != null) caseRecord.setBnsSections(request.getBnsSections());
        if (request.getSuspects() != null) caseRecord.setSuspects(request.getSuspects());
        if (request.getVehicles() != null) caseRecord.setVehicles(request.getVehicles());
        if (request.getLocations() != null) caseRecord.setLocations(request.getLocations());
        if (request.getEvidenceRefs() != null) caseRecord.setEvidenceRefs(request.getEvidenceRefs());
        if (request.getCctvRefs() != null) caseRecord.setCctvRefs(request.getCctvRefs());
        if (request.getLinkedCaseIds() != null) caseRecord.setLinkedCaseIds(request.getLinkedCaseIds());
        if (request.getEntities() != null) caseRecord.setEntities(request.getEntities());

        CaseRecord saved = caseRepository.save(caseRecord);

        auditService.logUserAction(actor, "CREATE_CASE", "CASE", saved.getId(),
                "Lodged FIR " + saved.getFirNumber() + " at station " + targetStationId);

        return CaseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public CaseDTO getCaseById(String id, UserPrincipal actor) {
        CaseRecord caseRecord = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", id));

        boolean hasRequestAccess = accessRequestRepository.existsByRequestingOfficerIdAndTargetCaseIdAndStatus(
                actor.getUsername(), caseRecord.getId(), RequestStatus.APPROVED);

        if (!securityEvaluator.canAccessCase(actor, caseRecord) && !hasRequestAccess) {
            auditService.logUserAction(actor, "UNAUTHORIZED_CASE_ACCESS_ATTEMPT", "CASE", id,
                    "Access denied to case " + id + " from station " + caseRecord.getStation().getId());
            throw new UnauthorizedAccessException("Access denied: You do not have permission to access case records from station " + caseRecord.getStation().getId());
        }

        auditService.logUserAction(actor, "VIEW_CASE", "CASE", id, "Viewed case details for " + id);

        return CaseDTO.fromEntity(caseRecord);
    }

    @Transactional(readOnly = true)
    public PagedResponse<CaseDTO> searchCases(
            String stationFilter,
            String investigatorFilter,
            CaseStatus status,
            CasePriority priority,
            String crimeType,
            String query,
            Pageable pageable,
            UserPrincipal actor) {

        // Enforce station isolation based on user role
        String effectiveStationId = null;
        String effectiveInvestigatorId = null;

        if (actor.getRole() == UserRole.SUPER_ADMIN) {
            effectiveStationId = (stationFilter != null && !stationFilter.isBlank() && !"ALL".equalsIgnoreCase(stationFilter)) ? stationFilter : null;
            effectiveInvestigatorId = (investigatorFilter != null && !investigatorFilter.isBlank() && !"ALL".equalsIgnoreCase(investigatorFilter)) ? investigatorFilter : null;
        } else if (actor.getRole() == UserRole.STATION_ADMIN) {
            effectiveStationId = actor.getStationId();
            effectiveInvestigatorId = (investigatorFilter != null && !investigatorFilter.isBlank() && !"ALL".equalsIgnoreCase(investigatorFilter)) ? investigatorFilter : null;
        } else if (actor.getRole() == UserRole.OFFICER) {
            effectiveStationId = actor.getStationId();
            // Optional: if officer wants to view only their assigned cases
            if ("ME".equalsIgnoreCase(investigatorFilter) || (investigatorFilter != null && investigatorFilter.equalsIgnoreCase(actor.getUsername()))) {
                effectiveInvestigatorId = actor.getUsername();
            }
        }

        Page<CaseDTO> page = caseRepository.searchCases(
                effectiveStationId,
                effectiveInvestigatorId,
                status,
                priority,
                crimeType,
                query,
                pageable
        ).map(CaseDTO::fromEntity);

        return PagedResponse.of(page);
    }

    @Transactional
    public CaseDTO updateCase(String id, UpdateCaseRequest request, UserPrincipal actor) {
        CaseRecord caseRecord = caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", id));

        if (!securityEvaluator.canAccessCase(actor, caseRecord)) {
            throw new UnauthorizedAccessException("Access denied: You cannot update case records from station " + caseRecord.getStation().getId());
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            caseRecord.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            caseRecord.setDescription(request.getDescription());
        }
        if (request.getCrimeType() != null && !request.getCrimeType().isBlank()) {
            caseRecord.setCrimeType(request.getCrimeType());
        }
        if (request.getStatus() != null) {
            caseRecord.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            caseRecord.setPriority(request.getPriority());
        }
        if (request.getIncidentDate() != null) {
            caseRecord.setIncidentDate(request.getIncidentDate());
        }
        if (request.getBnsSections() != null) {
            caseRecord.setBnsSections(request.getBnsSections());
        }
        if (request.getSuspects() != null) {
            caseRecord.setSuspects(request.getSuspects());
        }
        if (request.getVehicles() != null) {
            caseRecord.setVehicles(request.getVehicles());
        }
        if (request.getLocations() != null) {
            caseRecord.setLocations(request.getLocations());
        }
        if (request.getEvidenceRefs() != null) {
            caseRecord.setEvidenceRefs(request.getEvidenceRefs());
        }
        if (request.getCctvRefs() != null) {
            caseRecord.setCctvRefs(request.getCctvRefs());
        }
        if (request.getLinkedCaseIds() != null) {
            caseRecord.setLinkedCaseIds(request.getLinkedCaseIds());
        }
        if (request.getEntities() != null) {
            caseRecord.setEntities(request.getEntities());
        }

        CaseRecord updated = caseRepository.save(caseRecord);

        auditService.logUserAction(actor, "UPDATE_CASE", "CASE", updated.getId(),
                "Updated case record: " + updated.getId());

        return CaseDTO.fromEntity(updated);
    }

    @Transactional
    public CaseDTO assignInvestigator(String caseId, AssignInvestigatorRequest request, UserPrincipal actor) {
        CaseRecord caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", caseId));

        if (!securityEvaluator.canAccessCase(actor, caseRecord)) {
            throw new UnauthorizedAccessException("Access denied: Cannot reassign case from station " + caseRecord.getStation().getId());
        }

        // Only Station Admin or Super Admin can reassign cases
        if (actor.getRole() == UserRole.OFFICER) {
            throw new UnauthorizedAccessException("Investigating officers cannot reassign case ownership");
        }

        User newInvestigator = userRepository.findById(request.getInvestigatorId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getInvestigatorId()));

        // Ensure investigator belongs to the same station
        if (newInvestigator.getStation() != null &&
            !newInvestigator.getStation().getId().equalsIgnoreCase(caseRecord.getStation().getId())) {
            throw new BadRequestException("Investigator [" + newInvestigator.getId() + "] belongs to station ["
                    + newInvestigator.getStation().getId() + "] but case belongs to [" + caseRecord.getStation().getId() + "]");
        }

        caseRecord.setInvestigator(newInvestigator);
        if (caseRecord.getStatus() == CaseStatus.PENDING) {
            caseRecord.setStatus(CaseStatus.INVESTIGATING);
        }

        CaseRecord updated = caseRepository.save(caseRecord);

        auditService.logUserAction(actor, "ASSIGN_INVESTIGATOR", "CASE", caseId,
                "Assigned case " + caseId + " to officer " + newInvestigator.getName() + " [" + newInvestigator.getId() + "]");

        return CaseDTO.fromEntity(updated);
    }

    @Transactional
    public com.crimelens.intelligence.dto.FirIntelligenceResponseDTO analyzeCaseFir(String caseId, String rawText, UserPrincipal actor) {
        CaseRecord caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", caseId));

        if (!securityEvaluator.canAccessCase(actor, caseRecord)) {
            throw new UnauthorizedAccessException("Access denied: Cannot access case " + caseId + " from station " + caseRecord.getStation().getId());
        }

        String narrative = (rawText != null && !rawText.isBlank()) ? rawText.trim() : caseRecord.getDescription();
        if (narrative == null || narrative.isBlank()) {
            throw new BadRequestException("Case description narrative is empty. Cannot analyze FIR.");
        }

        com.crimelens.intelligence.dto.FirIntelligenceRequestDTO req = 
                new com.crimelens.intelligence.dto.FirIntelligenceRequestDTO(narrative, "case_record", caseId);

        com.crimelens.intelligence.dto.FirIntelligenceResponseDTO response = firBnsClient.processFir(req);

        // Update CaseRecord BNS sections in PostgreSQL if returned
        if (response != null && response.getBnsSections() != null && !response.getBnsSections().isEmpty()) {
            List<String> extractedSections = response.getBnsSections().stream()
                    .map(b -> (String) b.get("section"))
                    .filter(s -> s != null && !s.isBlank())
                    .distinct()
                    .toList();
            if (!extractedSections.isEmpty()) {
                caseRecord.getBnsSections().clear();
                caseRecord.getBnsSections().addAll(extractedSections);
                caseRepository.save(caseRecord);
            }
        }

        auditService.logUserAction(actor, "FIR_INTELLIGENCE_ANALYZED", "CASE", caseId,
                "Executed FIR BNS Intelligence analysis for case " + caseId);

        return response;
    }

    public com.crimelens.intelligence.dto.FirIntelligenceResponseDTO processRawFir(String rawText, UserPrincipal actor) {
        if (actor == null) {
            throw new UnauthorizedAccessException("User authentication required");
        }
        if (rawText == null || rawText.isBlank()) {
            throw new BadRequestException("Raw FIR text cannot be empty");
        }

        com.crimelens.intelligence.dto.FirIntelligenceRequestDTO req = 
                new com.crimelens.intelligence.dto.FirIntelligenceRequestDTO(rawText.trim(), "raw_input", null);

        com.crimelens.intelligence.dto.FirIntelligenceResponseDTO response = firBnsClient.processFir(req);

        auditService.logUserAction(actor, "RAW_FIR_ANALYZED", "FIR", "RAW",
                "Processed standalone raw FIR text analysis");

        return response;
    }

    private String generateCaseId(String stationId) {
        int year = Year.now().getValue();
        String stationPrefix = stationId.replace("OP-", "").replace("-CAP", "").replace("-CITY", "");
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "CR-" + stationPrefix + "-" + year + "-" + randomSuffix;
    }
}
