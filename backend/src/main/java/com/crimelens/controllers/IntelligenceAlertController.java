package com.crimelens.controllers;

import com.crimelens.dto.response.ApiResponse;
import com.crimelens.dto.response.IntelligenceAlertDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.services.IntelligenceAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
public class IntelligenceAlertController {

    private final IntelligenceAlertService alertService;

    public IntelligenceAlertController(IntelligenceAlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<IntelligenceAlertDTO>>> getAlerts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<IntelligenceAlertDTO> alerts = alertService.getAlerts(principal);
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<IntelligenceAlertDTO>> markAlertAsRead(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        IntelligenceAlertDTO alert = alertService.markAsRead(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Alert marked as read", alert));
    }
}
