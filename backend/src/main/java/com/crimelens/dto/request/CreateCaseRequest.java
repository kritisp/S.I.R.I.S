package com.crimelens.dto.request;

import com.crimelens.entities.ExtractedEntity;
import com.crimelens.entities.enums.CasePriority;
import com.crimelens.entities.enums.CaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public class CreateCaseRequest {

    private String id;

    @NotBlank(message = "FIR Number is required")
    @Size(max = 60, message = "FIR Number must not exceed 60 characters")
    private String firNumber;

    private String stationId; // If not provided, defaults to authenticated officer's station

    private String investigatorId; // If not provided, defaults to authenticated officer

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Incident description is required")
    private String description;

    @NotBlank(message = "Crime type / classification is required")
    @Size(max = 100, message = "Crime type must not exceed 100 characters")
    private String crimeType;

    private CaseStatus status = CaseStatus.PENDING;

    private CasePriority priority = CasePriority.MEDIUM;

    private Instant incidentDate;

    private List<String> bnsSections;
    private List<String> suspects;
    private List<String> vehicles;
    private List<String> locations;
    private List<String> evidenceRefs;
    private List<String> cctvRefs;
    private List<String> linkedCaseIds;
    private List<ExtractedEntity> entities;

    public CreateCaseRequest() {
    }

    public CreateCaseRequest(String id, String firNumber, String stationId, String investigatorId,
                             String title, String description, String crimeType, CaseStatus status,
                             CasePriority priority, Instant incidentDate) {
        this.id = id;
        this.firNumber = firNumber;
        this.stationId = stationId;
        this.investigatorId = investigatorId;
        this.title = title;
        this.description = description;
        this.crimeType = crimeType;
        this.status = status != null ? status : CaseStatus.PENDING;
        this.priority = priority != null ? priority : CasePriority.MEDIUM;
        this.incidentDate = incidentDate;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirNumber() {
        return firNumber;
    }

    public void setFirNumber(String firNumber) {
        this.firNumber = firNumber;
    }

    public String getStationId() {
        return stationId;
    }

    public void setStationId(String stationId) {
        this.stationId = stationId;
    }

    public String getInvestigatorId() {
        return investigatorId;
    }

    public void setInvestigatorId(String investigatorId) {
        this.investigatorId = investigatorId;
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

    public String getCrimeType() {
        return crimeType;
    }

    public void setCrimeType(String crimeType) {
        this.crimeType = crimeType;
    }

    public CaseStatus getStatus() {
        return status;
    }

    public void setStatus(CaseStatus status) {
        this.status = status;
    }

    public CasePriority getPriority() {
        return priority;
    }

    public void setPriority(CasePriority priority) {
        this.priority = priority;
    }

    public Instant getIncidentDate() {
        return incidentDate;
    }

    public void setIncidentDate(Instant incidentDate) {
        this.incidentDate = incidentDate;
    }

    public List<String> getBnsSections() {
        return bnsSections;
    }

    public void setBnsSections(List<String> bnsSections) {
        this.bnsSections = bnsSections;
    }

    public List<String> getSuspects() {
        return suspects;
    }

    public void setSuspects(List<String> suspects) {
        this.suspects = suspects;
    }

    public List<String> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<String> vehicles) {
        this.vehicles = vehicles;
    }

    public List<String> getLocations() {
        return locations;
    }

    public void setLocations(List<String> locations) {
        this.locations = locations;
    }

    public List<String> getEvidenceRefs() {
        return evidenceRefs;
    }

    public void setEvidenceRefs(List<String> evidenceRefs) {
        this.evidenceRefs = evidenceRefs;
    }

    public List<String> getCctvRefs() {
        return cctvRefs;
    }

    public void setCctvRefs(List<String> cctvRefs) {
        this.cctvRefs = cctvRefs;
    }

    public List<String> getLinkedCaseIds() {
        return linkedCaseIds;
    }

    public void setLinkedCaseIds(List<String> linkedCaseIds) {
        this.linkedCaseIds = linkedCaseIds;
    }

    public List<ExtractedEntity> getEntities() {
        return entities;
    }

    public void setEntities(List<ExtractedEntity> entities) {
        this.entities = entities;
    }
}
