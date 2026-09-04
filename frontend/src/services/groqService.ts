/**
 * Groq LLM Cloud Reasoning Service for S.I.R.I.S.
 * Directly communicates with Groq OpenAI-compatible Chat Completions API.
 * Uses primary model: `openai/gpt-oss-120b` (or configured fallback).
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("[GroqService] Groq API returned HTTP error:", response.status, errText);
      throw new Error(`Groq API error HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
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
