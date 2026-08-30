package com.crimelens.workspace.controller;

import com.crimelens.common.dto.ApiResponse;
import com.crimelens.security.UserPrincipal;
import com.crimelens.workspace.dto.request.AddWorkspaceCaseRequest;
import com.crimelens.workspace.dto.request.CreateWorkspaceRequest;
import com.crimelens.workspace.dto.request.UpdateWorkspaceRequest;
import com.crimelens.workspace.dto.response.TriggerDTO;
import com.crimelens.workspace.dto.response.WorkspaceCaseDTO;
import com.crimelens.workspace.dto.response.WorkspaceDTO;
import com.crimelens.workspace.dto.response.WorkspaceIntelligenceResultDTO;
import com.crimelens.workspace.service.InvestigationWorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces")
public class InvestigationWorkspaceController {

    private final InvestigationWorkspaceService workspaceService;

    public InvestigationWorkspaceController(InvestigationWorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceDTO>> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceDTO created = workspaceService.createWorkspace(request, principal);
        return new ResponseEntity<>(ApiResponse.success("Investigation workspace created", created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceDTO>>> getWorkspaces(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WorkspaceDTO> workspaces = workspaceService.getAccessibleWorkspaces(principal);
        return ResponseEntity.ok(ApiResponse.success(workspaces));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceDTO>> getWorkspaceById(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceDTO workspace = workspaceService.getWorkspaceById(id, principal);
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceDTO>> updateWorkspace(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceDTO updated = workspaceService.updateWorkspace(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("Workspace updated", updated));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<TriggerDTO>> confirmWorkspace(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        TriggerDTO trigger = workspaceService.confirmWorkspace(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Workspace confirmed and investigation trigger dispatched", trigger));
    }

    @GetMapping("/{id}/cases")
    public ResponseEntity<ApiResponse<List<WorkspaceCaseDTO>>> getWorkspaceCases(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WorkspaceCaseDTO> cases = workspaceService.getWorkspaceCases(id, principal);
        return ResponseEntity.ok(ApiResponse.success(cases));
    }

    @PostMapping("/{id}/cases")
    public ResponseEntity<ApiResponse<WorkspaceCaseDTO>> addCaseToWorkspace(
            @PathVariable("id") String id,
            @Valid @RequestBody AddWorkspaceCaseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceCaseDTO added = workspaceService.addCaseToWorkspace(id, request.getCaseId(), principal);
        return new ResponseEntity<>(ApiResponse.success("Case added to workspace", added), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/cases/{caseId}")
    public ResponseEntity<ApiResponse<Void>> removeCaseFromWorkspace(
            @PathVariable("id") String id,
            @PathVariable("caseId") String caseId,
            @AuthenticationPrincipal UserPrincipal principal) {
        workspaceService.removeCaseFromWorkspace(id, caseId, principal);
        return ResponseEntity.ok(ApiResponse.success("Case removed from workspace", null));
    }

    @GetMapping("/{id}/trigger")
    public ResponseEntity<ApiResponse<TriggerDTO>> getLatestTrigger(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        TriggerDTO trigger = workspaceService.getLatestTrigger(id, principal);
        return ResponseEntity.ok(ApiResponse.success(trigger));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<ApiResponse<WorkspaceIntelligenceResultDTO>> getIntelligenceResult(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkspaceIntelligenceResultDTO result = workspaceService.getIntelligenceResult(id, principal);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
