"""
AIRA Local AI FastAPI Query & Action Endpoints — Phase 7.2
Handles general text queries, grounded case queries, and fast-path operational actions.
"""

import time
import re
from fastapi import APIRouter, Depends, HTTPException, status

from .schemas import (
    QueryRequest,
    QueryResponse,
    QueryLatencyBreakdown,
    CaseQueryRequest,
    CaseQueryResponse,
    ActionRequest,
    ActionResponse,
)
from .deps import get_gateway, get_retriever, get_llm
from ..gateway import LocalGateway, IntentResult
from ..retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult
from ..llm import LocalLLM, LLMResult

router = APIRouter(tags=["Text Query & Operational Actions"])

SYSTEM_PROMPT = (
    "You are AIRA, a local police investigation assistant. "
    "Answer clearly and concisely in 2 to 3 short sentences. "
    "Base your answer strictly on the verified CrimeLens records provided. "
    "If a record or detail is missing, state clearly that it is not available. "
    "Do not invent facts or case details. Avoid markdown asterisks, bullets, or headers."
)


# -----------------------------------------------------------------------------
# ENDPOINT 1: POST /api/query (General Text Query: Action or Conversational)
# -----------------------------------------------------------------------------
@router.post(
    "/query",
    response_model=QueryResponse,
    summary="General Text Query (Action or Conversational)",
)
async def handle_text_query(
    request: QueryRequest,
    gateway: LocalGateway = Depends(get_gateway),
    retriever: CrimeLensRetriever = Depends(get_retriever),
    llm: LocalLLM = Depends(get_llm),
):
    """
    Accept a text query and route through LocalGateway:
    - If Action (e.g. 'Open FIR 212'): returns action parameters immediately (LLM/TTS bypassed).
    - If Conversational: grounds with CrimeLens SQLite when applicable and generates response via Llama 3.2.
    """
    query_text = request.get_query_text()

    # 1. Gateway routing
    intent_res: IntentResult = gateway.route(query_text)

    if intent_res.mode == "ACTION":
        return QueryResponse(
            success=True,
            mode="ACTION",
            intent=intent_res.intent,
            parameters=intent_res.parameters,
            response=f"[ACTION TRIGGERED] {intent_res.intent}",
            grounded=False,
            records_retrieved=0,
            dispatch_latency_ms=round(intent_res.latency_ms, 3),
            latency_ms=QueryLatencyBreakdown(
                gateway=round(intent_res.latency_ms, 3),
                retrieval=0.0,
                llm_first_token=0.0,
                llm_total=0.0,
            ),
        )

    # 2. Conversational / LLM path
    retrieval_ms = 0.0
    records_count = 0
    grounded = False
    prompt_with_context = query_text

    if intent_res.retrieval_request:
        req = intent_res.retrieval_request
        t_ret_start = time.perf_counter()
        ret_res: RetrievalResult = retriever.retrieve(req)
        retrieval_ms = (time.perf_counter() - t_ret_start) * 1000.0
        records_count = ret_res.raw_records_count
        grounded = ret_res.success or ("NOT FOUND" in ret_res.formatted_context)

        if ret_res.formatted_context:
            prompt_with_context = f"{ret_res.formatted_context}\n\nUser Question: {query_text}"

    # 3. LLM Generation
    try:
        llm_res: LLMResult = llm.generate(
            prompt=prompt_with_context,
            system_prompt=SYSTEM_PROMPT,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Local LLM service error: {e}",
        )

    return QueryResponse(
        success=True,
        mode="LLM",
        intent=intent_res.intent,
        parameters=intent_res.parameters,
        response=llm_res.text,
        grounded=grounded,
        records_retrieved=records_count,
        dispatch_latency_ms=None,
        latency_ms=QueryLatencyBreakdown(
            gateway=round(intent_res.latency_ms, 3),
            retrieval=round(retrieval_ms, 2) if records_count > 0 or grounded else None,
            llm_first_token=round(llm_res.first_chunk_latency_ms, 1),
            llm_total=round(llm_res.total_generation_latency_ms, 1),
        ),
    )


# -----------------------------------------------------------------------------
# ENDPOINT 2: POST /api/query/case (Explicit Grounded Case Query)
# -----------------------------------------------------------------------------
@router.post(
    "/query/case",
    response_model=CaseQueryResponse,
    summary="Explicit Grounded Case / FIR Query",
)
async def handle_case_query(
    request: CaseQueryRequest,
    retriever: CrimeLensRetriever = Depends(get_retriever),
    llm: LocalLLM = Depends(get_llm),
):
    """
    Perform a deterministic grounded FIR/case query against CrimeLens SQLite database.
    Does not allow SQL generation. If case is missing, cleanly reports not found without hallucinating.
    """
    raw_input = request.get_identifier()
    
    # Extract FIR identifier digits or code (e.g. '541' from 'Tell me about FIR 541')
    match = re.search(r'(?:fir[\s\-_:]*)?(\d+)', raw_input, re.IGNORECASE)
    case_id = match.group(1) if match else raw_input

    req = RetrievalRequest(
        resource="case",
        operation="get_case",
        identifier=case_id,
    )

    t_ret_start = time.perf_counter()
    ret_res: RetrievalResult = retriever.retrieve(req)
    ret_latency_ms = (time.perf_counter() - t_ret_start) * 1000.0

    prompt_with_context = f"{ret_res.formatted_context}\n\nUser Question: {raw_input}"

    try:
        llm_res: LLMResult = llm.generate(
            prompt=prompt_with_context,
            system_prompt=SYSTEM_PROMPT,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Local LLM service error: {e}",
        )

    return CaseQueryResponse(
        success=True,
        case_id=case_id,
        found=ret_res.success,
        grounded=ret_res.success,
        response=llm_res.text,
        data=ret_res.data if ret_res.success else None,
        retrieval_latency_ms=round(ret_latency_ms, 2),
        llm_first_token_ms=round(llm_res.first_chunk_latency_ms, 1),
        llm_total_ms=round(llm_res.total_generation_latency_ms, 1),
    )


# -----------------------------------------------------------------------------
# ENDPOINT 3: POST /api/action (Fast-Path Deterministic Action Router)
# -----------------------------------------------------------------------------
@router.post(
    "/action",
    response_model=ActionResponse,
    summary="Fast-Path Operational Command Router",
)
async def handle_operational_action(
    request: ActionRequest,
    gateway: LocalGateway = Depends(get_gateway),
):
    """
    Direct deterministic action router.
    Evaluates commands (e.g. 'Open FIR 212') in sub-millisecond, bypassing LLM, TTS, and DB.
    """
    action_text = request.get_action_text()
    intent_res: IntentResult = gateway.route(action_text)

    return ActionResponse(
        success=True,
        mode=intent_res.mode,
        intent=intent_res.intent,
        parameters=intent_res.parameters,
        confidence=intent_res.confidence,
        dispatch_latency_ms=round(intent_res.latency_ms, 3),
    )
