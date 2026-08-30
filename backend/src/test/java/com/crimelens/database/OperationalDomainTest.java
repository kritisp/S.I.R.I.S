package com.crimelens.database;

import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import com.crimelens.evidence.entity.Evidence;
import com.crimelens.access.entity.AccessRequest;
import com.crimelens.access.entity.enums.RequestStatus;
import com.crimelens.audit.entity.AuditLog;
import com.crimelens.intelligence.entity.IntelligenceAlert;
import com.crimelens.intelligence.entity.enums.AlertType;

import com.crimelens.user.repository.UserRepository;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.evidence.repository.EvidenceRepository;
import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.audit.repository.AuditLogRepository;
import com.crimelens.intelligence.repository.IntelligenceAlertRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class OperationalDomainTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PoliceStationRepository stationRepository;

    @Autowired
    private CaseRecordRepository caseRepository;

    @Autowired
    private EvidenceRepository evidenceRepository;

    @Autowired
    private AccessRequestRepository accessRequestRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private IntelligenceAlertRepository alertRepository;

    @Test
    public void testCreateStationUserAndCase() {
        // 1. Create Station
        PoliceStation station = new PoliceStation("TEST-ST-001", "Test Station", "Khordha", "Bhubaneswar", "Odisha", StationStatus.ACTIVE);
        PoliceStation savedStation = stationRepository.save(station);
        assertNotNull(savedStation);
        assertEquals("Test Station", savedStation.getName());

        // 2. Create User
        User user = new User("TEST-USR-01", "Officer Amit", UserRole.OFFICER, savedStation, "Sub-Inspector", "amit@odishapolice.gov.in", "HashPass123", UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);
        assertNotNull(savedUser);
        assertEquals("Officer Amit", savedUser.getName());
        assertEquals("TEST-ST-001", savedUser.getStation().getId());

        // 3. Create Case
        CaseRecord caseRecord = new CaseRecord(
                "TEST-CR-99",
                "TEST-FIR-99",
                savedStation,
                savedUser,
                "Theft at Office",
                "Laptop stolen from test office desk.",
                "Theft",
                CaseStatus.PENDING,
                CasePriority.LOW,
                Instant.now()
        );
        CaseRecord savedCase = caseRepository.save(caseRecord);
        assertNotNull(savedCase);
        assertEquals("TEST-FIR-99", savedCase.getFirNumber());
        assertEquals("Officer Amit", savedCase.getInvestigator().getName());

        // 4. Create Evidence
        Evidence evidence = new Evidence(
                "TEST-EVID-99",
                savedCase,
                savedUser,
                "Physical collection",
                "{\"size\":\"12kb\"}",
                "Recovered flash drive.",
                "Digital Media",
                Instant.now(),
                new ArrayList<>()
        );
        Evidence savedEvidence = evidenceRepository.save(evidence);
        assertNotNull(savedEvidence);
        assertEquals("TEST-CR-99", savedEvidence.getCaseRecord().getId());
        assertEquals("TEST-USR-01", savedEvidence.getUploader().getId());
        assertEquals("Physical collection", savedEvidence.getSource());

        // 5. Create Access Request
        PoliceStation requestingStation = new PoliceStation("TEST-ST-002", "Requesting Station", "Cuttack", "Cuttack", "Odisha", StationStatus.ACTIVE);
        stationRepository.save(requestingStation);
        User requestingOfficer = new User("TEST-USR-02", "Officer Barada", UserRole.OFFICER, requestingStation, "Sub-Inspector", "barada@odishapolice.gov.in", "HashPass123", UserStatus.ACTIVE);
        userRepository.save(requestingOfficer);
        User approver = new User("TEST-USR-03", "Admin Panda", UserRole.STATION_ADMIN, savedStation, "Inspector", "panda@odishapolice.gov.in", "HashPass123", UserStatus.ACTIVE);
        userRepository.save(approver);

        AccessRequest request = new AccessRequest(
                "TEST-REQ-99",
                requestingStation,
                requestingOfficer,
                savedStation,
                savedCase,
                approver,
                "Need access to flash drive evidence.",
                RequestStatus.APPROVED
        );
        AccessRequest savedReq = accessRequestRepository.save(request);
        assertNotNull(savedReq);
        assertEquals("TEST-USR-03", savedReq.getApprover().getId());

        // 6. Create Audit Log
        AuditLog auditLog = new AuditLog(savedUser, "TEST-USR-01", "Officer Amit", "OFFICER", "TEST-ST-001", "VIEW_CASE", "CASE", "TEST-CR-99", "127.0.0.1", "Viewed test case");
        AuditLog savedAudit = auditLogRepository.save(auditLog);
        assertNotNull(savedAudit);
        assertEquals("TEST-USR-01", savedAudit.getUser().getId());

        // 7. Create Intelligence Alert
        IntelligenceAlert alert = new IntelligenceAlert(
                "TEST-ALT-99",
                AlertType.NEW_HOTSPOT,
                "Crime trend warning",
                null,
                null,
                savedStation,
                false
        );
        IntelligenceAlert savedAlert = alertRepository.save(alert);
        assertNotNull(savedAlert);
        assertEquals("TEST-ST-001", savedAlert.getTargetStation().getId());
    }
}
