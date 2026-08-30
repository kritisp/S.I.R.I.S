"""
AIRA Local AI FastAPI Pydantic Schemas — Phase 7.2
Typed data contracts for health, text query, case query, action dispatch, voice query, and in-memory TTS.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, model_validator


# -----------------------------------------------------------------------------
# Health & Diagnostics Schemas
# -----------------------------------------------------------------------------
class HealthResponse(BaseModel):
    """Health check response payload."""
    status: str = Field(default="ok", description="Service health state")
    service: str = Field(default="local-ai", description="Service identifier")
    timestamp: float = Field(..., description="UNIX timestamp of health query")


class EnvironmentInfo(BaseModel):
    """Runtime environment hardware and database availability."""
    cuda_available: bool = Field(..., description="Whether NVIDIA CUDA is available")
    gpu_name: Optional[str] = Field(None, description="Active GPU device name")
    database_accessible: bool = Field(..., description="Whether CrimeLens SQLite database is accessible")
    database_path: Optional[str] = Field(None, description="Authoritative database path")


class StatusResponse(BaseModel):
    """System status and component availability payload."""
    status: str = Field(default="ready", description="Overall system operational status")
    service: str = Field(default="local-ai", description="Service identifier")
    api: str = Field(default="fastapi", description="API framework identifier")
    version: str = Field(default="1.0.0", description="API release version")
    environment: EnvironmentInfo = Field(..., description="Environment hardware and storage status")


class RootResponse(BaseModel):
    """API root greeting payload."""
    service: str = Field(default="AIRA Local AI API", description="Service name")
    status: str = Field(default="running", description="API execution status")
    version: str = Field(default="1.0.0", description="API release version")
    docs_url: str = Field(default="/docs", description="Interactive Swagger documentation endpoint")


class ErrorResponse(BaseModel):
    """Standardized API error response format."""
    error: str = Field(..., description="Error classification")
    message: str = Field(..., description="Human-readable error description")
    status_code: int = Field(..., description="HTTP status code")


# -----------------------------------------------------------------------------
# Text Query Schemas (Phase 7.2)
# -----------------------------------------------------------------------------
class QueryRequest(BaseModel):
    """General text query request supporting 'query' or 'text' keys."""
    query: Optional[str] = Field(None, description="User query prompt", examples=["Tell me about FIR 541"])
    text: Optional[str] = Field(None, description="Alternative user query prompt", examples=["Open FIR 212"])

    def get_query_text(self) -> str:
        """Extract query string from either 'query' or 'text'."""
        val = self.query or self.text
        return val.strip() if val else ""

    @model_validator(mode="after")
    def check_non_empty(self):
        if not self.get_query_text():
            raise ValueError("Either 'query' or 'text' must be provided and non-empty.")
        return self


class QueryLatencyBreakdown(BaseModel):
    """Latency breakdown for conversational query execution."""
    gateway: float = Field(..., description="Intent routing latency in milliseconds")
    retrieval: Optional[float] = Field(None, description="Database retrieval latency in milliseconds")
    llm_first_token: Optional[float] = Field(None, description="LLM first token latency in milliseconds")
    llm_total: Optional[float] = Field(None, description="Total LLM generation latency in milliseconds")


# Alias for backward compatibility
QueryLatencyMetrics = QueryLatencyBreakdown


class QueryResponse(BaseModel):
    """Structured response for general text queries (conversational or action)."""
    success: bool = Field(default=True, description="Query execution status")
    mode: str = Field(..., description="Execution mode: 'LLM' or 'ACTION'")
    intent: str = Field(..., description="Detected intent classification")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Extracted parameters")
    response: Optional[str] = Field(None, description="Generated answer or action description")
    grounded: bool = Field(default=False, description="Whether response was grounded in CrimeLens database")
    records_retrieved: int = Field(default=0, description="Count of database records retrieved for context")
    dispatch_latency_ms: Optional[float] = Field(None, description="Action dispatch latency in milliseconds")
    latency_ms: Optional[QueryLatencyBreakdown] = Field(None, description="Latency measurements")


# -----------------------------------------------------------------------------
# Grounded Case Query Schemas (Phase 7.2)
# -----------------------------------------------------------------------------
class CaseQueryRequest(BaseModel):
    """Explicit grounded case query request."""
    query: Optional[str] = Field(None, description="Natural language question about a case", examples=["Tell me about FIR 541"])
    case_id: Optional[str] = Field(None, description="Explicit FIR identifier", examples=["541", "FIR-2026-00541"])

    def get_identifier(self) -> str:
        """Extract FIR or query string."""
        return (self.case_id or self.query or "").strip()

    @model_validator(mode="after")
    def check_non_empty(self):
        if not self.get_identifier():
            raise ValueError("Either 'query' or 'case_id' must be provided.")
        return self


class CaseQueryResponse(BaseModel):
    """Structured response for grounded case queries."""
    success: bool = Field(default=True, description="Query execution status")
    case_id: Optional[str] = Field(None, description="Detected or requested FIR identifier")
    found: bool = Field(default=True, description="Whether case exists in database")
    grounded: bool = Field(default=True, description="Whether response is grounded in database facts")
    response: str = Field(..., description="Grounded investigation response or clean not-found message")
    data: Optional[Dict[str, Any]] = Field(None, description="Raw structured case data if found")
    retrieval_latency_ms: float = Field(..., description="Database query latency in milliseconds")
    llm_first_token_ms: Optional[float] = Field(None, description="LLM first token latency in milliseconds")
    llm_total_ms: Optional[float] = Field(None, description="Total LLM generation latency in milliseconds")


# -----------------------------------------------------------------------------
# Operational Action Schemas (Phase 7.2)
# -----------------------------------------------------------------------------
class ActionRequest(BaseModel):
    """Deterministic operational command request."""
    query: Optional[str] = Field(None, description="Command string", examples=["Open FIR 212"])
    text: Optional[str] = Field(None, description="Alternative command string", examples=["Open Evidence Vault"])

    def get_action_text(self) -> str:
        val = self.query or self.text
        return val.strip() if val else ""

    @model_validator(mode="after")
    def check_non_empty(self):
        if not self.get_action_text():
            raise ValueError("Either 'query' or 'text' must be provided.")
        return self


class ActionResponse(BaseModel):
    """Fast-path deterministic action routing response."""
    success: bool = Field(default=True, description="Action dispatch status")
    mode: str = Field(default="ACTION", description="Routing mode")
    intent: str = Field(..., description="Identified operational intent")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Extracted action parameters")
    confidence: float = Field(default=0.98, description="Intent classification confidence (0.0 - 1.0)")
    dispatch_latency_ms: float = Field(..., description="Sub-millisecond routing latency in milliseconds")


# -----------------------------------------------------------------------------
# Voice Query Schemas (Phase 7.2)
# -----------------------------------------------------------------------------
class VoiceQueryResponse(BaseModel):
    """Structured response for uploaded audio voice queries."""
    success: bool = Field(default=True, description="Voice query processing status")
    transcript: str = Field(..., description="Transcribed speech from uploaded audio")
    mode: str = Field(..., description="Execution mode: 'LLM' or 'ACTION'")
    intent: str = Field(..., description="Detected intent classification")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Extracted parameters")
    response: Optional[str] = Field(None, description="AIRA answer or action message")
    grounded: bool = Field(default=False, description="Whether database grounding was applied")
    latency_ms: Dict[str, Any] = Field(..., description="Timing breakdown across STT, Gateway, Retrieval, and LLM")


# -----------------------------------------------------------------------------
# TTS Schemas (Phase 7.2)
# -----------------------------------------------------------------------------
class TTSRequest(BaseModel):
    """Text-to-speech request for in-memory WAV audio generation."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Text to synthesize using Piper into in-memory WAV audio",
        examples=["Hello officer, this is AIRA."],
    )


