/**
 * firAnalysisService — S.I.R.I.S Real FIR / BNS RAG Pipeline Frontend Service
 * Connects frontend intake components directly to FastAPI RAG backend endpoint: POST /process-fir
 */

const RAG_BASE_URL = (import.meta.env.VITE_RAG_API_URL as string) || 'http://localhost:8000';
const INTERNAL_API_KEY = (import.meta.env.VITE_INTERNAL_API_KEY as string) || 'crimelens-internal-secret-key-2026';

export interface BnsSectionRecommendation {
  law: string; // 'BNS'
  section: string; // e.g. 'Section 305'
  title: string;
  reason: string;
  supporting_fir_evidence?: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  confidence_reason?: string;
}

export interface BnssProceduralAction {
  law: string; // 'BNSS'
  section: string; // e.g. 'Section 173'
  action: string;
}

export interface PrioritizedInvestigationAction {
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  reason: string;
  supporting_facts?: string[];
  expected_value?: string;
}

export interface ProcessFirResponse {
  fir_metadata: {
    fir_number?: string;
    police_station?: string;
    district?: string;
    date?: string;
    sections_cited?: string[];
  };
  summary: string;
  crime_type: string;
  crime_category: string;
  incident: {
    incident_location?: string;
    occurrence_timeline?: string;
    alleged_acts?: string[];
  };
  entities: {
    people?: Record<string, any>;
    weapons?: Array<{ description: string }>;
    property?: Array<{ item: string; value?: string }>;
    evidence?: Array<{ description: string }>;
    phones?: Array<{ number: string }>;
    vehicles?: Array<{ registration_number: string }>;
    locations?: Array<{ address: string }>;
  };
  timeline?: Array<{ time: string; event: string }>;
  modus_operandi?: string[];
  bns_sections: BnsSectionRecommendation[];
  bnss_procedural_actions: BnssProceduralAction[];
  investigation_actions: PrioritizedInvestigationAction[];
  investigation_intelligence?: {
    priority_level: string;
    priority_reason: string;
    legal_compliance_checklist?: string[];
    investigation_timeline?: string[];
  };
  insights?: string[];
  missing_information?: string[];
  masking_used?: boolean;
}

export const firAnalysisService = {
  /**
   * Submits FIR text narrative or document file to real backend RAG pipeline.
   */
  async processFIR(firText?: string, file?: File): Promise<ProcessFirResponse> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (firText && firText.trim()) {
      formData.append('fir_text', firText.trim());
    }

    try {
      const res = await fetch(`${RAG_BASE_URL}/process-fir`, {
        method: 'POST',
        headers: {
          'X-Internal-API-Key': INTERNAL_API_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`FIR RAG API returned HTTP ${res.status}: ${errorText || res.statusText}`);
      }

      const data: ProcessFirResponse = await res.json();
      return data;
    } catch (err: any) {
      console.error('[firAnalysisService] RAG Backend request failed:', err);
      throw err;
    }
  },
};
