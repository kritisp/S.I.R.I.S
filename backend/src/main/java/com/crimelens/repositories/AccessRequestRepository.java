package com.crimelens.repositories;

import com.crimelens.entities.AccessRequest;
import com.crimelens.entities.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessRequestRepository extends JpaRepository<AccessRequest, String> {
    List<AccessRequest> findByRequestingStationId(String stationId);
    List<AccessRequest> findByTargetStationId(String stationId);
    List<AccessRequest> findByRequestingOfficerId(String officerId);
    boolean existsByRequestingOfficerIdAndTargetCaseIdAndStatus(String officerId, String caseId, RequestStatus status);
}
