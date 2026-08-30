package com.crimelens.intelligence.dto.response;

import com.crimelens.intelligence.entity.IntelligenceAlert;
import com.crimelens.intelligence.entity.enums.AlertType;
import java.time.Instant;

public class IntelligenceAlertDTO {

    private String id;
    private AlertType type;
    private String message;
    private String relatedCaseId;
    private String targetCaseId;
    private String targetStationId;
    private boolean isRead;
    private Instant createdAt;

    public IntelligenceAlertDTO() {
    }

    public IntelligenceAlertDTO(IntelligenceAlert entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.type = entity.getType();
            this.message = entity.getMessage();
            if (entity.getRelatedCase() != null) {
                this.relatedCaseId = entity.getRelatedCase().getId();
            }
            if (entity.getTargetCase() != null) {
                this.targetCaseId = entity.getTargetCase().getId();
            }
            if (entity.getTargetStation() != null) {
                this.targetStationId = entity.getTargetStation().getId();
            }
            this.isRead = entity.isRead();
            this.createdAt = entity.getCreatedAt();
        }
    }

    public static IntelligenceAlertDTO fromEntity(IntelligenceAlert entity) {
        return entity == null ? null : new IntelligenceAlertDTO(entity);
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

    public String getRelatedCaseId() {
        return relatedCaseId;
    }

    public void setRelatedCaseId(String relatedCaseId) {
        this.relatedCaseId = relatedCaseId;
    }

    public String getTargetCaseId() {
        return targetCaseId;
    }

    public void setTargetCaseId(String targetCaseId) {
        this.targetCaseId = targetCaseId;
    }

    public String getTargetStationId() {
        return targetStationId;
    }

    public void setTargetStationId(String targetStationId) {
        this.targetStationId = targetStationId;
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
