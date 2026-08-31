package com.crimelens.intelligence;

import com.crimelens.casefile.dto.request.CreateCaseRequest;
import com.crimelens.casefile.dto.response.CaseDTO;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.casefile.service.CaseService;
import com.crimelens.intelligence.ml.client.FastApiCentralIntelligenceClient;
import com.crimelens.security.UserPrincipal;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.workspace.entity.InvestigationWorkspace;
import com.crimelens.workspace.entity.WorkspaceIntelligenceResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class CentralIntelligenceIntegrationTest {

    @Autowired
    private FastApiCentralIntelligenceClient centralIntelligenceClient;

    @Autowired
    private PoliceStationRepository stationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaseService caseService;

    @Autowired
    private CaseRecordRepository caseRepository;

    private UserPrincipal officerPrincipal;
    private CaseDTO testCase1;
    private CaseDTO testCase2;

    @BeforeEach
    void setUp() {
        PoliceStation station = stationRepository.findById("OP-BBSR-CAP").orElseGet(() ->
                stationRepository.saveAndFlush(new PoliceStation(
                        "OP-BBSR-CAP", "Capital PS", "Khordha", "Bhubaneswar", "Odisha", StationStatus.ACTIVE))
        );

        User officer = userRepository.findById("INV-BBSR-001").orElseGet(() ->
                userRepository.saveAndFlush(new User(
                        "INV-BBSR-001", "Officer One", UserRole.OFFICER, station, "Inspector", "officer1@odishapolice.gov.in", "hash", UserStatus.ACTIVE))
        );

        officerPrincipal = UserPrincipal.create(officer);

        CreateCaseRequest req1 = new CreateCaseRequest();
        req1.setStationId("OP-BBSR-CAP");
        req1.setInvestigatorId("INV-BBSR-001");
        req1.setFirNumber("FIR/2026/SYN_001");
        req1.setTitle("Armed Robbery at Saheed Nagar");
        req1.setDescription("Two suspects stole gold chain and cash.");
        req1.setCrimeType("Armed Robbery");

        testCase1 = caseService.createCase(req1, officerPrincipal);

        CreateCaseRequest req2 = new CreateCaseRequest();
        req2.setStationId("OP-BBSR-CAP");
        req2.setInvestigatorId("INV-BBSR-001");
        req2.setFirNumber("FIR/2026/SYN_002");
        req2.setTitle("House Burglary at Saheed Nagar");
        req2.setDescription("Balcony door forced open; cash stolen.");
        req2.setCrimeType("Burglary");

        testCase2 = caseService.createCase(req2, officerPrincipal);
    }

    @Test
    @DisplayName("Should execute workspace intelligence analysis via FastApiCentralIntelligenceClient")
    void testWorkspaceAnalysis() {
        CaseRecord case1 = caseRepository.findById(testCase1.getId()).orElseThrow();
        CaseRecord case2 = caseRepository.findById(testCase2.getId()).orElseThrow();

        InvestigationWorkspace mockWorkspace = new InvestigationWorkspace();
        mockWorkspace.setId("WS-TEST-001");
        mockWorkspace.setTitle("Saheed Nagar Burglary Cluster");

        WorkspaceIntelligenceResult result = centralIntelligenceClient.analyzeWorkspace(
                mockWorkspace,
                List.of(case1, case2),
                List.of("FULL")
        );

        assertNotNull(result);
        assertEquals("COMPLETED", result.getStatus());
        assertNotNull(result.getSummary());
        assertTrue(result.getRelationshipsDiscovered() >= 0);
        assertTrue(result.getPatternsDetected() >= 0);
    }
}
