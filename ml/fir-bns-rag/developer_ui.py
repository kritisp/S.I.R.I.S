import sys
import os
import json
import requests
import streamlit as st

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.legal_assistant import LegalIntelligenceAssistant

# Page Configuration
st.set_page_config(
    page_title="CrimeLens AI - Developer Testing Interface",
    page_icon="⚖️",
    layout="wide"
)

# Custom Styling
st.markdown("""
<style>
    .stApp {
        background-color: #0f172a;
        color: #f8fafc;
    }
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #38bdf8;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.0rem;
        color: #94a3b8;
        margin-bottom: 1.5rem;
    }
    .card {
        background-color: #1e293b;
        padding: 1.2rem;
        border-radius: 10px;
        border: 1px solid #334155;
        margin-bottom: 1rem;
    }
    /* Fix Textarea and Text Input Fields */
    textarea, input, .stTextArea textarea, .stTextInput input, div[data-baseweb="base-input"] {
        background-color: #1e293b !important;
        color: #ffffff !important;
        border: 1px solid #475569 !important;
        border-radius: 8px !important;
        font-size: 1rem !important;
    }
    textarea::placeholder, input::placeholder {
        color: #94a3b8 !important;
        opacity: 1 !important;
    }
    /* Fix Expander Header & Text Visibility */
    details, summary, [data-testid="stExpander"], [data-testid="stExpander"] summary {
        background-color: #1e293b !important;
        color: #38bdf8 !important;
        border-radius: 8px !important;
        border: 1px solid #334155 !important;
    }
    [data-testid="stExpander"] summary * {
        color: #38bdf8 !important;
        font-weight: 600 !important;
    }
    [data-testid="stExpanderDetails"] {
        background-color: #0f172a !important;
        color: #f8fafc !important;
        border-top: 1px solid #334155 !important;
    }
    /* Fix Selectbox and Dropdown styling */
    div[data-baseweb="select"] > div {
        background-color: #1e293b !important;
        color: #ffffff !important;
        border-color: #475569 !important;
    }
    div[data-baseweb="popover"] div {
        background-color: #1e293b !important;
        color: #ffffff !important;
    }
</style>
""", unsafe_allow_html=True)


# Initialize Legal Assistant in Session State if calling directly
@st.cache_resource
def load_assistant_pipeline():
    return LegalIntelligenceAssistant()


# Header Banner
st.markdown("<div class='main-header'>⚖️ CrimeLens AI Legal Intelligence Assistant</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-header'>Developer Testing Interface • BNS 2023 | BNSS 2023 | SOP RAG | Statutory Element Verification | Qwen2.5 7B</div>", unsafe_allow_html=True)

# Preset Scenarios
st.sidebar.title("📋 Preset Testing Scenarios")
presets = {
    "Select a preset...": "",
    "House Break-in & Theft (Night)": "Someone entered my house at night, broke the lock of my safe, and stole my gold jewellery.",
    "Hit and Run Crash": "A speeding vehicle rammed into a motorcycle on the highway and fled the scene without reporting or offering medical aid.",
    "Cyber Phishing Fraud": "A victim received a fake banking SMS and lost Rs 25,000 through unauthorized OTP transaction.",
    "Extortion Gang Threat": "Local gang members threatened a shop owner at gunpoint demanding monthly protection money."
}

selected_preset = st.sidebar.selectbox("Choose a scenario:", list(presets.keys()))
default_text = presets[selected_preset] if selected_preset != "Select a preset..." else ""

# Input Form
st.markdown("### 📝 Incident Description / Case Narrative")
case_input = st.text_area(
    label="Enter crime scenario narrative:",
    value=default_text,
    height=120,
    placeholder="Describe the incident (e.g. Someone entered my house at night and stole jewellery...)"
)

col_btn, col_api_status = st.columns([1, 4])

with col_btn:
    analyze_btn = st.button("🚀 Analyze Case", type="primary", use_container_width=True)

# Direct vs API Toggle in Sidebar
st.sidebar.markdown("---")
st.sidebar.markdown("### ⚙️ Execution Settings")
execution_mode = st.sidebar.radio(
    "Pipeline Mode:",
    ["Direct Python Import", "FastAPI Service (localhost:8000)"]
)

