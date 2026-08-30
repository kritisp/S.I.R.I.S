package com.crimelens.workspace.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AddWorkspaceCaseRequest {

    @NotBlank(message = "Case ID is required")
    private String caseId;

    public AddWorkspaceCaseRequest() {
    }

    public AddWorkspaceCaseRequest(String caseId) {
        this.caseId = caseId;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }
}
