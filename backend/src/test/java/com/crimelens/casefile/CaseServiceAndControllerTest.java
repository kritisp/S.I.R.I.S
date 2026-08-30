package com.crimelens.casefile;

import com.crimelens.casefile.dto.request.AssignInvestigatorRequest;
import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.casefile.dto.request.UpdateCaseRequest;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
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

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CaseServiceAndControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String bbsrOfficerToken;
    private String bbsrAdminToken;

    @BeforeEach
    void setup() throws Exception {
        LoginRequest officerLogin = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");
        MvcResult offResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(officerLogin)))
                .andExpect(status().isOk())
                .andReturn();
        bbsrOfficerToken = objectMapper.readTree(offResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        LoginRequest adminLogin = new LoginRequest("IIC-BBSR-01", "Demo@123", "OP-BBSR-CAP", "STATION_ADMIN");
        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        bbsrAdminToken = objectMapper.readTree(adminResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("1. Create Case - Valid input returns 201 Created")
    void testCreateCase_Success() throws Exception {
        CreateCaseRequest request = new CreateCaseRequest(
                null,
                "FIR-TEST-BBSR-2026-099",
                "OP-BBSR-CAP",
                "INV-BBSR-001",
                "Commercial Burglary at Khandagiri",
                "Break-in reported at commercial complex. Cash vault tampered.",
                "Commercial Burglary",
                CaseStatus.PENDING,
                CasePriority.HIGH,
                Instant.now()
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + bbsrOfficerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firNumber").value("FIR-TEST-BBSR-2026-099"))
                .andExpect(jsonPath("$.data.stationId").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("2. Create Case - Duplicate FIR Number returns 409 Conflict")
    void testCreateCase_DuplicateFir_Conflict() throws Exception {
        CreateCaseRequest request = new CreateCaseRequest(
                null,
                "CR-KHD-2026-004821", // Already exists from seed
                "OP-BBSR-CAP",
                "INV-BBSR-001",
                "Duplicate Case Title",
                "Description here",
                "Theft",
                CaseStatus.PENDING,
                CasePriority.MEDIUM,
                Instant.now()
        );

        mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + bbsrOfficerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("3. Update Case - Valid update returns 200 OK")
    void testUpdateCase_Success() throws Exception {
        UpdateCaseRequest request = new UpdateCaseRequest();
        request.setTitle("Updated High-Value Burglary Narrative");
        request.setPriority(CasePriority.CRITICAL);
        request.setStatus(CaseStatus.INVESTIGATING);

        mockMvc.perform(put("/api/v1/cases/CR-KHD-2026-004821")
                        .header("Authorization", "Bearer " + bbsrOfficerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Updated High-Value Burglary Narrative"))
                .andExpect(jsonPath("$.data.priority").value("CRITICAL"));
    }

    @Test
    @DisplayName("4. Assign Investigator - Station Admin can reassign officer (200 OK)")
    void testAssignInvestigator_StationAdmin_Success() throws Exception {
        AssignInvestigatorRequest request = new AssignInvestigatorRequest("INV-BBSR-002");

        mockMvc.perform(patch("/api/v1/cases/CR-KHD-2026-004821/assign")
                        .header("Authorization", "Bearer " + bbsrAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.investigatorId").value("INV-BBSR-002"));
    }

    @Test
    @DisplayName("5. Assign Investigator - Normal Officer cannot reassign case (403 Forbidden)")
    void testAssignInvestigator_Officer_Forbidden() throws Exception {
        AssignInvestigatorRequest request = new AssignInvestigatorRequest("INV-BBSR-002");

        mockMvc.perform(patch("/api/v1/cases/CR-KHD-2026-004821/assign")
                        .header("Authorization", "Bearer " + bbsrOfficerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
