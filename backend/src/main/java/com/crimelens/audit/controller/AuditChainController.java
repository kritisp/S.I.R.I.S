package com.crimelens.audit.controller;

import com.crimelens.audit.dto.response.AuditChainRecordDTO;
import com.crimelens.audit.dto.response.ChainVerificationResultDTO;
import com.crimelens.audit.service.AuditChainService;
import com.crimelens.common.dto.ApiResponse;
import com.crimelens.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit/chain")
public class AuditChainController {

    private final AuditChainService auditChainService;

    public AuditChainController(AuditChainService auditChainService) {
        this.auditChainService = auditChainService;
    }

    @GetMapping("/verify")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<ChainVerificationResultDTO>> verifyGlobalChain(
            @RequestParam(value = "scope", defaultValue = "GLOBAL") String scope) {
        ChainVerificationResultDTO result = auditChainService.verifyChain(scope);
        return ResponseEntity.ok(ApiResponse.success("Cryptographic hash chain verification complete.", result));
    }

    @GetMapping("/case/{caseId}/verify")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<ChainVerificationResultDTO>> verifyCaseChain(
            @PathVariable String caseId) {
        ChainVerificationResultDTO result = auditChainService.verifyChain("CASE:" + caseId);
        return ResponseEntity.ok(ApiResponse.success("Case cryptographic chain verification complete.", result));
    }

    @GetMapping("/evidence/{evidenceId}/verify")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<ChainVerificationResultDTO>> verifyEvidenceIntegrity(
            @PathVariable String evidenceId) {
        ChainVerificationResultDTO result = auditChainService.verifyEvidenceIntegrity(evidenceId);
        return ResponseEntity.ok(ApiResponse.success("Evidence cryptographic integrity verification complete.", result));
    }

    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<AuditChainRecordDTO>>> getChainRecords(
            @RequestParam(value = "scope", defaultValue = "GLOBAL") String scope) {
        List<AuditChainRecordDTO> records = auditChainService.getChainRecordsForScope(scope);
        return ResponseEntity.ok(ApiResponse.success("Cryptographically linked audit trail records retrieved.", records));
    }

    @GetMapping("/case/{caseId}/records")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<AuditChainRecordDTO>>> getCaseChainRecords(
            @PathVariable String caseId) {
        List<AuditChainRecordDTO> records = auditChainService.getChainRecordsForCase(caseId);
        return ResponseEntity.ok(ApiResponse.success("Case audit chain records retrieved.", records));
    }
}
