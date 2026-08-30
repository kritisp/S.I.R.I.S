package com.crimelens.casefile.dto.response;

public class OfficerCaseloadDTO {

    private String officerId;
    private String officerName;
    private String rank;
    private String stationId;
    private long totalAssignedCases;
    private long activeCases;
    private long pendingCases;
    private long solvedCases;

    public OfficerCaseloadDTO() {
    }

    public OfficerCaseloadDTO(String officerId, String officerName, String rank, String stationId,
                              long totalAssignedCases, long activeCases, long pendingCases, long solvedCases) {
        this.officerId = officerId;
        this.officerName = officerName;
        this.rank = rank;
        this.stationId = stationId;
        this.totalAssignedCases = totalAssignedCases;
        this.activeCases = activeCases;
        this.pendingCases = pendingCases;
        this.solvedCases = solvedCases;
    }

    public String getOfficerId() {
        return officerId;
    }

    public void setOfficerId(String officerId) {
        this.officerId = officerId;
    }

    public String getOfficerName() {
        return officerName;
    }

    public void setOfficerName(String officerName) {
        this.officerName = officerName;
    }

    public String getRank() {
        return rank;
    }

    public void setRank(String rank) {
        this.rank = rank;
    }

    public String getStationId() {
        return stationId;
    }

    public void setStationId(String stationId) {
        this.stationId = stationId;
    }

    public long getTotalAssignedCases() {
        return totalAssignedCases;
    }

    public void setTotalAssignedCases(long totalAssignedCases) {
        this.totalAssignedCases = totalAssignedCases;
    }

    public long getActiveCases() {
        return activeCases;
    }

    public void setActiveCases(long activeCases) {
        this.activeCases = activeCases;
    }

    public long getPendingCases() {
        return pendingCases;
    }

    public void setPendingCases(long pendingCases) {
        this.pendingCases = pendingCases;
    }

    public long getSolvedCases() {
        return solvedCases;
    }

    public void setSolvedCases(long solvedCases) {
        this.solvedCases = solvedCases;
    }
}
