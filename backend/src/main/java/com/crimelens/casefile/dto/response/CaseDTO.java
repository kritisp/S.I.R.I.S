package com.crimelens.casefile.dto.response;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.intelligence.entity.ExtractedEntity;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CaseDTO {

    private String id;
    private String firNumber;
    private String stationId;
    private String stationName;
    private String investigatorId;
    private String investigatorName;
    private String title;
    private String description;
    private String crimeType;
    private CaseStatus status;
    private CasePriority priority;
    private Instant incidentDate;
    private Instant createdAt;
    private Instant updatedAt;
    private List<String> bnsSections;
    private List<String> suspects;
    private List<String> vehicles;
    private List<String> locations;
    private List<String> evidenceRefs;
    private List<String> cctvRefs;
    private List<String> linkedCaseIds;
    private List<ExtractedEntity> entities;

    public CaseDTO() {
    }

    public CaseDTO(CaseRecord record) {
        if (record != null) {
            this.id = record.getId();
            this.firNumber = record.getFirNumber();
            if (record.getStation() != null) {
                this.stationId = record.getStation().getId();
                this.stationName = record.getStation().getName();
            }
            if (record.getInvestigator() != null) {
                this.investigatorId = record.getInvestigator().getId();
                this.investigatorName = record.getInvestigator().getName();
            }
            this.title = record.getTitle();
            this.description = record.getDescription();
            this.crimeType = record.getCrimeType();
            this.status = record.getStatus();
            this.priority = record.getPriority();
            this.incidentDate = record.getIncidentDate();
            this.createdAt = record.getCreatedAt();
            this.updatedAt = record.getUpdatedAt();
            this.bnsSections = record.getBnsSections() != null ? new ArrayList<>(record.getBnsSections()) : null;
            this.suspects = record.getSuspects() != null ? new ArrayList<>(record.getSuspects()) : null;
            this.vehicles = record.getVehicles() != null ? new ArrayList<>(record.getVehicles()) : null;
            this.locations = record.getLocations() != null ? new ArrayList<>(record.getLocations()) : null;
            this.evidenceRefs = record.getEvidenceRefs() != null ? new ArrayList<>(record.getEvidenceRefs()) : null;
            this.cctvRefs = record.getCctvRefs() != null ? new ArrayList<>(record.getCctvRefs()) : null;
            this.linkedCaseIds = record.getLinkedCaseIds() != null ? new ArrayList<>(record.getLinkedCaseIds()) : null;
            this.entities = record.getEntities() != null ? new ArrayList<>(record.getEntities()) : null;
        }
    }

    public static CaseDTO fromEntity(CaseRecord record) {
        return record == null ? null : new CaseDTO(record);
    }

    // Getters and Setters
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

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getInvestigatorId() {
        return investigatorId;
    }

    public void setInvestigatorId(String investigatorId) {
        this.investigatorId = investigatorId;
    }

    public String getInvestigatorName() {
        return investigatorName;
    }

    public void setInvestigatorName(String investigatorName) {
        this.investigatorName = investigatorName;
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
