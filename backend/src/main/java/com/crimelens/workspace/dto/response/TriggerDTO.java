package com.crimelens.workspace.dto.response;

import com.crimelens.workspace.entity.InvestigationTrigger;
import com.crimelens.workspace.entity.enums.TriggerStatus;

import java.time.Instant;

public class TriggerDTO {

    private String id;
    private String workspaceId;
    private String triggerType;
    private TriggerStatus status;
    private String requestedById;
    private String requestedByName;
    private Instant requestedAt;
    private Instant startedAt;
    private Instant completedAt;
    private String failureReason;
    private String resultMetadata;

    public TriggerDTO() {
    }

    public TriggerDTO(InvestigationTrigger entity) {
        if (entity != null) {
            this.id = entity.getId();
            if (entity.getWorkspace() != null) {
                this.workspaceId = entity.getWorkspace().getId();
            }
            this.triggerType = entity.getTriggerType();
            this.status = entity.getStatus();
            if (entity.getRequestedBy() != null) {
                this.requestedById = entity.getRequestedBy().getId();
                this.requestedByName = entity.getRequestedBy().getName();
            }
            this.requestedAt = entity.getRequestedAt();
            this.startedAt = entity.getStartedAt();
            this.completedAt = entity.getCompletedAt();
            this.failureReason = entity.getFailureReason();
            this.resultMetadata = entity.getResultMetadata();
        }
    }

    public static TriggerDTO fromEntity(InvestigationTrigger entity) {
        return entity == null ? null : new TriggerDTO(entity);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(String workspaceId) {
        this.workspaceId = workspaceId;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(String triggerType) {
        this.triggerType = triggerType;
    }

    public TriggerStatus getStatus() {
        return status;
    }

    public void setStatus(TriggerStatus status) {
        this.status = status;
    }

    public String getRequestedById() {
        return requestedById;
    }

    public void setRequestedById(String requestedById) {
        this.requestedById = requestedById;
    }

    public String getRequestedByName() {
        return requestedByName;
    }

    public void setRequestedByName(String requestedByName) {
        this.requestedByName = requestedByName;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getResultMetadata() {
        return resultMetadata;
    }

    public void setResultMetadata(String resultMetadata) {
        this.resultMetadata = resultMetadata;
    }
}
