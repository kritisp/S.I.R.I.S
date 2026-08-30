package com.crimelens.controllers;

import com.crimelens.ml.MlClientInterface;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/intelligence")
public class IntelligenceController {

    private final MlClientInterface mlClient;

    public IntelligenceController(MlClientInterface mlClient) {
        this.mlClient = mlClient;
    }

    @PostMapping("/transcribe-voice")
    public ResponseEntity<Map<String, Object>> transcribeVoice(
            @RequestParam("file") MultipartFile file) throws IOException {
        
        byte[] audioBytes = file.getBytes();
        String transcript = mlClient.transcribeVoice(audioBytes);

        Map<String, Object> response = new HashMap<>();
        response.put("text", transcript);

        return ResponseEntity.ok(response);
    }
}
