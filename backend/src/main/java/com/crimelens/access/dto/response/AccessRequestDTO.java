package com.crimelens.access.dto.response;

import com.crimelens.access.entity.AccessRequest;
import com.crimelens.access.entity.enums.RequestStatus;
import java.time.Instant;

public class AccessRequestDTO {

    private String id;
    private String requestingStationId;
    private String requestingStationName;
    private String requestingOfficerId;
    private String requestingOfficerName;
    private String targetStationId;
    private String targetStationName;
    private String targetCaseId;
    private String targetCaseTitle;
    private String reason;
    private RequestStatus status;
    private Instant createdAt;

    public AccessRequestDTO() {
    }

    public AccessRequestDTO(AccessRequest entity) {
        if (entity != null) {
            this.id = entity.getId();
            if (entity.getRequestingStation() != null) {
                this.requestingStationId = entity.getRequestingStation().getId();
                this.requestingStationName = entity.getRequestingStation().getName();
            }
            if (entity.getRequestingOfficer() != null) {
                this.requestingOfficerId = entity.getRequestingOfficer().getId();
                this.requestingOfficerName = entity.getRequestingOfficer().getName();
            }
            if (entity.getTargetStation() != null) {
                this.targetStationId = entity.getTargetStation().getId();
                this.targetStationName = entity.getTargetStation().getName();
            }
            if (entity.getTargetCase() != null) {
                this.targetCaseId = entity.getTargetCase().getId();
                this.targetCaseTitle = entity.getTargetCase().getTitle();
            }
            this.reason = entity.getReason();
            this.status = entity.getStatus();
            this.createdAt = entity.getCreatedAt();
        }
    }

    public static AccessRequestDTO fromEntity(AccessRequest entity) {
        return entity == null ? null : new AccessRequestDTO(entity);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRequestingStationId() {
        return requestingStationId;
    }

    public void setRequestingStationId(String requestingStationId) {
        this.requestingStationId = requestingStationId;
    }

    public String getRequestingStationName() {
        return requestingStationName;
    }

    public void setRequestingStationName(String requestingStationName) {
        this.requestingStationName = requestingStationName;
    }

    public String getRequestingOfficerId() {
        return requestingOfficerId;
    }

    public void setRequestingOfficerId(String requestingOfficerId) {
        this.requestingOfficerId = requestingOfficerId;
    }

    public String getRequestingOfficerName() {
        return requestingOfficerName;
    }

    public void setRequestingOfficerName(String requestingOfficerName) {
        this.requestingOfficerName = requestingOfficerName;
    }

    public String getTargetStationId() {
        return targetStationId;
    }

    public void setTargetStationId(String targetStationId) {
        this.targetStationId = targetStationId;
    }

    public String getTargetStationName() {
        return targetStationName;
    }

    public void setTargetStationName(String targetStationName) {
        this.targetStationName = targetStationName;
    }

    public String getTargetCaseId() {
        return targetCaseId;
    }

    public void setTargetCaseId(String targetCaseId) {
        this.targetCaseId = targetCaseId;
    }

    public String getTargetCaseTitle() {
        return targetCaseTitle;
    }

    public void setTargetCaseTitle(String targetCaseTitle) {
        this.targetCaseTitle = targetCaseTitle;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
