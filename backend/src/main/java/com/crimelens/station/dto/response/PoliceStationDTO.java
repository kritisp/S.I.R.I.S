package com.crimelens.station.dto.response;

import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import java.time.Instant;

public class PoliceStationDTO {

    private String id;
    private String name;
    private String district;
    private String city;
    private String state;
    private StationStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public PoliceStationDTO() {
    }

    public PoliceStationDTO(PoliceStation station) {
        if (station != null) {
            this.id = station.getId();
            this.name = station.getName();
            this.district = station.getDistrict();
            this.city = station.getCity();
            this.state = station.getState();
            this.status = station.getStatus();
            this.createdAt = station.getCreatedAt();
            this.updatedAt = station.getUpdatedAt();
        }
    }

    public static PoliceStationDTO fromEntity(PoliceStation station) {
        return station == null ? null : new PoliceStationDTO(station);
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
