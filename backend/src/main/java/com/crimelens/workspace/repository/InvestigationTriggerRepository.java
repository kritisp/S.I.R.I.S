package com.crimelens.workspace.repository;

import com.crimelens.workspace.entity.InvestigationTrigger;
import com.crimelens.workspace.entity.enums.TriggerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestigationTriggerRepository extends JpaRepository<InvestigationTrigger, String> {

    List<InvestigationTrigger> findByWorkspaceId(String workspaceId);

    Optional<InvestigationTrigger> findFirstByWorkspaceIdOrderByRequestedAtDesc(String workspaceId);

    Optional<InvestigationTrigger> findByWorkspaceIdAndStatusIn(String workspaceId, List<TriggerStatus> statuses);
}
