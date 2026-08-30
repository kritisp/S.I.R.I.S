package com.crimelens.workspace.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "workspace_intelligence_results")
public class WorkspaceIntelligenceResult {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trigger_id", nullable = false, unique = true)
    private InvestigationTrigger trigger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private InvestigationWorkspace workspace;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "relationships_discovered")
    private Integer relationshipsDiscovered = 0;

    @Column(name = "patterns_detected")
    private Integer patternsDetected = 0;

    @Column(name = "network_nodes_count")
    private Integer networkNodesCount = 0;

    @Column(name = "result_payload", columnDefinition = "TEXT")
    private String resultPayload;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private Instant generatedAt;

    public WorkspaceIntelligenceResult() {
    }

    public WorkspaceIntelligenceResult(String id, InvestigationTrigger trigger, InvestigationWorkspace workspace, String status, String summary, Integer relationshipsDiscovered, Integer patternsDetected, Integer networkNodesCount, String resultPayload) {
        this.id = id;
        this.trigger = trigger;
        this.workspace = workspace;
        this.status = status;
        this.summary = summary;
        this.relationshipsDiscovered = relationshipsDiscovered != null ? relationshipsDiscovered : 0;
        this.patternsDetected = patternsDetected != null ? patternsDetected : 0;
        this.networkNodesCount = networkNodesCount != null ? networkNodesCount : 0;
        this.resultPayload = resultPayload;
        this.generatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.generatedAt == null) {
            this.generatedAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public InvestigationTrigger getTrigger() {
        return trigger;
    }

    public void setTrigger(InvestigationTrigger trigger) {
        this.trigger = trigger;
    }

    public InvestigationWorkspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(InvestigationWorkspace workspace) {
        this.workspace = workspace;
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
