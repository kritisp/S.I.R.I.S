from typing import List, Dict, Any


class InvestigationPlanner:
    """
    Converts retrieved RAG investigation knowledge guidelines into structured investigation_plan items.
    """
    def __init__(self):
        pass

    def generate_plan(self, retrieved_guidelines: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Formats retrieved guideline docs into structured investigation plan items:
        [
          {
            "stage": "Crime Scene Examination",
            "action": "Inspect entry and exit points",
            "purpose": "Identify method of entry",
            "evidence_generated": "Scene photographs and forensic evidence"
          }
        ]
        """
        plan_items: List[Dict[str, str]] = []
        seen_actions = set()

        for doc_item in retrieved_guidelines:
            meta = doc_item.get("metadata", {})
            stage = meta.get("investigation_stage", "Field Investigation")
            action = meta.get("action_type", "Inspect crime scene and record statements")
            purpose = meta.get("purpose", "Gather evidence and establish timeline")
            evidence_generated = meta.get("evidence_generated", "Physical and documentary evidence")

            action_key = action.lower()[:30]
            if action_key in seen_actions:
                continue
            seen_actions.add(action_key)

            plan_items.append({
                "stage": stage,
                "action": action,
                "purpose": purpose,
                "evidence_generated": evidence_generated
            })

        return plan_items


if __name__ == "__main__":
    planner = InvestigationPlanner()
    mock_guidelines = [
        {
            "metadata": {
                "investigation_stage": "Crime Scene Examination",
                "action_type": "Inspect entry and exit points of the premises (doors, windows, roof, locks).",
                "purpose": "Identify method of entry, forced entry marks, or tool marks used by housebreakers.",
                "evidence_generated": "Scene photographs, tool mark impressions, lock defect notes."
            }
        }
    ]
    res = planner.generate_plan(mock_guidelines)
    print("\n--- Generated Investigation Plan Items ---")
    print(res)
