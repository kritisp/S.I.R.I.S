import json
from app.services.nlp.spacy_extractor import get_spacy_status
from app.services.graph.graph_intelligence_service import graph_intelligence_service

sample_fir = "On 22.08.2026, complainant Smt. Gita Rani Dash reported that suspect Rahul Kumar Sahoo stole vehicle OD-02-AK-4455 at Saheed Nagar, Bhubaneswar. Suspect phone +91-9876543210 and UPI suspect.mule@okaxis were used."

print("=== SPACY NER LOADED DIAGNOSTIC STATUS ===")
print(json.dumps(get_spacy_status(), indent=2))

result = graph_intelligence_service.extract_entities(sample_fir)

print("\n=== PIPELINE EXECUTION METADATA ===")
print(f"spacy_active : {result['spacy_active']}")
print(f"model_used   : {result['model_used']}")
print(f"duration_ms  : {result['duration_ms']} ms")
print(f"tiers        : {result['tiers']}")

print("\n=== EXTRACTED ENTITIES BREAKDOWN ===")
print(f"{'METHOD':<12} | {'TYPE':<12} | {'VALUE':<25} | {'NORMALIZED VALUE':<25} | {'SPAN (START-END)'}")
print("-" * 95)
for e in result['entities']:
    print(f"{e['method']:<12} | {e['type']:<12} | {e['value']:<25} | {e['normalized_value']:<25} | {e['start_char']}-{e['end_char']}")

print("\n=== FULL JSON RESPONSE ===")
print(json.dumps(result, indent=2))
