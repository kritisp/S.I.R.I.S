package com.crimelens.access.entity;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.user.entity.User;

import com.crimelens.access.entity.enums.RequestStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "access_requests", indexes = {
    @Index(name = "idx_requesting_station", columnList = "requesting_station_id"),
    @Index(name = "idx_target_station", columnList = "target_station_id"),
    @Index(name = "idx_target_case", columnList = "target_case_id")
})
public class AccessRequest {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requesting_station_id", nullable = false)
    private PoliceStation requestingStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requesting_officer_id", nullable = false)
    private User requestingOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_station_id", nullable = false)
    private PoliceStation targetStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_case_id", nullable = false)
    private CaseRecord targetCase;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AccessRequest() {
    }

    public AccessRequest(String id, PoliceStation requestingStation, User requestingOfficer, PoliceStation targetStation, CaseRecord targetCase, String reason, RequestStatus status) {
        this.id = id;
        this.requestingStation = requestingStation;
        this.requestingOfficer = requestingOfficer;
        this.targetStation = targetStation;
        this.targetCase = targetCase;
        this.reason = reason;
        this.status = status != null ? status : RequestStatus.PENDING;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public PoliceStation getRequestingStation() {
        return requestingStation;
    }

    public void setRequestingStation(PoliceStation requestingStation) {
        this.requestingStation = requestingStation;
    }

    public User getRequestingOfficer() {
        return requestingOfficer;
    }

    public void setRequestingOfficer(User requestingOfficer) {
        this.requestingOfficer = requestingOfficer;
    }

    public PoliceStation getTargetStation() {
        return targetStation;
    }

    public void setTargetStation(PoliceStation targetStation) {
        this.targetStation = targetStation;
    }

    public CaseRecord getTargetCase() {
        return targetCase;
    }

    public void setTargetCase(CaseRecord targetCase) {
        this.targetCase = targetCase;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
