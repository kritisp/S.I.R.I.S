export interface IntelligenceSignal {
  id: string;
  source: string;
  sourceType: 'FIR' | 'CDR' | 'CCTV' | 'VEHICLE' | 'PREVIOUS_CASE' | 'FINANCIAL';
  timestamp: string;
  confidence: number;
  description: string;
  iconName: string;
  details?: Record<string, string>;
}

export interface FusionEntityNode {
  id: string;
  label: string;
  type: 'CASE' | 'SUSPECT' | 'PHONE' | 'VEHICLE' | 'CCTV' | 'PREVIOUS_CASE' | 'BANK_ACCOUNT' | 'LOCATION';
  subtitle?: string;
  riskScore?: number;
  highlighted?: boolean;
}

export interface FusionEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence?: number;
}

export interface PredictiveZoneRisk {
  id: string;
  zoneName: string;
  district: string;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'MODERATE' | 'LOW';
  lat: number;
  lng: number;
  dominantCrime: string;
  forecastWindow: string;
  peakRiskTime: string;
  crimeProbabilities: { crime: string; probability: number }[];
  contributingFactors: string[];
  recentIncidentsCount: number;
  recentTrendPercent: number;
  repeatOffendersNearby: number;
  cctvAlertsCount: number;
  recommendedResponse: string;
}

export interface RiskContributionItem {
  factor: string;
  percentage: number;
  description: string;
}

export interface PatrolUnit {
  id: string;
  unitCode: string;
  vehicleType: string;
  officerInCharge: string;
  status: 'AVAILABLE' | 'PATROLLING' | 'DISPATCHED' | 'STANDBY';
  currentLocation: string;
  assignedZone?: string;
  distanceKm: number;
  etaMins: number;
}

export interface DeploymentRecommendation {
  id: string;
  unitCode: string;
  targetZone: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedTimeWindow: string;
  predictedCrime: string;
  rationale: string[];
  status: 'RECOMMENDED' | 'DEPLOYED' | 'REJECTED';
}

export const PRIMARY_DEMO_CASE = {
  id: '2026-0817',
  caseNumber: 'CASE #2026-0817',
  firNumber: 'FIR-2026-0817',
  title: 'Organized Vehicle Theft & Pass-Through Mule Syndicate',
  crimeCategory: 'Organized Vehicle Theft',
  location: 'Khandagiri, Bhubaneswar',
  psJurisdiction: 'Khandagiri PS',
  registeredDate: '2026-09-01 18:30 IST',
  threatLevel: 'HIGH' as const,
  threatScore: 91,
  corroboratingSignalsCount: 6,
  linkedCasesCount: 3,
  
  suspect: {
    name: 'Rahul S.',
    alias: 'Rahul "Speed" Sahoo',
    age: 29,
    phone: '+91-9199370000',
    address: 'Khandagiri Square area, Bhubaneswar',
    knownMO: 'Night-time ANPR Bypass & Mule Account Transfer',
    riskScore: 94
  },
  vehicle: {
    plateNumber: 'OD-02-MJ-8821',
    model: 'Dark Blue Mahindra Thar',
    status: 'FLAGGED_ANPR'
  },
  cctv: {
    cameraId: 'KDG-04',
    location: 'Khandagiri Square Junction (North-East Pole)',
    lastDetected: '2026-09-02 19:42 IST'
  },
  financial: {
    accountNumber: 'M-204',
    bank: 'Utkal Gramya Bank (Khandagiri Br.)',
    holder: 'Rahul S. (Mule Account)',
    suspiciousVolume: '₹2,45,000'
  },
  linkedFIRs: ['FIR-2025-114', 'FIR-2026-031', 'FIR-2026-0817']
};

