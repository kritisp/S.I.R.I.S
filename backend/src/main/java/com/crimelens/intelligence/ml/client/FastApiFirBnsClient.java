package com.crimelens.intelligence.ml.client;

import com.crimelens.intelligence.dto.FirIntelligenceRequestDTO;
import com.crimelens.intelligence.dto.FirIntelligenceResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Component
public class FastApiFirBnsClient implements FirIntelligenceClient {

    private static final Logger logger = LoggerFactory.getLogger(FastApiFirBnsClient.class);

    private final RestTemplate restTemplate;
    private final String mlBaseUrl;
    private final String internalApiKey;

    public FastApiFirBnsClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.ml.fir-bns-url:http://localhost:8000}") String mlBaseUrl,
            @Value("${app.ml.internal-api-key:crimelens-internal-secret-key-2026}") String internalApiKey,
            @Value("${app.ml.read-timeout-ms:40000}") int readTimeoutMs) {
        
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
        this.mlBaseUrl = mlBaseUrl.replaceAll("/$", "");
        this.internalApiKey = internalApiKey;
    }

    @Override
    public FirIntelligenceResponseDTO processFir(FirIntelligenceRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("FIR request DTO cannot be null.");
        }

        boolean hasFile = request.hasFile();
        boolean hasText = request.getFirText() != null && !request.getFirText().isBlank();

        if (!hasFile && !hasText) {
            throw new IllegalArgumentException("FIR request must contain either a text narrative or a file document.");
        }

        String targetUrl = mlBaseUrl + "/process-fir";
        logger.info("Dispatching FIR Intelligence request to FastAPI ML Service: {} (hasFile={}, hasText={})", targetUrl, hasFile, hasText);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Internal-API-Key", internalApiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        if (hasFile) {
            final String fileName = (request.getFileName() != null && !request.getFileName().isBlank()) 
                    ? request.getFileName() 
                    : "fir_document.pdf";
            
            ByteArrayResource fileResource = new ByteArrayResource(request.getFileBytes()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };
            body.add("file", fileResource);
        }

        if (hasText) {
            body.add("fir_text", request.getFirText().trim());
        }

        HttpEntity<MultiValueMap<String, Object>> httpEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<FirIntelligenceResponseDTO> response = restTemplate.exchange(
                    targetUrl,
                    HttpMethod.POST,
                    httpEntity,
                    FirIntelligenceResponseDTO.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                logger.info("Successfully received FIR Intelligence response from FastAPI.");
                return response.getBody();
            } else {
                throw new IllegalStateException("FastAPI ML Service returned unexpected status: " + response.getStatusCode());
            }
        } catch (RestClientException e) {
            logger.error("Failed to communicate with FIR FastAPI ML Service at {}: {}", targetUrl, e.getMessage());
            throw new IllegalStateException("FIR Intelligence Service is currently unavailable. " + e.getMessage(), e);
        }
    }
}
