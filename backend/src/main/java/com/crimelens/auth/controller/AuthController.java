package com.crimelens.auth.controller;

import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.auth.dto.request.RefreshTokenRequest;
import com.crimelens.common.dto.ApiResponse;
import com.crimelens.auth.dto.response.AuthResponse;
import com.crimelens.security.UserPrincipal;
import com.crimelens.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", authResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse authResponse = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        AuthResponse authResponse = authService.getCurrentUserInfo(principal);
        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }
}