export const FUSION_NODES: FusionEntityNode[] = [
  { id: 'case-0817', label: 'CASE #2026-0817', type: 'CASE', subtitle: 'Organized Vehicle Theft', riskScore: 91, highlighted: true },
  { id: 'suspect-rahul', label: 'Rahul S.', type: 'SUSPECT', subtitle: 'Primary Suspect (Score 94)', riskScore: 94, highlighted: true },
  { id: 'phone-rahul', label: '+91-9199370000', type: 'PHONE', subtitle: 'Primary Intercepted Line', riskScore: 85 },
  { id: 'vehicle-thar', label: 'OD-02-MJ-8821', type: 'VEHICLE', subtitle: 'Mahindra Thar (ANPR Flagged)', riskScore: 92, highlighted: true },
  { id: 'cctv-kdg04', label: 'CCTV KDG-04', type: 'CCTV', subtitle: 'Khandagiri Sq Checkpoint', riskScore: 88 },
  { id: 'fir-2025-114', label: 'FIR-2025-114', type: 'PREVIOUS_CASE', subtitle: 'Night Burglary (Khandagiri PS)', riskScore: 78 },
  { id: 'fir-2026-031', label: 'FIR-2026-031', type: 'PREVIOUS_CASE', subtitle: 'Vehicle Theft (Capital PS)', riskScore: 82 },
  { id: 'mule-m204', label: 'Mule Account M-204', type: 'BANK_ACCOUNT', subtitle: 'Utkal Gramya Bank', riskScore: 89, highlighted: true },
  { id: 'loc-khandagiri', label: 'Khandagiri, BBS', type: 'LOCATION', subtitle: 'Primary Risk Hotspot', riskScore: 87 }
];

export const FUSION_EDGES: FusionEdge[] = [
  { id: 'e1', source: 'case-0817', target: 'suspect-rahul', label: 'ACCUSED IN', confidence: 96 },
  { id: 'e2', source: 'suspect-rahul', target: 'phone-rahul', label: 'REGISTERED LINE', confidence: 99 },
  { id: 'e3', source: 'suspect-rahul', target: 'vehicle-thar', label: 'DRIVES / ASSOCIATED', confidence: 94 },
  { id: 'e4', source: 'vehicle-thar', target: 'cctv-kdg04', label: 'DETECTED BY (19:42)', confidence: 94 },
  { id: 'e5', source: 'suspect-rahul', target: 'mule-m204', label: 'ACCOUNT CONTROLLER', confidence: 91 },
  { id: 'e6', source: 'suspect-rahul', target: 'fir-2025-114', label: 'PRIOR ACCUSED MATCH', confidence: 88 },
  { id: 'e7', source: 'suspect-rahul', target: 'fir-2026-031', label: 'M.O. MATCH', confidence: 85 },
  { id: 'e8', source: 'cctv-kdg04', target: 'loc-khandagiri', label: 'LOCATED AT', confidence: 100 },
  { id: 'e9', source: 'case-0817', target: 'loc-khandagiri', label: 'CRIME SCENE', confidence: 100 }
];

export const INTELLIGENCE_SIGNALS: IntelligenceSignal[] = [
  {
    id: 'sig-1',
    source: 'FIR / Case Record',
    sourceType: 'FIR',
    timestamp: '18:30 IST',
    confidence: 98,
    description: 'Case #2026-0817 registered at Khandagiri PS for organized commercial vehicle theft.',
    iconName: 'FileText',
    details: { 'FIR No': 'FIR-2026-0817', 'Category': 'Organized Theft', 'Complainant': 'Commercial Hub Security' }
  },
  {
    id: 'sig-2',
    source: 'CDR Relationship',
    sourceType: 'CDR',
    timestamp: '19:15 IST',
    confidence: 92,
    description: 'Repeated high-frequency calls detected between +91-9199370000 and known receiver accomplice prior to theft.',
    iconName: 'PhoneCall',
    details: { 'Calls Count': '14 in 3 hours', 'Cell Tower': 'Khandagiri NH-16 Pole 8', 'Accomplice': 'Vikram "Shadow" Das' }
  },
  {
    id: 'sig-3',
    source: 'CCTV / ANPR Sighting',
    sourceType: 'CCTV',
    timestamp: '19:42 IST',
    confidence: 94,
    description: 'Vehicle OD-02-MJ-8821 detected near Khandagiri Square by Camera KDG-04 proceeding towards NH-16.',
    iconName: 'Video',
    details: { 'Camera': 'KDG-04 (Khandagiri Sq)', 'Plate Match': '94% Confidence', 'Speed': '48 km/h' }
  },
  {
    id: 'sig-4',
    source: 'Vehicle Association',
    sourceType: 'VEHICLE',
    timestamp: '19:45 IST',
    confidence: 96,
    description: 'Dark Blue Mahindra Thar (OD-02-MJ-8821) flagged as primary transport for Rahul S.',
    iconName: 'Truck',
    details: { 'Registration': 'OD-02-MJ-8821', 'RTO': 'Bhubaneswar RTO-II', 'Owner': 'Rahul S.' }
  },
  {
    id: 'sig-5',
    source: 'Previous Case Match',
    sourceType: 'PREVIOUS_CASE',
    timestamp: '20:00 IST',
    confidence: 89,
    description: 'Modus Operandi matches FIR-2025-114 and FIR-2026-031 involving night-time lock-picking and rapid transit.',
    iconName: 'GitBranch',
    details: { 'Matching FIRs': 'FIR-2025-114, FIR-2026-031', 'Similarity Index': '89%', 'Common M.O.': 'Lock bypass + Fast exit' }
  },
  {
    id: 'sig-6',
    source: 'Financial / Mule Account Link',
    sourceType: 'FINANCIAL',
    timestamp: '20:10 IST',
    confidence: 91,
    description: 'Rapid pass-through cash deposits identified in Mule Account M-204 right before incident window.',
    iconName: 'CreditCard',
    details: { 'Account': 'Mule Account M-204', 'Amount': '₹2,45,000', 'Structuring': 'Under ₹50k PAN Limit' }
  }
];

