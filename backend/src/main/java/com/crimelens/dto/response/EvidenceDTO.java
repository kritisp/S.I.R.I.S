package com.crimelens.dto.response;

import com.crimelens.entities.Evidence;
import com.crimelens.entities.ExtractedEntity;
import java.time.Instant;
import java.util.List;

public class EvidenceDTO {

    private String id;
    private String caseId;
    private String description;
    private String type;
    private Instant uploadedAt;
    private List<ExtractedEntity> entitiesExtracted;

    public EvidenceDTO() {
    }

    public EvidenceDTO(Evidence entity) {
        if (entity != null) {
            this.id = entity.getId();
            if (entity.getCaseRecord() != null) {
                this.caseId = entity.getCaseRecord().getId();
            }
            this.description = entity.getDescription();
            this.type = entity.getType();
            this.uploadedAt = entity.getUploadedAt();
            this.entitiesExtracted = entity.getEntitiesExtracted();
        }
    }

    public static EvidenceDTO fromEntity(Evidence entity) {
        return entity == null ? null : new EvidenceDTO(entity);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public List<ExtractedEntity> getEntitiesExtracted() {
        return entitiesExtracted;
    }

    public void setEntitiesExtracted(List<ExtractedEntity> entitiesExtracted) {
        this.entitiesExtracted = entitiesExtracted;
    }
}
