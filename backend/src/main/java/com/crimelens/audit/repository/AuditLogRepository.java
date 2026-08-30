package com.crimelens.audit.repository;

import com.crimelens.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);

    List<AuditLog> findByStationIdOrderByTimestampDesc(String stationId);

    Page<AuditLog> findByStationIdOrderByTimestampDesc(String stationId, Pageable pageable);

    List<AuditLog> findByResourceTypeAndResourceIdOrderByTimestampDesc(String resourceType, String resourceId);
}