export const PREDICTIVE_ZONES: PredictiveZoneRisk[] = [
  {
    id: 'zone-khandagiri',
    zoneName: 'Khandagiri',
    district: 'Khordha (Bhubaneswar)',
    riskScore: 87,
    riskLevel: 'CRITICAL',
    lat: 20.2589,
    lng: 85.7821,
    dominantCrime: 'Vehicle Theft',
    forecastWindow: 'Next 7 Days',
    peakRiskTime: '19:00 — 22:00 IST',
    crimeProbabilities: [
      { crime: 'Vehicle Theft', probability: 82 },
      { crime: 'Theft', probability: 74 },
      { crime: 'Snatching', probability: 61 },
      { crime: 'Burglary', probability: 48 }
    ],
    contributingFactors: [
      'Historical Crime Pattern (32%)',
      'Recent Incident Trend (+32%)',
      '3 Repeat Offenders Nearby',
      '5 Recent CCTV ANPR Alerts',
      'High Evening Transit Density'
    ],
    recentIncidentsCount: 14,
    recentTrendPercent: 32,
    repeatOffendersNearby: 3,
    cctvAlertsCount: 5,
    recommendedResponse: 'Deploy QRT Unit B-17 for proactive patrol (19:00–22:00) with ANPR active monitoring.'
  },
  {
    id: 'zone-mastercanteen',
    zoneName: 'Master Canteen',
    district: 'Khordha (Bhubaneswar)',
    riskScore: 81,
    riskLevel: 'HIGH',
    lat: 20.2678,
    lng: 85.8398,
    dominantCrime: 'Snatching & Pickpocketing',
    forecastWindow: 'Next 7 Days',
    peakRiskTime: '20:00 — 23:00 IST',
    crimeProbabilities: [
      { crime: 'Snatching', probability: 79 },
      { crime: 'Theft', probability: 71 },
      { crime: 'Robbery', probability: 54 },
      { crime: 'Vehicle Theft', probability: 42 }
    ],
    contributingFactors: [
      'High Pedestrian Footfall',
      'Railway Station Proximity',
      'Recent Snatching Spike (+24%)',
      '2 Active Surveillance Alerts'
    ],
    recentIncidentsCount: 11,
    recentTrendPercent: 24,
    repeatOffendersNearby: 2,
    cctvAlertsCount: 4,
    recommendedResponse: 'Deploy Mobile Unit C-05 for foot patrol and bus stand surveillance.'
  },
  {
    id: 'zone-saheednagar',
    zoneName: 'Saheed Nagar',
    district: 'Khordha (Bhubaneswar)',
    riskScore: 73,
    riskLevel: 'MEDIUM',
    lat: 20.2880,
    lng: 85.8420,
    dominantCrime: 'Commercial Burglary',
    forecastWindow: 'Next 7 Days',
    peakRiskTime: '21:00 — 00:00 IST',
    crimeProbabilities: [
      { crime: 'Burglary', probability: 72 },
      { crime: 'Vehicle Theft', probability: 58 },
      { crime: 'Cyber/Fraud', probability: 51 },
      { crime: 'Theft', probability: 40 }
    ],
    contributingFactors: [
      'Commercial Complex Density',
      'Night-time Low Visibility Areas',
      'Recent Lock-pick Anomaly Alerts'
    ],
    recentIncidentsCount: 8,
    recentTrendPercent: 18,
    repeatOffendersNearby: 1,
    cctvAlertsCount: 3,
    recommendedResponse: 'Assign Unit D-11 for commercial complex night check.'
  },
  {
    id: 'zone-patia',
    zoneName: 'Patia InfoCity',
    district: 'Khordha (Bhubaneswar)',
    riskScore: 66,
    riskLevel: 'MEDIUM',
    lat: 20.3540,
    lng: 85.8190,
    dominantCrime: 'Cyber & Financial Fraud',
    forecastWindow: 'Next 7 Days',
    peakRiskTime: '18:00 — 21:00 IST',
    crimeProbabilities: [
      { crime: 'Cyber/Fraud', probability: 76 },
      { crime: 'Vehicle Theft', probability: 52 },
      { crime: 'Snatching', probability: 45 },
      { crime: 'Burglary', probability: 31 }
    ],
    contributingFactors: [
      'IT Hub & Student Population',
      'High Digital Payment Volume',
      'Emerging Mule Account Connections'
    ],
    recentIncidentsCount: 7,
    recentTrendPercent: 14,
    repeatOffendersNearby: 1,
    cctvAlertsCount: 2,
    recommendedResponse: 'Assign Unit A-08 for tech corridor monitoring and cyber alert dispatch.'
  },
  {
    id: 'zone-palasuni',
    zoneName: 'Palasuni NH-16',
    district: 'Khordha (Bhubaneswar)',
    riskScore: 58,
    riskLevel: 'MODERATE',
    lat: 20.3012,
    lng: 85.8450,
    dominantCrime: 'Highway Robbery',
    forecastWindow: 'Next 7 Days',
    peakRiskTime: '22:00 — 02:00 IST',
    crimeProbabilities: [
      { crime: 'Highway Robbery', probability: 64 },
      { crime: 'Vehicle Theft', probability: 55 },
      { crime: 'Accident/Hit-Run', probability: 48 },
      { crime: 'Cargo Theft', probability: 38 }
    ],
    contributingFactors: [
      'Interstate Highway Intersection',
      'Heavy Freight Truck Volume',
      'Toll Gate ANPR Tracking Zone'
    ],
    recentIncidentsCount: 5,
    recentTrendPercent: 9,
    repeatOffendersNearby: 1,
    cctvAlertsCount: 3,
    recommendedResponse: 'Station Highway Patrol Unit B-22 at NH-16 Flyover Toll.'
  }
];

