# S.I.R.I.S. Multi-Agentic AI Subsystem & Analytics Architecture

This document provides a comprehensive technical breakdown of the specialized AI agent subsystem operating within the **S.I.R.I.S. (Smart Intelligence for Real-Time Investigation Support)** platform. It details individual agent capabilities, data processing methods (pandas DataFrames, graph centrality, vector similarity, Bhasini NLU), and how multi-agent outputs unify inside the **Intelligence Fusion Center** and **Central Intelligence Case Workspace**.

---

## 1. Subsystem Architecture Overview

S.I.R.I.S. employs a **Decentralized Multi-Agent Orchestration Pattern**. Specialized autonomous agents analyze raw heterogeneous evidence feeds concurrently, run domain-specific mathematical models, and publish structured insights into the **Central Intelligence Matrix**.

```
                           +-------------------------------------------------------+
                           |           RAW EVIDENCE & INVESTIGATION FEEDS          |
                           |  (FIR Text, Bank Ledgers, CDR Logs, CCTV ANPR, Map)   |
                           +-------------------------------------------------------+
                                                       |
     +-------------------------+-----------------------+------------------------+-------------------------+
     |                         |                       |                        |                         |
     v                         v                       v                        v                         v
+------------------+  +------------------+  +-------------------+  +-------------------+  +-------------------+
|  Financial AML   |  |   Telecom CDR    |  |   Statutory BNS   |  |    Cyber ANPR     |  |   Bhasini NLU     |
|   Crime Agent    |  |Intelligence Agent|  | Enforcement Agent |  | Pattern Matcher   |  | Speech/Translation|
+------------------+  +------------------+  +-------------------+  +-------------------+  +-------------------+
     |                         |                       |                        |                         |
     | Python pandas           | NetworkX Graph        | BGE-M3 Vector          | OCR Plate Trajectory    | ASR Wav Base64 &  |
     | Flow Velocity & Mules   | Burst Call Clustering | Statutory RAG Matcher  | Sequential Camera Hops  | Tri-Module TTS    |
     +-------------------------+-----------------------+------------------------+-------------------------+
                                                       |
                                                       v
                                   +---------------------------------------+
                                   |   MULTI-AGENT SYNTHESIS CONTROLLER    |
                                   |  (Unified Threat Index Score: 0-100)  |
                                   +---------------------------------------+
                                                       |
                        +------------------------------+------------------------------+
                        |                                                             |
                        v                                                             v
        +-------------------------------+                             +-------------------------------+
        |   INTELLIGENCE FUSION CENTER  |                             |   CENTRAL CASE WORKSPACE API  |
        |   (/intelligence-fusion)      |                             |   (/api/v1/workspace/case/{id})   |
        +-------------------------------+                             +-------------------------------+
```

---

## 2. Individual Agent Technical Specifications

### A. Financial Crime & Money Trail Agent (`moneyTrailService.ts`)
* **Primary Objective**: Detect money laundering topologies, pass-through mule accounts, and Hawala cashout sinks.
* **Analytics Engine & Data Processing**:
  - **Pandas / DataFrame Ingest & Ledger Matrix**: Parses bank account statements and UPI transaction logs into a directed weighted transaction graph.
  - **Topological Pass-Through Analysis**: Calculates the ratio of incoming to outgoing funds within tight time windows ($\Delta t \le 45 \text{ mins}$).
  - **Node Classification Algorithm**:
    - **Collector Account**: High in-degree, multiple distinct UPI sources.
    - **Pass-Through Mule**: Ratio $\frac{\text{Outflow}}{\text{Inflow}} \ge 0.95$ within 60 minutes of credit.
    - **Controller Hub**: Node with highest betweenness centrality routing funds to cashout nodes.
    - **Cashout Sink**: Outflow to Hawala desks, Crypto OTC, or ATM cash withdrawals.
* **Outputs Generated**:
  - `muleAccountsCount`, `controllersCount`, `cashoutDestinations`.
  - Recommended emergency asset freeze order under **BNSS Section 107**.

---

### B. Telecom CDR Intelligence Agent (`cdrIntelligenceService.ts`)
* **Primary Objective**: Uncover covert subscriber networks, nocturnal burst communications, cell tower co-location, and IMEI swapping.
* **Analytics Engine & Data Processing**:
  - **Call Detailed Record (CDR) Matrix**: Processes tower ID logs, timestamp delta, duration, and IMEI/IMSI identifiers.
  - **Nocturnal Burst Call Clustering**: Flags high-frequency short-duration calls occurring during late-night incident windows ($22:00 - 04:00 \text{ IST}$).
  - **Co-location Vectoring**: Calculates geographical proximity probability between two target numbers based on cell tower handovers ($\Delta d \le 500 \text{ m}, \Delta t \le 15 \text{ mins}$).
  - **IMEI Swap Detection**: Triggers alert when a single SIM card is inserted into multiple IMEI handsets within a 24-hour window.
* **Outputs Generated**:
  - `primaryTowerLocation`, `primaryImei`, `nocturnalBurstCallsCount`.
  - Top 3 communication leads with subscriber names, alias risk scores, and overlap confidence.

---

