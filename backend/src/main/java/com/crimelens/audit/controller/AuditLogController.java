package com.crimelens.audit.controller;

import com.crimelens.common.dto.ApiResponse;
import com.crimelens.audit.dto.response.AuditLogDTO;
import com.crimelens.common.dto.PagedResponse;
import com.crimelens.security.StationSecurityEvaluator;
import com.crimelens.security.UserPrincipal;
import com.crimelens.audit.service.AuditService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditLogController {

    private final AuditService auditService;
    private final StationSecurityEvaluator securityEvaluator;

    public AuditLogController(AuditService auditService, StationSecurityEvaluator securityEvaluator) {
        this.auditService = auditService;
        this.securityEvaluator = securityEvaluator;
    }

    @GetMapping("/station/{stationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogDTO>>> getStationAuditLogs(
            @PathVariable("stationId") String stationId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (!securityEvaluator.canAccessStation(principal, stationId)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized to access audit logs for station: " + stationId));
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        PagedResponse<AuditLogDTO> logs = auditService.getAuditLogsForStationPaged(stationId, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getUserAuditLogs(
            @PathVariable("userId") String userId,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (!principal.isSuperAdmin() && !principal.getUsername().equalsIgnoreCase(userId)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Unauthorized to view other users' audit logs"));
        }

        List<AuditLogDTO> logs = auditService.getAuditLogsForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
