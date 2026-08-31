package com.crimelens.intelligence.dto;

public class FirIntelligenceRequestDTO {

    private String firText;
    private String sourceName;
    private String caseId;

    public FirIntelligenceRequestDTO() {
    }

    public FirIntelligenceRequestDTO(String firText, String sourceName, String caseId) {
        this.firText = firText;
        this.sourceName = sourceName;
        this.caseId = caseId;
    }

    public String getFirText() {
        return firText;
    }

    public void setFirText(String firText) {
        this.firText = firText;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }
}
