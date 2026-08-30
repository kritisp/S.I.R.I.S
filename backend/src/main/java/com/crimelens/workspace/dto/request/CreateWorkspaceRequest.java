package com.crimelens.workspace.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateWorkspaceRequest {

    private String id;

    @NotBlank(message = "Workspace title is required")
    private String title;

    private String description;

    private String stationId;

    private List<String> analyticalScopes;

    public CreateWorkspaceRequest() {
    }

    public CreateWorkspaceRequest(String title, String description, String stationId, List<String> analyticalScopes) {
        this.title = title;
        this.description = description;
        this.stationId = stationId;
        this.analyticalScopes = analyticalScopes;
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

    public String getStationId() {
        return stationId;
    }

    public void setStationId(String stationId) {
        this.stationId = stationId;
    }

    public List<String> getAnalyticalScopes() {
        return analyticalScopes;
    }

    public void setAnalyticalScopes(List<String> analyticalScopes) {
        this.analyticalScopes = analyticalScopes;
    }
}
