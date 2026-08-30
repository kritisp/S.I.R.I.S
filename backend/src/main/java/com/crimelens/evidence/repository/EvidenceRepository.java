package com.crimelens.evidence.repository;

import com.crimelens.evidence.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, String> {
    List<Evidence> findByCaseRecordId(String caseId);
    List<Evidence> findByCaseRecordStationId(String stationId);
}
