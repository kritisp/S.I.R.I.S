package com.crimelens.audit.dto.response;

import com.crimelens.audit.entity.AuditLog;
import java.time.Instant;

public class AuditLogDTO {

    private Long id;
    private String userId;
    private String userName;
    private String userRole;
    private String stationId;
    private String action;
    private String resourceType;
    private String resourceId;
    private String ipAddress;
    private String details;
    private Instant timestamp;

    public AuditLogDTO() {
    }

    public AuditLogDTO(AuditLog log) {
        if (log != null) {
            this.id = log.getId();
            this.userId = log.getUserId();
            this.userName = log.getUserName();
            this.userRole = log.getUserRole();
            this.stationId = log.getStationId();
            this.action = log.getAction();
            this.resourceType = log.getResourceType();
            this.resourceId = log.getResourceId();
            this.ipAddress = log.getIpAddress();
            this.details = log.getDetails();
            this.timestamp = log.getTimestamp();
        }
    }

    public static AuditLogDTO fromEntity(AuditLog log) {
        return log == null ? null : new AuditLogDTO(log);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getStationId() {
        return stationId;
    }

    public void setStationId(String stationId) {
        this.stationId = stationId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
