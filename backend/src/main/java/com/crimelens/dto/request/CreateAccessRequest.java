package com.crimelens.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateAccessRequest {

    @NotBlank(message = "Target case ID is required")
    private String targetCaseId;

    @NotBlank(message = "Reason for access is required")
    private String reason;

    public CreateAccessRequest() {
    }

    public String getTargetCaseId() {
        return targetCaseId;
    }

    public void setTargetCaseId(String targetCaseId) {
        this.targetCaseId = targetCaseId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
