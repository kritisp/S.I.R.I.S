package com.crimelens.ml;

import com.crimelens.entities.ExtractedEntity;
import java.util.List;

public interface MlClientInterface {
    String chatResponse(String userMessage, String language);
    String generateFirDraft(String sourceContent, String language);
    String transcribeVoice(byte[] audioData);
    List<ExtractedEntity> extractEntities(String text);
}
