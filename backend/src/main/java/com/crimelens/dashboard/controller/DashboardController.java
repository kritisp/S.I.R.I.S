package com.crimelens.dashboard.controller;

import com.crimelens.common.dto.ApiResponse;
import com.crimelens.dashboard.dto.response.DashboardStatsDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        DashboardStatsDTO stats = dashboardService.getDashboardStats(principal);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