export const RISK_CONTRIBUTION_FACTORS: RiskContributionItem[] = [
  { factor: 'Historical Crime Pattern', percentage: 32, description: 'Long-term baseline frequency analysis for Khandagiri PS.' },
  { factor: 'Recent Incident Trend', percentage: 25, description: '+32% surge in vehicle theft reports in the last 14 days.' },
  { factor: 'Repeat Offender Activity', percentage: 18, description: 'Sighting and cell tower proximity of subjects like Rahul S.' },
  { factor: 'CCTV / ANPR Alerts', percentage: 14, description: 'Sequential plate detections near Khandagiri Square.' },
  { factor: 'Night-time Activity', percentage: 8, description: 'Elevated crime incidence during 19:00–22:00 window.' },
  { factor: 'Other Environmental Factors', percentage: 3, description: 'Lighting, transit bottlenecks, and crowd density.' }
];

export const RISK_TERRAIN_COMPOSITE_FACTORS = [
  { factor: 'Historical Crime', weight: 35, color: '#ef4444' },
  { factor: 'Recent Trend', weight: 20, color: '#f97316' },
  { factor: 'Repeat Offenders', weight: 18, color: '#eab308' },
  { factor: 'CCTV Alerts', weight: 12, color: '#3b82f6' },
  { factor: 'Transit Activity', weight: 8, color: '#8b5cf6' },
  { factor: 'Time-of-Day', weight: 7, color: '#06b6d4' }
];

