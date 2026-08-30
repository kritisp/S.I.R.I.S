package com.crimelens.station.dto.request;

import com.crimelens.station.entity.enums.StationStatus;
import jakarta.validation.constraints.Size;

public class UpdateStationRequest {

    @Size(max = 150, message = "Station name must not exceed 150 characters")
    private String name;

    @Size(max = 100, message = "District must not exceed 100 characters")
    private String district;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    private String state;

    private StationStatus status;

    public UpdateStationRequest() {
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
