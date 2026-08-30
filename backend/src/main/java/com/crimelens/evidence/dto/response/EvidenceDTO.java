package com.crimelens.evidence.dto.response;

import com.crimelens.evidence.entity.Evidence;
import com.crimelens.intelligence.entity.ExtractedEntity;
import java.time.Instant;
import java.util.List;

public class EvidenceDTO {

    private String id;
    private String caseId;
    private String description;
    private String type;
    private Instant uploadedAt;
    private List<ExtractedEntity> entitiesExtracted;
    private String uploaderId;
    private String uploaderName;
    private String source;
    private String fileMetadata;

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
            if (entity.getEntitiesExtracted() != null) {
                this.entitiesExtracted = new java.util.ArrayList<>(entity.getEntitiesExtracted());
            }
            if (entity.getUploader() != null) {
                this.uploaderId = entity.getUploader().getId();
                this.uploaderName = entity.getUploader().getName();
            }
            this.source = entity.getSource();
            this.fileMetadata = entity.getFileMetadata();
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

    public String getUploaderId() {
        return uploaderId;
    }

    public void setUploaderId(String uploaderId) {
        this.uploaderId = uploaderId;
    }

    public String getUploaderName() {
        return uploaderName;
    }

    public void setUploaderName(String uploaderName) {
        this.uploaderName = uploaderName;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getFileMetadata() {
        return fileMetadata;
    }

    public void setFileMetadata(String fileMetadata) {
        this.fileMetadata = fileMetadata;
    }
}
