package com.crimelens.station;

import com.crimelens.station.dto.request.CreateStationRequest;
import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.station.dto.request.UpdateStationRequest;
import com.crimelens.station.entity.enums.StationStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PoliceStationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String superAdminToken;
    private String officerToken;

    @BeforeEach
    void setup() throws Exception {
        LoginRequest saLogin = new LoginRequest("OP-HQ-001", "Demo@123", null, "SUPER_ADMIN");
        MvcResult saResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saLogin)))
                .andExpect(status().isOk())
                .andReturn();
        superAdminToken = objectMapper.readTree(saResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        LoginRequest offLogin = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");
        MvcResult offResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offLogin)))
                .andExpect(status().isOk())
                .andReturn();
        officerToken = objectMapper.readTree(offResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("1. Super Admin can register a new Police Station (201 Created)")
    void testCreateStation_SuperAdmin_Success() throws Exception {
        CreateStationRequest request = new CreateStationRequest(
                "OP-BLS-TOW-99",
                "Balasore Town Special PS",
                "Balasore",
                "Balasore",
                "Odisha",
                StationStatus.ACTIVE
        );

        mockMvc.perform(post("/api/v1/stations")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("OP-BLS-TOW-99"))
                .andExpect(jsonPath("$.data.name").value("Balasore Town Special PS"));
    }

    @Test
    @DisplayName("2. Normal Officer cannot register a Police Station (403 Forbidden)")
    void testCreateStation_Officer_Forbidden() throws Exception {
        CreateStationRequest request = new CreateStationRequest(
                "OP-ILL-01",
                "Illegal Station",
                "Puri",
                "Puri",
                "Odisha",
                StationStatus.ACTIVE
        );

        mockMvc.perform(post("/api/v1/stations")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("3. Get Station by ID returns 200 OK")
    void testGetStationById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/stations/OP-BBSR-CAP")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("OP-BBSR-CAP"))
                .andExpect(jsonPath("$.data.name").value("Khandagiri Police Station"));
    }

    @Test
    @DisplayName("4. Get non-existent Station returns 404 Not Found")
    void testGetNonExistentStation_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/stations/NON-EXISTENT-PS")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