if analyze_btn:
    if not case_input.strip():
        st.warning("Please enter a case description narrative to analyze.")
    else:
        st.markdown("---")
        st.markdown("### ⚙️ Processing Milestones & Logs")
        
        log_container = st.empty()
        
        with st.spinner("Processing crime narrative through CrimeLens RAG Pipeline..."):
            logs = []
            
            def add_log(msg: str):
                logs.append(msg)
                log_container.info("\n".join(logs))

            try:
                add_log("🔍 Analyzing user input & extracting legal keywords...")
                add_log("📜 Searching BNS Substantive Offences Vectorstore (ChromaDB + BGE-M3)...")
                add_log("⚖️ Executing Statutory Element Verifier & Aggravated Offence Guardrails...")
                add_log("🚓 Searching BNSS Procedural Actions Vectorstore (BM25 + Dense RRF)...")
                add_log("🕵️ Querying Investigation Knowledge SOP Retriever (Category Registry)...")
                add_log("🧠 Routing prompt to Remote Qwen2.5 7B Inference Server...")

                if "FastAPI" in execution_mode:
                    api_url = "http://localhost:8000/analyze-case"
                    res = requests.post(api_url, json={"case_description": case_input}, timeout=60)
                    if res.status_code == 200:
                        result_data = res.json()
                    else:
                        st.error(f"FastAPI Server returned error: {res.status_code} - {res.text}")
                        st.stop()
                else:
                    assistant = load_assistant_pipeline()
                    result_data = assistant.process_case(case_input)

                add_log("✅ Legal Intelligence Analysis Complete!")

                # Tabbed Output Display
                st.markdown("---")
                tab_pretty, tab_json = st.tabs(["📊 Formatted Report", "📄 Raw JSON Output"])

                with tab_pretty:
                    # Summary
                    st.markdown(f"#### 📌 Case Summary\n{result_data.get('case_summary', '')}")
                    
                    col_bns, col_bnss = st.columns(2)
                    
                    with col_bns:
                        st.markdown("#### ⚖️ Possible BNS Offences")
                        for off in result_data.get("possible_offences", []):
                            conf_color = "🟢" if off.get("confidence") == "HIGH" else "🟡"
                            with st.expander(f"{conf_color} {off.get('law')} {off.get('section')} - {off.get('title')}", expanded=True):
                                st.write(f"**Reason:** {off.get('reason')}")
                                st.write(f"**Confidence:** {off.get('confidence')}")
                                st.write(f"**Explainable XAI:** _{off.get('confidence_reason')}_")

                    with col_bnss:
                        st.markdown("#### 🚓 BNSS Procedural Actions")
                        for proc in result_data.get("procedural_actions", []):
                            with st.expander(f"🟢 {proc.get('law')} {proc.get('section')}", expanded=True):
                                st.write(f"**Action Required:** {proc.get('action')}")

                    # Investigation Plan
                    st.markdown("#### 🕵️ RAG Investigation Plan")
                    plan_items = result_data.get("investigation_plan", [])
                    for i, plan in enumerate(plan_items, 1):
                        st.markdown(f"**Step {i}: [{plan.get('stage')}]**")
                        st.write(f"• **Action:** {plan.get('action')}")
                        st.write(f"• **Purpose:** {plan.get('purpose')}")
                        st.write(f"• **Evidence Generated:** `{plan.get('evidence_generated')}`")
                        st.markdown("---")

                    col_ev, col_miss = st.columns(2)
                    with col_ev:
                        st.markdown("#### 📑 Evidence Required")
                        for ev in result_data.get("evidence_required", []):
                            st.write(f"• {ev}")
                    
                    with col_miss:
                        st.markdown("#### ❓ Missing Information / Questions")
                        for mi in result_data.get("missing_information", []):
                            st.write(f"• {mi}")

                    # Sources
                    st.markdown("#### 📚 Knowledge Sources")
                    for src in result_data.get("sources", []):
                        st.caption(f"• {src}")

                with tab_json:
                    st.json(result_data)

            except Exception as e:
                st.error(f"Error during analysis: {e}")
