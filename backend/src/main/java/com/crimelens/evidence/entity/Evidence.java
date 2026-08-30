package com.crimelens.evidence.entity;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.intelligence.entity.ExtractedEntity;
import com.crimelens.user.entity.User;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "evidence")
public class Evidence {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseRecord caseRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    @Column(name = "source", length = 200)
    private String source;

    @Column(name = "file_metadata", columnDefinition = "TEXT")
    private String fileMetadata;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "evidence_type", nullable = false, length = 100)
    private String type;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "evidence_extracted_entities", joinColumns = @JoinColumn(name = "evidence_id"))
    private List<ExtractedEntity> entitiesExtracted = new ArrayList<>();

    public Evidence() {
    }

    public Evidence(String id, CaseRecord caseRecord, String description, String type, Instant uploadedAt, List<ExtractedEntity> entitiesExtracted) {
        this.id = id;
        this.caseRecord = caseRecord;
        this.description = description;
        this.type = type;
        this.uploadedAt = uploadedAt != null ? uploadedAt : Instant.now();
        this.entitiesExtracted = entitiesExtracted != null ? entitiesExtracted : new ArrayList<>();
    }

    public Evidence(String id, CaseRecord caseRecord, User uploader, String source, String fileMetadata, String description, String type, Instant uploadedAt, List<ExtractedEntity> entitiesExtracted) {
        this.id = id;
        this.caseRecord = caseRecord;
        this.uploader = uploader;
        this.source = source;
        this.fileMetadata = fileMetadata;
        this.description = description;
        this.type = type;
        this.uploadedAt = uploadedAt != null ? uploadedAt : Instant.now();
        this.entitiesExtracted = entitiesExtracted != null ? entitiesExtracted : new ArrayList<>();
    }

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public User getUploader() {
        return uploader;
    }

    public void setUploader(User uploader) {
        this.uploader = uploader;
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
