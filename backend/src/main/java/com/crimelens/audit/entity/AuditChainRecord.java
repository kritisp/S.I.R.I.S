package com.crimelens.audit.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_chain_records", indexes = {
    @Index(name = "idx_chain_scope_seq", columnList = "chain_scope, sequence_index", unique = true),
    @Index(name = "idx_chain_case_id", columnList = "case_id"),
    @Index(name = "idx_chain_evidence_id", columnList = "evidence_id"),
    @Index(name = "idx_chain_event_type", columnList = "event_type"),
    @Index(name = "idx_chain_current_hash", columnList = "current_hash")
})
public class AuditChainRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_id", nullable = false, unique = true, length = 100)
    private String recordId;

    @Column(name = "chain_scope", nullable = false, length = 100)
    private String chainScope; // "GLOBAL" or "CASE:<case_id>"

    @Column(name = "sequence_index", nullable = false)
    private Long sequenceIndex; // 1, 2, 3... per chain scope

    @Column(name = "case_id", length = 100)
    private String caseId;

    @Column(name = "evidence_id", length = 100)
    private String evidenceId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType; // CASE_CREATED, EVIDENCE_REGISTERED, EVIDENCE_HASHED, EVIDENCE_ACCESSED, etc.

    @Column(name = "actor_id", length = 100)
    private String actorId;

    @Column(name = "actor_name", length = 150)
    private String actorName;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "station_id", length = 50)
    private String stationId;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp;

    @Column(name = "canonical_payload", columnDefinition = "TEXT", nullable = false)
    private String canonicalPayload;

    @Column(name = "content_hash", length = 128)
    private String contentHash; // SHA-256 of raw evidence/document content if applicable

    @Column(name = "previous_hash", nullable = false, length = 128)
    private String previousHash; // SHA-256 of previous record in chain

    @Column(name = "current_hash", nullable = false, length = 128)
    private String currentHash; // SHA-256(canonicalPayload + previousHash + sequenceIndex + timestamp)

    @Column(name = "verification_status", nullable = false, length = 30)
    private String verificationStatus; // "VALID", "COMPROMISED"

    public AuditChainRecord() {
        this.timestamp = Instant.now();
        this.verificationStatus = "VALID";
    }

    public AuditChainRecord(String recordId, String chainScope, Long sequenceIndex, String caseId,
                            String evidenceId, String eventType, String actorId, String actorName,
                            String actorRole, String stationId, Instant timestamp, String canonicalPayload,
                            String contentHash, String previousHash, String currentHash) {
        this.recordId = recordId;
        this.chainScope = chainScope != null ? chainScope : "GLOBAL";
        this.sequenceIndex = sequenceIndex;
        this.caseId = caseId;
        this.evidenceId = evidenceId;
        this.eventType = eventType;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.stationId = stationId;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.canonicalPayload = canonicalPayload;
        this.contentHash = contentHash;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.verificationStatus = "VALID";
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
        if (this.verificationStatus == null) {
            this.verificationStatus = "VALID";
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecordId() {
        return recordId;
    }

    public void setRecordId(String recordId) {
        this.recordId = recordId;
    }

    public String getChainScope() {
        return chainScope;
    }

    public void setChainScope(String chainScope) {
        this.chainScope = chainScope;
    }

    public Long getSequenceIndex() {
        return sequenceIndex;
    }

    public void setSequenceIndex(Long sequenceIndex) {
        this.sequenceIndex = sequenceIndex;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public String getEvidenceId() {
        return evidenceId;
    }

    public void setEvidenceId(String evidenceId) {
        this.evidenceId = evidenceId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getStationId() {
        return stationId;
    }

    public void setStationId(String stationId) {
        this.stationId = stationId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getCanonicalPayload() {
        return canonicalPayload;
    }

    public void setCanonicalPayload(String canonicalPayload) {
        this.canonicalPayload = canonicalPayload;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getCurrentHash() {
        return currentHash;
    }

    public void setCurrentHash(String currentHash) {
        this.currentHash = currentHash;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }
}