### C. Statutory BNS / BNSS Legal Enforcement Agent (`firAnalysisService.ts` & `groqService.ts`)
* **Primary Objective**: Map plain-text FIR narratives to statutory criminal offenses under **BNS 2023 (Bharatiya Nyaya Sanhita)** and enforce mandatory procedural investigations under **BNSS 2023 (Bharatiya Nagarik Suraksha Sanhita)**.
* **Analytics Engine & Data Processing**:
  - **Dense Vector Embedding RAG**: Uses BAAI/bge-m3 dense semantic embeddings over ChromaDB vector store indexing all 358 BNS sections and 531 BNSS procedural rules.
  - **Groq LLM Reasoning (`openai/gpt-oss-120b`)**: Evaluates legal ingredients (e.g. *movable property*, *dishonest intention*, *dwelling entry*) to match offences with HIGH/MEDIUM/LOW confidence.
  - **Procedural Mandate Engine**: Auto-generates mandatory BNSS actions:
    - **Section 105 BNSS**: Mandatory audio-video recording of search and seizure.
    - **Section 107 BNSS**: Bank account freeze order for proceeds of crime.
    - **Section 185 BNSS**: Execution of premises search by investigating officer.
* **Outputs Generated**:
  - Recommended BNS Sections (`BNS 304`, `BNS 317`, `BNS 309`).
  - Mandatory procedural search/seizure mandates with priority levels.

---

### D. Cyber ANPR & Pattern Detection Agent (`anomalyService.ts`)
* **Primary Objective**: Track vehicle geo-trails, CCTV optical character recognition (OCR) camera hits, and cross-case vehicle linkages.
* **Analytics Engine & Data Processing**:
  - **ANPR License Plate OCR Trajectory**: Reconstructs vehicle movement vectors across camera nodes along major highway corridors (e.g., NH-16).
  - **Cross-Case Pattern Correlation**: Matches license plate numbers (e.g., `OD-02-MJ-8821`) against active FIR dockets in neighboring police stations.
* **Outputs Generated**:
  - ANPR optical confidence score (e.g. 94%).
  - Sequential camera hop vector and cross-station crime link alert.

---

### E. Bhasini Multilingual NLU & Speech Engine (`bhasiniTranslationService.ts`)
* **Primary Objective**: Enable seamless Indian regional language intake (ASR Speech-to-Text) and officer voice briefing output (TTS Speech Synthesis) in **Odia (`or`)**, **Hindi (`hi`)**, **Bengali (`bn`)**, **Marathi (`mr`)**, and **English (`en`)**.
* **Analytics Engine & Data Processing**:
  - **ASR**: Converts base64 audio recorded via Web Audio MediaRecorder into transcribed text.
  - **NMT**: Translates multi-agent intelligence summaries into selected target regional languages.
  - **TTS**: Synthesizes translated briefing reports into spoken audio playback.

---

## 3. How Multi-Agent Insights Unify in Intelligence Fusion & Case Workspace

When an officer runs the pipeline from the **Evidence Vault (`/evidence`)**:

1. **Independent Execution Phase**:
   - Financial Agent parses bank ledgers $\rightarrow$ flags Mule Accounts.
   - Telecom Agent parses CDR dumps $\rightarrow$ identifies cell tower overlap & IMEI switches.
   - Statutory RAG Agent evaluates narrative $\rightarrow$ recommends BNS sections & BNSS search mandates.
   - Cyber ANPR Agent parses CCTV logs $\rightarrow$ plots vehicle trajectory.

2. **Cross-Domain Synthesis Phase**:
   - The **Multi-Agent Synthesis Controller** correlates entities across domains:
     $$\text{Threat Index} = w_f \cdot S_{\text{financial}} + w_t \cdot S_{\text{telecom}} + w_l \cdot S_{\text{legal}} + w_a \cdot S_{\text{anpr}}$$
   - Synthesizes an overall **Threat Level (CRITICAL / HIGH / MEDIUM)** and **Threat Score (e.g. 94/100)**.

3. **Multi-Destination Broadcasting**:
   - **Intelligence Fusion Center (`/intelligence-fusion`)**: Dynamically updates the central 9-node graph, populating connected suspect leads (e.g. *Rahul S.*), corroborating signal cards, and cross-station FIR links.
   - **Case Workspace API (`/api/v1/workspace/case/{id}`)**: Aggregates graph neighborhood, network centrality metrics, and statutory procedural dockets into the official case file.

---

## 4. Verification & Validation Summary

| Subsystem Component | Analytical Engine | Input Data | Primary Output | Integration Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Financial AML Agent** | Pandas DataFrame Flow Matrix | Bank CSV / UPI Log | Mule & Controller Nodes, Asset Freeze Order | Evidence Vault & Money Trail Workspace |
| **Telecom CDR Agent** | Tower Handover & Call Burst Graphs | Network CDR CSV | IMEI Swaps, Co-location Probabilities | Evidence Vault & CDR Workspace |
| **Statutory BNS Agent** | Bge-m3 Dense Vector RAG & Groq LLM | FIR Narrative Text | BNS Statutory Sections & BNSS Mandates | Case Workspace & FIR Console |
| **Cyber ANPR Agent** | Sequential Camera Hop Vectoring | CCTV OCR Hits | Geo-trail Trajectory & License Plate Match | GIS Map & ANPR Radar |
| **Bhasini NLU Engine** | ULCA Pipeline (ASR / NMT / TTS) | Base64 Audio & Text | Multilingual Voice Audio & Text Briefing | Drishti Voice Panel & Evidence Vault |
