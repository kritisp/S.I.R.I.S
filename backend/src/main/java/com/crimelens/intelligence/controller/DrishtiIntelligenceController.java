package com.crimelens.intelligence.controller;

import com.crimelens.common.dto.ApiResponse;
import com.crimelens.intelligence.dto.DrishtiIntelligenceDTO.*;
import com.crimelens.intelligence.service.DrishtiIntelligenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/intelligence")
public class DrishtiIntelligenceController {

    private final DrishtiIntelligenceService drishtiService;

    public DrishtiIntelligenceController(DrishtiIntelligenceService drishtiService) {
        this.drishtiService = drishtiService;
    }

    @PostMapping("/anpr-check")
    public ResponseEntity<ApiResponse<AnprCheckResponse>> checkAnprPlate(@RequestBody AnprCheckRequest request) {
        AnprCheckResponse response = drishtiService.processAnprCheck(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/trail")
    public ResponseEntity<ApiResponse<VehicleTrailResponse>> generateVehicleTrail(@RequestBody VehicleTrailRequest request) {
        VehicleTrailResponse response = drishtiService.generateGeoTrail(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/cameras-nearby")
    public ResponseEntity<ApiResponse<CamerasNearbyResponse>> getCamerasNearby(
            @RequestParam(value = "lat", defaultValue = "20.2580") double lat,
            @RequestParam(value = "lng", defaultValue = "85.7845") double lng,
            @RequestParam(value = "radius_meters", defaultValue = "500") int radiusMeters,
            @RequestParam(value = "timestamp", required = false) String timestamp) {
        
        CamerasNearbyResponse response = drishtiService.getCamerasNearby(lat, lng, radiusMeters, timestamp);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/action-queue")
    public ResponseEntity<ApiResponse<List<InvestigationActionItem>>> getActionQueue(
            @RequestParam(value = "caseId", required = false) String caseId) {
        List<InvestigationActionItem> queue = drishtiService.getActionQueue(caseId);
        return ResponseEntity.ok(ApiResponse.success(queue));
    }

    @PostMapping("/risk-score")
    public ResponseEntity<ApiResponse<RiskScoreResponse>> calculateRiskScore(@RequestBody RiskScoreRequest request) {
        RiskScoreResponse response = drishtiService.calculateRiskScore(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
