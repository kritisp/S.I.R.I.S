package com.crimelens.workspace.entity;

import com.crimelens.station.entity.PoliceStation;
import com.crimelens.user.entity.User;
import com.crimelens.workspace.entity.enums.WorkspaceStatus;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "investigation_workspaces")
public class InvestigationWorkspace {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private PoliceStation station;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private WorkspaceStatus status = WorkspaceStatus.DRAFT;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "workspace_analytical_scopes", joinColumns = @JoinColumn(name = "workspace_id"))
    @Column(name = "scope_name", length = 80)
    private List<String> analyticalScopes = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    public InvestigationWorkspace() {
    }

    public InvestigationWorkspace(String id, String title, String description, User creator, PoliceStation station, WorkspaceStatus status, List<String> analyticalScopes) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.creator = creator;
        this.station = station;
        this.status = status != null ? status : WorkspaceStatus.DRAFT;
        this.analyticalScopes = analyticalScopes != null ? analyticalScopes : new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getCreator() {
        return creator;
    }

    public void setCreator(User creator) {
        this.creator = creator;
    }

    public PoliceStation getStation() {
        return station;
    }

    public void setStation(PoliceStation station) {
        this.station = station;
    }

    public WorkspaceStatus getStatus() {
        return status;
    }

    public void setStatus(WorkspaceStatus status) {
        this.status = status;
    }

    public List<String> getAnalyticalScopes() {
        return analyticalScopes;
    }

    public void setAnalyticalScopes(List<String> analyticalScopes) {
        this.analyticalScopes = analyticalScopes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
}
