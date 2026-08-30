package com.crimelens.intelligence.ml.mock;

import com.crimelens.intelligence.entity.ExtractedEntity;
import com.crimelens.intelligence.entity.enums.EntityType;
import com.crimelens.intelligence.ml.MlClientInterface;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class MockMlClient implements MlClientInterface {

    @Override
    public String chatResponse(String userMessage, String language) {
        String lang = language != null ? language.toLowerCase() : "en";
        if (userMessage == null || userMessage.isBlank()) {
            return "How can I assist you in your investigation today?";
        }

        if (userMessage.toLowerCase().contains("legal") || userMessage.toLowerCase().contains("provision") || userMessage.toLowerCase().contains("bns")) {
            if ("or".equals(lang) || "hi".equals(lang)) {
                return "ଆଇନଗତ ପରାମର୍ଶ: BNS Section 303 (ଚୋରି) ଏବଂ Section 305 (ଲୁଟ୍) ଏହି ମାମଲା ପାଇଁ ଲାଗୁ ହୋଇପାରେ।";
            }
            return "Legal provision suggestion: Under BNS Section 303 (Theft) and Section 305 (Snatching), the evidence extracted matches the criteria for filing a charge sheet within 90 days.";
        }

        if ("or".equals(lang)) {
            return "ମୁଁ ଅନୁସନ୍ଧାନ ସହାୟକ ଅଟେ। ମୁଁ ଆପଣଙ୍କୁ ଚାର୍ଜସିଟ୍ ଡ୍ରାଫ୍ଟ ଏବଂ ଆଇନଗତ ବିଶ୍ଳେଷଣରେ ସାହାଯ୍ୟ କରିପାରିବି।";
        }
        return "I have analyzed the current dossier. Let me know if you would like me to draft a chargesheet, analyze suspects call detail records (CDR), or look up specific provisions under the Bharatiya Nyaya Sanhita (BNS).";
    }

    @Override
    public String generateFirDraft(String sourceContent, String language) {
        String lang = language != null ? language.toLowerCase() : "en";
        if ("or".equals(lang)) {
            return "ପ୍ରଥମ ସୂଚନା ରିପୋର୍ଟ (FIR) ଡ୍ରାଫ୍ଟ:\n\n" +
                   "ଥାନା: କଣ୍ଡଗିରି, ଭୁବନେଶ୍ୱର\n" +
                   "ଘଟଣା: ଚୋରି ଏବଂ ମାରପିଟ୍\n" +
                   "ବିବରଣୀ: ଅଭିଯୋଗକାରୀଙ୍କ ଘରୁ ନାଇଟ୍ ଟାଇମରେ ସୁନା ଅଳଙ୍କାର ଚୋରି ହୋଇଛି। BNS Section 303, 331 ଲାଗୁ କରାଯାଉ।";
        }
        return "FIRST INFORMATION REPORT (FIR) DRAFT\n" +
               "-------------------------------------\n" +
               "POLICE STATION: Khandagiri Police Station, Bhubaneswar\n" +
               "SECTIONS APPLIED: BNS Section 303 (Theft in dwelling house), Section 331 (House-trespass)\n" +
               "INCIDENT SUMMARY:\n" +
               "On the night of August 25, 2026, entry was forced through the rear balcony. " +
               "Unidentified suspects stole gold valuables and escaped. Getaway vehicle reported as white commercial van.\n\n" +
               "Draft generated successfully. Ready for officer verification and signature.";
    }

    @Override
    public String transcribeVoice(byte[] audioData) {
        return "Register a new FIR for burglary at Khandagiri involving a white van and phone number 9876543210.";
    }

    @Override
    public List<ExtractedEntity> extractEntities(String text) {
        List<ExtractedEntity> entities = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return entities;
        }
        String lower = text.toLowerCase();
        if (lower.contains("van") || lower.contains("motorcycle")) {
            entities.add(new ExtractedEntity(EntityType.VEHICLE, "White Commercial Van"));
        }
        if (lower.contains("khandagiri") || lower.contains("bbsr") || lower.contains("cuttack")) {
            entities.add(new ExtractedEntity(EntityType.LOCATION, "Khandagiri, Bhubaneswar"));
        }
        if (lower.contains("ramesh") || lower.contains("priyadarshi")) {
            entities.add(new ExtractedEntity(EntityType.PERSON, "Ramesh (Suspect)"));
        }
        if (lower.contains("9876543210")) {
            entities.add(new ExtractedEntity(EntityType.PHONE, "+91-9876543210"));
        }
        return entities;
    }

    @Override
    public com.crimelens.workspace.entity.WorkspaceIntelligenceResult analyzeWorkspace(
            com.crimelens.workspace.entity.InvestigationWorkspace workspace,
            List<com.crimelens.casefile.entity.CaseRecord> cases,
            List<String> scopes) {
        
        int caseCount = cases != null ? cases.size() : 0;
        int relationships = Math.max(1, caseCount * 3 + 2);
        int patterns = Math.max(1, caseCount + 1);
        int nodes = Math.max(2, caseCount * 5 + 4);

        String summary = "S.I.R.I.S. Mock Intelligence Engine successfully analyzed workspace '" + 
                         (workspace != null ? workspace.getTitle() : "Workspace") + "'. Synthesized " + 
                         relationships + " cross-case relationships and " + patterns + 
                         " crime MO patterns across " + caseCount + " linked case records.";

        String payloadJson = "{" +
                "\"confidenceScore\": 94.5," +
                "\"casesAnalyzed\":" + caseCount + "," +
                "\"scopes\":" + (scopes != null ? scopes.toString() : "[]") + "," +
                "\"relationshipsFound\":" + relationships + "," +
                "\"patternsDetected\":" + patterns + "," +
                "\"recommendations\":[\"Correlate CDR logs for shared mobile numbers\",\"Issue cross-station alert for matching getaway vehicle\",\"Request additional forensic evidence for weapon MO\"]" +
                "}";

        return new com.crimelens.workspace.entity.WorkspaceIntelligenceResult(
                "RES-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                null,
                workspace,
                "COMPLETED",
                summary,
                relationships,
                patterns,
                nodes,
                payloadJson
        );
    }
}
