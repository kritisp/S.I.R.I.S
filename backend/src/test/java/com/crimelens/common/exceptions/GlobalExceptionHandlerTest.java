package com.crimelens.common.exceptions;

import com.crimelens.casefile.dto.request.CreateCaseRequest;
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

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String officerToken;

    @BeforeEach
    void setup() throws Exception {
        LoginRequest login = new LoginRequest("INV-BBSR-001", "Demo@123", "OP-BBSR-CAP", "OFFICER");
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        officerToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("1. Validation failure returns 400 with structured validationErrors map")
    void testValidationError_Returns400WithDetails() throws Exception {
        // Missing firNumber, title, description, crimeType
        CreateCaseRequest invalidRequest = new CreateCaseRequest();

        mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.firNumber", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.title", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.description", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.crimeType", notNullValue()));
    }

    @Test
    @DisplayName("2. Resource Not Found returns 404 with clean message")
    void testResourceNotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/v1/cases/NON-EXISTENT-CASE-12345")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404));
    }
}
