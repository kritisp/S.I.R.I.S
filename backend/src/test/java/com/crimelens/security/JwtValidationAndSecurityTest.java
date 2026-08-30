package com.crimelens.security;

import com.crimelens.station.entity.PoliceStation;
import com.crimelens.user.entity.User;
import com.crimelens.station.entity.enums.StationStatus;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class JwtValidationAndSecurityTest {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MockMvc mockMvc;

    private UserPrincipal testOfficerPrincipal;

    @BeforeEach
    void setUp() {
        PoliceStation station = new PoliceStation("OP-BBSR-CAP", "Khandagiri Police Station", "Khordha", "Bhubaneswar", "Odisha", StationStatus.ACTIVE);
        User user = new User("INV-BBSR-TEST", "SI Tester", UserRole.OFFICER, station, "Sub-Inspector", "tester@police.gov.in", "hash", UserStatus.ACTIVE);
        testOfficerPrincipal = UserPrincipal.create(user);
    }

    @Test
    @DisplayName("1. JWT Generation and Claim Extraction")
    void testJwtTokenGenerationAndClaims() {
        String token = tokenProvider.generateAccessToken(testOfficerPrincipal);
        assertNotNull(token);

        assertTrue(tokenProvider.validateToken(token));
        assertEquals("INV-BBSR-TEST", tokenProvider.getUserIdFromToken(token));
        assertEquals("OFFICER", tokenProvider.getRoleFromToken(token));
        assertEquals("OP-BBSR-CAP", tokenProvider.getStationIdFromToken(token));
        assertEquals("ACCESS", tokenProvider.getTokenType(token));
    }

    @Test
    @DisplayName("2. Tampered JWT Token is Rejected")
    void testTamperedTokenRejected() {
        String token = tokenProvider.generateAccessToken(testOfficerPrincipal);
        String tamperedToken = token.substring(0, token.length() - 5) + "abcde";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("3. BCrypt Password Hashing Verification")
    void testBCryptPasswordHashing() {
        String rawPassword = "SecurePassword@2026";
        String encodedHash = passwordEncoder.encode(rawPassword);

        assertNotNull(encodedHash);
        assertNotEquals(rawPassword, encodedHash);
        assertTrue(encodedHash.startsWith("$2a$") || encodedHash.startsWith("$2b$"));
        assertTrue(passwordEncoder.matches(rawPassword, encodedHash));
        assertFalse(passwordEncoder.matches("WrongPassword", encodedHash));
    }

    @Test
    @DisplayName("4. Protected API Rejects Unauthenticated Requests with 401")
    void testProtectedEndpoint_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/cases"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("5. Protected API Rejects Invalid Bearer Token with 401")
    void testProtectedEndpoint_WithInvalidToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/cases")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }
}
