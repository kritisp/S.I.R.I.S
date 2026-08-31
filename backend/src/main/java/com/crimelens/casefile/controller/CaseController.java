package com.crimelens.casefile.controller;

import com.crimelens.casefile.dto.request.AssignInvestigatorRequest;
import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.casefile.dto.request.UpdateCaseRequest;
import com.crimelens.common.dto.ApiResponse;
import com.crimelens.casefile.dto.response.CaseDTO;
import com.crimelens.common.dto.PagedResponse;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import com.crimelens.intelligence.dto.FirIntelligenceResponseDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.casefile.service.CaseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/cases")
public class CaseController {

    private final CaseService caseService;

    public CaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseDTO>> createCase(
            @Valid @RequestBody CreateCaseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CaseDTO created = caseService.createCase(request, principal);
        return new ResponseEntity<>(ApiResponse.success("FIR lodged successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<CaseDTO>>> searchCases(
            @RequestParam(name = "stationId", required = false) String stationId,
            @RequestParam(name = "investigatorId", required = false) String investigatorId,
            @RequestParam(name = "status", required = false) CaseStatus status,
            @RequestParam(name = "priority", required = false) CasePriority priority,
            @RequestParam(name = "crimeType", required = false) String crimeType,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "DESC") String sortDir,
            @AuthenticationPrincipal UserPrincipal principal) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<CaseDTO> response = caseService.searchCases(
                stationId, investigatorId, status, priority, crimeType, query, pageable, principal
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseDTO>> getCaseById(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        CaseDTO caseDTO = caseService.getCaseById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(caseDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseDTO>> updateCase(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateCaseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CaseDTO updated = caseService.updateCase(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Case updated successfully", updated));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN')")
    public ResponseEntity<ApiResponse<CaseDTO>> assignInvestigator(
            @PathVariable("id") String id,
            @Valid @RequestBody AssignInvestigatorRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CaseDTO updated = caseService.assignInvestigator(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Investigator assigned successfully", updated));
    }

    @PostMapping(value = "/{id}/fir/analyze", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<FirIntelligenceResponseDTO>> analyzeCaseFir(
            @PathVariable("id") String id,
            @RequestParam(name = "firText", required = false) String firTextParam,
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestBody(required = false) Map<String, String> jsonBody,
            @AuthenticationPrincipal UserPrincipal principal) {

        String rawText = firTextParam;
        if ((rawText == null || rawText.isBlank()) && jsonBody != null) {
            rawText = jsonBody.get("firText");
        }

        FirIntelligenceResponseDTO result = caseService.analyzeCaseFir(id, rawText, file, principal);
        return ResponseEntity.ok(ApiResponse.success("FIR intelligence analysis completed", result));
    }

    @PostMapping(value = "/fir/process-raw", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<FirIntelligenceResponseDTO>> processRawFir(
            @RequestParam(name = "firText", required = false) String firTextParam,
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestBody(required = false) Map<String, String> jsonBody,
            @AuthenticationPrincipal UserPrincipal principal) {

        String rawText = firTextParam;
        if ((rawText == null || rawText.isBlank()) && jsonBody != null) {
            rawText = jsonBody.get("firText");
        }

        FirIntelligenceResponseDTO result = caseService.processRawFir(rawText, file, principal);
        return ResponseEntity.ok(ApiResponse.success("Standalone FIR intelligence analysis completed", result));
    }
}
