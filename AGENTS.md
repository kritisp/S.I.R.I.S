# S.I.R.I.S. (Smart Intelligence for Real Time Investigation Support) — Agent Rules & Architecture

## System Overview & Services

S.I.R.I.S is a distributed multi-service law enforcement and crime intelligence platform consisting of:

1. **Frontend (`frontend/`)**
   - **Stack**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, vis-network graph rendering.
   - **Port**: `5173` (dev server).
   - **Key Views**: `CaseWorkspace`, `NetworkExplorer`, `KnowledgeGraph`, `EvidenceLocker`.

2. **ML Central Intelligence (`ml/central-intelligence/`)**
   - **Stack**: Python 3.11+, FastAPI, spaCy (`en_core_web_sm`), ChromaDB vector store, Groq / Cerebras / Ollama LLM reasoning.
   - **Port**: `8000` (`http://localhost:8000/api/v1`).
   - **Core Engine**: Hybrid NLP Entity Extraction (deterministic regex + spaCy NER fallback), Entity Resolution & graph similarity.

3. **Backend Service (`backend/`)**
   - **Stack**: Spring Boot 3, Java 17+, Maven, JPA/Hibernate.
   - **Port**: `8080`.
   - **Database**: Supabase PostgreSQL.

4. **Knowledge Graph (Cloud Neo4j Aura)**
   - **Hosting**: Cloud Neo4j Aura / Remote instance (configured in `.env` via `NEO4J_URI`, e.g., `neo4j+s://...`).
   - **IMPORTANT**: Do NOT assume offline/local Neo4j (do not attempt to start a local Neo4j Docker container or service). Always use the remote/cloud Neo4j connection configured in the environment.

---

## Neo4j Graph Schema & Node Labels

### Node Types
- `CASE` (Properties: `fir_number`, `node_id`, `crime_type`, `district`, `police_station`, `date_of_occurrence`)
- `PERSON` (Properties: `name`, `normalized_name`, `role` [Suspect/Victim/Witness], `is_flagged`, `phone`, `alias`)
- `PHONE` (Properties: `normalized_number`, `node_id`, `carrier`, `imei`)
- `VEHICLE` (Properties: `registration_number`, `make`, `model`, `color`)
- `LOCATION` (Properties: `locality`, `city`, `district`, `coordinates`)
- `EVIDENCE` (Properties: `evidence_type`, `description`, `storage_location`)
- `LEGALSECTION` (Properties: `code`, `act`, `description` e.g., IPC/BNS sections)

### Relationship Types
- `(:PERSON)-[:INVOLVED_IN]->(:CASE)`
- `(:PERSON)-[:ASSOCIATED_WITH]->(:PERSON)`
- `(:PERSON)-[:OPERATES_VEHICLE]->(:VEHICLE)`
- `(:PERSON)-[:USED_PHONE]->(:PHONE)`
- `(:CASE)-[:OCCURRED_AT]->(:LOCATION)`
- `(:CASE)-[:HAS_EVIDENCE]->(:EVIDENCE)`
- `(:CASE)-[:CHARGED_UNDER]->(:LEGALSECTION)`
- `(:CASE)-[:SIMILAR_MODUS_OPERANDI]->(:CASE)`

---

## Standard Development & Testing Commands

- **ML NLP Entity Extractor Tests**:
  ```powershell
  python -m pytest ml/central-intelligence/tests/ -v
  ```
- **ML End-to-End Extraction Verification**:
  ```powershell
  python ml/central-intelligence/sample_e2e_extraction.py
  ```
- **Frontend Typecheck & Build**:
  ```powershell
  cd frontend; npm run build
  ```
