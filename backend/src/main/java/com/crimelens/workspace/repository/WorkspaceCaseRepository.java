package com.crimelens.workspace.repository;

import com.crimelens.workspace.entity.WorkspaceCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceCaseRepository extends JpaRepository<WorkspaceCase, Long> {

    List<WorkspaceCase> findByWorkspaceId(String workspaceId);

    Optional<WorkspaceCase> findByWorkspaceIdAndCaseRecordId(String workspaceId, String caseId);

    boolean existsByWorkspaceIdAndCaseRecordId(String workspaceId, String caseId);

    long countByWorkspaceId(String workspaceId);

    void deleteByWorkspaceIdAndCaseRecordId(String workspaceId, String caseId);
}
