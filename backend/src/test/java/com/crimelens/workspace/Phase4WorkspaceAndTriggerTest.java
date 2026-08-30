package com.crimelens.workspace;

import com.crimelens.audit.repository.AuditLogRepository;
import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.workspace.dto.request.AddWorkspaceCaseRequest;
import com.crimelens.workspace.dto.request.CreateWorkspaceRequest;
import com.crimelens.workspace.dto.request.UpdateWorkspaceRequest;
import com.crimelens.workspace.entity.InvestigationTrigger;
import com.crimelens.workspace.entity.enums.TriggerStatus;
import com.crimelens.workspace.entity.enums.WorkspaceStatus;
import com.crimelens.workspace.repository.InvestigationTriggerRepository;
import com.crimelens.workspace.repository.InvestigationWorkspaceRepository;
import com.crimelens.workspace.repository.WorkspaceIntelligenceResultRepository;
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
public class Phase4WorkspaceAndTriggerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InvestigationWorkspaceRepository workspaceRepository;

    @Autowired
    private InvestigationTriggerRepository triggerRepository;

    @Autowired
    private WorkspaceIntelligenceResultRepository resultRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

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
    @DisplayName("1. Authorized User Creates Workspace")
    void test1_CreateWorkspace_AuthorizedUser_Success() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateWorkspaceRequest request = new CreateWorkspaceRequest(
                "Saheed Nagar Burglaries Analysis",
                "Cross-case correlation of 2026 burglary incidents",
                "OP-BBSR-CAP",
                List.of("RELATIONSHIPS", "NETWORK", "PATTERNS")
        );

        mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Saheed Nagar Burglaries Analysis"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.station.id").value("OP-BBSR-CAP"));
    }

    @Test
    @DisplayName("2. Unauthorized User Cannot Create Workspace for Mismatched Station")
    void test2_CreateWorkspace_MismatchedStation_Forbidden() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateWorkspaceRequest request = new CreateWorkspaceRequest(
                "Cuttack Network Investigation",
                "Attempting to create workspace at another station",
                "OP-CTC-CITY",
                List.of("PATTERNS")
        );

        mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("3. User Can Retrieve Permitted Workspace")
    void test3_GetWorkspace_Permitted_Success() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest(
                "Unit IV Burglary Cluster",
                "Testing workspace retrieval",
                "OP-BBSR-CAP",
                List.of("NETWORK")
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String wsId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(get("/api/v1/workspaces/" + wsId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(wsId))
                .andExpect(jsonPath("$.data.title").value("Unit IV Burglary Cluster"));
    }

    @Test
    @DisplayName("4. User Cannot Retrieve Another Station's Workspace (403)")
    void test4_GetWorkspace_OtherStation_Forbidden() throws Exception {
        // Step 1: Cuttack officer creates workspace at Cuttack
        String ctcToken = obtainToken("INV-CTC-001", "OFFICER", "OP-CTC-CITY");
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest(
                "Cuttack Serial Robberies",
                "Station workspace for Cuttack",
                "OP-CTC-CITY",
                List.of("PATTERNS")
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + ctcToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String wsId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 2: BBSR officer attempts access and gets 403 Forbidden
        String bbsrToken = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        mockMvc.perform(get("/api/v1/workspaces/" + wsId)
                        .header("Authorization", "Bearer " + bbsrToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("5. Workspace Cannot Be Confirmed Without Cases (400 Bad Request)")
    void test5_ConfirmWorkspace_EmptyCases_BadRequest() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest(
                "Empty Workspace",
                "No cases added",
                "OP-BBSR-CAP",
                List.of("RELATIONSHIPS")
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String wsId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Confirming empty workspace returns 400
        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("must contain at least one case")));
    }

    @Test
    @DisplayName("6. Workspace Cannot Be Confirmed With Inaccessible Cases (403 Forbidden)")
    void test6_ConfirmWorkspace_InaccessibleCase_Forbidden() throws Exception {
        String bbsrToken = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest(
                "Cross Station Test Workspace",
                "Attempting to add unapproved Cuttack case",
                "OP-BBSR-CAP",
                List.of("RELATIONSHIPS")
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + bbsrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String wsId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Attempting to add unapproved cross-station case OD-CTC-2026-00981 fails with 403
        AddWorkspaceCaseRequest addCaseReq = new AddWorkspaceCaseRequest("OD-CTC-2026-00981");
        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/cases")
                        .header("Authorization", "Bearer " + bbsrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addCaseReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("7. Successful Confirmation Creates Exactly One Investigation Trigger")
    void test7_ConfirmWorkspace_CreatesOneTrigger() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        // Step 1: Create workspace
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest(
                "Saheed Nagar Case Matrix",
                "Full analysis workspace",
                "OP-BBSR-CAP",
                List.of("RELATIONSHIPS", "PATTERNS")
        );
        MvcResult createResult = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String wsId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 2: Add accessible case
        AddWorkspaceCaseRequest addCaseReq = new AddWorkspaceCaseRequest("CR-KHD-2026-004821");
        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/cases")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addCaseReq)))
                .andExpect(status().isCreated());

        // Step 3: Confirm workspace
        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.workspaceId").value(wsId));

        // Verify exactly one trigger exists for workspace
        List<InvestigationTrigger> triggers = triggerRepository.findByWorkspaceId(wsId);
        assertEquals(1, triggers.size());
    }

    @Test
    @DisplayName("8. Duplicate Confirmation Is Idempotent and Does Not Create Duplicate Active Triggers")
    void test8_ConfirmWorkspace_Idempotent() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        // Create & populate workspace
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest("Idempotency Workspace", "Desc", "OP-BBSR-CAP", List.of("PATTERNS"));
        MvcResult createRes = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated()).andReturn();

        String wsId = objectMapper.readTree(createRes.getResponse().getContentAsString()).path("data").path("id").asText();

        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/cases")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddWorkspaceCaseRequest("CR-KHD-2026-004821"))))
                .andExpect(status().isCreated());

        // First confirm
        MvcResult confirm1 = mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn();

        String triggerId1 = objectMapper.readTree(confirm1.getResponse().getContentAsString()).path("data").path("id").asText();

        // Second confirm
        MvcResult confirm2 = mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn();

        String triggerId2 = objectMapper.readTree(confirm2.getResponse().getContentAsString()).path("data").path("id").asText();

        assertEquals(triggerId1, triggerId2);
        assertEquals(1, triggerRepository.findByWorkspaceId(wsId).size());
    }

    @Test
    @DisplayName("9. Trigger Transitions Through Expected States and Mock Analysis Completes")
    void test9_TriggerExecution_And_IntelligenceResultRetrieval() throws Exception {
        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");

        // Create, populate, confirm
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest("Full Lifecycle Workspace", "Analysis", "OP-BBSR-CAP", List.of("RELATIONSHIPS"));
        MvcResult createRes = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated()).andReturn();
        String wsId = objectMapper.readTree(createRes.getResponse().getContentAsString()).path("data").path("id").asText();

        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/cases")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddWorkspaceCaseRequest("CR-KHD-2026-004821"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Wait briefly for async trigger completion
        Thread.sleep(800);

        // Check workspace status READY
        mockMvc.perform(get("/api/v1/workspaces/" + wsId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("READY"));

        // Check Trigger Status COMPLETED
        mockMvc.perform(get("/api/v1/workspaces/" + wsId + "/trigger")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Check Intelligence Result Retrieval
        mockMvc.perform(get("/api/v1/workspaces/" + wsId + "/result")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.summary").isNotEmpty())
                .andExpect(jsonPath("$.data.relationshipsDiscovered").value(greaterThan(0)));
    }

    @Test
    @DisplayName("10. Unauthorized User Cannot Retrieve Intelligence Result (403)")
    void test10_GetIntelligenceResult_Unauthorized_Forbidden() throws Exception {
        String bbsrToken = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        String ctcToken = obtainToken("INV-CTC-001", "OFFICER", "OP-CTC-CITY");

        // BBSR Officer creates and completes workspace
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest("BBSR Result Security WS", "Desc", "OP-BBSR-CAP", List.of("NETWORK"));
        MvcResult createRes = mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + bbsrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated()).andReturn();
        String wsId = objectMapper.readTree(createRes.getResponse().getContentAsString()).path("data").path("id").asText();

        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/cases")
                        .header("Authorization", "Bearer " + bbsrToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddWorkspaceCaseRequest("CR-KHD-2026-004821"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/workspaces/" + wsId + "/confirm")
                        .header("Authorization", "Bearer " + bbsrToken))
                .andExpect(status().isOk());

        Thread.sleep(800);

        // Cuttack officer attempts result retrieval and gets 403 Forbidden
        mockMvc.perform(get("/api/v1/workspaces/" + wsId + "/result")
                        .header("Authorization", "Bearer " + ctcToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("11. Audit Events Are Recorded For Workspace Operations")
    void test11_AuditLog_RecordsWorkspaceEvents() throws Exception {
        long initialAuditCount = auditLogRepository.count();

        String token = obtainToken("INV-BBSR-001", "OFFICER", "OP-BBSR-CAP");
        CreateWorkspaceRequest createReq = new CreateWorkspaceRequest("Audit Track WS", "Desc", "OP-BBSR-CAP", List.of("PATTERNS"));

        mockMvc.perform(post("/api/v1/workspaces")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        assertTrue(auditLogRepository.count() > initialAuditCount);
    }
}
