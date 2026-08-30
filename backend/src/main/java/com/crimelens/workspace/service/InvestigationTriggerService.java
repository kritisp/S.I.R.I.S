package com.crimelens.workspace.service;

import com.crimelens.audit.service.AuditService;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.intelligence.entity.IntelligenceAlert;
import com.crimelens.intelligence.entity.enums.AlertType;
import com.crimelens.intelligence.ml.MlClientInterface;
import com.crimelens.intelligence.repository.IntelligenceAlertRepository;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InvestigationTriggerService {

    private static final Logger logger = LoggerFactory.getLogger(InvestigationTriggerService.class);

    private final InvestigationTriggerRepository triggerRepository;
    private final InvestigationWorkspaceRepository workspaceRepository;
    private final WorkspaceCaseRepository workspaceCaseRepository;
    private final WorkspaceIntelligenceResultRepository resultRepository;
    private final IntelligenceAlertRepository alertRepository;
    private final MlClientInterface mlClient;
    private final AuditService auditService;

    public InvestigationTriggerService(InvestigationTriggerRepository triggerRepository,
                                       InvestigationWorkspaceRepository workspaceRepository,
                                       WorkspaceCaseRepository workspaceCaseRepository,
                                       WorkspaceIntelligenceResultRepository resultRepository,
                                       IntelligenceAlertRepository alertRepository,
                                       MlClientInterface mlClient,
                                       AuditService auditService) {
        this.triggerRepository = triggerRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceCaseRepository = workspaceCaseRepository;
        this.resultRepository = resultRepository;
        this.alertRepository = alertRepository;
        this.mlClient = mlClient;
        this.auditService = auditService;
    }

    @Async
    @Transactional
    public void executeTriggerAsync(String triggerId) {
        logger.info("Starting asynchronous trigger execution for trigger ID: {}", triggerId);

        InvestigationTrigger trigger = triggerRepository.findById(triggerId).orElse(null);
        if (trigger == null) {
            logger.error("Trigger ID {} not found for execution", triggerId);
            return;
        }

        InvestigationWorkspace workspace = trigger.getWorkspace();
        if (workspace == null) {
            logger.error("Workspace null for trigger ID {}", triggerId);
            return;
        }

        try {
            // 1. Mark Trigger RUNNING & Workspace ANALYZING
            trigger.setStatus(TriggerStatus.RUNNING);
            trigger.setStartedAt(Instant.now());
            triggerRepository.save(trigger);

            workspace.setStatus(WorkspaceStatus.ANALYZING);
            workspaceRepository.save(workspace);

            auditService.logAction(
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getId() : "SYSTEM",
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getName() : "System",
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getRole().name() : "SYSTEM",
                    workspace.getStation() != null ? workspace.getStation().getId() : null,
                    "INVESTIGATION_STARTED",
                    "TRIGGER",
                    trigger.getId(),
                    workspace.getId(),
                    "Started investigation analysis trigger for workspace: " + workspace.getId()
            );

            // 2. Fetch associated case records
            List<WorkspaceCase> workspaceCases = workspaceCaseRepository.findByWorkspaceId(workspace.getId());
            List<CaseRecord> cases = workspaceCases.stream()
                    .map(WorkspaceCase::getCaseRecord)
                    .collect(Collectors.toList());

            // 3. Invoke ML Client boundary
            WorkspaceIntelligenceResult result = mlClient.analyzeWorkspace(
                    workspace,
                    cases,
                    workspace.getAnalyticalScopes()
            );

            // Bind trigger and workspace
            result.setTrigger(trigger);
            result.setWorkspace(workspace);
            resultRepository.save(result);

            // 4. Update Trigger to COMPLETED
            trigger.setStatus(TriggerStatus.COMPLETED);
            trigger.setCompletedAt(Instant.now());
            trigger.setResultMetadata(result.getSummary());
            triggerRepository.save(trigger);

            // 5. Update Workspace to READY
            workspace.setStatus(WorkspaceStatus.READY);
            workspaceRepository.save(workspace);

            auditService.logAction(
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getId() : "SYSTEM",
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getName() : "System",
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getRole().name() : "SYSTEM",
                    workspace.getStation() != null ? workspace.getStation().getId() : null,
                    "INVESTIGATION_COMPLETED",
                    "TRIGGER",
                    trigger.getId(),
                    workspace.getId(),
                    "Completed investigation analysis for workspace: " + workspace.getId()
            );

            // 6. Create Intelligence Alert Notification
            String alertId = "ALT-WS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            IntelligenceAlert alert = new IntelligenceAlert(
                    alertId,
                    AlertType.PATTERN_DETECTED,
                    "Analysis completed for workspace '" + workspace.getTitle() + "'. " +
                    result.getRelationshipsDiscovered() + " cross-case relationships detected.",
                    cases.isEmpty() ? null : cases.get(0),
                    null,
                    workspace.getStation(),
                    false
            );
            alertRepository.save(alert);

        } catch (Exception ex) {
            logger.error("Error executing trigger ID {}: {}", triggerId, ex.getMessage(), ex);

            trigger.setStatus(TriggerStatus.FAILED);
            trigger.setCompletedAt(Instant.now());
            trigger.setFailureReason("Analysis failed: " + ex.getMessage());
            triggerRepository.save(trigger);

            workspace.setStatus(WorkspaceStatus.FAILED);
            workspaceRepository.save(workspace);

            auditService.logAction(
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getId() : "SYSTEM",
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getName() : "System",
                    trigger.getRequestedBy() != null ? trigger.getRequestedBy().getRole().name() : "SYSTEM",
                    workspace.getStation() != null ? workspace.getStation().getId() : null,
                    "INVESTIGATION_FAILED",
                    "TRIGGER",
                    trigger.getId(),
                    workspace.getId(),
                    "Investigation analysis failed: " + ex.getMessage()
            );
        }
    }
}
