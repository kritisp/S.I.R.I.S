package com.crimelens.casefile.dto.request;

import jakarta.validation.constraints.NotBlank;

public class AssignInvestigatorRequest {

    @NotBlank(message = "Investigator ID is required")
    private String investigatorId;

    public AssignInvestigatorRequest() {
    }

    public AssignInvestigatorRequest(String investigatorId) {
        this.investigatorId = investigatorId;
    }

    public String getInvestigatorId() {
        return investigatorId;
    }

    public void setInvestigatorId(String investigatorId) {
        this.investigatorId = investigatorId;
    }
}
