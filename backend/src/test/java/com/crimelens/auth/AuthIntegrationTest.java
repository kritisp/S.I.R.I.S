package com.crimelens.auth;

import com.crimelens.user.entity.User;

import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.auth.dto.request.RefreshTokenRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("1. Super Admin Login - Successful without station code")
    void testSuperAdminLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("OP-HQ-001", "Demo@123", null, "SUPER_ADMIN");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.id").value("OP-HQ-001"))
                .andExpect(jsonPath("$.data.user.role").value("SUPER_ADMIN"));
    }

    @Test
    @DisplayName("2. Station Admin Login - Successful with correct station code")
    void testStationAdminLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("IIC-BBSR-01", "Demo@123", "OP-BBSR-CAP", "STATION_ADMIN");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.id").value("IIC-BBSR-01"))
                .andExpect(jsonPath("$.data.user.role").value("STATION_ADMIN"))
                .andExpect(jsonPath("$.data.station.id").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("3. Officer Login - Successful with station code")
    void testOfficerLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.id").value("INV-BBSR-001"))
                .andExpect(jsonPath("$.data.user.role").value("OFFICER"))
                .andExpect(jsonPath("$.data.station.id").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("4. Login - Invalid password fails with 401 Unauthorized")
    void testLogin_InvalidPassword_Fails() throws Exception {
        LoginRequest request = new LoginRequest("INV-BBSR-001", "WrongPassword!999", "OP-BBSR-CAP", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("5. Login - Station code mismatch fails with 401 Unauthorized")
    void testLogin_StationMismatch_Fails() throws Exception {
        // INV-BBSR-001 is from OP-BBSR-CAP, attempting login with Cuttack station code
        LoginRequest request = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-CTC-CITY", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("6. Login - Non-existent user fails with 401 Unauthorized")
    void testLogin_NonExistentUser_Fails() throws Exception {
        LoginRequest request = new LoginRequest("NON-EXISTENT-999", "Demo@123", "OP-BBSR-CAP", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("7. Refresh Token - Valid refresh token yields new access token")
    void testRefreshToken_Success() throws Exception {
        // Step 1: Login to get refresh token
        LoginRequest loginRequest = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String refreshToken = root.path("data").path("refreshToken").asText();
        assertNotNull(refreshToken);

        // Step 2: Use refresh token
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(refreshToken);
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("8. Current User /me - Returns authenticated user details")
    void testGetCurrentUser_Success() throws Exception {
        // Step 1: Login
        LoginRequest loginRequest = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        // Step 2: Call /api/v1/auth/me
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.id").value("INV-BBSR-001"))
                .andExpect(jsonPath("$.data.user.name").value("SI Ranjan Samal"))
                .andExpect(jsonPath("$.data.station.name").value("Khandagiri Police Station"));
    }
}
