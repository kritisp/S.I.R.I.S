"""
AIRA Local AI FastAPI CrimeLens Case Retrieval Router — Phase 7.1
Direct read-only investigation data retrieval from authoritative CrimeLens SQLite storage.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from .schemas import CaseResponse
from .deps import get_retriever
from ..retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult

router = APIRouter(prefix="/cases", tags=["CrimeLens Case Data"])


@router.get("/{fir_number}", response_model=CaseResponse, summary="Retrieve Verified Case Proforma & Linked Records")
async def get_case_by_fir(
    fir_number: str,
    retriever: CrimeLensRetriever = Depends(get_retriever),
):
    """
    Retrieve structured case proforma, evidence, entities, and legal provisions for a specific FIR.
    Guarantees 100% read-only access (PRAGMA query_only = ON).
    """
    clean_fir = fir_number.strip()
    if not clean_fir:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="FIR identifier cannot be empty.",
        )

    req = RetrievalRequest(
        resource="case",
        operation="get_case",
        identifier=clean_fir,
    )

    ret_res: RetrievalResult = retriever.retrieve(req)

    if not ret_res.success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"FIR '{clean_fir}' was not found in the CrimeLens database.",
        )

    return CaseResponse(
        found=True,
        fir_number=clean_fir,
        data=ret_res.data,
        formatted_context=ret_res.formatted_context,
        error=None,
        retrieval_latency_ms=round(ret_res.retrieval_latency_ms, 3),
    )
