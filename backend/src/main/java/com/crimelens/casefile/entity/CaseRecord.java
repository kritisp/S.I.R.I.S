package com.crimelens.casefile.entity;

import com.crimelens.intelligence.entity.ExtractedEntity;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.user.entity.User;

import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "case_records", indexes = {
    @Index(name = "idx_case_fir_number", columnList = "fir_number"),
    @Index(name = "idx_case_station_id", columnList = "station_id"),
    @Index(name = "idx_case_investigator_id", columnList = "investigator_id"),
    @Index(name = "idx_case_status", columnList = "status"),
    @Index(name = "idx_case_priority", columnList = "priority")
})
public class CaseRecord {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @Column(name = "fir_number", nullable = false, unique = true, length = 60)
    private String firNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private PoliceStation station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigator_id")
    private User investigator;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "crime_type", nullable = false, length = 100)
    private String crimeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private CaseStatus status = CaseStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 30)
    private CasePriority priority = CasePriority.MEDIUM;

    @Column(name = "incident_date")
    private Instant incidentDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_bns_sections", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "section")
    private List<String> bnsSections = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_suspects", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "suspect")
    private List<String> suspects = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_vehicles", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "vehicle")
    private List<String> vehicles = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_locations", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "location")
    private List<String> locations = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_evidence_refs", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "evidence_ref")
    private List<String> evidenceRefs = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_cctv_refs", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "cctv_ref")
    private List<String> cctvRefs = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_linked_ids", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "linked_case_id")
    private List<String> linkedCaseIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "case_extracted_entities", joinColumns = @JoinColumn(name = "case_id"))
    private List<ExtractedEntity> entities = new ArrayList<>();

    public CaseRecord() {
    }

    public CaseRecord(String id, String firNumber, PoliceStation station, User investigator, String title,
                      String description, String crimeType, CaseStatus status, CasePriority priority, Instant incidentDate) {
        this.id = id;
        this.firNumber = firNumber;
        this.station = station;
        this.investigator = investigator;
        this.title = title;
        this.description = description;
        this.crimeType = crimeType;
        this.status = status != null ? status : CaseStatus.PENDING;
        this.priority = priority != null ? priority : CasePriority.MEDIUM;
        this.incidentDate = incidentDate != null ? incidentDate : Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.incidentDate == null) {
            this.incidentDate = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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

    public PoliceStation getStation() {
        return station;
    }

    public void setStation(PoliceStation station) {
        this.station = station;
    }

    public User getInvestigator() {
        return investigator;
    }

    public void setInvestigator(User investigator) {
        this.investigator = investigator;
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
