package com.crimelens.auth.service;

import com.crimelens.audit.service.AuditService;

import com.crimelens.auth.dto.request.LoginRequest;
import com.crimelens.auth.dto.request.RefreshTokenRequest;
import com.crimelens.auth.dto.response.AuthResponse;
import com.crimelens.station.dto.response.PoliceStationDTO;
import com.crimelens.user.dto.response.UserDTO;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.common.exceptions.BadRequestException;
import com.crimelens.common.exceptions.InvalidTokenException;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.security.JwtTokenProvider;
import com.crimelens.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> {
                    auditService.logAction(request.getUserId(), "Unknown", "UNKNOWN", request.getStationCode(),
                            "LOGIN_FAILED", "AUTH", request.getUserId(), null, "User not found");
                    return new BadCredentialsException("Invalid credentials or station context");
                });

        // Verify account is active
        if (user.getStatus() != UserStatus.ACTIVE) {
            auditService.logAction(user.getId(), user.getName(), user.getRole().name(),
                    user.getStation() != null ? user.getStation().getId() : null,
                    "LOGIN_BLOCKED", "AUTH", user.getId(), null, "Inactive account login attempt");
            throw new BadCredentialsException("Account is inactive. Please contact the station administrator.");
        }

        // Validate station code for Station Admin and Officer
        if (user.getRole() != UserRole.SUPER_ADMIN) {
            String userStationId = user.getStation() != null ? user.getStation().getId() : null;
            if (request.getStationCode() == null || !request.getStationCode().equalsIgnoreCase(userStationId)) {
                auditService.logAction(user.getId(), user.getName(), user.getRole().name(), request.getStationCode(),
                        "LOGIN_FAILED", "AUTH", user.getId(), null, "Station code mismatch");
                throw new BadCredentialsException("Invalid station code for user: " + request.getUserId());
            }
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditService.logAction(user.getId(), user.getName(), user.getRole().name(),
                    user.getStation() != null ? user.getStation().getId() : null,
                    "LOGIN_FAILED", "AUTH", user.getId(), null, "Password incorrect");
            throw new BadCredentialsException("Invalid credentials or station context");
        }

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(userPrincipal);
        String refreshToken = tokenProvider.generateRefreshToken(userPrincipal);

        auditService.logAction(user.getId(), user.getName(), user.getRole().name(),
                user.getStation() != null ? user.getStation().getId() : null,
                "LOGIN_SUCCESS", "AUTH", user.getId(), null, "Successful login");

        UserDTO userDTO = UserDTO.fromEntity(user);
        PoliceStationDTO stationDTO = user.getStation() != null ? PoliceStationDTO.fromEntity(user.getStation()) : null;

        return new AuthResponse(accessToken, refreshToken, tokenProvider.getAccessTokenExpirationMs(), userDTO, stationDTO);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!tokenProvider.validateToken(token)) {
            throw new InvalidTokenException("Invalid or expired refresh token");
        }

        String tokenType = tokenProvider.getTokenType(token);
        if (!"REFRESH".equals(tokenType)) {
            throw new InvalidTokenException("Supplied token is not a refresh token");
        }

        String userId = tokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidTokenException("User account is inactive");
        }

        UserPrincipal userPrincipal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(userPrincipal);
        String newRefreshToken = tokenProvider.generateRefreshToken(userPrincipal);

        UserDTO userDTO = UserDTO.fromEntity(user);
        PoliceStationDTO stationDTO = user.getStation() != null ? PoliceStationDTO.fromEntity(user.getStation()) : null;

        return new AuthResponse(newAccessToken, newRefreshToken, tokenProvider.getAccessTokenExpirationMs(), userDTO, stationDTO);
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentUserInfo(UserPrincipal principal) {
        User user = userRepository.findById(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getUsername()));

        UserDTO userDTO = UserDTO.fromEntity(user);
        PoliceStationDTO stationDTO = user.getStation() != null ? PoliceStationDTO.fromEntity(user.getStation()) : null;

        return new AuthResponse(null, null, 0, userDTO, stationDTO);
    }
}