# -----------------------------------------------------------------------------
# Direct Case Retrieval & Turn Schemas (Backward Compatibility)
# -----------------------------------------------------------------------------
class CaseResponse(BaseModel):
    """Direct case proforma retrieval response."""
    found: bool = Field(...)
    fir_number: str = Field(...)
    data: Optional[Dict[str, Any]] = None
    formatted_context: Optional[str] = None
    error: Optional[str] = None
    retrieval_latency_ms: float = Field(...)


class VoiceTurnRequest(BaseModel):
    """Voice pipeline turn request."""
    text_input: Optional[str] = None
    play_audio: bool = False
    max_record_seconds: float = 15.0


class VoiceLatencyBreakdown(BaseModel):
    """Voice turn timing breakdown."""
    recording_duration_s: float = 0.0
    stt_ms: float = 0.0
    gateway_ms: float = 0.0
    retrieval_ms: float = 0.0
    llm_first_token_ms: float = 0.0
    tts_first_pcm_ms: float = 0.0
    speech_to_first_audio_ms: float = 0.0
    total_duration_ms: float = 0.0


class VoiceTurnResponse(BaseModel):
    """Complete voice turn response."""
    transcript: str
    response: str
    sentences: List[str] = Field(default_factory=list)
    mode: str
    intent: str
    intent_parameters: Dict[str, Any] = Field(default_factory=dict)
    grounded: bool = False
    overlap_achieved: bool = False
    timed_out: bool = False
    latencies: VoiceLatencyBreakdown
