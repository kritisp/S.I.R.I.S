package com.crimelens.station.controller;

import com.crimelens.station.dto.request.CreateStationRequest;
import com.crimelens.station.dto.request.UpdateStationRequest;
import com.crimelens.common.dto.ApiResponse;
import com.crimelens.station.dto.response.PoliceStationDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.station.service.PoliceStationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stations")
public class PoliceStationController {

    private final PoliceStationService stationService;

    public PoliceStationController(PoliceStationService stationService) {
        this.stationService = stationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PoliceStationDTO>> createStation(
            @Valid @RequestBody CreateStationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        PoliceStationDTO created = stationService.createStation(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Police station registered successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PoliceStationDTO>>> getAllStations(
            @RequestParam(name = "district", required = false) String district) {
        List<PoliceStationDTO> stations;
        if (district != null && !district.isBlank()) {
            stations = stationService.getStationsByDistrict(district);
        } else {
            stations = stationService.getAllStations();
        }
        return ResponseEntity.ok(ApiResponse.success(stations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PoliceStationDTO>> getStationById(@PathVariable("id") String id) {
        PoliceStationDTO station = stationService.getStationById(id);
        return ResponseEntity.ok(ApiResponse.success(station));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PoliceStationDTO>> updateStation(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateStationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        PoliceStationDTO updated = stationService.updateStation(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Police station updated successfully", updated));
    }
}
