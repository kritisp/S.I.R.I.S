package com.crimelens.workspace.dto.response;

import com.crimelens.station.dto.response.PoliceStationDTO;
import com.crimelens.user.dto.response.UserDTO;
import com.crimelens.workspace.entity.InvestigationWorkspace;
import com.crimelens.workspace.entity.enums.WorkspaceStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class WorkspaceDTO {

    private String id;
    private String title;
    private String description;
    private UserDTO creator;
    private PoliceStationDTO station;
    private WorkspaceStatus status;
    private List<String> analyticalScopes = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
    private Instant confirmedAt;

    public WorkspaceDTO() {
    }

    public WorkspaceDTO(InvestigationWorkspace entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.title = entity.getTitle();
            this.description = entity.getDescription();
            if (entity.getCreator() != null) {
                this.creator = UserDTO.fromEntity(entity.getCreator());
            }
            if (entity.getStation() != null) {
                this.station = PoliceStationDTO.fromEntity(entity.getStation());
            }
            this.status = entity.getStatus();
            if (entity.getAnalyticalScopes() != null) {
                this.analyticalScopes = new ArrayList<>(entity.getAnalyticalScopes());
            }
            this.createdAt = entity.getCreatedAt();
            this.updatedAt = entity.getUpdatedAt();
            this.confirmedAt = entity.getConfirmedAt();
        }
    }

    public static WorkspaceDTO fromEntity(InvestigationWorkspace entity) {
        return entity == null ? null : new WorkspaceDTO(entity);
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

    public UserDTO getCreator() {
        return creator;
    }

    public void setCreator(UserDTO creator) {
        this.creator = creator;
    }

    public PoliceStationDTO getStation() {
        return station;
    }

    public void setStation(PoliceStationDTO station) {
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
