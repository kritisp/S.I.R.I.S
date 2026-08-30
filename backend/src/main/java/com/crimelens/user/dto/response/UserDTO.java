package com.crimelens.user.dto.response;

import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import java.time.Instant;

public class UserDTO {

    private String id;
    private String name;
    private UserRole role;
    private String stationId;
    private String stationName;
    private String rank;
    private String email;
    private UserStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public UserDTO() {
    }

    public UserDTO(User user) {
        if (user != null) {
            this.id = user.getId();
            this.name = user.getName();
            this.role = user.getRole();
            if (user.getStation() != null) {
                this.stationId = user.getStation().getId();
                this.stationName = user.getStation().getName();
            }
            this.rank = user.getRank();
            this.email = user.getEmail();
            this.status = user.getStatus();
            this.createdAt = user.getCreatedAt();
            this.updatedAt = user.getUpdatedAt();
        }
    }

    public static UserDTO fromEntity(User user) {
        return user == null ? null : new UserDTO(user);
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public String getStationId() {
        return stationId;
    }

    public void setStationId(String stationId) {
        this.stationId = stationId;
    }

    public String getStationName() {
        return stationName;
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
    }

    public String getRank() {
        return rank;
    }

    public void setRank(String rank) {
        this.rank = rank;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
