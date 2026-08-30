package com.crimelens.dashboard.dto.response;

import com.crimelens.casefile.dto.response.OfficerCaseloadDTO;
import com.crimelens.intelligence.dto.response.IntelligenceAlertDTO;

import java.util.List;
import java.util.Map;

public class DashboardStatsDTO {

    private long totalCases;
    private long pendingCases;
    private long activeInvestigations;
    private long solvedCases;
    private long closedCases;
    private Map<String, Long> crimeTypeCounts;
    private List<IntelligenceAlertDTO> recentAlerts;
    private List<OfficerCaseloadDTO> caseloads;

    public DashboardStatsDTO() {
    }

    public DashboardStatsDTO(long totalCases, long pendingCases, long activeInvestigations, long solvedCases, long closedCases, Map<String, Long> crimeTypeCounts, List<IntelligenceAlertDTO> recentAlerts, List<OfficerCaseloadDTO> caseloads) {
        this.totalCases = totalCases;
        this.pendingCases = pendingCases;
        this.activeInvestigations = activeInvestigations;
        this.solvedCases = solvedCases;
        this.closedCases = closedCases;
        this.crimeTypeCounts = crimeTypeCounts;
        this.recentAlerts = recentAlerts;
        this.caseloads = caseloads;
    }

    public long getTotalCases() {
        return totalCases;
    }

    public void setTotalCases(long totalCases) {
        this.totalCases = totalCases;
    }

    public long getPendingCases() {
        return pendingCases;
    }

    public void setPendingCases(long pendingCases) {
        this.pendingCases = pendingCases;
    }

    public long getActiveInvestigations() {
        return activeInvestigations;
    }

    public void setActiveInvestigations(long activeInvestigations) {
        this.activeInvestigations = activeInvestigations;
    }

    public long getSolvedCases() {
        return solvedCases;
    }

    public void setSolvedCases(long solvedCases) {
        this.solvedCases = solvedCases;
    }

    public long getClosedCases() {
        return closedCases;
    }

    public void setClosedCases(long closedCases) {
        this.closedCases = closedCases;
    }

    public Map<String, Long> getCrimeTypeCounts() {
        return crimeTypeCounts;
    }

    public void setCrimeTypeCounts(Map<String, Long> crimeTypeCounts) {
        this.crimeTypeCounts = crimeTypeCounts;
    }

    public List<IntelligenceAlertDTO> getRecentAlerts() {
        return recentAlerts;
    }

    public void setRecentAlerts(List<IntelligenceAlertDTO> recentAlerts) {
        this.recentAlerts = recentAlerts;
    }

    public List<OfficerCaseloadDTO> getCaseloads() {
        return caseloads;
    }

    public void setCaseloads(List<OfficerCaseloadDTO> caseloads) {
        this.caseloads = caseloads;
    }
}
