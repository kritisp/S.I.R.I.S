package com.crimelens.intelligence.dto;

import java.util.List;

public class DrishtiIntelligenceDTO {

    // ── ANPR DTOs ──
    public static class AnprCheckRequest {
        private String plateNumber;
        private String cameraId;
        private String cameraName;
        private Double lat;
        private Double lng;
        private String timestamp;

        public String getPlateNumber() { return plateNumber; }
        public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
        public String getCameraId() { return cameraId; }
        public void setCameraId(String cameraId) { this.cameraId = cameraId; }
        public String getCameraName() { return cameraName; }
        public void setCameraName(String cameraName) { this.cameraName = cameraName; }
        public Double getLat() { return lat; }
        public void setLat(Double lat) { this.lat = lat; }
        public Double getLng() { return lng; }
        public void setLng(Double lng) { this.lng = lng; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    public static class AnprCheckResponse {
        private boolean alert;
        private String severity;
        private String plateNumber;
        private String firCaseNumber;
        private String originalCrime;
        private String crimeDate;
        private String district;
        private String instructions;
        private String associatedPerson;
        private String provenance;

        public boolean isAlert() { return alert; }
        public void setAlert(boolean alert) { this.alert = alert; }
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getPlateNumber() { return plateNumber; }
        public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
        public String getFirCaseNumber() { return firCaseNumber; }
        public void setFirCaseNumber(String firCaseNumber) { this.firCaseNumber = firCaseNumber; }
        public String getOriginalCrime() { return originalCrime; }
        public void setOriginalCrime(String originalCrime) { this.originalCrime = originalCrime; }
        public String getCrimeDate() { return crimeDate; }
        public void setCrimeDate(String crimeDate) { this.crimeDate = crimeDate; }
        public String getDistrict() { return district; }
        public void setDistrict(String district) { this.district = district; }
        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }
        public String getAssociatedPerson() { return associatedPerson; }
        public void setAssociatedPerson(String associatedPerson) { this.associatedPerson = associatedPerson; }
        public String getProvenance() { return provenance; }
        public void setProvenance(String provenance) { this.provenance = provenance; }
    }

    // ── GEO-TRAIL DTOs ──
    public static class TrailHop {
        private int hop;
        private String cameraId;
        private String cameraName;
        private double lat;
        private double lng;
        private String timestamp;
        private String plateDetected;
        private int confidence;
        private String sightingType;
        private double distanceFromCrimeKm;

        public int getHop() { return hop; }
        public void setHop(int hop) { this.hop = hop; }
        public String getCameraId() { return cameraId; }
        public void setCameraId(String cameraId) { this.cameraId = cameraId; }
        public String getCameraName() { return cameraName; }
        public void setCameraName(String cameraName) { this.cameraName = cameraName; }
        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getPlateDetected() { return plateDetected; }
        public void setPlateDetected(String plateDetected) { this.plateDetected = plateDetected; }
        public int getConfidence() { return confidence; }
        public void setConfidence(int confidence) { this.confidence = confidence; }
        public String getSightingType() { return sightingType; }
        public void setSightingType(String sightingType) { this.sightingType = sightingType; }
        public double getDistanceFromCrimeKm() { return distanceFromCrimeKm; }
        public void setDistanceFromCrimeKm(double distanceFromCrimeKm) { this.distanceFromCrimeKm = distanceFromCrimeKm; }
    }

    public static class VehicleTrailRequest {
        private Double crimeLat;
        private Double crimeLng;
        private String crimeTimestamp;
        private String vehicleType;
        private String plateNumber;

        public Double getCrimeLat() { return crimeLat; }
        public void setCrimeLat(Double crimeLat) { this.crimeLat = crimeLat; }
        public Double getCrimeLng() { return crimeLng; }
        public void setCrimeLng(Double crimeLng) { this.crimeLng = crimeLng; }
        public String getCrimeTimestamp() { return crimeTimestamp; }
        public void setCrimeTimestamp(String crimeTimestamp) { this.crimeTimestamp = crimeTimestamp; }
        public String getVehicleType() { return vehicleType; }
        public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
        public String getPlateNumber() { return plateNumber; }
        public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
    }

    public static class VehicleTrailResponse {
        private List<TrailHop> trail;
        private int totalHops;
        private String trailStatus;
        private LocationRef lastKnownLocation;
        private double totalDistanceKm;
        private int durationMinutes;
        private String provenanceNotice;

        public List<TrailHop> getTrail() { return trail; }
        public void setTrail(List<TrailHop> trail) { this.trail = trail; }
        public int getTotalHops() { return totalHops; }
        public void setTotalHops(int totalHops) { this.totalHops = totalHops; }
        public String getTrailStatus() { return trailStatus; }
        public void setTrailStatus(String trailStatus) { this.trailStatus = trailStatus; }
        public LocationRef getLastKnownLocation() { return lastKnownLocation; }
        public void setLastKnownLocation(LocationRef lastKnownLocation) { this.lastKnownLocation = lastKnownLocation; }
        public double getTotalDistanceKm() { return totalDistanceKm; }
        public void setTotalDistanceKm(double totalDistanceKm) { this.totalDistanceKm = totalDistanceKm; }
        public int getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
        public String getProvenanceNotice() { return provenanceNotice; }
        public void setProvenanceNotice(String provenanceNotice) { this.provenanceNotice = provenanceNotice; }
    }

