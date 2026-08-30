package com.crimelens.security;

import com.crimelens.casefile.entity.CaseRecord;
import com.crimelens.user.entity.User;
import com.crimelens.user.entity.enums.UserRole;
import org.springframework.stereotype.Component;

@Component("stationSecurity")
public class StationSecurityEvaluator {

    public boolean canAccessStation(UserPrincipal principal, String stationId) {
        if (principal == null) {
            return false;
        }
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }
        return principal.getStationId() != null && principal.getStationId().equalsIgnoreCase(stationId);
    }

    public boolean canAccessCase(UserPrincipal principal, CaseRecord caseRecord) {
        if (principal == null || caseRecord == null) {
            return false;
        }
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }

        String userStationId = principal.getStationId();
        String caseStationId = caseRecord.getStation() != null ? caseRecord.getStation().getId() : null;

        // Station Admin can access all cases belonging to their station
        if (principal.getRole() == UserRole.STATION_ADMIN) {
            return userStationId != null && userStationId.equalsIgnoreCase(caseStationId);
        }

        // Officer can access cases at their station or assigned directly to them
        if (principal.getRole() == UserRole.OFFICER) {
            boolean sameStation = userStationId != null && userStationId.equalsIgnoreCase(caseStationId);
            boolean isAssigned = caseRecord.getInvestigator() != null &&
                                 principal.getUsername().equalsIgnoreCase(caseRecord.getInvestigator().getId());
            return sameStation || isAssigned;
        }

        return false;
    }

    public boolean canManageUser(UserPrincipal principal, User targetUser) {
        if (principal == null || targetUser == null) {
            return false;
        }
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }
        if (principal.getRole() == UserRole.STATION_ADMIN) {
            String userStationId = principal.getStationId();
            String targetStationId = targetUser.getStation() != null ? targetUser.getStation().getId() : null;
            return userStationId != null && userStationId.equalsIgnoreCase(targetStationId);
        }
        return false;
    }

    public boolean canAccessWorkspace(UserPrincipal principal, com.crimelens.workspace.entity.InvestigationWorkspace workspace) {
        if (principal == null || workspace == null) {
            return false;
        }
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }

        String userStationId = principal.getStationId();
        String workspaceStationId = workspace.getStation() != null ? workspace.getStation().getId() : null;

        // Creator can access their workspace
        if (workspace.getCreator() != null && principal.getUsername().equalsIgnoreCase(workspace.getCreator().getId())) {
            return true;
        }

        // Station Admin & Officers in the same station can access station workspaces
        return userStationId != null && userStationId.equalsIgnoreCase(workspaceStationId);
    }
}
