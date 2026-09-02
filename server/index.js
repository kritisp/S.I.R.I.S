import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { airaTools, resolveFirRecord, MOCK_CASES } from './tools.js';

dotenv.config({ path: '../.env' });
dotenv.config(); // fallback to local .env

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

const apiKey = process.env.GOOGLE_API_KEY;
console.log(`[AIRA SERVER] Starting AIRA Intelligence Backend`);
console.log(`[AIRA SERVER] Google API Key configured: ${Boolean(apiKey)}`);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AIRA Intelligence Gemini Server',
    geminiConfigured: Boolean(process.env.GOOGLE_API_KEY),
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  });
});

/**
 * Generate a secure Gemini Ephemeral Token for Browser Direct Live API
 * GET /api/gemini/live-token
 */
app.get('/api/gemini/live-token', async (req, res) => {
  try {
    if (!apiKey) {
      return res.status(500).json({
        error: 'GOOGLE_API_KEY is not configured in server environment.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Create short-lived ephemeral token restricted for Live session
    const tokenResponse = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });

    console.log('[AIRA TOKEN] Created Gemini ephemeral token for client session');

    return res.json({
      token: tokenResponse.name,
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      voice: 'Puck',
      sampleRate: 16000,
      outputSampleRate: 24000,
    });
  } catch (error) {
    console.error('[AIRA TOKEN ERROR] Failed to create ephemeral token:', error?.message || error);
    return res.status(500).json({
      error: error?.message || 'Failed to create Gemini Live token',
    });
  }
});

/**
 * Authoritative S.I.R.I.S. Tool Execution Endpoint
 * POST /api/tools/:toolName
 */
app.post('/api/tools/:toolName', (req, res) => {
  const { toolName } = req.params;
  const args = req.body || {};

  console.log(`[AIRA TOOL API] Executing tool: ${toolName} with args:`, args);

  if (typeof airaTools[toolName] === 'function') {
    try {
      const result = airaTools[toolName](args);
      console.log(`[AIRA TOOL API] Result:`, result);
      return res.json(result);
    } catch (err) {
      console.error(`[AIRA TOOL API ERROR] Error executing ${toolName}:`, err);
      return res.status(500).json({ error: err?.message || 'Tool execution failed' });
    }
  }

  return res.status(404).json({ error: `Tool ${toolName} not found.` });
});

/**
 * Return all FIR mock data catalog
 * GET /api/cases
 */
app.get('/api/cases', (req, res) => {
  return res.json(MOCK_CASES);
});

// ── DRISHTI MODULE 1: ANPR Check ──
app.post('/api/anpr-check', (req, res) => {
  const { plate_number } = req.body || {};
  const cleanPlate = (plate_number || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (cleanPlate.includes('OD02AB1234') || cleanPlate.includes('OD02') || cleanPlate.includes('KA01MJ8821')) {
    return res.json({
      alert: true,
      severity: 'CRITICAL',
      plate_number: 'OD-02-AB-1234',
      fir_case_number: 'FIR-2026-0142',
      original_crime: 'Armed Robbery / Hijack',
      crime_date: '2026-08-21T21:10:00Z',
      district: 'Khordha (Bhubaneswar)',
      associated_person: 'Rajesh Kumar (Suspect)',
      instructions: 'Vehicle associated with active armed heist investigation. Do not approach alone, contact Khandagiri PS & Cuttack Control Room.',
      provenance: 'Authorized Police Demonstration Watchlist'
    });
  }
  return res.json({
    alert: false,
    plate_number: plate_number || '',
    instructions: 'No active watchlist flags registered for this vehicle plate.',
    provenance: 'Authorized Officer Scan'
  });
});

// ── DRISHTI MODULE 2: Vehicle Geo-Trail ──
app.post('/api/trail', (req, res) => {
  const { crime_lat, crime_lng, crime_timestamp, plate_number } = req.body || {};
  const startLat = parseFloat(crime_lat) || 20.2580;
  const startLng = parseFloat(crime_lng) || 85.7845;
  const startTime = crime_timestamp || '2026-08-21T21:10:00Z';
  const plate = plate_number || 'OD-02-AB-1234';

  const trail = [
    { hop: 1, camera_id: 'CAM-041', camera_name: 'Khandagiri Square North ANPR Cam', lat: startLat, lng: startLng, timestamp: startTime, plate_detected: plate, confidence: 94, sighting_type: 'ANPR', distance_from_crime_km: 0.0 },
    { hop: 2, camera_id: 'CAM-052', camera_name: 'Patrapada NH-16 Bypass Cam 02', lat: startLat + 0.0042, lng: startLng + 0.0035, timestamp: '2026-08-21T21:17:00Z', plate_detected: plate, confidence: 89, sighting_type: 'ANPR', distance_from_crime_km: 0.6 },
    { hop: 3, camera_id: 'CAM-078', camera_name: 'Palasuni Flyover North Toll Cam 01', lat: startLat + 0.0125, lng: startLng + 0.0098, timestamp: '2026-08-21T21:23:00Z', plate_detected: plate, confidence: 82, sighting_type: 'ANPR', distance_from_crime_km: 1.8 },
    { hop: 4, camera_id: 'CAM-103', camera_name: 'Cuttack Sadar Link Road Checkpoint', lat: startLat + 0.0240, lng: startLng + 0.0185, timestamp: '2026-08-21T21:43:00Z', plate_detected: plate, confidence: 76, sighting_type: 'Visual / ANPR Correlation', distance_from_crime_km: 3.4 }
  ];

  return res.json({
    trail,
    total_hops: trail.length,
    trail_status: 'ACTIVE_TRAIL_RECONSTRUCTED',
    last_known_location: { lat: startLat + 0.0240, lng: startLng + 0.0185, camera_name: 'Cuttack Sadar Link Road Checkpoint' },
    total_distance_km: 3.4,
    duration_minutes: 33,
    provenance_notice: 'Demonstration data — investigator verification required.'
  });
});

// ── DRISHTI MODULE 3: CCTV Nearby ──
app.get('/api/cameras-nearby', (req, res) => {
  const lat = parseFloat(req.query.lat) || 20.2580;
  const lng = parseFloat(req.query.lng) || 85.7845;
  const radiusMeters = parseInt(req.query.radius_meters) || 500;

  const cameras = [
    { camera_id: 'CAM-041', name: 'Khandagiri Square North ANPR Cam', camera_type: 'Safe_City', lat, lng, distance_meters: 45.0, has_anpr: true, has_face_recog: true, junction_name: 'Khandagiri Chowk', relevance_score: 98.0 },
    { camera_id: 'CAM-052', name: 'Patrapada NH-16 Bypass Cam 02', camera_type: 'Safe_City', lat: lat + 0.002, lng: lng + 0.001, distance_meters: 180.0, has_anpr: true, has_face_recog: false, junction_name: 'Patrapada Junction', relevance_score: 88.0 },
    { camera_id: 'CAM-078', name: 'Unit IV Commercial Perimeter Gate', camera_type: 'BATCS', lat: lat + 0.004, lng: lng + 0.003, distance_meters: 340.0, has_anpr: true, has_face_recog: false, junction_name: 'Unit IV Market', relevance_score: 74.0 }
  ];

  return res.json({
    cameras,
    total_found: cameras.length,
    anpr_capable_count: 3,
    search_radius_meters: radiusMeters
  });
});

// ── DRISHTI MODULE 4 & 5: Action Queue & Event Trigger ──
app.get('/api/action-queue', (req, res) => {
  const queue = [
    { id: 'ACT-001', priority: 'HIGH', title: 'Review Vehicle ANPR Match', reason: 'Linked ANPR sighting for OD-02-AB-1234 matched with case FIR-2026-0142.', relatedCaseId: 'FIR-2026-0142', entityType: 'VEHICLE', entityValue: 'OD-02-AB-1234', timestamp: new Date().toISOString(), status: 'NEW', actionRoute: '/cctv?plate=OD-02-AB-1234' },
    { id: 'ACT-002', priority: 'HIGH', title: 'Verify Vehicle Flight Trail', reason: 'Sequential camera trail reconstructed across 4 hops to Cuttack Sadar border.', relatedCaseId: 'FIR-2026-0142', entityType: 'GEO_TRAIL', entityValue: 'Khandagiri -> Cuttack', timestamp: new Date().toISOString(), status: 'NEW', actionRoute: '/cctv?trail=true' },
    { id: 'ACT-003', priority: 'MEDIUM', title: 'Review Cross-Station MO Correlation', reason: 'High similarity (94%) detected between FIR-2026-0142 and FIR-2026-0081.', relatedCaseId: 'FIR-2026-0081', entityType: 'MO_PATTERN', entityValue: 'Jewelry Heist Pattern', timestamp: new Date().toISOString(), status: 'NEW', actionRoute: '/network' }
  ];
  return res.json(queue);
});

// ── DRISHTI MODULE 6: Risk Intelligence Score ──
app.post('/api/risk-score', (req, res) => {
  const { accused_name, fir_count = 1, prior_convictions = 0, crime_types = [] } = req.body || {};
  let score = 30;
  score += Math.min(fir_count * 12, 45);
  score += Math.min(prior_convictions * 10, 20);

  const hasViolent = (crime_types || []).some(t => {
    const lower = (t || '').toLowerCase();
    return lower.includes('robbery') || lower.includes('assault') || lower.includes('heist') || lower.includes('burglary');
  });
  if (hasViolent) score += 15;
  score = Math.min(Math.max(score, 10), 99);

  return res.json({
    accusedName: accused_name || 'Rajesh Kumar',
    riskScore: score,
    riskTier: score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW',
    confidence: 0.91,
    contributingFactors: [
      `Associated with ${fir_count} active crime records`,
      prior_convictions > 0 ? `History of ${prior_convictions} prior convictions` : 'Repeat offender pattern',
      'Offense category involves violent or armed entry characteristics',
      'Temporal activity correlation within last 30 days'
    ],
    legalDisclaimer: 'Analytical risk indicator for investigation prioritization — not a determination of guilt.',
    modelSource: 'S.I.R.I.S. Internal Recidivism Intelligence Engine'
  });
});


process.on('uncaughtException', (err) => {
  console.error('[AIRA SERVER UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[AIRA SERVER UNHANDLED REJECTION]:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`[AIRA SERVER] Running on http://localhost:${PORT}`);
  console.log(`[AIRA SERVER] Direct Gemini Live Token Endpoint: http://localhost:${PORT}/api/gemini/live-token`);
});
