package com.crimelens.evidence.controller;

import com.crimelens.audit.dto.response.ChainVerificationResultDTO;
import com.crimelens.evidence.dto.request.CreateEvidenceRequest;
import com.crimelens.common.dto.ApiResponse;
import com.crimelens.evidence.dto.response.EvidenceDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.evidence.service.EvidenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/evidence")
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<EvidenceDTO>>> getEvidence(
            @RequestParam(name = "caseId", required = false) String caseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<EvidenceDTO> evidence = evidenceService.getEvidence(caseId, principal);
        return ResponseEntity.ok(ApiResponse.success(evidence));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<EvidenceDTO>> getEvidenceById(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        EvidenceDTO evidence = evidenceService.getEvidenceById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(evidence));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<EvidenceDTO>> addEvidence(
            @Valid @RequestBody CreateEvidenceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        EvidenceDTO created = evidenceService.addEvidence(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Evidence registered successfully in tamper-evident vault", created), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<ChainVerificationResultDTO>> verifyEvidenceIntegrity(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ChainVerificationResultDTO result = evidenceService.verifyEvidenceIntegrity(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Evidence integrity verification complete", result));
    }

    @PostMapping("/{id}/seal")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN')")
    public ResponseEntity<ApiResponse<EvidenceDTO>> sealEvidence(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String reason = body != null ? body.get("reason") : null;
        EvidenceDTO sealed = evidenceService.sealEvidence(id, reason, principal);
        return ResponseEntity.ok(ApiResponse.success("Evidence sealed and custody trail recorded", sealed));
    }
}
