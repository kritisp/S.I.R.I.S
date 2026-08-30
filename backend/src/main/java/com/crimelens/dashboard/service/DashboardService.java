package com.crimelens.dashboard.service;

import com.crimelens.intelligence.service.IntelligenceAlertService;
import com.crimelens.user.service.UserService;

import com.crimelens.dashboard.dto.response.DashboardStatsDTO;
import com.crimelens.intelligence.dto.response.IntelligenceAlertDTO;
import com.crimelens.casefile.dto.response.OfficerCaseloadDTO;
import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.user.entity.User;
import com.crimelens.casefile.entity.enums.CaseStatus;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.casefile.repository.CaseRecordRepository;
import com.crimelens.user.repository.UserRepository;
import com.crimelens.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final CaseRecordRepository caseRepository;
    private final UserRepository userRepository;
    private final IntelligenceAlertService alertService;
    private final UserService userService;

    public DashboardService(CaseRecordRepository caseRepository,
                            UserRepository userRepository,
                            IntelligenceAlertService alertService,
                            UserService userService) {
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
        this.alertService = alertService;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats(UserPrincipal actor) {
        String stationId = actor.getRole() == UserRole.SUPER_ADMIN ? null : actor.getStationId();

        List<CaseRecord> accessibleCases = caseRepository.findAllAccessible(stationId, null);

        long total = accessibleCases.size();
        long pending = accessibleCases.stream().filter(c -> c.getStatus() == CaseStatus.PENDING).count();
        long active = accessibleCases.stream().filter(c -> c.getStatus() == CaseStatus.INVESTIGATING).count();
        long solved = accessibleCases.stream().filter(c -> c.getStatus() == CaseStatus.SOLVED).count();
        long closed = accessibleCases.stream().filter(c -> c.getStatus() == CaseStatus.CLOSED).count();

        // Crime Type distribution
        Map<String, Long> crimeTypeDistribution = accessibleCases.stream()
                .filter(c -> c.getCrimeType() != null)
                .collect(Collectors.groupingBy(CaseRecord::getCrimeType, Collectors.counting()));

        // Get alerts
        List<IntelligenceAlertDTO> recentAlerts = alertService.getAlerts(actor);
        if (recentAlerts.size() > 5) {
            recentAlerts = recentAlerts.subList(0, 5);
        }

        // Get caseloads for investigators in the same station
        List<User> investigators;
        if (stationId == null) {
            investigators = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == UserRole.OFFICER)
                    .collect(Collectors.toList());
        } else {
            investigators = userRepository.findByStationId(stationId).stream()
                    .filter(u -> u.getRole() == UserRole.OFFICER)
                    .collect(Collectors.toList());
        }

        List<OfficerCaseloadDTO> caseloads = investigators.stream()
                .map(i -> userService.getOfficerCaseload(i.getId(), actor))
                .collect(Collectors.toList());

        return new DashboardStatsDTO(
                total,
                pending,
                active,
                solved,
                closed,
                crimeTypeDistribution,
                recentAlerts,
                caseloads
        );
    }
}
