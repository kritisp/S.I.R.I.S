# S.I.R.I.S. (Smart Intelligence for Real-Time Investigation Support)
## Comprehensive Architecture & Module Integration Guide

---

### 1. Architectural Overview & Data Flow

S.I.R.I.S. is built on a decoupled, microservices-driven law enforcement intelligence architecture:

```
                  ┌─────────────────────────────────────────┐
                  │          React Frontend (:5173)         │
                  │   Vite, TypeScript, Tailwind, VisNet    │
                  └────────────────────┬────────────────────┘
                                       │ REST (JWT Authentication)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      Spring Boot Core Backend (:8080)   │
                  │ RBAC, Cases, Workspaces, Access Control │
                  └───────┬─────────────────────────┬───────┘
                          │                         │
      REST (Internal Key) │                         │ JDBC / JPA
                          ▼                         ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────────┐
│ Central Intelligence Engine (:8000)  │  │  Supabase PostgreSQL Database      │
│ FastAPI, Resolution, Pattern Match   │  │  Cases, Persons, Vehicles, Phones, │
└───────────┬──────────────────┬───────┘  │  Workspaces, Intelligence Results  │
            │                  │          └────────────────────────────────────┘
            ▼                  ▼
┌────────────────────┐ ┌───────────────┐
│ Real Neo4j Graph   │ │ Groq LLM      │
│ GDS 2026.07.0      │ │ Synthesis     │
└────────────────────┘ └───────────────┘
```

---

### 2. Database Layer: H2 vs. Supabase PostgreSQL

* **H2 Embedded Database (`jdbc:h2:mem:crimelens_db`)**:
  * **Role**: Temporary local development & unit test fallback.
  * **Why it exists**: Configured in `application-dev.yml` so developers can run Spring Boot tests out-of-the-box without requiring a local or cloud database setup.
* **Supabase PostgreSQL**:
  * **Role**: Single Operational Source of Truth for production and integration staging.
  * **Tables**: `cases`, `persons`, `case_persons`, `vehicles`, `case_vehicles`, `phones`, `case_phones`, `locations`, `evidences`, `legal_sections`, `case_legal_sections`, `workspaces`, `workspace_intelligence_results`.
  * **How to switch**: Set `SPRING_DATASOURCE_URL=jdbc:postgresql://<supabase-host>:5432/postgres` (or use `application-prod.yml`), and Spring Boot will instantly read and write to Supabase PostgreSQL.

---

### 3. Detailed Module Explanation & Integration Status

#### Module 1: JWT Authentication & Station RBAC
* **Functionality**: Manages user login, password hashing (BCrypt), JWT token issuance/validation, and Role-Based Access Control (`SUPER_ADMIN`, `STATION_ADMIN`, `OFFICER`). Enforces station isolation (`StationSecurityEvaluator`).
* **Backend**: `AuthController.java`, `JwtTokenProvider.java`, `StationSecurityEvaluator.java`.
* **Frontend**: `Login.tsx`, `AuthContext.tsx`, authenticated API interceptors passing `Authorization: Bearer <token>`.
* **Status**: **100% Integrated**.

#### Module 2: Case Records & FIR Engine
* **Functionality**: Provides full case lifecycle tracking, storing FIR metadata, crime categories, priority levels, linked suspects, vehicles, phones, and evidence references.
* **Backend**: `CaseRecordController.java`, `CaseRecordRepository.java`, `CaseRecord.java`.
* **Frontend**: `Cases.tsx`, `CaseDetailModal.tsx`, `FIRUploadModal.tsx`.
* **Status**: **100% Integrated**.

#### Module 3: FIR / BNS Intelligence (OCR & Legal Mapping)
* **Functionality**: Processes raw FIR PDFs and scanned images using OCR. Extracts structured case fields and maps statutory legal sections under Bharatiya Nyaya Sanhita (BNS) and IPC.
* **FastAPI Service**: `ml/fir-bns-rag` (`:8001`).
* **Backend**: `FirIntelligenceClient.java`, `FirService.java`.
* **Frontend**: FIR upload dropzone, BNS statutory breakdown widget.
* **Status**: **100% Integrated**.

