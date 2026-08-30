package com.crimelens.station.entity;

import com.crimelens.station.entity.enums.StationStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "police_stations")
public class PoliceStation {

    @Id
    @Column(name = "id", length = 50, nullable = false, updatable = false)
    private String id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "district", nullable = false, length = 100)
    private String district;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    private String state = "Odisha";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StationStatus status = StationStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public PoliceStation() {
    }

    public PoliceStation(String id, String name, String district, String city, String state, StationStatus status) {
        this.id = id;
        this.name = name;
        this.district = district;
        this.city = city;
        this.state = state != null ? state : "Odisha";
        this.status = status != null ? status : StationStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public StationStatus getStatus() {
        return status;
    }

    public void setStatus(StationStatus status) {
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
