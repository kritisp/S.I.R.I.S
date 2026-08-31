package com.crimelens.intelligence.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FirIntelligenceResponseDTO {

    private Map<String, Object> firMetadata;
    private String summary;
    private String crimeType;
    private String crimeCategory;
    private Map<String, Object> incident;
    private Map<String, Object> entities;
    private List<Map<String, Object>> timeline;
    private List<String> modusOperandi;
    private List<Map<String, Object>> bnsSections;
    private List<Map<String, Object>> bnssProceduralActions;
    private List<Map<String, Object>> investigationActions;
    private Map<String, Object> investigationIntelligence;
    private List<String> insights;
    private List<String> missingInformation;
    private Boolean maskingUsed;
    private Map<String, Object> executionMetadata;

    public FirIntelligenceResponseDTO() {
    }

    public Map<String, Object> getFirMetadata() {
        return firMetadata;
    }

    public void setFirMetadata(Map<String, Object> firMetadata) {
        this.firMetadata = firMetadata;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getCrimeType() {
        return crimeType;
    }

    public void setCrimeType(String crimeType) {
        this.crimeType = crimeType;
    }

    public String getCrimeCategory() {
        return crimeCategory;
    }

    public void setCrimeCategory(String crimeCategory) {
        this.crimeCategory = crimeCategory;
    }

    public Map<String, Object> getIncident() {
        return incident;
    }

    public void setIncident(Map<String, Object> incident) {
        this.incident = incident;
    }

    public Map<String, Object> getEntities() {
        return entities;
    }

    public void setEntities(Map<String, Object> entities) {
        this.entities = entities;
    }

    public List<Map<String, Object>> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<Map<String, Object>> timeline) {
        this.timeline = timeline;
    }

    public List<String> getModusOperandi() {
        return modusOperandi;
    }

    public void setModusOperandi(List<String> modusOperandi) {
        this.modusOperandi = modusOperandi;
    }

    public List<Map<String, Object>> getBnsSections() {
        return bnsSections;
    }

    public void setBnsSections(List<Map<String, Object>> bnsSections) {
        this.bnsSections = bnsSections;
    }

    public List<Map<String, Object>> getBnssProceduralActions() {
        return bnssProceduralActions;
    }

    public void setBnssProceduralActions(List<Map<String, Object>> bnssProceduralActions) {
        this.bnssProceduralActions = bnssProceduralActions;
    }

    public List<Map<String, Object>> getInvestigationActions() {
        return investigationActions;
    }

    public void setInvestigationActions(List<Map<String, Object>> investigationActions) {
        this.investigationActions = investigationActions;
    }

    public Map<String, Object> getInvestigationIntelligence() {
        return investigationIntelligence;
    }

    public void setInvestigationIntelligence(Map<String, Object> investigationIntelligence) {
        this.investigationIntelligence = investigationIntelligence;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }

    public List<String> getMissingInformation() {
        return missingInformation;
    }

    public void setMissingInformation(List<String> missingInformation) {
        this.missingInformation = missingInformation;
    }

    public Boolean getMaskingUsed() {
        return maskingUsed;
    }

    public void setMaskingUsed(Boolean maskingUsed) {
        this.maskingUsed = maskingUsed;
    }

    public Map<String, Object> getExecutionMetadata() {
        return executionMetadata;
    }

    public void setExecutionMetadata(Map<String, Object> executionMetadata) {
        this.executionMetadata = executionMetadata;
    }
}
