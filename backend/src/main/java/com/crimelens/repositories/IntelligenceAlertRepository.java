package com.crimelens.repositories;

import com.crimelens.entities.IntelligenceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntelligenceAlertRepository extends JpaRepository<IntelligenceAlert, String> {
    List<IntelligenceAlert> findByTargetStationIdOrderByCreatedAtDesc(String stationId);
    List<IntelligenceAlert> findAllByOrderByCreatedAtDesc();
}
