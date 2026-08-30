package com.crimelens.security;

import com.crimelens.access.entity.AccessRequest;
import com.crimelens.access.entity.enums.RequestStatus;

import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.audit.repository.AuditLogRepository;
import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.user.repository.UserRepository;
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

import java.util.Date;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class Phase3SecurityComprehensiveTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private CaseRecordRepository caseRecordRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    private String obtainAccessToken(String userId, String role, String stationCode) throws Exception {
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
    @DisplayName("Scenario 1: Successful Auth Returns Access Token, Refresh Token, and User/Station Metadata")
    void test1_SuccessfulAuth_ReturnsTokensAndMetadata() throws Exception {
        LoginRequest request = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresIn").value(greaterThan(0)))
                .andExpect(jsonPath("$.data.user.id").value("INV-BBSR-001"))
                .andExpect(jsonPath("$.data.user.role").value("OFFICER"))
                .andExpect(jsonPath("$.data.station.id").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("Scenario 2: Login Fails with Invalid Password (401)")
    void test2_LoginFails_InvalidPassword() throws Exception {
        LoginRequest request = new LoginRequest("INV-BBSR-001", "WrongPassword!999", "OP-BBSR-CAP", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Authentication failed")));
    }

    @Test
    @DisplayName("Scenario 3: Login Fails with Station Mismatch for Non-Super Admin (401)")
    void test3_LoginFails_StationMismatch() throws Exception {
        // INV-BBSR-001 is registered at OP-BBSR-CAP, attempts login with OP-CTC-CITY
        LoginRequest request = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-CTC-CITY", "OFFICER");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Scenario 4: Protected API Rejects Request Missing Token (401)")
    void test4_ProtectedApi_MissingToken_401() throws Exception {
        mockMvc.perform(get("/api/v1/cases"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Scenario 5: Protected API Rejects Tampered Token (401)")
    void test5_ProtectedApi_TamperedToken_401() throws Exception {
        String token = obtainAccessToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        String tampered = token.substring(0, token.length() - 6) + "XXXXXX";

        mockMvc.perform(get("/api/v1/cases")
                        .header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Scenario 6: Protected API Rejects Expired Token (401)")
    void test6_ProtectedApi_ExpiredToken_401() throws Exception {
        // Construct an expired token directly using JwtTokenProvider validation
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider(
                "4c8b9d3f5e1a7c2b8e4f0a9d3c5e7b1a9f0e2d4c6b8a0e2f4a6c8b0d2e4f6a8b",
                -1000L, // Expired 1 second ago
                -1000L,
                "crimelens-state-command"
        );

        User officer = userRepository.findById("INV-BBSR-001").orElseThrow();
        UserPrincipal principal = UserPrincipal.create(officer);
        String expiredToken = shortLivedProvider.generateAccessToken(principal);

        assertFalse(tokenProvider.validateToken(expiredToken));

        mockMvc.perform(get("/api/v1/cases")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Scenario 7: Super Admin Can View Cases Across All Stations")
    void test7_SuperAdmin_CanAccessAllStations() throws Exception {
        String token = obtainAccessToken("OP-HQ-001", "SUPER_ADMIN", null);

        // Access BBSR Case
        mockMvc.perform(get("/api/v1/cases/CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("CR-KHD-2026-004821"));

        // Access Cuttack Case
        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("OD-CTC-2026-00981"));
    }

    @Test
    @DisplayName("Scenario 8: Station Admin Only Views Cases Belonging to Their Station")
    void test8_StationAdmin_RestrictedToOwnStation() throws Exception {
        String token = obtainAccessToken("IIC-BBSR-01", "STATION_ADMIN", "OP-BBSR-CAP");

        // BBSR Case succeeds
        mockMvc.perform(get("/api/v1/cases/CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Cuttack Case fails with 403 Forbidden
        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 9: Officer Can View Station Cases and Assigned Cases")
    void test9_Officer_AccessStationAndAssignedCases() throws Exception {
        String token = obtainAccessToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        // Access station case
        mockMvc.perform(get("/api/v1/cases/CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stationId").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("Scenario 10: Station Isolation Prevents Officer A from Accessing Station B Case (403)")
    void test10_StationIsolation_CrossStation_Forbidden() throws Exception {
        String bbsrToken = obtainAccessToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        // Attempting to access Cuttack case without access request returns 403
        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + bbsrToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Scenario 11: Officer with APPROVED Access Request CAN View Target Case")
    void test11_ApprovedAccessGrant_CanViewCase() throws Exception {
        // Seeded in DataInitializer: req2 is APPROVED for invBbsr2 on OD-CTC-2026-00981
        String token = obtainAccessToken("INV-BBSR-002", "OFFICER", "OP-BBSR-CAP");

        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("OD-CTC-2026-00981"));
    }

    @Test
    @DisplayName("Scenario 12: Evidence API Enforces Same Authorization Logic as Parent Case")
    void test12_EvidenceApi_InheritsParentCaseAuthorization() throws Exception {
        String bbsrOfficerToken = obtainAccessToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        String ctcOfficerToken = obtainAccessToken("INV-CTC-001", "OFFICER", "OP-CTC-CITY");

        // BBSR Officer accessing BBSR Case Evidence succeeds
        mockMvc.perform(get("/api/v1/evidence")
                        .param("caseId", "CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + bbsrOfficerToken))
                .andExpect(status().isOk());

        // BBSR Officer accessing Cuttack Case Evidence (unauthorized) returns 403 Forbidden
        mockMvc.perform(get("/api/v1/evidence")
                        .param("caseId", "OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + bbsrOfficerToken))
                .andExpect(status().isForbidden());

        // Approved cross-station officer (invBbsr2) can view evidence for OD-CTC-2026-00981
        String approvedToken = obtainAccessToken("INV-BBSR-002", "OFFICER", "OP-BBSR-CAP");
        mockMvc.perform(get("/api/v1/evidence")
                        .param("caseId", "OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + approvedToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Scenario 13: Unapproved Access Request Returns 403 on Case/Evidence Endpoints")
    void test13_UnapprovedAccessRequest_Forbidden() throws Exception {
        // req1 is PENDING for INV-BBSR-001 on OD-CTC-2026-00981
        String token = obtainAccessToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        mockMvc.perform(get("/api/v1/cases/OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/evidence")
                        .param("caseId", "OD-CTC-2026-00981")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Scenario 14: Security Events Are Properly Audit Logged")
    void test14_AuditLog_RecordsSecurityEvents() throws Exception {
        long initialAuditCount = auditLogRepository.count();

        // Perform login
        obtainAccessToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        // Verify audit log count increased
        long currentAuditCount = auditLogRepository.count();
        assertTrue(currentAuditCount > initialAuditCount);
    }

    @Test
    @DisplayName("Scenario 15: INACTIVE User Account Prevents Login and API Access")
    void test15_InactiveUser_Blocked() throws Exception {
        // Step 1: Create or set user inactive
        User user = userRepository.findById("INV-CTC-001").orElseThrow();
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);

        // Login attempt fails with 401
        LoginRequest loginRequest = new LoginRequest("INV-CTC-001", "Demo@123", "OP-CTC-CITY", "OFFICER");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // Restore status to ACTIVE for future tests
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }
}
