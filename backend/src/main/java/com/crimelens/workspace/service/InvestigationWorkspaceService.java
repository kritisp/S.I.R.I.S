package com.crimelens.workspace.service;

import com.crimelens.audit.service.AuditService;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.common.exceptions.BadRequestException;
import com.crimelens.common.exceptions.DuplicateResourceException;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.workspace.dto.request.CreateWorkspaceRequest;
import com.crimelens.workspace.dto.request.UpdateWorkspaceRequest;
import com.crimelens.workspace.dto.response.TriggerDTO;
import com.crimelens.workspace.dto.response.WorkspaceCaseDTO;
import com.crimelens.workspace.dto.response.WorkspaceDTO;
import com.crimelens.workspace.dto.response.WorkspaceIntelligenceResultDTO;
import com.crimelens.workspace.entity.InvestigationTrigger;
import com.crimelens.workspace.entity.InvestigationWorkspace;
import com.crimelens.workspace.entity.WorkspaceCase;
import com.crimelens.workspace.entity.WorkspaceIntelligenceResult;
import com.crimelens.workspace.entity.enums.TriggerStatus;
import com.crimelens.workspace.entity.enums.WorkspaceStatus;
import com.crimelens.workspace.repository.InvestigationTriggerRepository;
import com.crimelens.workspace.repository.InvestigationWorkspaceRepository;
import com.crimelens.workspace.repository.WorkspaceCaseRepository;
import com.crimelens.workspace.repository.WorkspaceIntelligenceResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InvestigationWorkspaceService {

    private final InvestigationWorkspaceRepository workspaceRepository;
    private final WorkspaceCaseRepository workspaceCaseRepository;
    private final InvestigationTriggerRepository triggerRepository;
    private final WorkspaceIntelligenceResultRepository resultRepository;
    private final CaseRecordRepository caseRepository;
    private final PoliceStationRepository stationRepository;
    private final UserRepository userRepository;
    private final StationSecurityEvaluator securityEvaluator;
    private final AuditService auditService;
    private final InvestigationTriggerService triggerService;

    public InvestigationWorkspaceService(InvestigationWorkspaceRepository workspaceRepository,
                                         WorkspaceCaseRepository workspaceCaseRepository,
                                         InvestigationTriggerRepository triggerRepository,
                                         WorkspaceIntelligenceResultRepository resultRepository,
                                         CaseRecordRepository caseRepository,
                                         PoliceStationRepository stationRepository,
                                         UserRepository userRepository,
                                         StationSecurityEvaluator securityEvaluator,
                                         AuditService auditService,
                                         InvestigationTriggerService triggerService) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceCaseRepository = workspaceCaseRepository;
        this.triggerRepository = triggerRepository;
        this.resultRepository = resultRepository;
        this.caseRepository = caseRepository;
        this.stationRepository = stationRepository;
        this.userRepository = userRepository;
        this.securityEvaluator = securityEvaluator;
        this.auditService = auditService;
        this.triggerService = triggerService;
    }

    @Transactional
    public WorkspaceDTO createWorkspace(CreateWorkspaceRequest request, UserPrincipal actor) {
        String rawStationId = request.getStationId();
        if (rawStationId == null || rawStationId.isBlank()) {
            rawStationId = actor.getStationId();
        }

        if (rawStationId == null) {
            throw new BadRequestException("Station ID must be specified for workspace creation.");
        }

        final String targetStationId = rawStationId;

        if (!securityEvaluator.canAccessStation(actor, targetStationId)) {
            throw new UnauthorizedAccessException("Unauthorized to create workspace for station: " + targetStationId);
        }

        PoliceStation station = stationRepository.findById(targetStationId)
                .orElseThrow(() -> new ResourceNotFoundException("PoliceStation", "id", targetStationId));

        User creator = userRepository.findById(actor.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actor.getUsername()));

        String workspaceId = request.getId();
        if (workspaceId == null || workspaceId.isBlank()) {
            workspaceId = "WS-" + targetStationId.replace("OP-", "").replace("-CAP", "").replace("-CITY", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } else if (workspaceRepository.existsById(workspaceId)) {
            throw new DuplicateResourceException("Workspace with ID '" + workspaceId + "' already exists.");
        }

        List<String> scopes = request.getAnalyticalScopes();
        if (scopes == null || scopes.isEmpty()) {
            scopes = List.of("RELATIONSHIPS", "NETWORK", "PATTERNS");
        }

        InvestigationWorkspace workspace = new InvestigationWorkspace(
                workspaceId,
                request.getTitle(),
                request.getDescription(),
                creator,
                station,
                WorkspaceStatus.DRAFT,
                scopes
        );

        InvestigationWorkspace saved = workspaceRepository.save(workspace);

        auditService.logUserAction(actor, "CREATE_WORKSPACE", "WORKSPACE", saved.getId(),
                "Created draft investigation workspace: " + saved.getTitle());

        return WorkspaceDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public WorkspaceDTO getWorkspaceById(String id, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", id));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You do not have permission to access this workspace.");
        }

        return WorkspaceDTO.fromEntity(workspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceDTO> getAccessibleWorkspaces(UserPrincipal actor) {
        if (actor.getRole() == UserRole.SUPER_ADMIN) {
            return workspaceRepository.findAll().stream()
                    .map(WorkspaceDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        String userStationId = actor.getStationId();
        if (userStationId == null) {
            return List.of();
        }

        return workspaceRepository.findByStationId(userStationId).stream()
                .map(WorkspaceDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkspaceDTO updateWorkspace(String id, UpdateWorkspaceRequest request, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", id));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You do not have permission to update this workspace.");
        }

        if (workspace.getStatus() != WorkspaceStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT workspaces can be updated.");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            workspace.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            workspace.setDescription(request.getDescription());
        }
        if (request.getAnalyticalScopes() != null && !request.getAnalyticalScopes().isEmpty()) {
            workspace.setAnalyticalScopes(request.getAnalyticalScopes());
        }

        InvestigationWorkspace updated = workspaceRepository.save(workspace);

        auditService.logUserAction(actor, "UPDATE_WORKSPACE", "WORKSPACE", updated.getId(),
                "Updated workspace metadata for: " + updated.getId());

        return WorkspaceDTO.fromEntity(updated);
    }

    @Transactional
    public WorkspaceCaseDTO addCaseToWorkspace(String workspaceId, String caseId, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", workspaceId));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You cannot modify this workspace.");
        }

        if (workspace.getStatus() != WorkspaceStatus.DRAFT) {
            throw new BadRequestException("Cannot add cases to a non-DRAFT workspace.");
        }

        CaseRecord caseRecord = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("CaseRecord", "id", caseId));

        if (!securityEvaluator.canAccessCase(actor, caseRecord)) {
            throw new UnauthorizedAccessException("Access denied: You cannot add inaccessible case " + caseId + " to workspace.");
        }

        if (workspaceCaseRepository.existsByWorkspaceIdAndCaseRecordId(workspaceId, caseId)) {
            throw new DuplicateResourceException("Case [" + caseId + "] is already added to workspace [" + workspaceId + "]");
        }

        WorkspaceCase workspaceCase = new WorkspaceCase(workspace, caseRecord);
        WorkspaceCase saved = workspaceCaseRepository.save(workspaceCase);

        auditService.logUserAction(actor, "ADD_CASE_TO_WORKSPACE", "WORKSPACE", workspaceId,
                "Added case " + caseId + " to workspace " + workspaceId);

        return WorkspaceCaseDTO.fromEntity(saved);
    }

    @Transactional
    public void removeCaseFromWorkspace(String workspaceId, String caseId, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", workspaceId));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You cannot modify this workspace.");
        }

        if (workspace.getStatus() != WorkspaceStatus.DRAFT) {
            throw new BadRequestException("Cannot remove cases from a non-DRAFT workspace.");
        }

        if (!workspaceCaseRepository.existsByWorkspaceIdAndCaseRecordId(workspaceId, caseId)) {
            throw new ResourceNotFoundException("WorkspaceCase", "caseId", caseId);
        }

        workspaceCaseRepository.deleteByWorkspaceIdAndCaseRecordId(workspaceId, caseId);

        auditService.logUserAction(actor, "REMOVE_CASE_FROM_WORKSPACE", "WORKSPACE", workspaceId,
                "Removed case " + caseId + " from workspace " + workspaceId);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceCaseDTO> getWorkspaceCases(String workspaceId, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", workspaceId));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You do not have permission to view workspace cases.");
        }

        return workspaceCaseRepository.findByWorkspaceId(workspaceId).stream()
                .map(WorkspaceCaseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public TriggerDTO confirmWorkspace(String workspaceId, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", workspaceId));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You cannot confirm this workspace.");
        }

        // Idempotency Check: if already confirmed, analyzing, or ready, return existing trigger
        if (workspace.getStatus() == WorkspaceStatus.CONFIRMED ||
            workspace.getStatus() == WorkspaceStatus.ANALYZING ||
            workspace.getStatus() == WorkspaceStatus.READY) {
            InvestigationTrigger existingTrigger = triggerRepository.findFirstByWorkspaceIdOrderByRequestedAtDesc(workspaceId)
                    .orElse(null);
            if (existingTrigger != null) {
                return TriggerDTO.fromEntity(existingTrigger);
            }
        }

        if (workspace.getStatus() != WorkspaceStatus.DRAFT) {
            throw new BadRequestException("Workspace must be in DRAFT state for confirmation.");
        }

        // Rule 1: Workspace must have at least one case
        long caseCount = workspaceCaseRepository.countByWorkspaceId(workspaceId);
        if (caseCount == 0) {
            throw new BadRequestException("Workspace must contain at least one case before confirmation.");
        }

        // Rule 2: Validate accessible cases
        List<WorkspaceCase> workspaceCases = workspaceCaseRepository.findByWorkspaceId(workspaceId);
        for (WorkspaceCase wc : workspaceCases) {
            if (!securityEvaluator.canAccessCase(actor, wc.getCaseRecord())) {
                throw new UnauthorizedAccessException("Cannot confirm workspace containing inaccessible case: " + wc.getCaseRecord().getId());
            }
        }

        // Rule 3: Validate analytical scopes
        if (workspace.getAnalyticalScopes() == null || workspace.getAnalyticalScopes().isEmpty()) {
            workspace.setAnalyticalScopes(List.of("RELATIONSHIPS", "NETWORK", "PATTERNS"));
        }

        User requester = userRepository.findById(actor.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actor.getUsername()));

        // Transactional State Mutation
        workspace.setStatus(WorkspaceStatus.CONFIRMED);
        workspace.setConfirmedAt(Instant.now());
        workspaceRepository.save(workspace);

        String triggerId = "TRIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        InvestigationTrigger trigger = new InvestigationTrigger(triggerId, workspace, "FULL_WORKSPACE_INTELLIGENCE", requester);
        InvestigationTrigger savedTrigger = triggerRepository.save(trigger);

        auditService.logUserAction(actor, "CONFIRM_WORKSPACE", "WORKSPACE", workspaceId,
                "Confirmed workspace and created investigation trigger: " + savedTrigger.getId());

        auditService.logUserAction(actor, "INVESTIGATION_TRIGGER_CREATED", "TRIGGER", savedTrigger.getId(),
                "Trigger created for workspace " + workspaceId);

        // Execute Trigger Asynchronously after transaction commit
        final String finalTriggerId = savedTrigger.getId();
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        triggerService.executeTriggerAsync(finalTriggerId);
                    }
                }
            );
        } else {
            triggerService.executeTriggerAsync(finalTriggerId);
        }

        return TriggerDTO.fromEntity(savedTrigger);
    }

    @Transactional(readOnly = true)
    public TriggerDTO getLatestTrigger(String workspaceId, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", workspaceId));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You cannot view triggers for this workspace.");
        }

        InvestigationTrigger trigger = triggerRepository.findFirstByWorkspaceIdOrderByRequestedAtDesc(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationTrigger", "workspaceId", workspaceId));

        return TriggerDTO.fromEntity(trigger);
    }

    @Transactional(readOnly = true)
    public WorkspaceIntelligenceResultDTO getIntelligenceResult(String workspaceId, UserPrincipal actor) {
        InvestigationWorkspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("InvestigationWorkspace", "id", workspaceId));

        if (!securityEvaluator.canAccessWorkspace(actor, workspace)) {
            throw new UnauthorizedAccessException("Access denied: You cannot view intelligence results for this workspace.");
        }

        WorkspaceIntelligenceResult result = resultRepository.findByWorkspaceId(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkspaceIntelligenceResult", "workspaceId", workspaceId));

        return WorkspaceIntelligenceResultDTO.fromEntity(result);
    }
}
