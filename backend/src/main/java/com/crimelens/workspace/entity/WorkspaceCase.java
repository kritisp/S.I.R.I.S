package com.crimelens.workspace.entity;

import com.crimelens.casefile.entity.CaseRecord;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "workspace_cases", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"workspace_id", "case_id"})
})
public class WorkspaceCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private InvestigationWorkspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseRecord caseRecord;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    public WorkspaceCase() {
    }

    public WorkspaceCase(InvestigationWorkspace workspace, CaseRecord caseRecord) {
        this.workspace = workspace;
        this.caseRecord = caseRecord;
        this.addedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.addedAt == null) {
            this.addedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InvestigationWorkspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(InvestigationWorkspace workspace) {
        this.workspace = workspace;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