#### Module 4: Central Intelligence Engine & Multi-Case Analytics
* **Functionality**: Analyzes multiple cases across police stations to discover hidden operational links, repeat offender MOs, shared getaway vehicles, and burner phones.
* **FastAPI Service**: `ml/central-intelligence` (`:8000`).
* **Backend**: `FastApiCentralIntelligenceClient.java` (implements `@Primary MlClientInterface`).
* **Frontend**: Workspace Intelligence view, Risk Score cards, Key Observations breakdown.
* **Status**: **100% Integrated**.

#### Module 5: Neo4j Graph Datastore & Graph Projection
* **Functionality**: Automatically projects PostgreSQL cases and entities into a high-performance graph database (`bolt://127.0.0.1:7687`). Enforces 7 uniqueness constraints (`c_case_node_id`, etc.) and 5 range indexes (`i_case_fir_number`, etc.). Supports Cypher multi-hop path extraction (`MATCH p=(c1:Case)-[*1..3]-(c2:Case)`).
* **Graph Engine**: Neo4j Enterprise 2026.07.1.
* **Integration**: `Neo4jGraphProjectionService.py` via Python `neo4j` driver.
* **Status**: **100% Integrated**.

#### Module 6: Neo4j Graph Data Science (GDS)
* **Functionality**: Runs native graph analytics algorithms over projected nodes and relationships, including Weakly Connected Components (`gds.wcc.stream`), Louvain community detection (`gds.louvain.stream`), and degree/betweenness centrality.
* **Plugin Version**: GDS 2026.07.0 (471 registered procedures verified).
* **Status**: **100% Integrated**.

#### Module 7: Cross-Case Entity Resolution
* **Functionality**: Performs deterministic and probabilistic fuzzy matching on suspect names (Jaro-Winkler + Levenshtein distance), normalizes phone numbers (+91), and standardizes vehicle registration numbers to merge identities across police station boundaries.
* **Policy**: Score $\ge 0.80$ triggers `HIGH_CONFIDENCE_MATCH` (Auto-Merge); Score $< 0.50$ triggers `NO_MATCH`.
* **Integration**: `person_resolution.py`, `entity_resolution_service.py`.
* **Status**: **100% Integrated**.

#### Module 8: Double-Blind Privacy & Groq LLM Synthesis
* **Functionality**: Masks all PII (names, phone numbers, addresses) before sending structured graph findings to the Groq LLM. De-masks PII in-memory upon receiving the narrative intelligence report.
* **Integration**: `GroqSynthesisService.py`, `privacy_masking.py`.
* **Status**: **100% Integrated**.

#### Module 9: Investigation Workspaces & Persistence
* **Functionality**: Allows investigating officers to create digital workspaces, add target cases, run intelligence triggers, and persist complete intelligence results.
* **Backend**: `WorkspaceController.java`, `WorkspaceIntelligenceResult.java`.
* **Persistence**: Saved directly to PostgreSQL (`workspace_intelligence_results` table) for historical retrieval.
* **Frontend**: `Workspaces.tsx`, `WorkspaceDetail.tsx`.
* **Status**: **100% Integrated**.

#### Module 10: Interactive Network Explorer
* **Functionality**: Renders an interactive, zoomable visual graph layout showing connected suspects, vehicles, phone numbers, and cases across police stations.
* **Backend Endpoint**: `GET /api/v1/workspaces/{id}/graph`.
* **Frontend**: `NetworkExplorer.tsx` using Vis-Network / Canvas rendering.
* **Status**: **100% Integrated**.

---

### 4. Integration Matrix Summary

| Component | Spring Boot Core | Supabase Postgres | Neo4j + GDS | Central Intelligence | React Frontend |
|-----------|------------------|-------------------|-------------|----------------------|----------------|
| **JWT Auth** | ✅ | ✅ | N/A | ✅ (Secret Validation) | ✅ |
| **Cases / FIR** | ✅ | ✅ | ✅ (Graph Projection) | ✅ | ✅ |
| **FIR / BNS RAG** | ✅ | ✅ | N/A | ✅ | ✅ |
| **Central Intelligence** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Graph Explorer** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Groq Synthesis** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Workspaces** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

