package com.crimelens.audit.entity;

import com.crimelens.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_station_id", columnList = "station_id"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_resource_type", columnList = "resource_type"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_relation_id")
    private User user;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "user_name", length = 150)
    private String userName;

    @Column(name = "user_role", length = 30)
    private String userRole;

    @Column(name = "station_id", length = 50)
    private String stationId;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "resource_type", length = 50)
    private String resourceType;

    @Column(name = "resource_id", length = 100)
    private String resourceId;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp;

    public AuditLog() {
        this.timestamp = Instant.now();
    }

    public AuditLog(String userId, String userName, String userRole, String stationId, String action,
                    String resourceType, String resourceId, String ipAddress, String details) {
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.stationId = stationId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.ipAddress = ipAddress;
        this.details = details;
        this.timestamp = Instant.now();
    }

    public AuditLog(User user, String userId, String userName, String userRole, String stationId, String action,
                    String resourceType, String resourceId, String ipAddress, String details) {
        this.user = user;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.stationId = stationId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.ipAddress = ipAddress;
        this.details = details;
        this.timestamp = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    // Getters and Setters
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
