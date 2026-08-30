package com.crimelens.audit.service;

import com.crimelens.user.entity.User;

import com.crimelens.audit.dto.response.AuditLogDTO;
import com.crimelens.common.dto.PagedResponse;
import com.crimelens.audit.entity.AuditLog;
import com.crimelens.audit.repository.AuditLogRepository;
import com.crimelens.security.UserPrincipal;
import com.crimelens.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void logAction(String userId, String userName, String userRole, String stationId,
                          String action, String resourceType, String resourceId,
                          String ipAddress, String details) {
        try {
            User user = null;
            if (userId != null && !userId.equalsIgnoreCase("ANONYMOUS")) {
                user = userRepository.findById(userId).orElse(null);
            }
            AuditLog log = new AuditLog(user, userId, userName, userRole, stationId, action, resourceType, resourceId, ipAddress, details);
            auditLogRepository.save(log);
            logger.info("AUDIT: User [{}] Role [{}] Station [{}] Action [{}] Resource [{}:{}]",
                    userId, userRole, stationId, action, resourceType, resourceId);
        } catch (Exception e) {
            logger.error("Failed to write audit log for action: {}", action, e);
        }
    }

    @Transactional
    public void logUserAction(UserPrincipal principal, String action, String resourceType, String resourceId, String details) {
        if (principal != null) {
            logAction(
                    principal.getUsername(),
                    principal.getName(),
                    principal.getRole().name(),
                    principal.getStationId(),
                    action,
                    resourceType,
                    resourceId,
                    null,
                    details
            );
        } else {
            logAction("ANONYMOUS", "Anonymous", "NONE", null, action, resourceType, resourceId, null, details);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForUser(String userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId)
                .stream()
                .map(AuditLogDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAuditLogsForStation(String stationId) {
        return auditLogRepository.findByStationIdOrderByTimestampDesc(stationId)
                .stream()
                .map(AuditLogDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogDTO> getAuditLogsForStationPaged(String stationId, Pageable pageable) {
        Page<AuditLogDTO> paged = auditLogRepository.findByStationIdOrderByTimestampDesc(stationId, pageable)
                .map(AuditLogDTO::fromEntity);
        return PagedResponse.of(paged);
    }
}
