"""
AIRA Local AI FastAPI AI Query & Action Router — Phase 7.1
Handles conversational text reasoning, database grounding, deterministic action routing, and token streaming.
"""

import time
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from .schemas import (
    QueryRequest,
    QueryResponse,
    QueryLatencyMetrics,
    ActionRequest,
    ActionResponse,
)
from .deps import get_gateway, get_retriever, get_llm
from ..gateway import LocalGateway, IntentResult
from ..retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult
from ..llm import LocalLLM, LLMResult

router = APIRouter(prefix="/ai", tags=["Local AI Intelligence"])

SYSTEM_PROMPT = (
    "You are AIRA, a local police investigation assistant. "
    "Answer clearly and concisely in 2 to 3 short sentences. "
    "Base your answer strictly on the verified CrimeLens records provided. "
    "If a record or detail is missing, state clearly that it is not available. "
    "Do not invent facts or case details. Avoid markdown asterisks, bullets, or headers."
)


@router.post("/action", response_model=ActionResponse, summary="Fast-Path Operational Command Router")
async def handle_action(
    request: ActionRequest,
    gateway: LocalGateway = Depends(get_gateway),
):
    """
    Sub-millisecond deterministic operational action router.
    Evaluates command text and dispatches application actions without invoking LLM, TTS, or SQLite.
    """
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Action text cannot be empty.",
        )

    intent_res: IntentResult = gateway.route(clean_text)

    return ActionResponse(
        mode=intent_res.mode,
        intent=intent_res.intent,
        parameters=intent_res.parameters,
        confidence=intent_res.confidence,
        latency_ms=round(intent_res.latency_ms, 3),
    )


@router.post("/query", response_model=QueryResponse, summary="Conversational Query & Grounded Reasoning")
async def handle_query(
    request: QueryRequest,
    gateway: LocalGateway = Depends(get_gateway),
    retriever: CrimeLensRetriever = Depends(get_retriever),
    llm: LocalLLM = Depends(get_llm),
):
    """
    Execute a conversational text query:
    1. Route through LocalGateway (Action vs Conversational).
    2. If Action: returns detected intent immediately (LLM bypassed).
    3. If Conversational: extracts case/entity mention -> queries SQLite read-only -> injects grounded context -> streams Llama 3.2.
    """
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query text cannot be empty.",
        )

    # 1. Gateway Routing
    intent_res: IntentResult = gateway.route(clean_text)

    if intent_res.mode == "ACTION":
        return QueryResponse(
            mode="ACTION",
            intent=intent_res.intent,
            parameters=intent_res.parameters,
            response=f"[ACTION TRIGGERED] {intent_res.intent}",
            grounded=False,
            records_retrieved=0,
            latency_ms=QueryLatencyMetrics(
                gateway_ms=round(intent_res.latency_ms, 3),
                retrieval_ms=0.0,
                first_token_ms=0.0,
                total_generation_ms=0.0,
            ),
        )

    # 2. Conversational Mode: Grounded Data Retrieval
    retrieval_ms = 0.0
    records_count = 0
    grounded = False
    prompt_with_context = clean_text

    if intent_res.retrieval_request:
        req = intent_res.retrieval_request
        t_ret_start = time.perf_counter()
        ret_res: RetrievalResult = retriever.retrieve(req)
        retrieval_ms = (time.perf_counter() - t_ret_start) * 1000.0
        records_count = ret_res.raw_records_count
        grounded = ret_res.success or ("NOT FOUND" in ret_res.formatted_context)

        if ret_res.formatted_context:
            prompt_with_context = f"{ret_res.formatted_context}\n\nUser Question: {clean_text}"

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
        mode="LLM",
        intent=intent_res.intent,
        parameters=intent_res.parameters,
        response=llm_res.text,
        grounded=grounded,
        records_retrieved=records_count,
        latency_ms=QueryLatencyMetrics(
            gateway_ms=round(intent_res.latency_ms, 3),
            retrieval_ms=round(retrieval_ms, 2),
            first_token_ms=round(llm_res.first_chunk_latency_ms, 1),
            total_generation_ms=round(llm_res.total_generation_latency_ms, 1),
        ),
    )


@router.post("/stream", summary="Token Streaming Conversational Query")
async def handle_stream(
    request: QueryRequest,
    gateway: LocalGateway = Depends(get_gateway),
    retriever: CrimeLensRetriever = Depends(get_retriever),
    llm: LocalLLM = Depends(get_llm),
):
    """
    Stream tokens incrementally over HTTP using chunked transfer encoding.
    """
    clean_text = request.text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query text cannot be empty.",
        )

    intent_res: IntentResult = gateway.route(clean_text)
    prompt_with_context = clean_text

    if intent_res.retrieval_request:
        ret_res = retriever.retrieve(intent_res.retrieval_request)
        if ret_res.formatted_context:
            prompt_with_context = f"{ret_res.formatted_context}\n\nUser Question: {clean_text}"

    async def token_generator() -> AsyncGenerator[str, None]:
        stream = llm.stream_response(prompt=prompt_with_context, system_prompt=SYSTEM_PROMPT)
        for token in stream:
            yield token

    return StreamingResponse(token_generator(), media_type="text/plain")
