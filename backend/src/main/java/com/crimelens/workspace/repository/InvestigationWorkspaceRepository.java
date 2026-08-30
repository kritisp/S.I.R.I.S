package com.crimelens.workspace.repository;

import com.crimelens.workspace.entity.InvestigationWorkspace;
import com.crimelens.workspace.entity.enums.WorkspaceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationWorkspaceRepository extends JpaRepository<InvestigationWorkspace, String> {

    List<InvestigationWorkspace> findByStationId(String stationId);

    List<InvestigationWorkspace> findByCreatorId(String creatorId);

    List<InvestigationWorkspace> findByStationIdAndStatus(String stationId, WorkspaceStatus status);
}
