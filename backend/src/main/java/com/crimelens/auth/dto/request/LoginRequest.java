package com.crimelens.auth.dto.request;

import com.crimelens.user.entity.User;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Password is required")
    private String password;

    private String stationCode;

    private String role;

    public LoginRequest() {
    }

    public LoginRequest(String userId, String password, String stationCode, String role) {
        this.userId = userId;
        this.password = password;
        this.stationCode = stationCode;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getStationCode() {
        return stationCode;
    }

    public void setStationCode(String stationCode) {
        this.stationCode = stationCode;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
