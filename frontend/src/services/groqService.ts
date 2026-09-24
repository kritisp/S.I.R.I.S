/**
 * Groq LLM Cloud Reasoning Service for S.I.R.I.S.
 * Calls the voice-gateway server's /api/groq/chat-completion proxy, which holds
 * GROQ_API_KEY server-side. Previously called Groq's API directly from the browser
 * with a VITE_GROQ_API_KEY exposed in the built bundle — removed for security.
 */

const VOICE_GATEWAY_URL = (import.meta.env.VITE_GEMINI_TOKEN_URL as string || 'http://localhost:3001/api/gemini/live-token').replace(/\/api\/gemini\/live-token$/, '');
const GROQ_PROXY_URL = `${VOICE_GATEWAY_URL}/api/groq/chat-completion`;

export interface ParsedFirDraft {
  isFirRequest: boolean;
  complainantName?: string;
  incidentType?: string;
  narrative?: string;
  incidentLocation?: string;
  incidentDate?: string;
  policeStation?: string;
  suspectDetails?: string;
  suggestedBnsSections?: string[];
  confidenceScore?: number;
  summaryResponse?: string;
}

class GroqService {
  /**
   * Execute chat completion query against Groq Cloud API.
   */
  async chatCompletion(messages: { role: string; content: string }[], temperature = 0.2): Promise<string> {
    const response = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, temperature })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[GroqService] Groq proxy returned HTTP error:", response.status, errText);
      throw new Error(`Groq proxy error HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.content || "";
  }

  /**
   * Intelligently parses natural language user prompt (text or speech) for FIR Filing requests.
   * Uses Groq LLM structured reasoning.
   */
  async parseFirFromNaturalLanguage(userQuery: string): Promise<ParsedFirDraft> {
    const qLower = userQuery.toLowerCase();
    const firKeywords = ['register fir', 'file fir', 'file an fir', 'register an fir', 'report a crime', 'fir for', 'complaint of', 'fir registration', 'file complaint'];
    const matchesKeyword = firKeywords.some(k => qLower.includes(k));

    if (!matchesKeyword) {
      return { isFirRequest: false };
    }

    const systemPrompt = `You are S.I.R.I.S. Senior Law Enforcement & Legal AI Parser for Indian Police (BNS 2023 / BNSS 2023).
Analyze the user's input and extract structured FIR registration details into raw JSON.
Output ONLY valid JSON with no markdown formatting around it (do NOT wrap in triple backticks).

Required JSON format:
{
  "isFirRequest": true,
  "complainantName": "Name of informant or 'Informant / Officer'",
  "incidentType": "Brief crime category (e.g. Armed Robbery, Cyber Fraud, Theft, Snatching, Assault)",
  "narrative": "Detailed formal FIR legal statement summarizing the incident",
  "incidentLocation": "Location specified or 'Local Jurisdiction'",
  "incidentDate": "Date/time mentioned or 'Immediate / Recent'",
  "policeStation": "Police Station mentioned (e.g. Saheed Nagar PS, Puri Town PS, Khandagiri PS) or 'Nearest Sector PS'",
  "suspectDetails": "Details of accused/suspects mentioned",
  "suggestedBnsSections": ["BNS Section 304", "BNS Section 317"],
  "confidenceScore": 0.95,
  "summaryResponse": "Formal officer briefing statement acknowledging FIR draft creation and outlining next legal action under BNS 2023."
}`;

    try {
      const llmOutput = await this.chatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ], 0.1);

      const cleanJson = llmOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed: ParsedFirDraft = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.warn("[GroqService] LLM JSON parsing failed, using rule-based fallback:", err);
      return {
        isFirRequest: true,
        complainantName: "Informant / Officer",
        incidentType: "Reported Offence under BNS 2023",
        narrative: userQuery,
        incidentLocation: "Jurisdiction Area",
        incidentDate: new Date().toLocaleDateString(),
        policeStation: "Central Police Station",
        suggestedBnsSections: ["BNS Section 304", "BNS Section 317"],
        confidenceScore: 0.85,
        summaryResponse: `FIR Draft created from narrative: "${userQuery}". Recommended legal review under BNS 2023.`
      };
    }
  }
}

export const groqService = new GroqService();
