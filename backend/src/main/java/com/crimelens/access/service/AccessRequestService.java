package com.crimelens.access.service;

import com.crimelens.audit.service.AuditService;
import com.crimelens.user.entity.User;

import com.crimelens.access.dto.request.CreateAccessRequest;
import com.crimelens.access.dto.response.AccessRequestDTO;
import com.crimelens.access.entity.AccessRequest;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.access.entity.enums.RequestStatus;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.common.exceptions.BadRequestException;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final CaseRecordRepository caseRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AccessRequestService(AccessRequestRepository accessRequestRepository,
                                CaseRecordRepository caseRepository,
                                UserRepository userRepository,
                                AuditService auditService) {
        this.accessRequestRepository = accessRequestRepository;
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AccessRequestDTO createRequest(CreateAccessRequest request, UserPrincipal actor) {
        if (actor.getStationId() == null) {
            throw new BadRequestException("Only station-affiliated officers can request case access.");
        }

        CaseRecord targetCase = caseRepository.findById(request.getTargetCaseId())
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", request.getTargetCaseId()));

        if (targetCase.getStation().getId().equalsIgnoreCase(actor.getStationId())) {
            throw new BadRequestException("You already have direct access to cases within your own station.");
        }

        var officer = userRepository.findById(actor.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actor.getUsername()));

        String requestId = "REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        AccessRequest accessRequest = new AccessRequest(
                requestId,
                officer.getStation(),
                officer,
                targetCase.getStation(),
                targetCase,
                request.getReason(),
                RequestStatus.PENDING
        );

        AccessRequest saved = accessRequestRepository.save(accessRequest);

        auditService.logUserAction(actor, "CREATE_ACCESS_REQUEST", "ACCESS_REQUEST", saved.getId(),
                "Requested access to case " + targetCase.getId() + " at station " + targetCase.getStation().getId());

        return AccessRequestDTO.fromEntity(saved);
    }

    @Transactional
    public AccessRequestDTO approveRequest(String requestId, UserPrincipal actor) {
        return updateRequestStatus(requestId, RequestStatus.APPROVED, actor);
    }

    @Transactional
    public AccessRequestDTO rejectRequest(String requestId, UserPrincipal actor) {
        return updateRequestStatus(requestId, RequestStatus.REJECTED, actor);
    }

    private AccessRequestDTO updateRequestStatus(String requestId, RequestStatus newStatus, UserPrincipal actor) {
        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AccessRequest", "id", requestId));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Access request has already been processed.");
        }

        // Validate that actor is an admin of the target station (or super admin)
        boolean isAuthorized = actor.getRole() == UserRole.SUPER_ADMIN ||
                (actor.getRole() == UserRole.STATION_ADMIN &&
                 actor.getStationId() != null &&
                 actor.getStationId().equalsIgnoreCase(request.getTargetStation().getId()));

        if (!isAuthorized) {
            throw new UnauthorizedAccessException("Unauthorized: Only commanders or admins of the target station ("
                    + request.getTargetStation().getId() + ") can process access requests.");
        }

        User approverUser = userRepository.findById(actor.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actor.getUsername()));
        request.setApprover(approverUser);
        request.setStatus(newStatus);
        AccessRequest saved = accessRequestRepository.save(request);

        auditService.logUserAction(actor, "RESOLVE_ACCESS_REQUEST", "ACCESS_REQUEST", saved.getId(),
                "Resolved access request " + requestId + " to status " + newStatus);

        return AccessRequestDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AccessRequestDTO> getIncomingRequests(UserPrincipal actor) {
        if (actor.getRole() == UserRole.SUPER_ADMIN) {
            return accessRequestRepository.findAll().stream()
                    .map(AccessRequestDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        if (actor.getRole() == UserRole.OFFICER) {
            throw new UnauthorizedAccessException("Unauthorized: Investigating officers cannot view incoming access requests.");
        }

        String stationId = actor.getStationId();
        if (stationId == null) {
            return List.of();
        }

        return accessRequestRepository.findByTargetStationId(stationId).stream()
                .map(AccessRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AccessRequestDTO> getOutgoingRequests(UserPrincipal actor) {
        if (actor.getRole() == UserRole.SUPER_ADMIN) {
            return accessRequestRepository.findAll().stream()
                    .map(AccessRequestDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        String stationId = actor.getStationId();
        if (stationId == null) {
            return List.of();
        }

        if (actor.getRole() == UserRole.STATION_ADMIN) {
            return accessRequestRepository.findByRequestingStationId(stationId).stream()
                    .map(AccessRequestDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        // Officer can only see requests they created
        return accessRequestRepository.findByRequestingOfficerId(actor.getUsername()).stream()
                .map(AccessRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
