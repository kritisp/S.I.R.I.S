package com.crimelens.config;

import com.crimelens.access.entity.AccessRequest;
import com.crimelens.access.entity.enums.RequestStatus;
import com.crimelens.access.repository.AccessRequestRepository;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.evidence.entity.Evidence;
import com.crimelens.evidence.repository.EvidenceRepository;
import com.crimelens.intelligence.entity.ExtractedEntity;
import com.crimelens.intelligence.entity.IntelligenceAlert;
import com.crimelens.intelligence.entity.enums.AlertType;
import com.crimelens.intelligence.entity.enums.EntityType;
import com.crimelens.intelligence.repository.IntelligenceAlertRepository;
import com.crimelens.station.entity.PoliceStation;
import com.crimelens.station.entity.enums.StationStatus;
import com.crimelens.station.repository.PoliceStationRepository;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.user.entity.enums.UserStatus;
import com.crimelens.user.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final PoliceStationRepository stationRepository;
    private final UserRepository userRepository;
    private final CaseRecordRepository caseRepository;
    private final EvidenceRepository evidenceRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final IntelligenceAlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PoliceStationRepository stationRepository,
                           UserRepository userRepository,
                           CaseRecordRepository caseRepository,
                           EvidenceRepository evidenceRepository,
                           AccessRequestRepository accessRequestRepository,
                           IntelligenceAlertRepository alertRepository,
                           PasswordEncoder passwordEncoder) {
        this.stationRepository = stationRepository;
        this.userRepository = userRepository;
        this.caseRepository = caseRepository;
        this.evidenceRepository = evidenceRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.alertRepository = alertRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (stationRepository.count() > 0) {
            logger.info("Database already contains data. Skipping initial seeding.");
            return;
        }

        logger.info("Seeding initial Odisha Police stations, users, and case records...");

        // 1. Seed Police Stations
        PoliceStation stBbsr = new PoliceStation("OP-BBSR-CAP", "Khandagiri Police Station", "Khordha", "Bhubaneswar", "Odisha", StationStatus.ACTIVE);
        PoliceStation stCtc = new PoliceStation("OP-CTC-CITY", "Cuttack City PS", "Cuttack", "Cuttack", "Odisha", StationStatus.ACTIVE);
        PoliceStation stRkl = new PoliceStation("OP-RKL-CEN", "Rourkela Central PS", "Sundargarh", "Rourkela", "Odisha", StationStatus.ACTIVE);
        PoliceStation stBam = new PoliceStation("OP-BAM-TWN", "Berhampur Town PS", "Ganjam", "Berhampur", "Odisha", StationStatus.ACTIVE);
        PoliceStation stPuri = new PoliceStation("OP-PURI-TWN", "Puri Town PS", "Puri", "Puri", "Odisha", StationStatus.ACTIVE);
        PoliceStation stSbp = new PoliceStation("OP-SBP-CEN", "Sambalpur Central PS", "Sambalpur", "Sambalpur", "Odisha", StationStatus.ACTIVE);

        List<PoliceStation> stations = Arrays.asList(stBbsr, stCtc, stRkl, stBam, stPuri, stSbp);
        stationRepository.saveAll(stations);

        // 2. Seed Users with BCrypt hash for "Demo@123"
        String defaultPasswordHash = passwordEncoder.encode("Demo@123");

        User superAdmin = new User("OP-HQ-001", "Comm. Mahapatra", UserRole.SUPER_ADMIN, null,
                "Commissioner", "hq.mahapatra@odishapolice.gov.in", defaultPasswordHash, UserStatus.ACTIVE);

        User iicBbsr = new User("IIC-BBSR-01", "IIC Ramesh", UserRole.STATION_ADMIN, stBbsr,
                "Inspector", "iic.khandagiri@odishapolice.gov.in", defaultPasswordHash, UserStatus.ACTIVE);

        User invBbsr1 = new User("INV-BBSR-001", "SI Ranjan Samal", UserRole.OFFICER, stBbsr,
                "Sub-Inspector", "ranjan.samal@odishapolice.gov.in", defaultPasswordHash, UserStatus.ACTIVE);

        User invBbsr2 = new User("INV-BBSR-002", "SI Ashok Mishra", UserRole.OFFICER, stBbsr,
                "Sub-Inspector", "ashok.mishra@odishapolice.gov.in", defaultPasswordHash, UserStatus.ACTIVE);

        User iicCtc = new User("IIC-CTC-01", "IIC Patnaik", UserRole.STATION_ADMIN, stCtc,
                "Inspector", "iic.cuttack@odishapolice.gov.in", defaultPasswordHash, UserStatus.ACTIVE);

        User invCtc1 = new User("INV-CTC-001", "SI Priyadarshi", UserRole.OFFICER, stCtc,
                "Sub-Inspector", "priyadarshi@odishapolice.gov.in", defaultPasswordHash, UserStatus.ACTIVE);

        List<User> users = Arrays.asList(superAdmin, iicBbsr, invBbsr1, invBbsr2, iicCtc, invCtc1);
        userRepository.saveAll(users);

        // 3. Seed Initial Case Records
        CaseRecord case1 = new CaseRecord(
                "CR-KHD-2026-004821",
                "CR-KHD-2026-004821",
                stBbsr,
                invBbsr1,
                "Residential Burglary (Unit IV)",
                "Night-time residential burglary in Unit IV area. Entry via rear balcony forced latch. Gold ornaments and cash stolen. Suspects fled in white commercial van.",
                "Residential Burglary",
                CaseStatus.INVESTIGATING,
                CasePriority.HIGH,
                Instant.now().minusSeconds(86400 * 3)
        );
        case1.setBnsSections(Arrays.asList("BNS 303", "BNS 331"));
        case1.setSuspects(Arrays.asList("Unknown masked male"));
        case1.setVehicles(Arrays.asList("White commercial van"));
        case1.setLocations(Arrays.asList("Unit IV, Bhubaneswar"));
        case1.setEntities(Arrays.asList(
                new ExtractedEntity(EntityType.VEHICLE, "White Commercial Van"),
                new ExtractedEntity(EntityType.LOCATION, "Unit IV, Bhubaneswar")
        ));

        CaseRecord case2 = new CaseRecord(
                "OD-BBSR-2026-0001",
                "OD-BBSR-2026-0001",
                stBbsr,
                invBbsr1,
                "High-Value Burglary (Unit IV)",
                "Commercial jewelry store robbery on 100ft road. Two masked men, 500g gold stolen, getaway in white van. Dropped burner mobile +91-9876543210.",
                "High-Value Burglary",
                CaseStatus.INVESTIGATING,
                CasePriority.HIGH,
                Instant.now().minusSeconds(86400 * 5)
        );
        case2.setBnsSections(Arrays.asList("BNS 303", "BNS 305"));
        case2.setSuspects(Arrays.asList("Ramesh", "Suresh"));
        case2.setVehicles(Arrays.asList("White commercial van"));
        case2.setLocations(Arrays.asList("100ft road, Unit IV, Bhubaneswar"));
        case2.setEvidenceRefs(new ArrayList<>(Arrays.asList("EVID-000001")));
        case2.setEntities(Arrays.asList(
                new ExtractedEntity(EntityType.VEHICLE, "White Commercial Van"),
                new ExtractedEntity(EntityType.PHONE, "+91-9876543210"),
                new ExtractedEntity(EntityType.PERSON, "Ramesh")
        ));

        CaseRecord case3 = new CaseRecord(
                "OD-BBSR-2026-0042",
                "OD-BBSR-2026-0042",
                stBbsr,
                invBbsr2,
                "Vehicle Theft — Saheed Nagar",
                "Two-wheeler stolen from Saheed Nagar commercial market parking lot during evening peak hours.",
                "Vehicle Theft",
                CaseStatus.INVESTIGATING,
                CasePriority.MEDIUM,
                Instant.now().minusSeconds(86400 * 7)
        );
        case3.setBnsSections(Arrays.asList("BNS 303"));
        case3.setSuspects(Arrays.asList("Unknown thief"));
        case3.setVehicles(Arrays.asList("Black Honda Activa OD-02-X-9988"));
        case3.setLocations(Arrays.asList("Saheed Nagar Market, Bhubaneswar"));
        case3.setEntities(Arrays.asList(
                new ExtractedEntity(EntityType.VEHICLE, "Black Honda Activa OD-02-X-9988"),
                new ExtractedEntity(EntityType.LOCATION, "Saheed Nagar, Bhubaneswar")
        ));

        CaseRecord case4 = new CaseRecord(
                "OD-CTC-2026-00981",
                "OD-CTC-2026-00981",
                stCtc,
                invCtc1,
                "Jewelry Heist (Badambadi)",
                "Armed jewelry store heist at Badambadi square. 3 perpetrators on motorcycle and white commercial van. Contact number +91-9876543210 linked in CDR logs.",
                "Armed Heist",
                CaseStatus.INVESTIGATING,
                CasePriority.CRITICAL,
                Instant.now().minusSeconds(86400 * 2)
        );
        case4.setBnsSections(Arrays.asList("BNS 309", "BNS 310"));
        case4.setSuspects(Arrays.asList("Ramesh", "Unknown Rider"));
        case4.setVehicles(Arrays.asList("White commercial van", "Black Pulsar Motorcycle"));
        case4.setLocations(Arrays.asList("Badambadi Square, Cuttack"));
        case4.setEvidenceRefs(new ArrayList<>(Arrays.asList("EVID-000002")));
        case4.setEntities(Arrays.asList(
                new ExtractedEntity(EntityType.VEHICLE, "White Commercial Van"),
                new ExtractedEntity(EntityType.VEHICLE, "Black Pulsar Motorcycle"),
                new ExtractedEntity(EntityType.PHONE, "+91-9876543210"),
                new ExtractedEntity(EntityType.PERSON, "Ramesh")
        ));

        List<CaseRecord> cases = Arrays.asList(case1, case2, case3, case4);
        caseRepository.saveAll(cases);

        // 4. Seed Evidence
        Evidence ev1 = new Evidence(
                "EVID-000001",
                case2,
                "Burner mobile phone recovered from getaway path.",
                "Mobile Phone",
                Instant.now().minusSeconds(86400 * 4),
                Arrays.asList(new ExtractedEntity(EntityType.PHONE, "+91-9876543210"))
        );
        Evidence ev2 = new Evidence(
                "EVID-000002",
                case4,
                "CCTV footage copy showing getaway white commercial van.",
                "Video File",
                Instant.now().minusSeconds(86400 * 1),
                Arrays.asList(new ExtractedEntity(EntityType.VEHICLE, "White Commercial Van"))
        );
        evidenceRepository.saveAll(Arrays.asList(ev1, ev2));

        // 5. Seed Access Request
        AccessRequest req1 = new AccessRequest(
                "REQ-000001",
                stCtc,
                invCtc1,
                stBbsr,
                case2,
                "Suspect white van from Cuttack heist matches Unit IV burglary description.",
                RequestStatus.PENDING
        );
        accessRequestRepository.save(req1);

        // 6. Seed Alerts
        IntelligenceAlert alt1 = new IntelligenceAlert(
                "ALT-000001",
                AlertType.CROSS_STATION_MATCH,
                "CROSS-STATION MATCH DETECTED: Burner phone number +91-9876543210 linked in both Unit IV Burglary (Bhubaneswar) and Jewelry Heist (Cuttack).",
                case2,
                case4,
                stBbsr,
                false
        );
        IntelligenceAlert alt2 = new IntelligenceAlert(
                "ALT-000002",
                AlertType.NEW_HOTSPOT,
                "CRIME HOTSPOT WARNING: Increased burglary frequency detected in Khordha district over last 7 days.",
                null,
                null,
                stBbsr,
                false
        );
        alertRepository.saveAll(Arrays.asList(alt1, alt2));

        logger.info("Successfully seeded {} stations, {} users, and {} case records.",
                stations.size(), users.size(), cases.size());
    }
}
