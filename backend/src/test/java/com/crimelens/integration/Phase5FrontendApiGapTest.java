package com.crimelens.integration;

import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.casefile.dto.request.AssignInvestigatorRequest;
import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase5FrontendApiGapTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String obtainToken(String userId, String role, String stationCode) throws Exception {
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
    @DisplayName("1. Evidence Vault: GET /api/v1/evidence without caseId returns station evidence")
    void test1_EvidenceVault_OptionalCaseId_ReturnsStationEvidence() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        mockMvc.perform(get("/api/v1/evidence")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("2. FIR Registration Flow: POST /api/v1/cases creates case and returns FIR metadata")
    void test2_FirRegistration_CreateCase() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateCaseRequest request = new CreateCaseRequest(
                "CR-KHD-2026-9999",
                "FIR-KHD-2026-9999",
                "OP-BBSR-CAP",
                "INV-BBSR-001",
                "Commercial Vault Robbery",
                "High value burglary at commercial jeweler in Saheed Nagar",
                "Commercial Burglary",
                CaseStatus.PENDING,
                CasePriority.HIGH,
                null
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firNumber").value("FIR-KHD-2026-9999"))
                .andExpect(jsonPath("$.data.title").value("Commercial Vault Robbery"));
    }

    @Test
    @DisplayName("3. Case Search & Registry: GET /api/v1/cases with filters")
    void test3_CaseSearch_WithFilters() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        mockMvc.perform(get("/api/v1/cases")
                        .param("query", "Burglary")
                        .param("page", "0")
                        .param("size", "10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("4. Investigator Assignment: PATCH /api/v1/cases/{id}/assign")
    void test4_AssignInvestigator() throws Exception {
        String token = obtainToken("IIC-BBSR-01", "STATION_ADMIN", "OP-BBSR-CAP");
        AssignInvestigatorRequest request = new AssignInvestigatorRequest("INV-BBSR-002");

        mockMvc.perform(patch("/api/v1/cases/CR-KHD-2026-004821/assign")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.investigatorId").value("INV-BBSR-002"));
    }

    @Test
    @DisplayName("5. Operational Dashboard Telemetry: GET /api/v1/dashboard/stats")
    void test5_DashboardStats() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        mockMvc.perform(get("/api/v1/dashboard/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCases").value(greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.activeInvestigations").value(greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("6. Intelligence Alerts Feed: GET /api/v1/alerts and PATCH /api/v1/alerts/{id}/read")
    void test6_IntelligenceAlertsFeed() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        MvcResult result = mockMvc.perform(get("/api/v1/alerts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        if (json.contains("\"id\":\"ALT-")) {
            String alertId = objectMapper.readTree(json).path("data").get(0).path("id").asText();
            mockMvc.perform(patch("/api/v1/alerts/" + alertId + "/read")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isRead").value(true));
        }
    }

    @Test
    @DisplayName("7. AIRA Assistant Chat & Draft Generation Endpoints")
    void test7_AIRAChat_And_Draft() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        String chatJson = "{\"messages\":[{\"role\":\"user\",\"content\":\"Explain BNS theft provisions\"}],\"language\":\"en\"}";

        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("assistant"))
                .andExpect(jsonPath("$.message").isNotEmpty());

        mockMvc.perform(post("/api/v1/chat/generate-draft")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(chatJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.draft.title").isNotEmpty())
                .andExpect(jsonPath("$.draft.description").isNotEmpty());
    }

    @Test
    @DisplayName("8. Station Audit Log Access: GET /api/v1/audit/station/{stationId}")
    void test8_StationAuditLogs() throws Exception {
        String token = obtainToken("IIC-BBSR-01", "STATION_ADMIN", "OP-BBSR-CAP");

        mockMvc.perform(get("/api/v1/audit/station/OP-BBSR-CAP")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }
}
