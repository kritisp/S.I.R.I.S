package com.crimelens.audit.dto.response;

public class RecordVerificationItemDTO {

    private String recordId;
    private Long sequenceIndex;
    private String eventType;
    private String storedPreviousHash;
    private String expectedPreviousHash;
    private String storedCurrentHash;
    private String calculatedCurrentHash;
    private boolean previousHashValid;
    private boolean currentHashValid;
    private boolean contentHashValid;
    private String status; // "VALID", "COMPROMISED"
    private String failureDetails;

    public RecordVerificationItemDTO() {
        this.previousHashValid = true;
        this.currentHashValid = true;
        this.contentHashValid = true;
        this.status = "VALID";
    }

    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }

    public Long getSequenceIndex() { return sequenceIndex; }
    public void setSequenceIndex(Long sequenceIndex) { this.sequenceIndex = sequenceIndex; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getStoredPreviousHash() { return storedPreviousHash; }
    public void setStoredPreviousHash(String storedPreviousHash) { this.storedPreviousHash = storedPreviousHash; }

    public String getExpectedPreviousHash() { return expectedPreviousHash; }
    public void setExpectedPreviousHash(String expectedPreviousHash) { this.expectedPreviousHash = expectedPreviousHash; }

    public String getStoredCurrentHash() { return storedCurrentHash; }
    public void setStoredCurrentHash(String storedCurrentHash) { this.storedCurrentHash = storedCurrentHash; }

    public String getCalculatedCurrentHash() { return calculatedCurrentHash; }
    public void setCalculatedCurrentHash(String calculatedCurrentHash) { this.calculatedCurrentHash = calculatedCurrentHash; }

    public boolean isPreviousHashValid() { return previousHashValid; }
    public void setPreviousHashValid(boolean previousHashValid) { this.previousHashValid = previousHashValid; }

    public boolean isCurrentHashValid() { return currentHashValid; }
    public void setCurrentHashValid(boolean currentHashValid) { this.currentHashValid = currentHashValid; }

    public boolean isContentHashValid() { return contentHashValid; }
    public void setContentHashValid(boolean contentHashValid) { this.contentHashValid = contentHashValid; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFailureDetails() { return failureDetails; }
    public void setFailureDetails(String failureDetails) { this.failureDetails = failureDetails; }
}
