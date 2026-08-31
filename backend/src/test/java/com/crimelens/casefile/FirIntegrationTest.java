package com.crimelens.casefile;

import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.casefile.dto.response.CaseDTO;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.casefile.service.CaseService;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.intelligence.dto.FirIntelligenceRequestDTO;
import com.crimelens.intelligence.dto.FirIntelligenceResponseDTO;
import com.crimelens.intelligence.ml.client.FirIntelligenceClient;
import com.crimelens.security.UserPrincipal;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
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
    private PoliceStationRepository stationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseRecordRepository caseRepository;

    @MockBean
    private FirIntelligenceClient firBnsClient;

    private UserPrincipal officerPrincipal;
    private UserPrincipal unauthorizedOfficerPrincipal;
    private CaseDTO testCase;

    @BeforeEach
    void setUp() {
        PoliceStation station = stationRepository.findById("OP-BBSR-CAP").orElseGet(() ->
                stationRepository.saveAndFlush(new PoliceStation(
                        "OP-BBSR-CAP", "Capital PS", "Khordha", "Bhubaneswar", "Odisha", StationStatus.ACTIVE))
        );

        PoliceStation otherStation = stationRepository.findById("OP-CTC-CITY").orElseGet(() ->
                stationRepository.saveAndFlush(new PoliceStation(
                        "OP-CTC-CITY", "Cuttack City PS", "Cuttack", "Cuttack", "Odisha", StationStatus.ACTIVE))
        );

        User officer = userRepository.findById("INV-BBSR-001").orElseGet(() ->
                userRepository.saveAndFlush(new User(
                        "INV-BBSR-001", "Officer One", UserRole.OFFICER, station, "Inspector", "officer1@odishapolice.gov.in", "hash", UserStatus.ACTIVE))
        );

        User otherOfficer = userRepository.findById("INV-CTC-002").orElseGet(() ->
                userRepository.saveAndFlush(new User(
                        "INV-CTC-002", "Officer Two", UserRole.OFFICER, otherStation, "Sub-Inspector", "officer2@odishapolice.gov.in", "hash", UserStatus.ACTIVE))
        );

        officerPrincipal = UserPrincipal.create(officer);
        unauthorizedOfficerPrincipal = UserPrincipal.create(otherOfficer);

        CreateCaseRequest request = new CreateCaseRequest();
        request.setStationId("OP-BBSR-CAP");
        request.setInvestigatorId("INV-BBSR-001");
        request.setTitle("Armed Robbery at Saheed Nagar");
        request.setDescription("Two motorcycle riders threatened complainant Priyadarshi Mohanty with a knife and stole gold items.");
        request.setCrimeType("Armed Robbery");

        testCase = caseService.createCase(request, officerPrincipal);

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

    @Test
    @DisplayName("TEST 7: Authorized officer analyzes permitted case successfully")
    void testAnalyzeCaseFirSuccess() {
        FirIntelligenceResponseDTO response = caseService.analyzeCaseFir(testCase.getId(), null, officerPrincipal);

        assertNotNull(response);
        assertEquals("violent_crimes", response.getCrimeCategory());
        assertTrue(response.getMaskingUsed());
        assertFalse(response.getBnsSections().isEmpty());

        com.crimelens.casefile.entity.CaseRecord updatedCase = caseRepository.findById(testCase.getId()).orElseThrow();
        assertNotNull(updatedCase.getBnsSections());
        assertTrue(updatedCase.getBnsSections().contains("Section 309"));
    }

    @Test
    @DisplayName("TEST 6: Unauthorized officer from another station is blocked from analyzing case")
    void testAnalyzeCaseFirUnauthorizedBlocked() {
        assertThrows(UnauthorizedAccessException.class, () ->
                caseService.analyzeCaseFir(testCase.getId(), null, unauthorizedOfficerPrincipal)
        );
    }

    @Test
    @DisplayName("TEST 2 & 3: Should process PDF/Image MultipartFile document upload through CaseService")
    void testAnalyzeCaseFirWithFileUpload() {
        MockMultipartFile mockPdf = new MockMultipartFile(
                "file",
                "sample_fir.pdf",
                "application/pdf",
                "FIRST INFORMATION REPORT PDF CONTENT".getBytes()
        );

        FirIntelligenceResponseDTO response = caseService.analyzeCaseFir(testCase.getId(), null, mockPdf, officerPrincipal);

        assertNotNull(response);
        ArgumentCaptor<FirIntelligenceRequestDTO> captor = ArgumentCaptor.forClass(FirIntelligenceRequestDTO.class);
        Mockito.verify(firBnsClient, Mockito.atLeastOnce()).processFir(captor.capture());

        FirIntelligenceRequestDTO sentReq = captor.getValue();
        assertTrue(sentReq.hasFile());
        assertEquals("sample_fir.pdf", sentReq.getFileName());
    }

    @Test
    @DisplayName("Should process standalone raw FIR text successfully")
    void testProcessRawFirSuccess() {
        String rawText = "Burglars broke main door lock at Khandagiri and stole cash.";
        FirIntelligenceResponseDTO response = caseService.processRawFir(rawText, officerPrincipal);

        assertNotNull(response);
        assertNotNull(response.getBnsSections());
        Mockito.verify(firBnsClient, Mockito.atLeastOnce()).processFir(any());
    }
}
