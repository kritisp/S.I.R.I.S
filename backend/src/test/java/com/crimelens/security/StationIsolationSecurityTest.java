package com.crimelens.security;

import com.crimelens.auth.dto.request.LoginRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class StationIsolationSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String superAdminToken;
    private String bbsrStationAdminToken;
    private String bbsrOfficerToken;
    private String ctcOfficerToken;

    @BeforeEach
    void obtainTokens() throws Exception {
        superAdminToken = loginAndGetToken("OP-HQ-001", "SUPER_ADMIN", null);
        bbsrStationAdminToken = loginAndGetToken("IIC-BBSR-01", "STATION_ADMIN", "OP-BBSR-CAP");
        bbsrOfficerToken = loginAndGetToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        ctcOfficerToken = loginAndGetToken("INV-CTC-001", "OFFICER", "OP-CTC-CITY");
    }

    private String loginAndGetToken(String userId, String role, String stationCode) throws Exception {
        LoginRequest request = new LoginRequest(userId, "Demo@123", stationCode, role);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("1. Bhubaneswar Officer accessing Bhubaneswar Case succeeds (200 OK)")
    void testOfficer_AccessOwnStationCase_Success() throws Exception {
        mockMvc.perform(get("/api/v1/cases/CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + bbsrOfficerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("CR-KHD-2026-004821"))
                .andExpect(jsonPath("$.data.stationId").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("2. Bhubaneswar Officer accessing Cuttack Case is FORBIDDEN (403)")
    void testOfficer_AccessOtherStationCase_Forbidden() throws Exception {
        // OD-CTC-2026-00981 belongs to Cuttack City PS
        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + bbsrOfficerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("3. Bhubaneswar Station Admin accessing Cuttack Case is FORBIDDEN (403)")
    void testStationAdmin_AccessOtherStationCase_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + bbsrStationAdminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("4. Super Admin can access cases from ANY station across state (200 OK)")
    void testSuperAdmin_AccessAnyStationCase_Success() throws Exception {
        // Access Bhubaneswar case
        mockMvc.perform(get("/api/v1/cases/CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("CR-KHD-2026-004821"));

        // Access Cuttack case
        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("OD-CTC-2026-00981"));
    }

    @Test
    @DisplayName("5. Case Search list is automatically restricted to Officer's station")
    void testOfficer_CaseList_StationIsolated() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("Authorization", "Bearer " + bbsrOfficerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].stationId", everyItem(equalTo("OP-BBSR-CAP"))));
    }

    @Test
    @DisplayName("6. Cuttack Officer searching cases only sees Cuttack cases")
    void testCtcOfficer_CaseList_StationIsolated() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("Authorization", "Bearer " + ctcOfficerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].stationId", everyItem(equalTo("OP-CTC-CITY"))));
    }
}