---

### 5. Prerequisites, Installation & How to Run

#### System Prerequisites
* **Java SDK**: Java 21 or Java 24 (64-bit)
* **Build Tool**: Apache Maven 3.9+
* **Python Engine**: Python 3.10+
* **Node Environment**: Node.js v18+ and `npm` v9+
* **Graph Database**: Neo4j Desktop (Enterprise 2026.07.1 DBMS) listening on `bolt://127.0.0.1:7687` with **Graph Data Science (GDS 2026.07.0)** plugin installed.
* **Operational Database**: PostgreSQL 15+ (Supabase Cloud or Local PostgreSQL on port 5432).

---

#### Step-by-Step Installation

##### 1. Backend Dependencies (Spring Boot)
```powershell
cd backend
mvn clean install -DskipTests
```

##### 2. Frontend Dependencies (React + Vite)
```powershell
cd frontend
npm install
```

##### 3. Central Intelligence FastAPI Dependencies
```powershell
cd ml/central-intelligence
python -m pip install -r requirements.txt
```

##### 4. FIR / BNS RAG FastAPI Dependencies
```powershell
cd ml/fir-bns-rag
python -m pip install -r requirements.txt
```

---

#### Environment Configuration (.env Files)

Create or verify `.env` files in each service directory:

* **Spring Boot (`backend/src/main/resources/application-dev.yml` or shell environment)**:
  ```env
  SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/postgres
  SPRING_DATASOURCE_USERNAME=postgres
  SPRING_DATASOURCE_PASSWORD=password
  INTERNAL_API_KEY=crimelens-internal-secret-key-2026
  ```

* **Central Intelligence (`ml/central-intelligence/.env`)**:
  ```env
  NEO4J_URI=bolt://127.0.0.1:7687
  NEO4J_USERNAME=neo4j
  NEO4J_PASSWORD=password
  DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
  GROQ_API_KEY=your_groq_api_key_here
  INTERNAL_API_KEY=crimelens-internal-secret-key-2026
  ```

* **React Frontend (`frontend/.env`)**:
  ```env
  VITE_API_BASE_URL=http://localhost:8080/api/v1
  ```

---

#### Step-by-Step Execution Commands

Run the services in 5 separate terminal windows in the following order:

##### Terminal 1: Neo4j Enterprise DBMS
Open **Neo4j Desktop** UI and click **Start** on `dbms-f2d8022d-3c0e-4115-802f-e4406a132c78`.
Verify Bolt is listening on `bolt://127.0.0.1:7687`.

##### Terminal 2: Central Intelligence FastAPI Engine
```powershell
cd ml/central-intelligence
python -m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload
```
*Health Check*: Open `http://localhost:8000/health` (Returns `{"status": "healthy"}`).

##### Terminal 3: FIR / BNS RAG FastAPI Engine
```powershell
cd ml/fir-bns-rag
python -m uvicorn api_server:app --port 8001 --host 127.0.0.1 --reload
```
*Health Check*: Open `http://localhost:8001/health` (Returns `{"status": "healthy"}`).

##### Terminal 4: Spring Boot Core Backend
```powershell
cd backend
mvn spring-boot:run
```
*Health Check*: Open `http://localhost:8080/api/v1/auth/me` (Returns HTTP 401 Unauthorized for unauthenticated requests).

##### Terminal 5: React Frontend UI
```powershell
cd frontend
npm run dev
```
*Application Access*: Open `http://localhost:5173/` in Google Chrome or Microsoft Edge.

---

#### Default Test Credentials (Seeded Data)

* **Investigating Officer Account**:
  * Email / ID: `ranjan.samal@odishapolice.gov.in`
  * Password: `Demo@123`
  * Station: Khandagiri Police Station (`OP-BBSR-CAP`)
* **Station Admin Account**:
  * Email / ID: `iic.khandagiri@odishapolice.gov.in`
  * Password: `Demo@123`
* **Super Admin Account**:
  * Email / ID: `hq.mahapatra@odishapolice.gov.in`
  * Password: `Demo@123`

