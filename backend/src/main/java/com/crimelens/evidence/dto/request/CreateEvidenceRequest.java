package com.crimelens.evidence.dto.request;

import com.crimelens.evidence.entity.Evidence;

import com.crimelens.intelligence.entity.ExtractedEntity;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class CreateEvidenceRequest {

    private String id;

    @NotBlank(message = "Case ID is required")
    private String caseId;

    @NotBlank(message = "Evidence description is required")
    private String description;

    @NotBlank(message = "Evidence type is required")
    private String type;

    private String source;

    private String fileMetadata;

    private List<ExtractedEntity> entitiesExtracted;

    public CreateEvidenceRequest() {
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

    public List<ExtractedEntity> getEntitiesExtracted() {
        return entitiesExtracted;
    }

    public void setEntitiesExtracted(List<ExtractedEntity> entitiesExtracted) {
        this.entitiesExtracted = entitiesExtracted;
    }
}
