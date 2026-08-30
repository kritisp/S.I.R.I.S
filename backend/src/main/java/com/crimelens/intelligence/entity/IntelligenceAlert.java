package com.crimelens.intelligence.entity;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.station.entity.PoliceStation;

import com.crimelens.intelligence.entity.enums.AlertType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "intelligence_alerts", indexes = {
    @Index(name = "idx_alert_type", columnList = "alert_type"),
    @Index(name = "idx_alert_target_station", columnList = "target_station_id"),
    @Index(name = "idx_alert_created", columnList = "created_at")
})
public class IntelligenceAlert {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 40)
    private AlertType type;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_case_id")
    private CaseRecord relatedCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_case_id")
    private CaseRecord targetCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_station_id")
    private PoliceStation targetStation;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public IntelligenceAlert() {
    }

    public IntelligenceAlert(String id, AlertType type, String message, CaseRecord relatedCase, CaseRecord targetCase, PoliceStation targetStation, boolean isRead) {
        this.id = id;
        this.type = type;
        this.message = message;
        this.relatedCase = relatedCase;
        this.targetCase = targetCase;
        this.targetStation = targetStation;
        this.isRead = isRead;
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

    public AlertType getType() {
        return type;
    }

    public void setType(AlertType type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public CaseRecord getRelatedCase() {
        return relatedCase;
    }

    public void setRelatedCase(CaseRecord relatedCase) {
        this.relatedCase = relatedCase;
    }

    public CaseRecord getTargetCase() {
        return targetCase;
    }

    public void setTargetCase(CaseRecord targetCase) {
        this.targetCase = targetCase;
    }

    public PoliceStation getTargetStation() {
        return targetStation;
    }

    public void setTargetStation(PoliceStation targetStation) {
        this.targetStation = targetStation;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
