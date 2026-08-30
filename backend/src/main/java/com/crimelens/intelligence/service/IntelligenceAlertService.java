package com.crimelens.intelligence.service;

import com.crimelens.audit.service.AuditService;

import com.crimelens.intelligence.dto.response.IntelligenceAlertDTO;
import com.crimelens.intelligence.entity.IntelligenceAlert;
import com.crimelens.user.entity.enums.UserRole;
import com.crimelens.common.exceptions.ResourceNotFoundException;
import com.crimelens.common.exceptions.UnauthorizedAccessException;
import com.crimelens.intelligence.repository.IntelligenceAlertRepository;
import com.crimelens.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IntelligenceAlertService {

    private final IntelligenceAlertRepository alertRepository;
    private final AuditService auditService;

    public IntelligenceAlertService(IntelligenceAlertRepository alertRepository, AuditService auditService) {
        this.alertRepository = alertRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<IntelligenceAlertDTO> getAlerts(UserPrincipal actor) {
        if (actor.getRole() == UserRole.SUPER_ADMIN) {
            return alertRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(IntelligenceAlertDTO::fromEntity)
                    .collect(Collectors.toList());
        }

        String stationId = actor.getStationId();
        if (stationId == null) {
            return List.of();
        }

        return alertRepository.findByTargetStationIdOrderByCreatedAtDesc(stationId).stream()
                .map(IntelligenceAlertDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public IntelligenceAlertDTO markAsRead(String alertId, UserPrincipal actor) {
        IntelligenceAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("IntelligenceAlert", "id", alertId));

        if (actor.getRole() != UserRole.SUPER_ADMIN &&
            (alert.getTargetStation() != null &&
             !alert.getTargetStation().getId().equalsIgnoreCase(actor.getStationId()))) {
            throw new UnauthorizedAccessException("Unauthorized to mark this alert as read.");
        }

        alert.setRead(true);
        IntelligenceAlert saved = alertRepository.save(alert);

        return IntelligenceAlertDTO.fromEntity(saved);
    }
}
