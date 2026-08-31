import sys
import os
import io
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.legal_assistant import LegalIntelligenceAssistant
from rag.fir_intelligence_pipeline import FIRIntelligencePipeline

# Initialize FastAPI App
app = FastAPI(
    title="CrimeLens AI FIR Intelligence API",
    description="Comprehensive Legal & Investigation Intelligence API powering BNS/BNSS statutory RAG, case-specific FIR analysis, and AI-driven investigation planning.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Header

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "crimelens-internal-secret-key-2026")


def verify_internal_api_key(x_internal_api_key: Optional[str] = Header(None)):
    """Enforces service-to-service authentication between Spring Boot Core and FastAPI."""
    expected_key = os.getenv("INTERNAL_API_KEY", "crimelens-internal-secret-key-2026")
    if expected_key and x_internal_api_key != expected_key:
        print(f"[API Security Warning] Unauthorized internal API key attempt: '{x_internal_api_key}'")
        raise HTTPException(status_code=401, detail="Invalid or missing X-Internal-API-Key header.")


# Singletons (Lazy Loaded)
assistant_instance: Optional[LegalIntelligenceAssistant] = None
fir_pipeline_instance: Optional[FIRIntelligencePipeline] = None


def get_assistant() -> LegalIntelligenceAssistant:
    global assistant_instance
    if assistant_instance is None:
        print("[API Server] Initializing LegalIntelligenceAssistant singleton...")
        assistant_instance = LegalIntelligenceAssistant()
    return assistant_instance


def get_fir_pipeline() -> FIRIntelligencePipeline:
    global fir_pipeline_instance
    if fir_pipeline_instance is None:
        print("[API Server] Initializing FIRIntelligencePipeline singleton...")
        fir_pipeline_instance = FIRIntelligencePipeline()
    return fir_pipeline_instance


# -----------------------------------------------------------------------------
# Pydantic Schemas for Legacy /analyze-case Endpoint
# -----------------------------------------------------------------------------
class CaseRequest(BaseModel):
    case_description: str = Field(
        ...,
        description="Factual incident report or narrative of the crime submitted for legal intelligence analysis.",
        example="Someone entered my house at night and stole my jewellery"
    )


class PossibleOffence(BaseModel):
    law: str = Field(..., example="BNS")
    section: str = Field(..., example="Section 303")
    title: str = Field(..., example="Theft in a dwelling house, or means of transportation...")
    reason: str = Field(..., example="Fully satisfied statutory ingredients...")
    confidence: str = Field(..., example="HIGH")
    confidence_reason: str = Field(..., example="All mandatory legal elements matched: movable property, dishonest intention, dwelling entry")


class ProceduralAction(BaseModel):
    law: str = Field(..., example="BNSS")
    section: str = Field(..., example="Section 185")
    action: str = Field(..., example="Execute search of premises by police officer during investigation under BNSS Section 185.")


class InvestigationPlanItem(BaseModel):
    stage: str = Field(..., example="Crime Scene Examination")
    action: str = Field(..., example="Inspect entry and exit points of the premises...")
    purpose: str = Field(..., example="Identify method of entry, forced entry marks...")
    evidence_generated: str = Field(..., example="Scene photographs, tool mark impressions...")


class CaseAnalysisResponse(BaseModel):
    case_summary: str
    primary_offence: Optional[PossibleOffence] = None
    secondary_offences: Optional[List[PossibleOffence]] = []
    alternative_offences: Optional[List[PossibleOffence]] = []
    possible_offences: List[PossibleOffence]
    procedural_actions: List[ProceduralAction]
    investigation_plan: List[InvestigationPlanItem]
    evidence_required: List[str]
    missing_information: List[str]
    sources: List[str]




# -----------------------------------------------------------------------------
# Health Check Endpoint
# -----------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root_health():
    """Root health check endpoint."""
    return {
        "status": "online",
        "service": "CrimeLens AI FIR Intelligence API",
        "version": "2.0.0",
        "docs": "/docs"
    }


