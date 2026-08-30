package com.crimelens.casefile.repository;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.casefile.entity.enums.CasePriority;
import com.crimelens.casefile.entity.enums.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRecordRepository extends JpaRepository<CaseRecord, String> {

    Optional<CaseRecord> findByFirNumber(String firNumber);

    boolean existsByFirNumber(String firNumber);

    List<CaseRecord> findByStationId(String stationId);

    List<CaseRecord> findByInvestigatorId(String investigatorId);

    List<CaseRecord> findByStationIdAndInvestigatorId(String stationId, String investigatorId);

    long countByStationId(String stationId);

    long countByStationIdAndStatus(String stationId, CaseStatus status);

    long countByInvestigatorIdAndStatus(String investigatorId, CaseStatus status);

    @Query("SELECT c FROM CaseRecord c WHERE " +
           "(:stationId IS NULL OR c.station.id = :stationId) AND " +
           "(:investigatorId IS NULL OR (c.investigator IS NOT NULL AND c.investigator.id = :investigatorId)) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:priority IS NULL OR c.priority = :priority) AND " +
           "(:crimeType IS NULL OR LOWER(c.crimeType) LIKE LOWER(CONCAT('%', :crimeType, '%'))) AND " +
           "(:query IS NULL OR (" +
           "   LOWER(c.firNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "   LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "   LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "   LOWER(c.crimeType) LIKE LOWER(CONCAT('%', :query, '%'))" +
           "))")
    Page<CaseRecord> searchCases(
            @Param("stationId") String stationId,
            @Param("investigatorId") String investigatorId,
            @Param("status") CaseStatus status,
            @Param("priority") CasePriority priority,
            @Param("crimeType") String crimeType,
            @Param("query") String query,
            Pageable pageable
    );

    @Query("SELECT c FROM CaseRecord c WHERE " +
           "(:stationId IS NULL OR c.station.id = :stationId) AND " +
           "(:investigatorId IS NULL OR (c.investigator IS NOT NULL AND c.investigator.id = :investigatorId))")
    List<CaseRecord> findAllAccessible(@Param("stationId") String stationId, @Param("investigatorId") String investigatorId);
}
