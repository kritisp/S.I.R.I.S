package com.crimelens.workspace.entity;

import com.crimelens.user.entity.User;
import com.crimelens.workspace.entity.enums.TriggerStatus;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "investigation_triggers")
public class InvestigationTrigger {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private InvestigationWorkspace workspace;

    @Column(name = "trigger_type", nullable = false, length = 80)
    private String triggerType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TriggerStatus status = TriggerStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "result_metadata", columnDefinition = "TEXT")
    private String resultMetadata;

    public InvestigationTrigger() {
    }

    public InvestigationTrigger(String id, InvestigationWorkspace workspace, String triggerType, User requestedBy) {
        this.id = id;
        this.workspace = workspace;
        this.triggerType = triggerType;
        this.requestedBy = requestedBy;
        this.status = TriggerStatus.PENDING;
        this.requestedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public InvestigationWorkspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(InvestigationWorkspace workspace) {
        this.workspace = workspace;
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

    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User requestedBy) {
        this.requestedBy = requestedBy;
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