# -----------------------------------------------------------------------------
# Legacy Case Analysis Endpoint
# -----------------------------------------------------------------------------
@app.post("/analyze-case", response_model=CaseAnalysisResponse, tags=["Legal Intelligence"])
def analyze_case(request: CaseRequest):
    """
    Analyzes crime narrative through BNS/BNSS/SOP RAG pipeline and returns structured intelligence JSON.
    """
    if not request.case_description or not request.case_description.strip():
        raise HTTPException(status_code=400, detail="Case description cannot be empty.")

    try:
        assistant = get_assistant()
        result = assistant.process_case(request.case_description)
        return result
    except Exception as e:
        print(f"[API Server Error] Pipeline execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Legal Intelligence Pipeline Error: {str(e)}")


# -----------------------------------------------------------------------------
# Primary FIR Intelligence Endpoint: /process-fir
# -----------------------------------------------------------------------------
@app.post("/process-fir", tags=["FIR Intelligence"])
async def process_fir_endpoint(
    fir_text: Optional[str] = Form(None, description="Raw or formal FIR incident text narrative. Provide this OR upload a file."),
    file: Optional[UploadFile] = File(None, description="FIR document as PDF or plain-text file (.pdf / .txt)."),
    x_internal_api_key: Optional[str] = Header(None)
):
    verify_internal_api_key(x_internal_api_key)
    """
    Primary CrimeLens FIR Intelligence Pipeline Endpoint.

    Accepts either:
    - **fir_text** form field: plain FIR text pasted directly
    - **file** upload: FIR document as PDF (.pdf) or text (.txt)

    Returns complete structured FIR Intelligence JSON including:
    - `fir_metadata`: Police Station, FIR No, Date, cited sections
    - `summary`: Factual legal overview
    - `crime_type` & `crime_category`: Domain categorization
    - `incident`: Location, occurrence timeline, alleged acts
    - `entities`: Complainant, accused, witnesses, weapons, property, vehicles, phones
    - `timeline`: Sequence of events
    - `modus_operandi`: MO patterns
    - `bns_sections`: Verified BNS substantive offences with supporting FIR evidence
    - `bnss_procedural_actions`: Procedural statutory steps
    - `investigation_actions`: Case-specific prioritized next steps (action + priority + reason + supporting facts)
    - `investigation_intelligence`: Priority level, checklist, and timelines
    - `insights`: Evidence-grounded analytical inferences
    - `missing_information`: Critical missing facts
    - `masking_used`: Boolean indicating whether cloud PII masking was activated
    """
    # 1. Determine input source
    target_input: Union[str, bytes] = ""
    source_name: str = "raw_input"

    # Case A: File upload (PDF / Text)
    if file is not None:
        filename = file.filename or "uploaded_file"
        content_type = file.content_type or ""

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if filename.lower().endswith(".pdf") or "pdf" in content_type.lower():
            target_input = file_bytes
            source_name = filename
        elif filename.lower().endswith((".txt", ".json", ".log")) or "text" in content_type.lower():
            try:
                target_input = file_bytes.decode("utf-8", errors="replace")
                source_name = filename
            except Exception:
                raise HTTPException(status_code=400, detail="Unable to decode uploaded text file.")
        else:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{filename}'. Please upload a PDF (.pdf) or text (.txt) document."
            )

    # Case B: Form text field
    elif fir_text is not None and fir_text.strip():
        target_input = fir_text.strip()
        source_name = "form_text"

    else:
        raise HTTPException(
            status_code=400,
            detail="Missing FIR input. Provide 'fir_text' as a form field or upload an FIR PDF/TXT document."
        )

    # Validate that text input is not empty/whitespace
    if isinstance(target_input, str) and not target_input.strip():
        raise HTTPException(status_code=400, detail="FIR text content cannot be empty.")

    # 2. Execute FIR Intelligence Pipeline
    try:
        pipeline = get_fir_pipeline()
        result = pipeline.process_fir(target_input, source_name=source_name)
        return result
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail=str(fnf_err))
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=f"Invalid FIR Input: {str(val_err)}")
    except Exception as e:
        print(f"[API Server Error] FIR Pipeline execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"FIR Intelligence Pipeline Error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=False)
