---
name: siris-intelligence
description: S.I.R.I.S investigation intelligence workflows, Cloud Neo4j Aura graph querying, FIR hybrid entity extraction, and testing procedures.
---

# S.I.R.I.S. Intelligence & Testing Runbook

Use this skill when developing, testing, or debugging the S.I.R.I.S crime intelligence platform.

## 1. Cloud Neo4j Aura Operations

- **Connection**: Driven by `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` in `.env`.
- **Protocol**: `neo4j+s://` or `bolt+s://` for remote secure Aura instances.
- **Connection Service**: Handled by `ml/central-intelligence/app/services/graph/connection.py`.
- **Query Patterns**:
  - Fetch Bounded Neighborhood:
    ```cypher
    MATCH (n {node_id: $focus_id})-[r]-(m)
    RETURN n, r, m LIMIT 50
    ```
  - Shortest Path between Suspects:
    ```cypher
    MATCH p = shortestPath((a:PERSON {node_id: $id1})-[*..5]-(b:PERSON {node_id: $id2}))
    RETURN p
    ```

## 2. Hybrid NLP Entity Extraction Pipeline

- **Source Code**: `ml/central-intelligence/app/services/nlp/hybrid_entity_extractor.py`
- **Rule-based Matchers**: Extract phone numbers, vehicle registration numbers (e.g. `OD02AB1234`), IPC/BNS legal sections (`IPC 379`, `IPC 302`), and monetary amounts.
- **spaCy Matchers**: Fallback for Person names, Organizations, and Geographic locations with confidence scoring.

### Verification Runbook
Run unit tests and verification directly:
```powershell
python -m pytest ml/central-intelligence/tests/test_hybrid_entity_extractor.py -v
```

## 3. Frontend & Graph Integration

- **Frontend Graph Component**: [`frontend/src/components/graph/KnowledgeGraph.tsx`](file:///e:/desk/S.I.R.I.S/CrimeLens-SIH-V2-Frontend/frontend/src/components/graph/KnowledgeGraph.tsx)
- **Explorer Page**: [`frontend/src/pages/NetworkExplorer.tsx`](file:///e:/desk/S.I.R.I.S/CrimeLens-SIH-V2-Frontend/frontend/src/pages/NetworkExplorer.tsx)
- **API Client**: Calls ML Central Intelligence service at port 8000 (`/api/v1/graph/intelligence/focus/{node_id}`).
