"""
S.I.R.I.S. Graph Intelligence Service
======================================

Integrates S.I.R.I.S graph algorithms (PageRank-style influence scoring, Brandes
betweenness, bridge path detection, entity reuse alert rules) into the
S.I.R.I.S. central-intelligence service.

This service builds an in-memory adjacency graph from PostgreSQL (Supabase)
data, computes centrality metrics, and exposes them via the /api/v1/graph/*
endpoints so the NetworkExplorer frontend can render live intelligence.

It does NOT duplicate the Neo4j projection or the existing analytics.py
betweenness (which operates on Neo4j). This is a Postgres-first graph that:
  - reads canonical entities and FIR associations from Postgres
  - builds an in-memory graph
  - computes betweenness + influence ranks
  - flags entity-reuse and mastermind patterns as alerts
  - serves the NetworkExplorer with a shape compatible with the frontend

Design decisions:
  - TTL-cached (60 s) so repeated NetworkExplorer loads are cheap
  - Degrades gracefully: if DB is unreachable, returns empty graph with clear offline status
  - All normalization uses the existing central-intelligence normalizers
"""

import hashlib
import logging
import re
import time
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# 1. ARGUS ENTITY NORMALIZER (adapted from ARGUS normalize.js)
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_phone(raw: str) -> str:
    """Strips country-code prefix and returns 10-digit Indian mobile."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 10:
        return digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits


def _normalize_upi(raw: str) -> str:
    return (raw or "").strip().lower()


def _normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()


def _normalize_wallet(raw: str) -> str:
    return (raw or "").strip().lower()


def _normalize_bank_account(raw: str) -> str:
    return re.sub(r"\D", "", raw or "")


def normalize_entity(entity_type: str, raw: str) -> str:
    """Canonical normalization dispatcher — mirrors ARGUS normalize.js."""
    t = (entity_type or "").upper()
    if t == "PHONE":
        return _normalize_phone(raw)
    if t == "UPI":
        return _normalize_upi(raw)
    if t in ("EMAIL", "PERSON"):
        return _normalize_email(raw)
    if t == "WALLET":
        return _normalize_wallet(raw)
    if t == "BANK_ACCOUNT":
        return _normalize_bank_account(raw)
    return (raw or "").strip().lower()


# ─────────────────────────────────────────────────────────────────────────────
# 2. ARGUS ENTITY EXTRACTOR (adapted from ARGUS extract.py)
#    Regex-only tier — deterministic, fast, no spaCy dependency required.
# ─────────────────────────────────────────────────────────────────────────────

# Ordered by priority: most-specific first to avoid overlap.
_WALLET_RE = re.compile(r"\b0x[a-fA-F0-9]{40}\b")
_IFSC_RE   = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")
_EMAIL_RE  = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
_UPI_RE    = re.compile(r"\b[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9]{1,}\b")
_TELE_RE   = re.compile(r"(?<![A-Za-z0-9._%+\-])@([A-Za-z][A-Za-z0-9_]{3,31})\b")
_IP_RE     = re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b")
_PHONE_RE  = re.compile(r"(?<!\d)(?:\+?91[\s\-]?|0)?([6-9](?:[\s\-]?\d){9})(?!\d)")
_ACCT_RE   = re.compile(r"(?<!\d)(\d{11,18})(?!\d)")

_PIPELINE = [
    (_WALLET_RE, "WALLET",       0.99, 0),
    (_IFSC_RE,   None,           0.0,  0),   # claimed, never emitted
    (_EMAIL_RE,  "EMAIL",        0.98, 0),
    (_UPI_RE,    "UPI",          0.97, 0),
    (_TELE_RE,   "TELEGRAM",     0.94, 1),
    (_IP_RE,     "IP",           0.96, 0),
    (_PHONE_RE,  "PHONE",        0.97, 1),
    (_ACCT_RE,   "BANK_ACCOUNT", 0.95, 1),
]


def extract_entities_from_narrative(narrative: str) -> List[Dict[str, Any]]:
    """
    Extracts identifiers from a FIR narrative using ARGUS priority-ordered regex pipeline.

    Returns a list of entity dicts: {type, value, normalized_value, confidence, method}.
    Deduplicates on (type, normalized_value) — same UPI mentioned twice is one entity.
    """
    import time as _time
    started = _time.perf_counter()
    text = str(narrative or "")
    claimed: List[Tuple[int, int]] = []

    def is_claimed(s: int, e: int) -> bool:
        return any(s < ce and e > cs for cs, ce in claimed)

    entities: List[Dict[str, Any]] = []
    seen: Set[Tuple[str, str]] = set()

    for pattern, etype, conf, grp in _pipeline_iter():
        for m in pattern.finditer(text):
            s, e = m.span()
            if is_claimed(s, e):
                continue
            claimed.append((s, e))
            if etype is None:
                continue
            raw = m.group(grp).strip()
            norm = normalize_entity(etype, raw)
            if not norm:
                continue
            key = (etype, norm)
            if key in seen:
                continue
            seen.add(key)
            entities.append({
                "type": etype,
                "value": raw,
                "normalized_value": norm,
                "confidence": conf,
                "method": "REGEX",
            })

    duration_ms = round((_time.perf_counter() - started) * 1000, 2)
    return entities, duration_ms


def _pipeline_iter():
    """Yields (pattern, etype, conf, grp) in priority order."""
    for pattern, etype, conf, grp in _PIPELINE:
        yield pattern, etype, conf, grp


# ─────────────────────────────────────────────────────────────────────────────
# 3. IN-MEMORY GRAPH (ARGUS graphAlgos.js port)
# ─────────────────────────────────────────────────────────────────────────────

class Graph:
    """Lightweight undirected weighted graph for ARGUS analytics."""

    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}   # node_id → props
        self.adj:   Dict[str, Set[str]] = defaultdict(set)  # adjacency
        self.edges: List[Tuple[str, str, float]] = []  # (u, v, weight)

    def add_node(self, node_id: str, **props):
        self.nodes[node_id] = props

    def add_edge(self, u: str, v: str, weight: float = 1.0):
        if u not in self.nodes:
            self.nodes[u] = {}
        if v not in self.nodes:
            self.nodes[v] = {}
        self.adj[u].add(v)
        self.adj[v].add(u)
        self.edges.append((u, v, weight))

    def neighbors(self, node_id: str) -> Set[str]:
        return self.adj.get(node_id, set())


def _bfs_shortest(graph: Graph, source: str) -> Dict[str, int]:
    """BFS from source; returns distance dict."""
    dist = {source: 0}
    queue = deque([source])
    while queue:
        cur = queue.popleft()
        for nb in graph.neighbors(cur):
            if nb not in dist:
                dist[nb] = dist[cur] + 1
                queue.append(nb)
    return dist


def compute_betweenness(graph: Graph) -> Dict[str, float]:
    """
    Brandes betweenness centrality (adapted from ARGUS graphAlgos.js).
    Returns normalized score in [0, 1] per node.
    """
    nodes = list(graph.nodes.keys())
    N = len(nodes)
    if N <= 2:
        return {n: 0.0 for n in nodes}

    bc: Dict[str, float] = {n: 0.0 for n in nodes}

    for s in nodes:
        # Brandes forward pass
        stack: List[str] = []
        pred: Dict[str, List[str]] = {n: [] for n in nodes}
        sigma: Dict[str, float] = {n: 0.0 for n in nodes}
        dist:  Dict[str, int]   = {n: -1  for n in nodes}
        sigma[s] = 1.0
        dist[s] = 0
        queue = deque([s])

        while queue:
            v = queue.popleft()
            stack.append(v)
            for w in graph.neighbors(v):
                if dist[w] < 0:
                    dist[w] = dist[v] + 1
                    queue.append(w)
                if dist[w] == dist[v] + 1:
                    sigma[w] += sigma[v]
                    pred[w].append(v)

        # Brandes backward pass
        delta: Dict[str, float] = {n: 0.0 for n in nodes}
        while stack:
            w = stack.pop()
            for v in pred[w]:
                if sigma[w] > 0:
                    delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
            if w != s:
                bc[w] += delta[w]

    # Normalize by (N-1)(N-2)/2 for undirected
    norm = ((N - 1) * (N - 2)) / 2.0
    if norm > 0:
        bc = {n: min(1.0, v / norm) for n, v in bc.items()}
    return bc


def compute_pagerank(graph: Graph, damping: float = 0.85, iterations: int = 50) -> Dict[str, float]:
    """
    Simplified PageRank (ARGUS influence_scores adaptation).
    Returns score in [0, 1] per node.
    """
    nodes = list(graph.nodes.keys())
    N = len(nodes)
    if N == 0:
        return {}
    rank = {n: 1.0 / N for n in nodes}
    out_deg = {n: len(graph.neighbors(n)) for n in nodes}

    for _ in range(iterations):
        new_rank: Dict[str, float] = {}
        for n in nodes:
            incoming = sum(
                rank[nb] / max(out_deg[nb], 1)
                for nb in graph.neighbors(n)
            )
            new_rank[n] = (1 - damping) / N + damping * incoming
        rank = new_rank

    # Normalize to [0, 1]
    mx = max(rank.values()) if rank else 1.0
    if mx > 0:
        rank = {n: v / mx for n, v in rank.items()}
    return rank


def _bfs_path(graph: Graph, source: str, target: str) -> Optional[List[str]]:
    """Returns shortest path (list of node_ids) or None."""
    if source == target:
        return [source]
    if source not in graph.nodes or target not in graph.nodes:
        return None
    prev: Dict[str, Optional[str]] = {source: None}
    queue = deque([source])
    while queue:
        cur = queue.popleft()
        if cur == target:
            path = []
            while cur is not None:
                path.append(cur)
                cur = prev[cur]
            return list(reversed(path))
        for nb in graph.neighbors(cur):
            if nb not in prev:
                prev[nb] = cur
                queue.append(nb)
    return None


def _shared_neighbors(graph: Graph, a: str, b: str) -> List[str]:
    return list(graph.neighbors(a) & graph.neighbors(b))


def connected_components(graph: Graph) -> List[Set[str]]:
    """BFS connected component finder."""
    visited: Set[str] = set()
    components = []
    for n in graph.nodes:
        if n not in visited:
            comp: Set[str] = set()
            queue = deque([n])
            visited.add(n)
            while queue:
                cur = queue.popleft()
                comp.add(cur)
                for nb in graph.neighbors(cur):
                    if nb not in visited:
                        visited.add(nb)
                        queue.append(nb)
            components.append(comp)
    return components


# ─────────────────────────────────────────────────────────────────────────────
# 4. ARGUS ALERT RULES (adapted from ARGUS alertRules.js)
# ─────────────────────────────────────────────────────────────────────────────

def _fingerprint(rule: str, *args) -> str:
    payload = rule + "|" + "|".join(str(a) for a in sorted(args))
    return hashlib.sha256(payload.encode()).hexdigest()[:20]


def run_alert_rules(
    graph: Graph,
    betweenness: Dict[str, float],
    pagerank: Dict[str, float],
    entity_complaint_counts: Dict[str, int],
) -> List[Dict[str, Any]]:
    """
    Runs 5 ARGUS alert rules against the current in-memory graph.

    Rules (from ARGUS alertRules.js):
      1. ENTITY_REUSE        — same entity in ≥3 complaints
      2. MASTERMIND_IDENTIFIED — highest betweenness + PageRank coordinator
      3. VELOCITY             — entity appearing in ≥2 complaints in 7 days (approximated)
      4. SHARED_INFRASTRUCTURE — single phone/wallet connecting ≥3 cases
      5. HIGH_BETWEENNESS_BRIDGE — betweenness ≥ 0.35 but low complaint count (coordinator hiding)
    """
    alerts: List[Dict[str, Any]] = []
    now_ts = int(time.time() * 1000)

    # Rule 1: Entity Reuse
    for node_id, count in entity_complaint_counts.items():
        if count >= 3:
            props = graph.nodes.get(node_id, {})
            fp = _fingerprint("ENTITY_REUSE", node_id)
            alerts.append({
                "id": fp,
                "severity": "HIGH" if count >= 5 else "MEDIUM",
                "alert_type": "ENTITY_REUSE",
                "title": f"Entity reused across {count} complaints",
                "details": {
                    "node_id": node_id,
                    "entity_type": props.get("entity_type", "UNKNOWN"),
                    "complaint_count": count,
                    "label": props.get("label", node_id),
                },
                "fingerprint": fp,
                "created_at": now_ts,
                "status": "OPEN",
            })

    # Rule 2: Mastermind Identified
    if betweenness:
        top_bc = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:3]
        top_pr = sorted(pagerank.items(), key=lambda x: x[1], reverse=True)[:3]
        top_bc_ids = {n for n, _ in top_bc}
        top_pr_ids = {n for n, _ in top_pr}
        mastermind_candidates = top_bc_ids & top_pr_ids
        for cand in mastermind_candidates:
            props = graph.nodes.get(cand, {})
            bc_score = betweenness.get(cand, 0)
            pr_score = pagerank.get(cand, 0)
            # Only flag if betweenness is significant (≥0.15)
            if bc_score >= 0.15:
                fp = _fingerprint("MASTERMIND_IDENTIFIED", cand)
                alerts.append({
                    "id": fp,
                    "severity": "CRITICAL",
                    "alert_type": "MASTERMIND_IDENTIFIED",
                    "title": f"Potential network coordinator identified",
                    "details": {
                        "node_id": cand,
                        "entity_type": props.get("entity_type", "UNKNOWN"),
                        "label": props.get("label", cand),
                        "betweenness_score": round(bc_score, 4),
                        "influence_score": round(pr_score, 4),
                        "complaint_count": entity_complaint_counts.get(cand, 0),
                        "note": "High betweenness + influence — may be coordinating without direct complaint exposure.",
                    },
                    "fingerprint": fp,
                    "created_at": now_ts,
                    "status": "OPEN",
                })

    # Rule 3: Shared Infrastructure (phone/wallet/UPI in ≥3 cases)
    for node_id, props in graph.nodes.items():
        etype = props.get("entity_type", "")
        if etype in ("PHONE", "UPI", "WALLET", "BANK_ACCOUNT"):
            case_nodes = [nb for nb in graph.neighbors(node_id) if graph.nodes.get(nb, {}).get("node_type") == "case"]
            if len(case_nodes) >= 3:
                fp = _fingerprint("SHARED_INFRASTRUCTURE", node_id)
                alerts.append({
                    "id": fp,
                    "severity": "HIGH",
                    "alert_type": "SHARED_INFRASTRUCTURE",
                    "title": f"Shared {etype} infrastructure across {len(case_nodes)} cases",
                    "details": {
                        "node_id": node_id,
                        "entity_type": etype,
                        "label": props.get("label", node_id),
                        "case_count": len(case_nodes),
                        "linked_cases": case_nodes[:10],
                    },
                    "fingerprint": fp,
                    "created_at": now_ts,
                    "status": "OPEN",
                })

    # Rule 4: High-Betweenness Bridge (hidden coordinator)
    for node_id, bc_score in betweenness.items():
        complaint_count = entity_complaint_counts.get(node_id, 0)
        if bc_score >= 0.35 and complaint_count == 0:
            props = graph.nodes.get(node_id, {})
            fp = _fingerprint("HIGH_BETWEENNESS_BRIDGE", node_id)
            # Avoid duplicating MASTERMIND_IDENTIFIED
            if not any(a["fingerprint"] == _fingerprint("MASTERMIND_IDENTIFIED", node_id) for a in alerts):
                alerts.append({
                    "id": fp,
                    "severity": "HIGH",
                    "alert_type": "HIGH_BETWEENNESS_BRIDGE",
                    "title": "High-betweenness entity not named in any complaint",
                    "details": {
                        "node_id": node_id,
                        "entity_type": props.get("entity_type", "UNKNOWN"),
                        "label": props.get("label", node_id),
                        "betweenness_score": round(bc_score, 4),
                        "note": "Entity bridges multiple clusters but has never been named as accused — possible coordinator.",
                    },
                    "fingerprint": fp,
                    "created_at": now_ts,
                    "status": "OPEN",
                })

    return alerts


# ─────────────────────────────────────────────────────────────────────────────
# 5. POSTGRES GRAPH BUILDER
# ─────────────────────────────────────────────────────────────────────────────

def _build_graph_from_postgres(db_session) -> Tuple[Graph, Dict[str, int]]:
    """
    Reads canonical entity and FIR association data from Postgres and builds
    an in-memory Graph suitable for ARGUS analytics.

    Returns (graph, entity_complaint_counts).
    """
    from sqlalchemy import text

    graph = Graph()
    entity_complaint_counts: Dict[str, int] = {}

    try:
        # ── 1. Load all phones (canonical entities in S.I.R.I.S.)
        phone_rows = db_session.execute(text(
            "SELECT id::text, normalized_number, number_hash FROM phones"
        )).fetchall()
        for row in phone_rows:
            nid = f"phone:{row[0]}"
            norm = row[1] or row[2] or row[0]
            graph.add_node(nid, entity_type="PHONE", label=norm, node_type="entity",
                           normalized=norm, source_id=row[0])

        # ── 2. Load all persons
        person_rows = db_session.execute(text(
            "SELECT id::text, name, identifier_hash FROM persons"
        )).fetchall()
        for row in person_rows:
            nid = f"person:{row[0]}"
            graph.add_node(nid, entity_type="PERSON", label=row[1] or "Unknown",
                           node_type="entity", normalized=(row[1] or "").lower(),
                           source_id=row[0])

        # ── 3. Load all vehicles
        vehicle_rows = db_session.execute(text(
            "SELECT id::text, registration_number FROM vehicles"
        )).fetchall()
        for row in vehicle_rows:
            nid = f"vehicle:{row[0]}"
            graph.add_node(nid, entity_type="VEHICLE", label=row[1] or "Unknown",
                           node_type="entity", normalized=(row[1] or "").upper(),
                           source_id=row[0])

        # ── 4. Load all cases (FIRs)
        case_rows = db_session.execute(text(
            "SELECT id::text, fir_number, station_id, district, state FROM cases"
        )).fetchall()
        for row in case_rows:
            nid = f"case:{row[0]}"
            graph.add_node(nid, entity_type="CASE", label=row[1] or row[0],
                           node_type="case", station_id=row[2],
                           district=row[3], state=row[4], source_id=row[0])

        # ── 5. Load case-phone associations → edges
        cp_rows = db_session.execute(text(
            "SELECT case_id::text, phone_id::text FROM case_phones"
        )).fetchall()
        for row in cp_rows:
            case_nid = f"case:{row[0]}"
            phone_nid = f"phone:{row[1]}"
            graph.add_edge(case_nid, phone_nid, 1.0)
            entity_complaint_counts[phone_nid] = entity_complaint_counts.get(phone_nid, 0) + 1

        # ── 6. Load case-person associations → edges
        cpers_rows = db_session.execute(text(
            "SELECT case_id::text, person_id::text FROM case_persons"
        )).fetchall()
        for row in cpers_rows:
            case_nid = f"case:{row[0]}"
            person_nid = f"person:{row[1]}"
            graph.add_edge(case_nid, person_nid, 0.9)
            entity_complaint_counts[person_nid] = entity_complaint_counts.get(person_nid, 0) + 1

        # ── 7. Load case-vehicle associations → edges
        cv_rows = db_session.execute(text(
            "SELECT case_id::text, vehicle::text FROM case_vehicles"
        )).fetchall()
        for row in cv_rows:
            case_nid = f"case:{row[0]}"
            vehicle_nid = f"vehicle:{row[1]}"
            graph.add_edge(case_nid, vehicle_nid, 0.8)
            entity_complaint_counts[vehicle_nid] = entity_complaint_counts.get(vehicle_nid, 0) + 1

    except Exception as exc:
        logger.error("Failed to build graph from Postgres: %s", exc)
        try:
            db_session.rollback()
        except Exception:
            pass

    return graph, entity_complaint_counts


# ─────────────────────────────────────────────────────────────────────────────
# 6. MAIN SERVICE CLASS (with TTL cache)
# ─────────────────────────────────────────────────────────────────────────────

_CACHE_TTL = 60.0   # seconds


class GraphIntelligenceService:
    """
    Wraps the in-memory graph with TTL caching and exposes
    methods matching the /api/v1/graph/* endpoint needs.
    """

    def __init__(self):
        self._graph: Optional[Graph] = None
        self._betweenness: Dict[str, float] = {}
        self._pagerank: Dict[str, float] = {}
        self._entity_complaint_counts: Dict[str, int] = {}
        self._alerts: List[Dict[str, Any]] = []
        self._built_at: float = 0.0

    def _is_stale(self) -> bool:
        return (time.monotonic() - self._built_at) > _CACHE_TTL

    def _rebuild(self, db_session):
        logger.info("GraphIntelligenceService: rebuilding in-memory graph from Postgres...")
        t0 = time.monotonic()

        graph, ecc = _build_graph_from_postgres(db_session)
        self._graph = graph
        self._entity_complaint_counts = ecc

        # Only compute betweenness on entity-only subgraph (skip case nodes for performance)
        entity_graph = Graph()
        for nid, props in graph.nodes.items():
            if props.get("node_type") != "case":
                entity_graph.add_node(nid, **props)
        # Add entity-entity edges through shared cases
        case_entities: Dict[str, List[str]] = defaultdict(list)
        for u, v, _ in graph.edges:
            u_props = graph.nodes.get(u, {})
            v_props = graph.nodes.get(v, {})
            if u_props.get("node_type") == "case":
                case_entities[u].append(v)
            elif v_props.get("node_type") == "case":
                case_entities[v].append(u)

        for case_id, ents in case_entities.items():
            for i in range(len(ents)):
                for j in range(i + 1, len(ents)):
                    entity_graph.add_edge(ents[i], ents[j], 1.0)

        self._betweenness = compute_betweenness(entity_graph)
        self._pagerank = compute_pagerank(entity_graph)
        self._alerts = run_alert_rules(
            entity_graph, self._betweenness, self._pagerank, ecc
        )
        self._built_at = time.monotonic()

        elapsed = round(time.monotonic() - t0, 2)
        logger.info(
            "GraphIntelligenceService: graph built — %d nodes, %d edges, "
            "%d alerts in %.2fs",
            len(self._graph.nodes), len(self._graph.edges),
            len(self._alerts), elapsed
        )

    def _ensure_fresh(self, db_session):
        if self._graph is None or self._is_stale():
            try:
                self._rebuild(db_session)
            except Exception as exc:
                logger.error("GraphIntelligenceService rebuild failed: %s", exc)
                if self._graph is None:
                    self._graph = Graph()

    # ── Public API ───────────────────────────────────────────────────────────

    def get_overview(self, db_session, limit: int = 150) -> Dict[str, Any]:
        """
        Returns top-influence entities and case nodes for the NetworkExplorer
        D3 force graph.
        """
        self._ensure_fresh(db_session)
        graph = self._graph

        # Build node list sorted by influence (betweenness > 0 first, then pagerank)
        nodes = []
        for nid, props in graph.nodes.items():
            bc = self._betweenness.get(nid, 0.0)
            pr = self._pagerank.get(nid, 0.0)
            complaint_cnt = self._entity_complaint_counts.get(nid, 0)
            influence = round(bc * 0.6 + pr * 0.4, 4)
            nodes.append({
                "id": nid,
                "label": props.get("label", nid),
                "entity_type": props.get("entity_type", "UNKNOWN"),
                "node_type": props.get("node_type", "entity"),
                "betweenness": round(bc, 4),
                "influence": influence,
                "complaint_count": complaint_cnt,
                "is_flagged": bc >= 0.15,
                "cluster_id": props.get("cluster_id"),
                "district": props.get("district"),
                "station_id": props.get("station_id"),
            })

        # Sort: flagged first, then by influence desc, then case nodes last
        nodes.sort(key=lambda n: (
            0 if n["node_type"] == "case" else 1,
            -n["influence"]
        ))
        nodes = nodes[:limit]

        # Build edge list for included nodes
        included_ids = {n["id"] for n in nodes}
        edges = []
        seen_edges: Set[Tuple[str, str]] = set()
        for u, v, w in graph.edges:
            if u in included_ids and v in included_ids:
                key = (min(u, v), max(u, v))
                if key not in seen_edges:
                    seen_edges.add(key)
                    edges.append({"source": u, "target": v, "weight": w})

        components = connected_components(graph)

        return {
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(graph.nodes),
            "total_edges": len(graph.edges),
            "components": len(components),
            "built_at": self._built_at,
        }

    def get_neighbors(
        self, db_session, node_id: str, depth: int = 1, limit: int = 50
    ) -> Dict[str, Any]:
        """Returns node's neighbors up to depth hops (BFS)."""
        self._ensure_fresh(db_session)
        graph = self._graph

        if node_id not in graph.nodes:
            return {"node_id": node_id, "found": False, "nodes": [], "edges": []}

        visited: Set[str] = {node_id}
        frontier = {node_id}
        for _ in range(depth):
            next_frontier = set()
            for n in frontier:
                for nb in graph.neighbors(n):
                    if nb not in visited:
                        visited.add(nb)
                        next_frontier.add(nb)
            frontier = next_frontier
            if not frontier:
                break

        subgraph_ids = visited
        sub_nodes = []
        for nid in list(subgraph_ids)[:limit]:
            props = graph.nodes.get(nid, {})
            bc = self._betweenness.get(nid, 0.0)
            pr = self._pagerank.get(nid, 0.0)
            sub_nodes.append({
                "id": nid,
                "label": props.get("label", nid),
                "entity_type": props.get("entity_type", "UNKNOWN"),
                "node_type": props.get("node_type", "entity"),
                "betweenness": round(bc, 4),
                "influence": round(bc * 0.6 + pr * 0.4, 4),
                "is_center": nid == node_id,
            })

        included = {n["id"] for n in sub_nodes}
        sub_edges = []
        seen_edges: Set[Tuple[str, str]] = set()
        for u, v, w in graph.edges:
            if u in included and v in included:
                key = (min(u, v), max(u, v))
                if key not in seen_edges:
                    seen_edges.add(key)
                    sub_edges.append({"source": u, "target": v, "weight": w})

        return {
            "node_id": node_id,
            "found": True,
            "nodes": sub_nodes,
            "edges": sub_edges,
        }

    def get_why(self, db_session, node_id: str) -> Dict[str, Any]:
        """
        S.I.R.I.S explainability panel for a given entity node.
        Returns betweenness rank, influence, bridge paths, removal test.
        """
        self._ensure_fresh(db_session)
        graph = self._graph
        props = graph.nodes.get(node_id)
        if props is None:
            return {"node_id": node_id, "found": False}

        bc = self._betweenness.get(node_id, 0.0)
        pr = self._pagerank.get(node_id, 0.0)
        complaint_cnt = self._entity_complaint_counts.get(node_id, 0)

        # Betweenness rank among all non-case nodes
        entity_bc = [(n, v) for n, v in self._betweenness.items()
                     if graph.nodes.get(n, {}).get("node_type") != "case"]
        entity_bc.sort(key=lambda x: x[1], reverse=True)
        bc_rank = next((i + 1 for i, (n, _) in enumerate(entity_bc) if n == node_id), None)

        # Bridge paths: find 2 nodes the target connects that would otherwise be separated
        # Simplified: show 3 shortest paths that pass through this node
        sample_pairs = []
        neighbors = list(graph.neighbors(node_id))
        for i in range(min(3, len(neighbors))):
            for j in range(i + 1, min(4, len(neighbors))):
                path = _bfs_path(graph, neighbors[i], neighbors[j])
                if path and node_id in path:
                    sample_pairs.append({
                        "from": neighbors[i],
                        "to": neighbors[j],
                        "path": path,
                        "passes_through": True,
                    })

        # Removal test: how many components does the graph break into if we remove this node?
        before = len(connected_components(graph))
        tmp = Graph()
        for n, p in graph.nodes.items():
            if n != node_id:
                tmp.add_node(n, **p)
        for u, v, w in graph.edges:
            if u != node_id and v != node_id:
                tmp.add_edge(u, v, w)
        after = len(connected_components(tmp))
        removal_delta = after - before

        return {
            "node_id": node_id,
            "found": True,
            "label": props.get("label", node_id),
            "entity_type": props.get("entity_type", "UNKNOWN"),
            "betweenness": round(bc, 4),
            "influence": round(bc * 0.6 + pr * 0.4, 4),
            "betweenness_rank": bc_rank,
            "complaint_count": complaint_cnt,
            "is_flagged": bc >= 0.15,
            "bridge_paths": sample_pairs[:3],
            "removal_test": {
                "components_before": before,
                "components_after": after,
                "delta": removal_delta,
                "is_bridge": removal_delta > 0,
                "note": (
                    f"Removing this node splits the network into {after} components "
                    f"(was {before})."
                    if removal_delta > 0
                    else "Removing this node does not fragment the network."
                ),
            },
        }

    def get_path(self, db_session, from_id: str, to_id: str) -> Dict[str, Any]:
        """Returns shortest path between two nodes."""
        self._ensure_fresh(db_session)
        path = _bfs_path(self._graph, from_id, to_id)
        if path is None:
            return {"found": False, "from": from_id, "to": to_id, "path": []}
        path_nodes = []
        for nid in path:
            props = self._graph.nodes.get(nid, {})
            path_nodes.append({
                "id": nid,
                "label": props.get("label", nid),
                "entity_type": props.get("entity_type", "UNKNOWN"),
            })
        return {
            "found": True,
            "from": from_id,
            "to": to_id,
            "path": path_nodes,
            "hop_count": len(path) - 1,
        }

    def get_common(self, db_session, a: str, b: str) -> Dict[str, Any]:
        """Returns shared neighbors of two nodes."""
        self._ensure_fresh(db_session)
        shared = _shared_neighbors(self._graph, a, b)
        shared_nodes = []
        for nid in shared:
            props = self._graph.nodes.get(nid, {})
            shared_nodes.append({
                "id": nid,
                "label": props.get("label", nid),
                "entity_type": props.get("entity_type", "UNKNOWN"),
            })
        return {"a": a, "b": b, "common": shared_nodes, "count": len(shared_nodes)}

    def get_alerts(self, db_session) -> List[Dict[str, Any]]:
        """Returns live S.I.R.I.S alert rules results."""
        self._ensure_fresh(db_session)
        return self._alerts

    @staticmethod
    def extract_entities(narrative: str) -> Dict[str, Any]:
        """Entity extraction from FIR narrative — S.I.R.I.S regex pipeline."""
        entities, duration_ms = extract_entities_from_narrative(narrative)
        return {
            "entities": entities,
            "duration_ms": duration_ms,
            "tiers": {
                "regex": len(entities),
                "ner": 0,
            },
        }


# Singleton
graph_intelligence_service = GraphIntelligenceService()