    public static class LocationRef {
        private double lat;
        private double lng;
        private String cameraName;

        public LocationRef() {}
        public LocationRef(double lat, double lng, String cameraName) {
            this.lat = lat; this.lng = lng; this.cameraName = cameraName;
        }
        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }
        public String getCameraName() { return cameraName; }
        public void setCameraName(String cameraName) { this.cameraName = cameraName; }
    }

    // ── CCTV NEARBY DTOs ──
    public static class CameraInfo {
        private String cameraId;
        private String name;
        private String cameraType;
        private double lat;
        private double lng;
        private double distanceMeters;
        private boolean hasAnpr;
        private boolean hasFaceRecog;
        private String junctionName;
        private double relevanceScore;

        public String getCameraId() { return cameraId; }
        public void setCameraId(String cameraId) { this.cameraId = cameraId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCameraType() { return cameraType; }
        public void setCameraType(String cameraType) { this.cameraType = cameraType; }
        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }
        public double getDistanceMeters() { return distanceMeters; }
        public void setDistanceMeters(double distanceMeters) { this.distanceMeters = distanceMeters; }
        public boolean isHasAnpr() { return hasAnpr; }
        public void setHasAnpr(boolean hasAnpr) { this.hasAnpr = hasAnpr; }
        public boolean isHasFaceRecog() { return hasFaceRecog; }
        public void setHasFaceRecog(boolean hasFaceRecog) { this.hasFaceRecog = hasFaceRecog; }
        public String getJunctionName() { return junctionName; }
        public void setJunctionName(String junctionName) { this.junctionName = junctionName; }
        public double getRelevanceScore() { return relevanceScore; }
        public void setRelevanceScore(double relevanceScore) { this.relevanceScore = relevanceScore; }
    }

    public static class CamerasNearbyResponse {
        private List<CameraInfo> cameras;
        private int totalFound;
        private int anprCapableCount;
        private int searchRadiusMeters;

        public List<CameraInfo> getCameras() { return cameras; }
        public void setCameras(List<CameraInfo> cameras) { this.cameras = cameras; }
        public int getTotalFound() { return totalFound; }
        public void setTotalFound(int totalFound) { this.totalFound = totalFound; }
        public int getAnprCapableCount() { return anprCapableCount; }
        public void setAnprCapableCount(int anprCapableCount) { this.anprCapableCount = anprCapableCount; }
        public int getSearchRadiusMeters() { return searchRadiusMeters; }
        public void setSearchRadiusMeters(int searchRadiusMeters) { this.searchRadiusMeters = searchRadiusMeters; }
    }

    // ── ACTION QUEUE ITEM DTO ──
    public static class InvestigationActionItem {
        private String id;
        private String priority; // HIGH, MEDIUM, LOW
        private String title;
        private String reason;
        private String relatedCaseId;
        private String entityType;
        private String entityValue;
        private String timestamp;
        private String status; // NEW, IN_REVIEW, VERIFIED, DISMISSED
        private String actionRoute;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getRelatedCaseId() { return relatedCaseId; }
        public void setRelatedCaseId(String relatedCaseId) { this.relatedCaseId = relatedCaseId; }
        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }
        public String getEntityValue() { return entityValue; }
        public void setEntityValue(String entityValue) { this.entityValue = entityValue; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getActionRoute() { return actionRoute; }
        public void setActionRoute(String actionRoute) { this.actionRoute = actionRoute; }
    }

    // ── RISK SCORE DTOs ──
    public static class RiskScoreRequest {
        private String accusedName;
        private int firCount = 1;
        private List<String> crimeTypes;
        private String districtName = "Khordha";
        private Integer age;
        private int priorConvictions = 0;

        public String getAccusedName() { return accusedName; }
        public void setAccusedName(String accusedName) { this.accusedName = accusedName; }
        public int getFirCount() { return firCount; }
        public void setFirCount(int firCount) { this.firCount = firCount; }
        public List<String> getCrimeTypes() { return crimeTypes; }
        public void setCrimeTypes(List<String> crimeTypes) { this.crimeTypes = crimeTypes; }
        public String getDistrictName() { return districtName; }
        public void setDistrictName(String districtName) { this.districtName = districtName; }
        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }
        public int getPriorConvictions() { return priorConvictions; }
        public void setPriorConvictions(int priorConvictions) { this.priorConvictions = priorConvictions; }
    }

    public static class RiskScoreResponse {
        private String accusedName;
        private int riskScore;
        private String riskTier; // CRITICAL, HIGH, MEDIUM, LOW
        private double confidence;
        private List<String> contributingFactors;
        private String legalDisclaimer;
        private String modelSource;

        public String getAccusedName() { return accusedName; }
        public void setAccusedName(String accusedName) { this.accusedName = accusedName; }
        public int getRiskScore() { return riskScore; }
        public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
        public String getRiskTier() { return riskTier; }
        public void setRiskTier(String riskTier) { this.riskTier = riskTier; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public List<String> getContributingFactors() { return contributingFactors; }
        public void setContributingFactors(List<String> contributingFactors) { this.contributingFactors = contributingFactors; }
        public String getLegalDisclaimer() { return legalDisclaimer; }
        public void setLegalDisclaimer(String legalDisclaimer) { this.legalDisclaimer = legalDisclaimer; }
        public String getModelSource() { return modelSource; }
        public void setModelSource(String modelSource) { this.modelSource = modelSource; }
    }
}
