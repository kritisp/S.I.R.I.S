package com.crimelens.station.dto.request;

import com.crimelens.station.entity.enums.StationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateStationRequest {

    @NotBlank(message = "Station ID / Code is required")
    @Size(max = 50, message = "Station Code must not exceed 50 characters")
    private String id;

    @NotBlank(message = "Station name is required")
    @Size(max = 150, message = "Station name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "District is required")
    @Size(max = 100, message = "District must not exceed 100 characters")
    private String district;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    private String state = "Odisha";

    private StationStatus status = StationStatus.ACTIVE;

    public CreateStationRequest() {
    }

    public CreateStationRequest(String id, String name, String district, String city, String state, StationStatus status) {
        this.id = id;
        this.name = name;
        this.district = district;
        this.city = city;
        this.state = state != null ? state : "Odisha";
        this.status = status != null ? status : StationStatus.ACTIVE;
    }

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
}
