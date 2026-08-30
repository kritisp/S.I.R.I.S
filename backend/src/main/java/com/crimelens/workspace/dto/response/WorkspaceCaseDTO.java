package com.crimelens.workspace.dto.response;

import com.crimelens.casefile.dto.response.CaseDTO;
import com.crimelens.workspace.entity.WorkspaceCase;

import java.time.Instant;

public class WorkspaceCaseDTO {

    private Long id;
    private String workspaceId;
    private CaseDTO caseRecord;
    private Instant addedAt;

    public WorkspaceCaseDTO() {
    }

    public WorkspaceCaseDTO(WorkspaceCase entity) {
        if (entity != null) {
            this.id = entity.getId();
            if (entity.getWorkspace() != null) {
                this.workspaceId = entity.getWorkspace().getId();
            }
            if (entity.getCaseRecord() != null) {
                this.caseRecord = CaseDTO.fromEntity(entity.getCaseRecord());
            }
            this.addedAt = entity.getAddedAt();
        }
    }

    public static WorkspaceCaseDTO fromEntity(WorkspaceCase entity) {
        return entity == null ? null : new WorkspaceCaseDTO(entity);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(String workspaceId) {
        this.workspaceId = workspaceId;
    }

    public CaseDTO getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseDTO caseRecord) {
        this.caseRecord = caseRecord;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
