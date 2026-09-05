package com.crimelens.audit.dto.response;

import com.crimelens.audit.entity.AuditChainRecord;
import java.time.Instant;

public class AuditChainRecordDTO {

    private String recordId;
    private String chainScope;
    private Long sequenceIndex;
    private String caseId;
    private String evidenceId;
    private String eventType;
    private String actorId;
    private String actorName;
    private String actorRole;
    private String stationId;
    private Instant timestamp;
    private String canonicalPayload;
    private String contentHash;
    private String previousHash;
    private String currentHash;
    private String verificationStatus;

    public AuditChainRecordDTO() {
    }

    public static AuditChainRecordDTO fromEntity(AuditChainRecord entity) {
        if (entity == null) return null;
        AuditChainRecordDTO dto = new AuditChainRecordDTO();
        dto.setRecordId(entity.getRecordId());
        dto.setChainScope(entity.getChainScope());
        dto.setSequenceIndex(entity.getSequenceIndex());
        dto.setCaseId(entity.getCaseId());
        dto.setEvidenceId(entity.getEvidenceId());
        dto.setEventType(entity.getEventType());
        dto.setActorId(entity.getActorId());
        dto.setActorName(entity.getActorName());
        dto.setActorRole(entity.getActorRole());
        dto.setStationId(entity.getStationId());
        dto.setTimestamp(entity.getTimestamp());
        dto.setCanonicalPayload(entity.getCanonicalPayload());
        dto.setContentHash(entity.getContentHash());
        dto.setPreviousHash(entity.getPreviousHash());
        dto.setCurrentHash(entity.getCurrentHash());
        dto.setVerificationStatus(entity.getVerificationStatus());
        return dto;
    }

    // Getters and Setters
    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }

    public String getChainScope() { return chainScope; }
    public void setChainScope(String chainScope) { this.chainScope = chainScope; }

    public Long getSequenceIndex() { return sequenceIndex; }
    public void setSequenceIndex(Long sequenceIndex) { this.sequenceIndex = sequenceIndex; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getEvidenceId() { return evidenceId; }
    public void setEvidenceId(String evidenceId) { this.evidenceId = evidenceId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getStationId() { return stationId; }
    public void setStationId(String stationId) { this.stationId = stationId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getCanonicalPayload() { return canonicalPayload; }
    public void setCanonicalPayload(String canonicalPayload) { this.canonicalPayload = canonicalPayload; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
}
