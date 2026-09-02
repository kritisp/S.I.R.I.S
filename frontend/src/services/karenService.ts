import { CaseRecord, Station, Evidence } from '../mockServices/types';

export interface KarenContext {
  currentUser?: string;
  station?: string;
  currentCaseId?: string;
  currentPage?: string;
  selectedEntity?: string;
  role?: string;
  cases?: CaseRecord[];
  stations?: Station[];
  evidence?: Evidence[];
}

export interface KarenAction {
  label: string;
  route: string;
  primary?: boolean;
}

export interface KarenResponse {
  intent: string;
  response: string;
  actions?: KarenAction[];
  route?: string;
}

export function processKarenQuery(query: string, context: KarenContext): KarenResponse {
  const q = query.trim().toLowerCase();
  const cases = context.cases || [];
  const stations = context.stations || [];

  // Helper to extract case references or number from query
  const findMatchingCase = (): CaseRecord | undefined => {
    // Look for exact ID matches first
    const idMatch = q.match(/(cr|od)-[a-z0-9-]+/);
    if (idMatch) {
      const matchId = idMatch[0].toUpperCase();
      const found = cases.find(c => c.id.toUpperCase() === matchId || c.id.replace(/-/g, '').toUpperCase() === matchId.replace(/-/g, ''));
      if (found) return found;
    }

    // Look for numerical matches (e.g. 541)
    const numberMatch = q.match(/\d+/);
    if (numberMatch) {
      const numStr = numberMatch[0];
      const found = cases.find(c => c.firNumber.includes(numStr) || c.id.includes(numStr));
      if (found) return found;
    }

    // Context fallback
    if (context.currentCaseId) {
      const found = cases.find(c => c.id === context.currentCaseId);
      if (found) return found;
    }

    return undefined;
  };

  // Helper to resolve navigation path aliases
  const getCaseRoute = (caseId: string) => `/cases/${caseId}`;

  // ==========================================
  // DIRECT COMMAND ROUTER (Precedence Rules)
  // ==========================================

  // DRISHTI Intent 1: ANPR Vehicle Intelligence
  if (q.includes('show me this vehicle') || q.includes('vehicle intelligence') || q.includes('anpr')) {
    return {
      intent: 'ANPR_LOOKUP',
      response: 'Accessing ANPR Vehicle Intelligence for OD-02-AB-1234. Matched under active armed robbery case FIR-2026-0142.',
      actions: [
        { label: 'OPEN VEHICLE INTEL', route: '/cctv?plate=OD-02-AB-1234', primary: true },
        { label: 'TRACE VEHICLE', route: '/cctv?trail=true' },
        { label: 'VIEW LINKED CASES', route: '/cases/CR-KHD-2026-00142' }
      ]
    };
  }

  // DRISHTI Intent 2: Vehicle Geo-Trail
  if (q.includes('trace this vehicle') || q.includes('geo-trail') || q.includes('vehicle trail') || q.includes('trace vehicle')) {
    return {
      intent: 'VEHICLE_TRAIL',
      response: 'Reconstructing flight trajectory for vehicle OD-02-AB-1234 across 4 camera hops from Khandagiri Square (21:10) to Cuttack Sadar checkpoint (21:43). Total distance: 3.4 km.',
      actions: [
        { label: 'VIEW GEO-TRAIL MAP', route: '/cctv?trail=true', primary: true },
        { label: 'REVIEW CCTV FEEDS', route: '/cctv' }
      ]
    };
  }

  // DRISHTI Intent 3: CCTV Nearby Intelligence
  if (q.includes('show nearby cameras') || q.includes('nearby cameras') || q.includes('cameras nearby')) {
    return {
      intent: 'OPEN_CCTV',
      response: 'Identified 3 active surveillance cameras within 500m of incident location. CAM-041 (Khandagiri Square) has 98% relevance score.',
      actions: [
        { label: 'OPEN CCTV CONSOLE', route: '/cctv', primary: true }
      ]
    };
  }

  // DRISHTI Intent 4 & 5: Action Queue & Automatic Triggers
  if (q.includes('what should i investigate next') || q.includes('action queue') || q.includes('investigate next') || q.includes('task queue')) {
    return {
      intent: 'ACTION_QUEUE',
      response: 'Inspector, your action queue has 2 High Priority items: 1) Review ANPR vehicle match for OD-02-AB-1234; 2) Verify reconstructed vehicle flight trail to Cuttack Sadar.',
      actions: [
        { label: 'OPEN ACTION QUEUE', route: '/dashboard', primary: true },
        { label: 'OPEN CASE WORKSPACE', route: '/cases/CR-KHD-2026-00142' }
      ]
    };
  }

  if (q.includes('what intelligence was automatically detected') || q.includes('automatic intelligence') || q.includes('auto detected')) {
    return {
      intent: 'INTELLIGENCE_EVENTS',
      response: 'Automatic Event Trigger detected: High correlation (94% MO similarity + shared vehicle OD-02-AB-1234) between Khandagiri FIR-2026-0142 and Cuttack Sadar FIR-2026-0081.',
      actions: [
        { label: 'VIEW NETWORK EXPLORER', route: '/network', primary: true }
      ]
    };
  }

  // DRISHTI Intent 6: Risk Explanation
  if (q.includes('why is this lead high priority') || q.includes('risk score') || q.includes('risk priority') || q.includes('why high priority')) {
    return {
      intent: 'RISK_EXPLANATION',
      response: 'Analytical Risk Score: 72/100 (HIGH). Contributing factors: 1) Associated with 3 active FIRs; 2) History of prior convictions; 3) Violent armed robbery characteristics; 4) Recent activity within 30 days. Note: Analytical indicator for prioritization, not a determination of guilt.',
      actions: [
        { label: 'VIEW RISK DETAILS', route: '/cases/CR-KHD-2026-00142', primary: true }
      ]
    };
  }

  if (q.includes('show me all cases connected to this vehicle') || q.includes('cases connected to vehicle')) {
    return {
      intent: 'CASE_NETWORK',
      response: 'Vehicle OD-02-AB-1234 connects 3 active cases: FIR-2026-0142 (Khandagiri Armed Robbery), FIR-2026-0081 (Cuttack Jewelry Heist), and FIR 541 (Khandagiri Van Theft).',
      actions: [
        { label: 'EXPLORE NETWORK GRAPH', route: '/network', primary: true },
        { label: 'VIEW PRIMARY CASE', route: '/cases/CR-KHD-2026-00142' }
      ]
    };
  }


  if (q.includes('tell me about') && q.includes('541')) {
    return {
      intent: 'CASE_LOOKUP',
      response: 'FIR 541 identified.',
      actions: [
        { label: 'OPEN CASE', route: '/investigations/CR-KHD-2026-00541', primary: true },
        { label: 'VIEW NETWORK', route: '/network' },
        { label: 'VIEW CCTV', route: '/cctv' }
      ]
    };
  }
  
  if (q.includes('open fir 541') || q.includes('open case 541')) {
    return {
      intent: 'OPEN_CASE',
      response: 'Opening case file for FIR 541.',
      route: '/investigations/CR-KHD-2026-00541'
    };
  }

  if (q.includes('show my cases') || q.includes('show cases')) {
    return {
      intent: 'OPEN_CASES_LIST',
      response: 'Opening your active investigations desk.',
      route: '/investigations'
    };
  }

  if (q.includes('show pending cases') || q.includes('pending cases')) {
    return {
      intent: 'OPEN_PENDING_CASES',
      response: 'Loading all pending investigations.',
      route: '/investigations?status=pending'
    };
  }

  if (q.includes('show linked cases') || q.includes('linked cases')) {
    return {
      intent: 'OPEN_NETWORK',
      response: 'Opening network relationship graph.',
      route: '/network'
    };
  }

  if (q.includes('find similar crimes') || q.includes('similar crimes')) {
    return {
      intent: 'OPEN_SIMILAR_CRIMES',
      response: 'Opening crime similarity network.',
      route: '/network?mode=similarity'
    };
  }

  if (q.includes('open cctv') || q.includes('cctv')) {
    return {
      intent: 'OPEN_CCTV',
      response: 'Opening CCTV feeds console.',
      route: '/cctv'
    };
  }

  if (q.includes('what bns applies') || q.includes('what bns') || q.includes('bns')) {
    return {
      intent: 'OPEN_LEGAL',
      response: 'Accessing Bharatiya Nyaya Sanhita legal provisions.',
      route: '/legal'
    };
  }

  if (q.includes('generate report') || q.includes('report') || q.includes('generate report')) {
    return {
      intent: 'OPEN_REPORTS',
      response: 'Opening reports desk.',
      route: '/reports'
    };
  }

  if (q.includes('open evidence vault') || q.includes('evidence vault') || q.includes('evidence')) {
    return {
      intent: 'OPEN_EVIDENCE',
      response: 'Opening evidence locker.',
      route: '/evidence'
    };
  }

  if (q.includes('show case timeline') || q.includes('timeline')) {
    const activeId = context.currentCaseId || 'CR-KHD-2026-00541';
    return {
      intent: 'OPEN_TIMELINE',
      response: 'Opening case timeline logs.',
      route: `/cases/${activeId}?tab=overview`
    };
  }

  if (q.includes('investigation progress') || q.includes('progress')) {
    const activeId = context.currentCaseId || 'CR-KHD-2026-00541';
    return {
      intent: 'OPEN_PROGRESS',
      response: 'Opening case investigation progress logs.',
      route: `/cases/${activeId}?tab=overview`
    };
  }

  // General Page Navigation Commands
  if (q.includes('go to dashboard') || q.includes('open dashboard') || q.includes('dashboard')) {
    return {
      intent: 'NAVIGATE',
      response: 'Navigating to Dashboard.',
      route: '/dashboard'
    };
  }
  if (q.includes('go to register fir') || q.includes('new case') || q.includes('register case') || q.includes('register fir')) {
    return {
      intent: 'NAVIGATE',
      response: 'Opening Register FIR page.',
      route: '/cases/new'
    };
  }
  if (q.includes('go to station intelligence') || q.includes('station intelligence') || q.includes('open alerts') || q.includes('show alerts') || q.includes('state alerts') || q.includes('intelligence alerts') || q.includes('alerts')) {
    return {
      intent: 'NAVIGATE',
      response: 'Opening State Alerts page.',
      route: '/intelligence/alerts'
    };
  }
  if (q.includes('go to officers') || q.includes('open officers') || q.includes('go to investigators') || q.includes('investigators') || q.includes('officers')) {
    return {
      intent: 'NAVIGATE',
      response: 'Opening Officers listing.',
      route: '/investigators'
    };
  }
  if (q.includes('go to access requests') || q.includes('open access requests') || q.includes('access requests') || q.includes('requests')) {
    return {
      intent: 'NAVIGATE',
      response: 'Opening Access Requests page.',
      route: '/requests'
    };
  }
  if (q.includes('go to stations') || q.includes('open stations') || q.includes('stations')) {
    return {
      intent: 'NAVIGATE',
      response: 'Opening Stations overview.',
      route: '/stations'
    };
  }
  if (q.includes('go to cases') || q.includes('open cases') || q.includes('cases')) {
    return {
      intent: 'NAVIGATE',
      response: 'Opening Cases database.',
      route: '/cases'
    };
  }

  // ==========================================
  // DYNAMIC INTELLIGENCE BACKUP SCANNER
  // ==========================================

  // Next investigation query / Pending cases advice
  if (q.includes('next') || q.includes('investigate next') || q.includes('workload')) {
    const pendingCases = cases.filter(c => c.status === 'INVESTIGATING');
    const myPending = pendingCases.filter(c => c.investigatorId === 'INV-BBSR-001' || c.description.toLowerCase().includes('vikram'));
    
    if (myPending.length > 0) {
      const topPriorityCase = myPending.find(c => c.priority === 'CRITICAL' || c.priority === 'HIGH') || myPending[0];
      return {
        intent: 'PENDING_WORKLOAD',
        response: `Inspector, you have **${myPending.length} active investigations** assigned.
Recommended next step:
• Case: **${topPriorityCase.title}** (${topPriorityCase.firNumber})
• Priority: **${topPriorityCase.priority}**
• Task: Review newly correlation evidence regarding suspect **Ranga Mohanty**.`,
        actions: [
          { label: 'OPEN CASE', route: getCaseRoute(topPriorityCase.id), primary: true },
          { label: 'VIEW ALL CASES', route: '/cases?filter=pending' }
        ],
        route: `/cases?filter=pending`
      };
    }
  }

  // Network links / Criminal relationships
  if (q.includes('correlation') || q.includes('similar')) {
    const activeCase = findMatchingCase() || cases.find(c => c.id === 'CR-KHD-2026-00541');
    if (activeCase) {
      const vehicleVals = activeCase.entities?.filter(e => e.type === 'VEHICLE').map(e => e.value) || [];
      const phoneVals = activeCase.entities?.filter(e => e.type === 'PHONE').map(e => e.value) || [];
      
      const relatedByVehicle = cases.filter(c => c.id !== activeCase.id && c.entities?.some(e => e.type === 'VEHICLE' && vehicleVals.includes(e.value)));
      const relatedByPhone = cases.filter(c => c.id !== activeCase.id && c.entities?.some(e => e.type === 'PHONE' && phoneVals.includes(e.value)));
      
      let linkSummary = `I analyzed the intelligence graph for Case **${activeCase.firNumber}**:\n`;
      
      if (relatedByVehicle.length > 0) {
        linkSummary += `• **Vehicle Link**: Matched plate **${vehicleVals[0]}** with Case **${relatedByVehicle[0].id}** (Jewelry Heist at Badambadi)\n`;
      }
      if (relatedByPhone.length > 0) {
        linkSummary += `• **Phone Link**: Matched contact number **${phoneVals[0]}** with Case **${relatedByPhone[0].id}**\n`;
      }
      if (activeCase.suspects && activeCase.suspects.length > 0) {
        linkSummary += `• **Suspect Link**: **${activeCase.suspects[0]}** is also associated with **2 other cases** in Cuttack district.\n`;
      }

      if (relatedByVehicle.length === 0 && relatedByPhone.length === 0) {
        linkSummary += `• Discovery: Identified **94% similarity correlation** with Case **OD-CTC-2026-00981** in Cuttack.\n`;
      }

      return {
        intent: 'CASE_NETWORK',
        response: linkSummary,
        actions: [
          { label: 'VIEW NETWORK EXPLORER', route: `/network`, primary: true },
          { label: 'OPEN MATCH CASE', route: relatedByVehicle[0] ? getCaseRoute(relatedByVehicle[0].id) : '/cases' }
        ],
        route: `/network`
      };
    }
  }

  // Hotspots / Analytics
  if (q.includes('hotspot') || q.includes('highest pending') || q.includes('performance') || q.includes('trends') || q.includes('analytics')) {
    const counts: { [key: string]: number } = {};
    cases.forEach(c => {
      if (c.status === 'INVESTIGATING' || c.status === 'PENDING') {
        counts[c.stationId] = (counts[c.stationId] || 0) + 1;
      }
    });

    let maxStationId = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([sid, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxStationId = sid;
      }
    });

    const highestStation = stations.find(s => s.id === maxStationId)?.name || 'Khandagiri Police Station';

    return {
      intent: 'CRIME_HOTSPOTS',
      response: `Crime Analytics & Workload Distribution:
• **Highest Active Workload**: **${highestStation}** with **${maxCount} active investigations**.
• Khordha District shows an **18% increase** in vehicle theft indices over the last quarter.`,
      actions: [
        { label: 'VIEW HOTSPOT ANALYTICS', route: '/reports', primary: true }
      ],
      route: '/reports'
    };
  }

  // Generic Case details / Case ID queries
  const matchedCase = findMatchingCase();
  if (matchedCase) {
    const investigatorName = matchedCase.investigatorId === 'INV-BBSR-001' ? 'Inspector Vikram' : 'SI Ranjan Samal';
    const stationName = stations.find(s => s.id === matchedCase.stationId)?.name || 'Khandagiri Police Station';

    return {
      intent: 'CASE_LOOKUP',
      response: `I found details for case **${matchedCase.firNumber}**:
• Case ID: **${matchedCase.id}**
• Crime: **${matchedCase.crimeType}**
• Station: **${stationName}**
• Officer: **${investigatorName}**
• Status: **${matchedCase.status}**`,
      actions: [
        { label: 'OPEN CASE WORKSPACE', route: getCaseRoute(matchedCase.id), primary: true },
        { label: 'VIEW RELATIONSHIPS', route: `/network` }
      ],
      route: getCaseRoute(matchedCase.id)
    };
  }

  // Role-based fallback
  const role = context.role || 'OFFICER';
  if (role === 'SUPER_ADMIN') {
    return {
      intent: 'COMMISSIONER_DASHBOARD',
      response: `Good morning Commissioner.
State Registry is online:
• Active Stations: **${stations.length || 12}**
• Registered cases: **${cases.length || 75}**
• District alert: High activity profile in Khordha district.`,
      actions: [
        { label: 'VIEW STATE PERFORMANCE', route: '/reports', primary: true },
        { label: 'VIEW ALL STATIONS', route: '/stations' }
      ]
    };
  } else if (role === 'STATION_ADMIN') {
    const stationName = context.station || 'Khandagiri PS';
    return {
      intent: 'STATION_DASHBOARD',
      response: `Good morning IIC Ramesh.
**${stationName}** workload status:
• Active officers: **5**
• Pending investigations: **4**
• Average resolution speed: **4.2 days**`,
      actions: [
        { label: 'VIEW ASSIGNED CASES', route: '/cases', primary: true },
        { label: 'VIEW STATION OFFICERS', route: '/investigators' }
      ]
    };
  } else {
    // Default Investigator / Officer fallback
    return {
      intent: 'INVESTIGATOR_DASHBOARD',
      response: `Good morning Inspector Vikram.
I am Karen, your CrimeLens Investigation Assistant. How can I help you scan cases, check evidence, or discover linked networks today?`,
      actions: [
        { label: 'OPEN MY CASE DESK', route: '/cases', primary: true },
        { label: 'VIEW LIVE ALERTS', route: '/dashboard' }
      ]
    };
  }
}
