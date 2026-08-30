package com.crimelens.user;

import com.crimelens.user.dto.request.CreateUserRequest;
import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
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
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String bbsrAdminToken;
    private String bbsrOfficerToken;

    @BeforeEach
    void setup() throws Exception {
        LoginRequest adminLogin = new LoginRequest("IIC-BBSR-01", "Demo@123", "OP-BBSR-CAP", "STATION_ADMIN");
        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        bbsrAdminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        LoginRequest officerLogin = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");
        MvcResult offResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(officerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        bbsrOfficerToken = objectMapper.readTree(offResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("1. Station Admin can create an Officer for their station (201 Created)")
    void testCreateOfficer_StationAdmin_Success() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setId("INV-BBSR-NEW-01");
        request.setName("SI Debasis Mohanty");
        request.setRole(UserRole.OFFICER);
        request.setStationId("OP-BBSR-CAP");
        request.setRank("Sub-Inspector");
        request.setEmail("debasis.mohanty@odishapolice.gov.in");
        request.setPassword("Demo@123");
        request.setStatus(UserStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + bbsrAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value("INV-BBSR-NEW-01"))
                .andExpect(jsonPath("$.data.stationId").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("2. Station Admin cannot create an Officer for a different station (403 Forbidden)")
    void testCreateOfficer_OtherStation_Forbidden() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setId("INV-CTC-NEW-01");
        request.setName("SI Cross Station");
        request.setRole(UserRole.OFFICER);
        request.setStationId("OP-CTC-CITY"); // Station Admin is from OP-BBSR-CAP!
        request.setRank("Sub-Inspector");
        request.setPassword("Demo@123");

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + bbsrAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("3. Officer cannot create other users (403 Forbidden)")
    void testCreateOfficer_Officer_Forbidden() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setId("INV-BBSR-099");
        request.setName("SI Illegal");
        request.setRole(UserRole.OFFICER);
        request.setStationId("OP-BBSR-CAP");
        request.setPassword("Demo@123");

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + bbsrOfficerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("4. View Officer Caseload statistics (200 OK)")
    void testGetOfficerCaseload_Success() throws Exception {
        mockMvc.perform(get("/api/v1/users/INV-BBSR-001/caseload")
                        .header("Authorization", "Bearer " + bbsrAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.officerId").value("INV-BBSR-001"))
                .andExpect(jsonPath("$.data.activeCases").isNumber());
    }

    @Test
    @DisplayName("5. Station Admin can toggle officer active/inactive status (200 OK)")
    void testToggleOfficerStatus_Success() throws Exception {
        mockMvc.perform(patch("/api/v1/users/INV-BBSR-002/status")
                        .header("Authorization", "Bearer " + bbsrAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        // Toggle back
        mockMvc.perform(patch("/api/v1/users/INV-BBSR-002/status")
                        .header("Authorization", "Bearer " + bbsrAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }
}
