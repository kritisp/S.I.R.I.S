package com.crimelens.audit.dto.response;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class ChainVerificationResultDTO {

    private String chainScope;
    private String status; // "VERIFIED" or "COMPROMISED"
    private int totalRecords;
    private int verifiedRecords;
    private String brokenRecordId;
    private Long brokenSequenceIndex;
    private String failureReason;
    private Instant verifiedAt;
    private List<RecordVerificationItemDTO> items;

    public ChainVerificationResultDTO() {
        this.status = "VERIFIED";
        this.verifiedAt = Instant.now();
        this.items = new ArrayList<>();
    }

    public ChainVerificationResultDTO(String chainScope) {
        this.chainScope = chainScope;
        this.status = "VERIFIED";
        this.verifiedAt = Instant.now();
        this.items = new ArrayList<>();
    }

    public String getChainScope() { return chainScope; }
    public void setChainScope(String chainScope) { this.chainScope = chainScope; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public int getVerifiedRecords() { return verifiedRecords; }
    public void setVerifiedRecords(int verifiedRecords) { this.verifiedRecords = verifiedRecords; }

    public String getBrokenRecordId() { return brokenRecordId; }
    public void setBrokenRecordId(String brokenRecordId) { this.brokenRecordId = brokenRecordId; }

    public Long getBrokenSequenceIndex() { return brokenSequenceIndex; }
    public void setBrokenSequenceIndex(Long brokenSequenceIndex) { this.brokenSequenceIndex = brokenSequenceIndex; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public List<RecordVerificationItemDTO> getItems() { return items; }
    public void setItems(List<RecordVerificationItemDTO> items) { this.items = items; }
}
