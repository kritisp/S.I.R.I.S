package com.crimelens.intelligence.ml.client;

import com.crimelens.intelligence.dto.FirIntelligenceRequestDTO;
import com.crimelens.intelligence.dto.FirIntelligenceResponseDTO;

public interface FirIntelligenceClient {
    FirIntelligenceResponseDTO processFir(FirIntelligenceRequestDTO request);
}
