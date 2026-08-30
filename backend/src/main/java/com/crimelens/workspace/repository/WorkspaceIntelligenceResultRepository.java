package com.crimelens.workspace.repository;

import com.crimelens.workspace.entity.WorkspaceIntelligenceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceIntelligenceResultRepository extends JpaRepository<WorkspaceIntelligenceResult, String> {

    Optional<WorkspaceIntelligenceResult> findByWorkspaceId(String workspaceId);

    Optional<WorkspaceIntelligenceResult> findByTriggerId(String triggerId);
}