export const SYNTHETIC_PATROL_UNITS: PatrolUnit[] = [
  {
    id: 'u-b17',
    unitCode: 'Unit B-17',
    vehicleType: 'Scorpio QRT Interceptor',
    officerInCharge: 'SI Bikram Samant',
    status: 'AVAILABLE',
    currentLocation: 'Fire Station Sq (1.8 km from Khandagiri)',
    distanceKm: 1.8,
    etaMins: 4
  },
  {
    id: 'u-c05',
    unitCode: 'Unit C-05',
    vehicleType: 'PCR Van #05',
    officerInCharge: 'ASI Ramesh Jena',
    status: 'PATROLLING',
    currentLocation: 'Rajmahal Sq (2.4 km from Master Canteen)',
    distanceKm: 2.4,
    etaMins: 6
  },
  {
    id: 'u-d11',
    unitCode: 'Unit D-11',
    vehicleType: 'Quick Reaction Patrol D-11',
    officerInCharge: 'SI Ananya Patnaik',
    status: 'AVAILABLE',
    currentLocation: 'Vani Vihar Flyover (3.1 km from Saheed Nagar)',
    distanceKm: 3.1,
    etaMins: 7
  },
  {
    id: 'u-a08',
    unitCode: 'Unit A-08',
    vehicleType: 'Cyber Interceptor A-08',
    officerInCharge: 'Insp S. K. Dash',
    status: 'STANDBY',
    currentLocation: 'KIIT Square (2.0 km from Patia InfoCity)',
    distanceKm: 2.0,
    etaMins: 5
  },
  {
    id: 'u-b22',
    unitCode: 'Unit B-22',
    vehicleType: 'Highway Interceptor B-22',
    officerInCharge: 'SI Manoj Tripathy',
    status: 'PATROLLING',
    currentLocation: 'Rasulgarh Toll Plaza (2.8 km from Palasuni)',
    distanceKm: 2.8,
    etaMins: 6
  },
  {
    id: 'u-c14',
    unitCode: 'Unit C-14',
    vehicleType: 'PCR Patrol #14',
    officerInCharge: 'ASI P. C. Rout',
    status: 'AVAILABLE',
    currentLocation: 'Capital PS Yard (4.2 km from Khandagiri)',
    distanceKm: 4.2,
    etaMins: 10
  }
];

export const INITIAL_AI_RECOMMENDATIONS: DeploymentRecommendation[] = [
  {
    id: 'rec-1',
    unitCode: 'Unit B-17',
    targetZone: 'Khandagiri',
    priority: 'CRITICAL',
    recommendedTimeWindow: '19:00 — 22:00 IST',
    predictedCrime: 'Organized Vehicle Theft (82% Prob)',
    rationale: [
      'High predicted vehicle-theft risk (87/100)',
      'Recent CCTV ANPR alert for OD-02-MJ-8821',
      'Active repeat offender (Rahul S.) in immediate vicinity'
    ],
    status: 'RECOMMENDED'
  },
  {
    id: 'rec-2',
    unitCode: 'Unit C-05',
    targetZone: 'Master Canteen',
    priority: 'HIGH',
    recommendedTimeWindow: '20:00 — 23:00 IST',
    predictedCrime: 'Snatching & Chain Robbery (79% Prob)',
    rationale: [
      'Elevated snatching risk score (81/100)',
      'High pedestrian crowd density near bus stand',
      'Recent 11 incident reports in last 14 days'
    ],
    status: 'RECOMMENDED'
  },
  {
    id: 'rec-3',
    unitCode: 'Unit D-11',
    targetZone: 'Saheed Nagar',
    priority: 'MEDIUM',
    recommendedTimeWindow: '21:00 — 00:00 IST',
    predictedCrime: 'Commercial Burglary (72% Prob)',
    rationale: [
      'Commercial complex burglary trend spike',
      'Recent lock-pick anomaly alerts',
      'High night-time vulnerability'
    ],
    status: 'RECOMMENDED'
  },
  {
    id: 'rec-4',
    unitCode: 'Unit A-08',
    targetZone: 'Patia InfoCity',
    priority: 'MEDIUM',
    recommendedTimeWindow: '18:00 — 21:00 IST',
    predictedCrime: 'Emerging Cyber / Mule Transfer (76% Prob)',
    rationale: [
      'Emerging cyber and financial fraud activity',
      'Mule account M-204 transaction trail correlation',
      'High digital transaction density zone'
    ],
    status: 'RECOMMENDED'
  }
];
