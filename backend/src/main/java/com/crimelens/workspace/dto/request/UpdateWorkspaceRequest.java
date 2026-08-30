package com.crimelens.workspace.dto.request;

import java.util.List;

public class UpdateWorkspaceRequest {

    private String title;
    private String description;
    private List<String> analyticalScopes;

    public UpdateWorkspaceRequest() {
    }

    public UpdateWorkspaceRequest(String title, String description, List<String> analyticalScopes) {
        this.title = title;
        this.description = description;
        this.analyticalScopes = analyticalScopes;
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

    public List<String> getAnalyticalScopes() {
        return analyticalScopes;
    }

    public void setAnalyticalScopes(List<String> analyticalScopes) {
        this.analyticalScopes = analyticalScopes;
    }
}
