package com.crimelens.audit;

import com.crimelens.audit.dto.response.ChainVerificationResultDTO;
import com.crimelens.audit.entity.AuditChainRecord;
import com.crimelens.audit.repository.AuditChainRepository;
import com.crimelens.audit.service.AuditChainService;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.evidence.entity.Evidence;
import com.crimelens.evidence.repository.EvidenceRepository;
import com.crimelens.security.crypto.EvidenceCryptoService;
import com.crimelens.user.entity.User;
import com.crimelens.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class AuditChainServiceTest {

    @Autowired
    private AuditChainService auditChainService;

    @Autowired
    private AuditChainRepository auditChainRepository;

    @Autowired
    private EvidenceRepository evidenceRepository;

    @Autowired
    private CaseRecordRepository caseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EvidenceCryptoService cryptoService;

    @BeforeEach
    void setUp() {
        auditChainRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Valid Hash Chain: A -> B -> C verifies successfully as VALID")
    void testValidHashChainSequentialVerification() {
        String scope = "CASE:CR-TEST-101";

        auditChainService.appendToChain(scope, "CASE_CREATED", "CR-TEST-101", null, "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", null, "Created Case CR-TEST-101");
        auditChainService.appendToChain(scope, "EVIDENCE_REGISTERED", "CR-TEST-101", "EVID-001", "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", "hash123", "Registered weapon evidence");
        auditChainService.appendToChain(scope, "EVIDENCE_ACCESSED", "CR-TEST-101", "EVID-001", "OFF-002", "Inspector Das", "STATION_ADMIN", "OP-BBSR", "hash123", "Accessed weapon evidence");

        ChainVerificationResultDTO result = auditChainService.verifyChain(scope);

        assertNotNull(result);
        assertEquals("VERIFIED", result.getStatus());
        assertEquals(3, result.getTotalRecords());
        assertEquals(3, result.getVerifiedRecords());
        assertNull(result.getBrokenRecordId());
    }

    @Test
    @DisplayName("2. Tamper Detection: Modified Record Content fails verification as COMPROMISED")
    void testTamperDetectionModifiedRecordContent() {
        String scope = "CASE:CR-TEST-102";

        AuditChainRecord r1 = auditChainService.appendToChain(scope, "CASE_CREATED", "CR-TEST-102", null, "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", null, "Created Case");
        AuditChainRecord r2 = auditChainService.appendToChain(scope, "EVIDENCE_REGISTERED", "CR-TEST-102", "EVID-002", "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", "hashA", "Registered vehicle evidence");

        // Tamper with r2 canonical payload
        r2.setCanonicalPayload(r2.getCanonicalPayload() + "|TAMPERED");
        auditChainRepository.saveAndFlush(r2);

        ChainVerificationResultDTO result = auditChainService.verifyChain(scope);

        assertNotNull(result);
        assertEquals("COMPROMISED", result.getStatus());
        assertEquals(2, result.getTotalRecords());
        assertEquals(1, result.getVerifiedRecords());
        assertEquals(r2.getRecordId(), result.getBrokenRecordId());
        assertTrue(result.getFailureReason().contains("Tampering detected in record content"));
    }

    @Test
    @DisplayName("3. Tamper Detection: Broken Previous Hash link fails verification as COMPROMISED")
    void testTamperDetectionBrokenPreviousHashLink() {
        String scope = "CASE:CR-TEST-103";

        auditChainService.appendToChain(scope, "CASE_CREATED", "CR-TEST-103", null, "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", null, "Created Case");
        AuditChainRecord r2 = auditChainService.appendToChain(scope, "EVIDENCE_REGISTERED", "CR-TEST-103", "EVID-003", "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", "hashX", "Registered evidence");

        // Break previous hash link on r2
        r2.setPreviousHash("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        auditChainRepository.saveAndFlush(r2);

        ChainVerificationResultDTO result = auditChainService.verifyChain(scope);

        assertNotNull(result);
        assertEquals("COMPROMISED", result.getStatus());
        assertEquals(r2.getRecordId(), result.getBrokenRecordId());
        assertTrue(result.getFailureReason().contains("Cryptographic hash chain broken"));
    }

    @Test
    @DisplayName("4. Evidence Integrity Verification: Detects live evidence description tampering")
    void testEvidenceIntegrityVerification() {
        CaseRecord c = caseRepository.findAll().stream().findFirst().orElseGet(() -> {
            CaseRecord nc = new CaseRecord();
            nc.setId("CR-TEST-104");
            nc.setFirNumber("FIR/2026/099");
            nc.setTitle("CCTV Evidence Case");
            nc.setDescription("Burglary Case Description");
            nc.setCrimeType("Burglary");
            return caseRepository.save(nc);
        });

        User u = userRepository.findById("INV-BBSR-001").orElse(null);

        Evidence ev = new Evidence("EVID-TEST-104", c, u, "CCTV Camera 4", "1080p MP4", "Original CCTV Footage Description", "VIDEO", Instant.now(), new ArrayList<>());
        evidenceRepository.save(ev);

        String rawContent = "Original CCTV Footage Description|CCTV Camera 4|1080p MP4";
        String contentHash = com.crimelens.audit.security.HashChainUtils.sha256(rawContent);

        auditChainService.appendToChain("EVIDENCE:EVID-TEST-104", "EVIDENCE_HASHED", "CR-TEST-104", "EVID-TEST-104", "INV-BBSR-001", "Inspector Roy", "OFFICER", "OP-BBSR", contentHash, "Hashed evidence");

        // Verify valid initial integrity
        ChainVerificationResultDTO initialCheck = auditChainService.verifyEvidenceIntegrity("EVID-TEST-104");
        assertEquals("VERIFIED", initialCheck.getStatus());

        // Tamper with live evidence description in DB
        ev.setDescription("TAMPERED CCTV Footage Description");
        evidenceRepository.saveAndFlush(ev);

        // Verify tamper is immediately detected
        ChainVerificationResultDTO tamperedCheck = auditChainService.verifyEvidenceIntegrity("EVID-TEST-104");
        assertEquals("COMPROMISED", tamperedCheck.getStatus());
        assertTrue(tamperedCheck.getFailureReason().contains("Evidence content hash mismatch"));
    }

    @Test
    @DisplayName("5. Tamper Detection: Deleted Record creates sequence discontinuity")
    void testTamperDetectionDeletedRecord() {
        String scope = "CASE:CR-TEST-105";

        AuditChainRecord r1 = auditChainService.appendToChain(scope, "CASE_CREATED", "CR-TEST-105", null, "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", null, "Created Case");
        AuditChainRecord r2 = auditChainService.appendToChain(scope, "EVIDENCE_REGISTERED", "CR-TEST-105", "EVID-005", "OFF-001", "Officer Roy", "OFFICER", "OP-BBSR", "hash5", "Registered evidence");
        AuditChainRecord r3 = auditChainService.appendToChain(scope, "EVIDENCE_ACCESSED", "CR-TEST-105", "EVID-005", "OFF-002", "Inspector Das", "OFFICER", "OP-BBSR", "hash5", "Accessed evidence");

        // Delete record 2
        auditChainRepository.delete(r2);
        auditChainRepository.flush();

        ChainVerificationResultDTO result = auditChainService.verifyChain(scope);

        assertNotNull(result);
        assertEquals("COMPROMISED", result.getStatus());
        assertTrue(result.getFailureReason().contains("discontinuity") || result.getFailureReason().contains("broken"));
    }

    @Test
    @DisplayName("6. Cryptography: AES-256-GCM encryption with AAD binding operates correctly")
    void testAesGcmEncryptionWithAadBinding() {
        String sensitiveMetadata = "IMEI: 864201948201948 | SIM IMSI: 4044501928374";
        String aad = "EVIDENCE:EVID-CRYPT-999";

        EvidenceCryptoService.EncryptedResult res = cryptoService.encrypt(sensitiveMetadata, aad);
        assertNotNull(res);
        assertNotNull(res.getCiphertextBase64());
        assertNotNull(res.getIvHex());

        // Valid decryption
        String decrypted = cryptoService.decrypt(res.getCiphertextBase64(), res.getIvHex(), aad);
        assertEquals(sensitiveMetadata, decrypted);

        // Decryption with wrong AAD should throw
        assertThrows(RuntimeException.class, () -> {
            cryptoService.decrypt(res.getCiphertextBase64(), res.getIvHex(), "EVIDENCE:EVID-WRONG-000");
        });
    }
}
