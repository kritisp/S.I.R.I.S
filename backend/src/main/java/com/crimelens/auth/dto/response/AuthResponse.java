package com.crimelens.auth.dto.response;

import com.crimelens.station.dto.response.PoliceStationDTO;
import com.crimelens.user.dto.response.UserDTO;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserDTO user;
    private PoliceStationDTO station;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String refreshToken, long expiresIn, UserDTO user, PoliceStationDTO station) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
        this.expiresIn = expiresIn;
        this.user = user;
        this.station = station;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public PoliceStationDTO getStation() {
        return station;
    }

    public void setStation(PoliceStationDTO station) {
        this.station = station;
    }
}
