package com.crimelens.user.controller;

import com.crimelens.user.entity.User;

import com.crimelens.user.dto.request.CreateUserRequest;
import com.crimelens.user.dto.request.UpdateUserRequest;
import com.crimelens.common.dto.ApiResponse;
import com.crimelens.casefile.dto.response.OfficerCaseloadDTO;
import com.crimelens.user.dto.response.UserDTO;
import com.crimelens.security.UserPrincipal;
import com.crimelens.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserDTO created = userService.createUser(request, principal);
        return new ResponseEntity<>(ApiResponse.success("User / Officer created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers(
            @RequestParam(name = "stationId", required = false) String stationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<UserDTO> users = userService.getAllUsers(stationId, principal);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserDTO user = userService.getUserById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserDTO updated = userService.updateUser(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'STATION_ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserStatus(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserDTO updated = userService.toggleUserStatus(id, principal);
        return ResponseEntity.ok(ApiResponse.success("User status changed to " + updated.getStatus(), updated));
    }

    @GetMapping("/{id}/caseload")
    public ResponseEntity<ApiResponse<OfficerCaseloadDTO>> getOfficerCaseload(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        OfficerCaseloadDTO caseload = userService.getOfficerCaseload(id, principal);
        return ResponseEntity.ok(ApiResponse.success(caseload));
    }
}
