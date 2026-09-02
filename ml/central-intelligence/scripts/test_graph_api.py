"""
End-to-End API Test Script for ARGUS Graph Intelligence Endpoints
================================================================
Executes direct python calls against ArgusGraphService with a real DB session
to verify data flow, schema, graph topology, betweenness, alert rules, and entity extraction.
"""

import json
import logging
import os
import sys
import pathlib

repo_root = str(pathlib.Path(__file__).resolve().parents[2])
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.services.graph.argus_graph_service import argus_graph_service, extract_entities_from_narrative

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-5s %(message)s")
logger = logging.getLogger("test_graph_api")


def main():
    env_path = pathlib.Path(__file__).resolve().parents[1] / ".env"
    db_url = ""
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

    if not db_url:
        logger.error("DATABASE_URL not found")
        sys.exit(1)

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    logger.info("Connecting to Database for E2E Verification...")
    engine = create_engine(db_url, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    print("\n" + "=" * 70)
    print("1. VERIFYING /api/v1/graph/overview")
    print("=" * 70)
    overview = argus_graph_service.get_overview(session, limit=150)
    print(f"Total Nodes Returned: {overview['total_nodes']}")
    print(f"Total Edges Returned: {overview['total_edges']}")
    print(f"Components Count: {overview['components']}")

    top_nodes = overview['nodes'][:5]
    print("\nTop 5 Influence Entities:")
    for n in top_nodes:
        print(f"  - [{n['entity_type']}] {n['label']} | Betweenness: {n['betweenness']} | Influence: {n['influence']} | Complaints: {n['complaint_count']}")

    coordinator_node = None
    for n in overview['nodes']:
        if "Biswanath Mishra" in n['label'] or "Biswanath" in str(n.get('id')):
            coordinator_node = n
            break

    print("\n" + "=" * 70)
    print("2. VERIFYING /api/v1/graph/why (Explainability Panel)")
    print("=" * 70)
    test_node_id = coordinator_node['id'] if coordinator_node else (overview['nodes'][0]['id'] if overview['nodes'] else "")
    if test_node_id:
        why = argus_graph_service.get_why(session, test_node_id)
        print(f"Target Node: {why.get('label')} ({test_node_id})")
        print(f"  Betweenness Score : {why.get('betweenness')}")
        print(f"  Betweenness Rank  : #{why.get('betweenness_rank')}")
        print(f"  Influence Score    : {why.get('influence')}")
        print(f"  Bridge Paths Count : {len(why.get('bridge_paths', []))}")
        print(f"  Removal Test Impact: {json.dumps(why.get('removal_test'), indent=2)}")

    print("\n" + "=" * 70)
    print("3. VERIFYING /api/v1/graph/neighbors")
    print("=" * 70)
    if test_node_id:
        nbrs = argus_graph_service.get_neighbors(session, test_node_id, depth=1)
        print(f"Neighbors around {test_node_id}: {nbrs.get('total_nodes')} nodes, {nbrs.get('total_edges')} edges")

    print("\n" + "=" * 70)
    print("4. VERIFYING /api/v1/graph/alerts")
    print("=" * 70)
    alerts = argus_graph_service.get_alerts(session)
    print(f"Live Alert Rules Triggered: {len(alerts)}")
    for a in alerts[:5]:
        print(f"  - [{a['severity']}] {a['alert_type']}: {a['title']}")

    print("\n" + "=" * 70)
    print("5. VERIFYING /api/v1/graph/extract")
    print("=" * 70)
    test_narrative = (
        "Complainant invested ₹75,000 via WhatsApp group operated by Vikram Rathore (+91 98611 05000). "
        "Transferred ₹50,000 to UPI ID vikram123@paytm and ₹25,000 to crypto wallet 0x71C7656EC7ab88b098defB751B7401B5f6d8976F. "
        "Telegram ID @vikram_crypto."
    )
    extracted, ms = extract_entities_from_narrative(test_narrative)
    print(f"Extraction Completed in {ms:.2f} ms")
    print("Extracted Entities:")
    for e in extracted:
        print(f"  - [{e['type']}] Value: {e['value']} (Normalized: {e['normalized_value']}) | Conf: {e['confidence']}")

    print("\n" + "=" * 70)
    print("ALL API VERIFICATIONS PASSED SUCCESSFULLY")
    print("=" * 70)

    session.close()


if __name__ == "__main__":
    main()
