import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.postgres import get_db

router = APIRouter()

class CreateRequestPayload(BaseModel):
    targetCaseId: str
    reason: str

# In-memory + DB backed access requests
IN_MEMORY_REQUESTS = [
    {
        'id': 'REQ-2026-001',
        'targetCaseId': 'FIR-2026-BBSR_001-014',
        'requestingOfficerId': 'USR-001',
        'requestingOfficerName': 'SI Ranjan Samal',
        'requestingStationId': 'OP-BBSR-CAP',
        'targetStationId': 'OP-BBSR-KHD',
        'reason': 'Correlated suspect phone +91-9199370000 active in commercial burglary network.',
        'status': 'APPROVED',
        'createdAt': '2026-09-01T10:00:00Z',
        'reviewedAt': '2026-09-01T11:30:00Z',
        'reviewedBy': 'Inspector Ramesh (IIC)',
        'reviewNotes': 'Section 91 CrPC requisition verified and sanctioned.'
    },
    {
        'id': 'REQ-2026-002',
        'targetCaseId': 'FIR-2026-BBSR_001-067',
        'requestingOfficerId': 'USR-001',
        'requestingOfficerName': 'SI Ranjan Samal',
        'requestingStationId': 'OP-BBSR-CAP',
        'targetStationId': 'OP-CTC-PUR',
        'reason': 'Shared getaway vehicle OD-02-AB-1234 registered across jurisdiction boundaries.',
        'status': 'PENDING',
        'createdAt': '2026-09-02T14:15:00Z',
        'reviewedAt': None,
        'reviewedBy': None,
        'reviewNotes': None
    }
]

@router.get('/incoming', summary='Fetch incoming Section 91 CrPC requests for station review')
def get_incoming_requests() -> List[Dict[str, Any]]:
    return IN_MEMORY_REQUESTS

@router.get('/outgoing', summary='Fetch outgoing Section 91 CrPC requests initiated by officer')
def get_outgoing_requests() -> List[Dict[str, Any]]:
    return IN_MEMORY_REQUESTS

@router.post('', summary='Create Section 91 CrPC cross-jurisdiction access requisition')
def create_request(payload: CreateRequestPayload) -> Dict[str, Any]:
    new_req = {
        'id': f'REQ-2026-{uuid.uuid4().hex[:4].upper()}',
        'targetCaseId': payload.targetCaseId,
        'requestingOfficerId': 'USR-001',
        'requestingOfficerName': 'SI Ranjan Samal',
        'requestingStationId': 'OP-BBSR-CAP',
        'targetStationId': 'OD-STATEWIDE-GRID',
        'reason': payload.reason,
        'status': 'PENDING',
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'reviewedAt': None,
        'reviewedBy': None,
        'reviewNotes': None
    }
    IN_MEMORY_REQUESTS.insert(0, new_req)
    return new_req

@router.patch('/{request_id}/approve', summary='Approve Section 91 requisition')
def approve_request(request_id: str) -> Dict[str, Any]:
    for r in IN_MEMORY_REQUESTS:
        if r['id'] == request_id:
            r['status'] = 'APPROVED'
            r['reviewedAt'] = datetime.now(timezone.utc).isoformat()
            r['reviewedBy'] = 'Inspector Ramesh (IIC)'
            r['reviewNotes'] = 'Formal statutory clearance granted under Sec 91 CrPC.'
            return r
    raise HTTPException(status_code=404, detail='Requisition not found')

@router.patch('/{request_id}/reject', summary='Reject Section 91 requisition')
def reject_request(request_id: str) -> Dict[str, Any]:
    for r in IN_MEMORY_REQUESTS:
        if r['id'] == request_id:
            r['status'] = 'REJECTED'
            r['reviewedAt'] = datetime.now(timezone.utc).isoformat()
            r['reviewedBy'] = 'Inspector Ramesh (IIC)'
            r['reviewNotes'] = 'Requisition dismissed due to insufficient statutory basis.'
            return r
    raise HTTPException(status_code=404, detail='Requisition not found')
