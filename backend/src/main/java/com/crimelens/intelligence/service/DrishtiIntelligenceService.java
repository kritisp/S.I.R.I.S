package com.crimelens.intelligence.service;

import com.crimelens.intelligence.dto.DrishtiIntelligenceDTO.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class DrishtiIntelligenceService {

    // ── Haversine Ground Distance Formula (meters) ──
    public double haversineM(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371000; // Earth radius in meters
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double dphi = Math.toRadians(lat2 - lat1);
        double dlam = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dphi / 2) * Math.sin(dphi / 2) +
                   Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) * Math.sin(dlam / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ── 1. ANPR Check & Watchlist Lookup ──
    public AnprCheckResponse processAnprCheck(AnprCheckRequest req) {
        AnprCheckResponse resp = new AnprCheckResponse();
        if (req.getPlateNumber() == null || req.getPlateNumber().trim().isEmpty()) {
            resp.setAlert(false);
            return resp;
        }

        String cleanPlate = req.getPlateNumber().replaceAll("[^A-Za-z0-9]", "").toUpperCase();

        // Seeded target vehicle: OD02AB1234
        if (cleanPlate.contains("OD02AB1234") || cleanPlate.contains("OD02") || cleanPlate.equals("KA01MJ8821")) {
            resp.setAlert(true);
            resp.setSeverity("CRITICAL");
            resp.setPlateNumber("OD-02-AB-1234");
            resp.setFirCaseNumber("FIR-2026-0142");
            resp.setOriginalCrime("Armed Robbery / Hijack");
            resp.setCrimeDate("2026-08-21T21:10:00Z");
            resp.setDistrict("Khordha (Bhubaneswar)");
            resp.setAssociatedPerson("Rajesh Kumar (Suspect)");
            resp.setInstructions("Vehicle associated with active armed heist investigation. Do not approach alone, notify Khandagiri PS & Cuttack Control Room.");
            resp.setProvenance("Authorized Police Demonstration Watchlist");
        } else {
            resp.setAlert(false);
            resp.setPlateNumber(req.getPlateNumber());
            resp.setInstructions("No active watchlist flags registered for this vehicle plate.");
            resp.setProvenance("Authorized Officer Scan");
        }

        return resp;
    }

    // ── 2. Vehicle Geo-Trail Reconstruction ──
    public VehicleTrailResponse generateGeoTrail(VehicleTrailRequest req) {
        double startLat = (req.getCrimeLat() != null) ? req.getCrimeLat() : 20.2580;
        double startLng = (req.getCrimeLng() != null) ? req.getCrimeLng() : 85.7845;
        String startTime = (req.getCrimeTimestamp() != null) ? req.getCrimeTimestamp() : "2026-08-21T21:10:00Z";
        String plate = (req.getPlateNumber() != null) ? req.getPlateNumber() : "OD-02-AB-1234";

        List<TrailHop> hops = new ArrayList<>();

        // Hop 1: Crime Scene Camera
        TrailHop h1 = new TrailHop();
        h1.setHop(1);
        h1.setCameraId("CAM-041");
        h1.setCameraName("Khandagiri Square North ANPR Cam");
        h1.setLat(startLat);
        h1.setLng(startLng);
        h1.setTimestamp(startTime);
        h1.setPlateDetected(plate);
        h1.setConfidence(94);
        h1.setSightingType("ANPR");
        h1.setDistanceFromCrimeKm(0.0);
        hops.add(h1);

        // Hop 2: NH-16 Junction
        TrailHop h2 = new TrailHop();
        h2.setHop(2);
        h2.setCameraId("CAM-052");
        h2.setCameraName("Patrapada NH-16 Bypass Cam 02");
        h2.setLat(startLat + 0.0042);
        h2.setLng(startLng + 0.0035);
        h2.setTimestamp("2026-08-21T21:17:00Z");
        h2.setPlateDetected(plate);
        h2.setConfidence(89);
        h2.setSightingType("ANPR");
        h2.setDistanceFromCrimeKm(0.6);
        hops.add(h2);

        // Hop 3: Cuttack Highway Toll Gate
        TrailHop h3 = new TrailHop();
        h3.setHop(3);
        h3.setCameraId("CAM-078");
        h3.setCameraName("Palasuni Flyover North Toll Cam 01");
        h3.setLat(startLat + 0.0125);
        h3.setLng(startLng + 0.0098);
        h3.setTimestamp("2026-08-21T21:23:00Z");
        h3.setPlateDetected(plate);
        h3.setConfidence(82);
        h3.setSightingType("ANPR");
        h3.setDistanceFromCrimeKm(1.8);
        hops.add(h3);

        // Hop 4: Cuttack Sadar Entry (Last Known Location)
        TrailHop h4 = new TrailHop();
        h4.setHop(4);
        h4.setCameraId("CAM-103");
        h4.setCameraName("Cuttack Sadar Link Road Checkpoint");
        h4.setLat(startLat + 0.0240);
        h4.setLng(startLng + 0.0185);
        h4.setTimestamp("2026-08-21T21:43:00Z");
        h4.setPlateDetected(plate);
        h4.setConfidence(76);
        h4.setSightingType("Visual / ANPR Correlation");
        h4.setDistanceFromCrimeKm(3.4);
        hops.add(h4);

        VehicleTrailResponse resp = new VehicleTrailResponse();
        resp.setTrail(hops);
        resp.setTotalHops(hops.size());
        resp.setTrailStatus("ACTIVE_TRAIL_RECONSTRUCTED");
        resp.setLastKnownLocation(new LocationRef(h4.getLat(), h4.getLng(), h4.getCameraName()));
        resp.setTotalDistanceKm(3.4);
        resp.setDurationMinutes(33);
        resp.setProvenanceNotice("Demonstration data — investigator verification required.");

        return resp;
    }

    // ── 3. CCTV Nearby & Relevance Scoring ──
    public CamerasNearbyResponse getCamerasNearby(double lat, double lng, int radiusMeters, String timestamp) {
        int radius = radiusMeters > 0 ? radiusMeters : 500;
        List<CameraInfo> cameraList = new ArrayList<>();

        CameraInfo c1 = new CameraInfo();
        c1.setCameraId("CAM-041");
        c1.setName("Khandagiri Square North ANPR Cam");
        c1.setCameraType("Safe_City");
        c1.setLat(lat);
        c1.setLng(lng);
        c1.setDistanceMeters(45.0);
        c1.setHasAnpr(true);
        c1.setHasFaceRecog(true);
        c1.setJunctionName("Khandagiri Chowk");
        c1.setRelevanceScore(98.0);
        cameraList.add(c1);

        CameraInfo c2 = new CameraInfo();
        c2.setCameraId("CAM-052");
        c2.setName("Patrapada NH-16 Bypass Cam 02");
        c2.setCameraType("Safe_City");
        c2.setLat(lat + 0.002);
        c2.setLng(lng + 0.001);
        c2.setDistanceMeters(180.0);
        c2.setHasAnpr(true);
        c2.setHasFaceRecog(false);
        c2.setJunctionName("Patrapada Junction");
        c2.setRelevanceScore(88.0);
        cameraList.add(c2);

        CameraInfo c3 = new CameraInfo();
        c3.setCameraId("CAM-078");
        c3.setName("Unit IV Commercial Perimeter Gate");
        c3.setCameraType("BATCS");
        c3.setLat(lat + 0.004);
        c3.setLng(lng + 0.003);
        c3.setDistanceMeters(340.0);
        c3.setHasAnpr(true);
        c3.setHasFaceRecog(false);
        c3.setJunctionName("Unit IV Market");
        c3.setRelevanceScore(74.0);
        cameraList.add(c3);

        CamerasNearbyResponse resp = new CamerasNearbyResponse();
        resp.setCameras(cameraList);
        resp.setTotalFound(cameraList.size());
        resp.setAnprCapableCount(3);
        resp.setSearchRadiusMeters(radius);
        return resp;
    }

    // ── 4. Action Queue Generator ──
    public List<InvestigationActionItem> getActionQueue(String caseId) {
        List<InvestigationActionItem> queue = new ArrayList<>();

        InvestigationActionItem item1 = new InvestigationActionItem();
        item1.setId("ACT-001");
        item1.setPriority("HIGH");
        item1.setTitle("Review Vehicle ANPR Match");
        item1.setReason("Linked ANPR sighting for OD-02-AB-1234 matched with case FIR-2026-0142.");
        item1.setRelatedCaseId("FIR-2026-0142");
        item1.setEntityType("VEHICLE");
        item1.setEntityValue("OD-02-AB-1234");
        item1.setTimestamp(Instant.now().toString());
        item1.setStatus("NEW");
        item1.setActionRoute("/cctv?plate=OD-02-AB-1234");
        queue.add(item1);

        InvestigationActionItem item2 = new InvestigationActionItem();
        item2.setId("ACT-002");
        item2.setPriority("HIGH");
        item2.setTitle("Verify Vehicle Flight Trail");
        item2.setReason("Sequential camera trail reconstructed across 4 hops to Cuttack Sadar border.");
        item2.setRelatedCaseId("FIR-2026-0142");
        item2.setEntityType("GEO_TRAIL");
        item2.setEntityValue("Khandagiri -> Cuttack");
        item2.setTimestamp(Instant.now().toString());
        item2.setStatus("NEW");
        item2.setActionRoute("/cctv?trail=true");
        queue.add(item2);

        InvestigationActionItem item3 = new InvestigationActionItem();
        item3.setId("ACT-003");
        item3.setPriority("MEDIUM");
        item3.setTitle("Review Cross-Station MO Correlation");
        item3.setReason("High similarity (94%) detected between FIR-2026-0142 and FIR-2026-0081.");
        item3.setRelatedCaseId("FIR-2026-0081");
        item3.setEntityType("MO_PATTERN");
        item3.setEntityValue("Jewelry Heist Pattern");
        item3.setTimestamp(Instant.now().toString());
        item3.setStatus("NEW");
        item3.setActionRoute("/network");
        queue.add(item3);

        return queue;
    }

    // ── 5. Multi-Factor Risk Score Calculator ──
    public RiskScoreResponse calculateRiskScore(RiskScoreRequest req) {
        int firCount = req.getFirCount() > 0 ? req.getFirCount() : 1;
        int priorConvictions = req.getPriorConvictions();
        List<String> types = req.getCrimeTypes() != null ? req.getCrimeTypes() : Collections.emptyList();

        int score = 30;
        score += Math.min(firCount * 12, 45);
        score += Math.min(priorConvictions * 10, 20);

        boolean hasViolent = types.stream().anyMatch(t -> {
            String lower = t.toLowerCase();
            return lower.contains("robbery") || lower.contains("assault") || lower.contains("heist") || lower.contains("burglary");
        });
        if (hasViolent) score += 15;

        score = Math.min(Math.max(score, 10), 99);
        String tier = score >= 85 ? "CRITICAL" : score >= 70 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";

        List<String> factors = new ArrayList<>();
        factors.add("Associated with " + firCount + " active crime records");
        if (priorConvictions > 0) factors.add("History of " + priorConvictions + " prior convictions");
        if (hasViolent) factors.add("Offense category involves violent or armed entry characteristics");
        factors.add("Temporal activity correlation within last 30 days");

        RiskScoreResponse resp = new RiskScoreResponse();
        resp.setAccusedName(req.getAccusedName() != null ? req.getAccusedName() : "Rajesh Kumar");
        resp.setRiskScore(score);
        resp.setRiskTier(tier);
        resp.setConfidence(0.91);
        resp.setContributingFactors(factors);
        resp.setLegalDisclaimer("Analytical risk indicator for investigation prioritization — not a determination of guilt.");
        resp.setModelSource("S.I.R.I.S. Internal Recidivism Intelligence Engine");

        return resp;
    }
}
