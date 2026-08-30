package com.crimelens.controllers;

import com.crimelens.dto.request.CreateEvidenceRequest;
import com.crimelens.dto.response.ApiResponse;
import com.crimelens.dto.response.EvidenceDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.services.EvidenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/evidence")
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EvidenceDTO>>> getEvidenceByCaseId(
            @RequestParam("caseId") String caseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<EvidenceDTO> evidence = evidenceService.getEvidenceByCaseId(caseId, principal);
        return ResponseEntity.ok(ApiResponse.success(evidence));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EvidenceDTO>> addEvidence(
            @Valid @RequestBody CreateEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        EvidenceDTO created = evidenceService.addEvidence(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Evidence uploaded successfully", created), HttpStatus.CREATED);
    }
}
