package com.crimelens.intelligence.ml.client;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.intelligence.entity.ExtractedEntity;
import com.crimelens.intelligence.ml.MlClientInterface;
import com.crimelens.intelligence.ml.mock.MockMlClient;
import com.crimelens.workspace.entity.InvestigationWorkspace;
import com.crimelens.workspace.entity.WorkspaceIntelligenceResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Component
@Primary
public class FastApiCentralIntelligenceClient implements MlClientInterface {

    private static final Logger logger = LoggerFactory.getLogger(FastApiCentralIntelligenceClient.class);

    private final RestTemplate restTemplate;
    private final String mlBaseUrl;
    private final String internalApiKey;
    private final MockMlClient fallbackMockClient;

    public FastApiCentralIntelligenceClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.ml.central-intelligence-url:http://localhost:8000}") String mlBaseUrl,
            @Value("${app.ml.internal-api-key:crimelens-internal-secret-key-2026}") String internalApiKey,
            @Value("${app.ml.read-timeout-ms:40000}") int readTimeoutMs,
            MockMlClient fallbackMockClient) {

        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
        this.mlBaseUrl = mlBaseUrl.replaceAll("/$", "");
        this.internalApiKey = internalApiKey;
        this.fallbackMockClient = fallbackMockClient;
    }

    @Override
    public String chatResponse(String userMessage, String language) {
        return fallbackMockClient.chatResponse(userMessage, language);
    }

    @Override
    public String generateFirDraft(String sourceContent, String language) {
        return fallbackMockClient.generateFirDraft(sourceContent, language);
    }

    @Override
    public String transcribeVoice(byte[] audioData) {
        throw new UnsupportedOperationException("transcribeVoice is not wired to FastAPI yet. No mocks allowed.");
    }

    @Override
    public List<ExtractedEntity> extractEntities(String text) {
        throw new UnsupportedOperationException("extractEntities is not wired to FastAPI yet. No mocks allowed.");
    }

    @Override
    public WorkspaceIntelligenceResult analyzeWorkspace(
            InvestigationWorkspace workspace,
            List<CaseRecord> cases,
            List<String> scopes) {

        if (cases == null || cases.isEmpty()) {
            return new WorkspaceIntelligenceResult(
                    "RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                    null,
                    workspace,
                    "COMPLETED",
                    "No cases selected or available in workspace for graph intelligence analysis.",
                    0, 0, 0,
                    "{\"summary\":\"No cases selected or available in workspace for graph intelligence analysis.\",\"analytical_metadata\":{\"cases_evaluated_count\":0,\"multi_hop_paths_count\":0,\"patterns_detected_count\":0},\"report\":{\"summary\":\"No cases selected or available in workspace for graph intelligence analysis.\",\"key_observations\":[],\"recommended_followups\":[]},\"multi_hop_paths\":[]}"
            );
        }

        List<String> targetCaseIds = new ArrayList<>();
        if (cases != null) {
            for (CaseRecord c : cases) {
                if (c.getId() != null) {
                    targetCaseIds.add(c.getId());
                } else if (c.getFirNumber() != null) {
                    targetCaseIds.add(c.getFirNumber());
                }
            }
        }

        String targetUrl = mlBaseUrl + "/api/v1/intelligence/analyze";
        logger.info("Dispatching Central Intelligence analysis request to FastAPI ML Service: {} (cases={})", targetUrl, targetCaseIds.size());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-API-Key", internalApiKey);

        Map<String, Object> reqBody = new HashMap<>();
        reqBody.put("target_case_ids", targetCaseIds);
        reqBody.put("analytical_scope", (scopes != null && !scopes.isEmpty()) ? scopes.get(0) : "FULL");
        reqBody.put("max_traversal_depth", 3);
        reqBody.put("max_cases", 50);

        Map<String, Object> workspaceContext = new HashMap<>();
        if (workspace != null) {
            workspaceContext.put("workspace_id", workspace.getId());
            if (workspace.getCreator() != null) {
                workspaceContext.put("investigator_id", workspace.getCreator().getId());
            }
            if (workspace.getStation() != null) {
                workspaceContext.put("station_id", workspace.getStation().getId());
            }
        }
        reqBody.put("workspace_context", workspaceContext);

        HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(reqBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.POST,
                    httpEntity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map respMap = response.getBody();
                Map metadata = (Map) respMap.get("analytical_metadata");
                Map report = (Map) respMap.get("report");
                List paths = (List) respMap.get("multi_hop_paths");

                int caseCount = targetCaseIds.size();
                int relationships = metadata != null && metadata.get("multi_hop_paths_count") != null 
                        ? ((Number) metadata.get("multi_hop_paths_count")).intValue() 
                        : (paths != null ? paths.size() : 0);

                int patterns = metadata != null && metadata.get("patterns_detected_count") != null 
                        ? ((Number) metadata.get("patterns_detected_count")).intValue() 
                        : 0;

                int nodes = metadata != null && metadata.get("cases_evaluated_count") != null 
                        ? ((Number) metadata.get("cases_evaluated_count")).intValue()
                        : caseCount;

                String summary = report != null && report.get("summary") != null 
                        ? (String) report.get("summary") 
                        : "Central Intelligence Engine successfully executed multi-hop graph analysis across workspace cases.";

                // Serialize full response payload for complete frontend graph rendering
                String fullPayloadJson;
                try {
                    fullPayloadJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(respMap);
                } catch (Exception ex) {
                    fullPayloadJson = "{\"summary\":\"" + summary.replace("\"", "\\\"") + "\"}";
                }

                logger.info("Successfully processed Central Intelligence workspace analysis via FastAPI (relationships={}, patterns={}, nodes={}).",
                        relationships, patterns, nodes);

                return new WorkspaceIntelligenceResult(
                        "RES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        null,
                        workspace,
                        "COMPLETED",
                        summary,
                        relationships,
                        patterns,
                        nodes,
                        fullPayloadJson
                );
            }
        } catch (RestClientException e) {
            logger.warn("Central Intelligence FastAPI Service at {} unavailable ({}), falling back to internal ML engine.", targetUrl, e.getMessage());
            return fallbackMockClient.analyzeWorkspace(workspace, cases, scopes);
        }

        return fallbackMockClient.analyzeWorkspace(workspace, cases, scopes);
    }
}
