package com.crimelens.workspace.dto.response;

import com.crimelens.workspace.entity.WorkspaceIntelligenceResult;

import java.time.Instant;

public class WorkspaceIntelligenceResultDTO {

    private String id;
    private String triggerId;
    private String workspaceId;
    private String status;
    private String summary;
    private Integer relationshipsDiscovered;
    private Integer patternsDetected;
    private Integer networkNodesCount;
    private String resultPayload;
    private Instant generatedAt;

    public WorkspaceIntelligenceResultDTO() {
    }

    public WorkspaceIntelligenceResultDTO(WorkspaceIntelligenceResult entity) {
        if (entity != null) {
            this.id = entity.getId();
            if (entity.getTrigger() != null) {
                this.triggerId = entity.getTrigger().getId();
            }
            if (entity.getWorkspace() != null) {
                this.workspaceId = entity.getWorkspace().getId();
            }
            this.status = entity.getStatus();
            this.summary = entity.getSummary();
            this.relationshipsDiscovered = entity.getRelationshipsDiscovered();
            this.patternsDetected = entity.getPatternsDetected();
            this.networkNodesCount = entity.getNetworkNodesCount();
            this.resultPayload = entity.getResultPayload();
            this.generatedAt = entity.getGeneratedAt();
        }
    }

    public static WorkspaceIntelligenceResultDTO fromEntity(WorkspaceIntelligenceResult entity) {
        return entity == null ? null : new WorkspaceIntelligenceResultDTO(entity);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTriggerId() {
        return triggerId;
    }

    public void setTriggerId(String triggerId) {
        this.triggerId = triggerId;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(String workspaceId) {
        this.workspaceId = workspaceId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Integer getRelationshipsDiscovered() {
        return relationshipsDiscovered;
    }

    public void setRelationshipsDiscovered(Integer relationshipsDiscovered) {
        this.relationshipsDiscovered = relationshipsDiscovered;
    }

    public Integer getPatternsDetected() {
        return patternsDetected;
    }

    public void setPatternsDetected(Integer patternsDetected) {
        this.patternsDetected = patternsDetected;
    }

    public Integer getNetworkNodesCount() {
        return networkNodesCount;
    }

    public void setNetworkNodesCount(Integer networkNodesCount) {
        this.networkNodesCount = networkNodesCount;
    }

    public String getResultPayload() {
        return resultPayload;
    }

    public void setResultPayload(String resultPayload) {
        this.resultPayload = resultPayload;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }
}
