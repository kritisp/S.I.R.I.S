package com.crimelens.casefile;

import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.casefile.dto.response.CaseDTO;
import com.crimelens.casefile.service.CaseService;
import com.crimelens.intelligence.dto.FirIntelligenceRequestDTO;
import com.crimelens.intelligence.dto.FirIntelligenceResponseDTO;
import com.crimelens.intelligence.ml.client.FirIntelligenceClient;
import com.crimelens.security.UserPrincipal;
import com.crimelens.user.entity.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class FirIntegrationTest {

    @Autowired
    private CaseService caseService;

    @Autowired
    private com.crimelens.station.repository.PoliceStationRepository stationRepository;

    @Autowired
    private com.crimelens.user.repository.UserRepository userRepository;

    @MockBean
    private FirIntelligenceClient firBnsClient;

    private UserPrincipal officerPrincipal;
    private CaseDTO testCase;

    @BeforeEach
    void setUp() {
        com.crimelens.station.entity.PoliceStation station = stationRepository.findById("OP-BBSR-CAP").orElseGet(() ->
                stationRepository.saveAndFlush(new com.crimelens.station.entity.PoliceStation(
                        "OP-BBSR-CAP", "Capital PS", "Khordha", "Bhubaneswar", "Odisha", com.crimelens.station.entity.enums.StationStatus.ACTIVE))
        );

        com.crimelens.user.entity.User officer = userRepository.findById("INV-BBSR-001").orElseGet(() ->
                userRepository.saveAndFlush(new com.crimelens.user.entity.User(
                        "INV-BBSR-001", "Officer One", UserRole.OFFICER, station, "Inspector", "officer1@odishapolice.gov.in", "hash", com.crimelens.user.entity.enums.UserStatus.ACTIVE))
        );

        officerPrincipal = UserPrincipal.create(officer);

        CreateCaseRequest request = new CreateCaseRequest();
        request.setStationId("OP-BBSR-CAP");
        request.setInvestigatorId("INV-BBSR-001");
        request.setTitle("Armed Robbery at Saheed Nagar");
        request.setDescription("Two motorcycle riders threatened complainant Priyadarshi Mohanty with a knife and stole gold items.");
        request.setCrimeType("Armed Robbery");

        testCase = caseService.createCase(request, officerPrincipal);

        // Setup mock FIR intelligence response
        FirIntelligenceResponseDTO mockResponse = new FirIntelligenceResponseDTO();
        mockResponse.setSummary("FIR indicates incident of armed robbery.");
        mockResponse.setCrimeCategory("violent_crimes");
        mockResponse.setMaskingUsed(true);
        mockResponse.setBnsSections(List.of(
                Map.of("section", "Section 309", "title", "Robbery", "confidence", "HIGH")
        ));
        mockResponse.setInvestigationActions(List.of(
                Map.of("action", "Obtain CCTV footage", "priority", "HIGH", "reason", "Suspects fled on motorcycle")
        ));

        Mockito.when(firBnsClient.processFir(any(FirIntelligenceRequestDTO.class)))
                .thenReturn(mockResponse);
    }

    @Autowired
    private com.crimelens.casefile.repository.CaseRecordRepository caseRepository;

    @Test
    @DisplayName("Should successfully execute FIR analysis through Spring Boot CaseService and update BNS sections")
    void testAnalyzeCaseFirSuccess() {
        FirIntelligenceResponseDTO response = caseService.analyzeCaseFir(testCase.getId(), null, officerPrincipal);

        assertNotNull(response);
        assertEquals("violent_crimes", response.getCrimeCategory());
        assertTrue(response.getMaskingUsed());
        assertFalse(response.getBnsSections().isEmpty());

        // Verify CaseRecord updated in database
        com.crimelens.casefile.entity.CaseRecord updatedCase = caseRepository.findById(testCase.getId()).orElseThrow();
        assertNotNull(updatedCase.getBnsSections());
        assertTrue(updatedCase.getBnsSections().contains("Section 309"));
    }

    @Test
    @DisplayName("Should process standalone raw FIR text successfully")
    void testProcessRawFirSuccess() {
        String rawText = "Burglars broke main door lock at Khandagiri and stole cash.";
        FirIntelligenceResponseDTO response = caseService.processRawFir(rawText, officerPrincipal);

        assertNotNull(response);
        assertNotNull(response.getBnsSections());
        Mockito.verify(firBnsClient, Mockito.times(1)).processFir(any());
    }
}
