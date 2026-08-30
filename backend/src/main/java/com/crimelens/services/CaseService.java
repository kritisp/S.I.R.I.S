package com.crimelens.services;

import com.crimelens.dto.request.AssignInvestigatorRequest;
import com.crimelens.dto.request.CreateCaseRequest;
import com.crimelens.dto.request.UpdateCaseRequest;
import com.crimelens.dto.response.CaseDTO;
import com.crimelens.dto.response.PagedResponse;
import com.crimelens.entities.CaseRecord;
import com.crimelens.entities.PoliceStation;
import com.crimelens.entities.User;
import com.crimelens.entities.enums.CasePriority;
import com.crimelens.entities.enums.CaseStatus;
import com.crimelens.entities.enums.UserRole;
import com.crimelens.exceptions.BadRequestException;
import com.crimelens.exceptions.DuplicateResourceException;
import com.crimelens.exceptions.ResourceNotFoundException;
import com.crimelens.exceptions.UnauthorizedAccessException;
import com.crimelens.repositories.AccessRequestRepository;
import com.crimelens.repositories.CaseRecordRepository;
import com.crimelens.repositories.PoliceStationRepository;
import com.crimelens.repositories.UserRepository;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
import com.crimelens.entities.enums.RequestStatus;
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

    public CaseService(CaseRecordRepository caseRepository,
                       PoliceStationRepository stationRepository,
                       UserRepository userRepository,
                       StationSecurityEvaluator securityEvaluator,
                       AuditService auditService,
                       AccessRequestRepository accessRequestRepository) {
        this.caseRepository = caseRepository;
        this.stationRepository = stationRepository;
        this.userRepository = userRepository;
        this.securityEvaluator = securityEvaluator;
        this.auditService = auditService;
        this.accessRequestRepository = accessRequestRepository;
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

    private String generateCaseId(String stationId) {
        int year = Year.now().getValue();
        String stationPrefix = stationId.replace("OP-", "").replace("-CAP", "").replace("-CITY", "");
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "CR-" + stationPrefix + "-" + year + "-" + randomSuffix;
    }
}
