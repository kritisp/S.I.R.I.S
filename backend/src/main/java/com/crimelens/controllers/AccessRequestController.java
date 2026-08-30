package com.crimelens.controllers;

import com.crimelens.dto.request.CreateAccessRequest;
import com.crimelens.dto.response.ApiResponse;
import com.crimelens.dto.response.AccessRequestDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.services.AccessRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requests")
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    public AccessRequestController(AccessRequestService accessRequestService) {
        this.accessRequestService = accessRequestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccessRequestDTO>> createRequest(
            @Valid @RequestBody CreateAccessRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AccessRequestDTO created = accessRequestService.createRequest(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Access request submitted successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/incoming")
    public ResponseEntity<ApiResponse<List<AccessRequestDTO>>> getIncomingRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AccessRequestDTO> requests = accessRequestService.getIncomingRequests(principal);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/outgoing")
    public ResponseEntity<ApiResponse<List<AccessRequestDTO>>> getOutgoingRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AccessRequestDTO> requests = accessRequestService.getOutgoingRequests(principal);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AccessRequestDTO>> approveRequest(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        AccessRequestDTO resolved = accessRequestService.approveRequest(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Request approved successfully", resolved));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<AccessRequestDTO>> rejectRequest(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        AccessRequestDTO resolved = accessRequestService.rejectRequest(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Request rejected successfully", resolved));
    }
}
