package com.crimelens.audit.repository;

import com.crimelens.audit.entity.AuditChainRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditChainRepository extends JpaRepository<AuditChainRecord, Long> {

    List<AuditChainRecord> findByChainScopeOrderBySequenceIndexAsc(String chainScope);

    Optional<AuditChainRecord> findFirstByChainScopeOrderBySequenceIndexDesc(String chainScope);

    Optional<AuditChainRecord> findByRecordId(String recordId);

    List<AuditChainRecord> findByCaseIdOrderBySequenceIndexAsc(String caseId);

    List<AuditChainRecord> findByEvidenceIdOrderBySequenceIndexAsc(String evidenceId);

    @Query("SELECT MAX(a.sequenceIndex) FROM AuditChainRecord a WHERE a.chainScope = :chainScope")
    Long findMaxSequenceIndexForScope(@Param("chainScope") String chainScope);
}
