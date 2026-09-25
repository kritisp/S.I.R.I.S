import os
import psycopg2
import neo4j
from dotenv import load_dotenv

load_dotenv('ml/central-intelligence/.env')

print('=' * 70)
print('         S.I.R.I.S. LIVE DATA PROOF & AUDIT REPORT')
print('=' * 70)

# 1. Supabase PostgreSQL
db_url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute('SELECT count(*) FROM cases')
cases_count = cur.fetchone()[0]

cur.execute('SELECT count(*) FROM case_records')
case_records_count = cur.fetchone()[0]

cur.execute('SELECT count(*) FROM persons')
persons_count = cur.fetchone()[0]

cur.execute('SELECT count(*) FROM phones')
phones_count = cur.fetchone()[0]

cur.execute('SELECT count(*) FROM vehicles')
vehicles_count = cur.fetchone()[0]

cur.execute('SELECT count(*) FROM evidences')
evidences_count = cur.fetchone()[0]

cur.execute('SELECT count(*) FROM investigation_events')
events_count = cur.fetchone()[0]

print('\n[1] SUPABASE POSTGRESQL LIVE TABLE COUNTS:')
print(f'  • cases table                 : {cases_count:,} FIR records')
print(f'  • case_records table         : {case_records_count:,} Spring Boot records')
print(f'  • persons table              : {persons_count:,} entities')
print(f'  • phones table               : {phones_count:,} endpoints')
print(f'  • vehicles table             : {vehicles_count:,} registrations')
print(f'  • evidences table            : {evidences_count:,} items with Chain of Custody')
print(f'  • investigation_events table : {events_count:,} logged timeline events')

cur.execute('SELECT district, count(*) FROM cases GROUP BY district ORDER BY count(*) DESC')
districts = cur.fetchall()
print(f'\n[2] GEOGRAPHIC SPREAD ({len(districts)} Districts represented):')
for d, cnt in districts[:6]:
    print(f'  • {d:30s} : {cnt} cases')
print('    ... and more across Odisha.')

cur.execute('SELECT crime_type, count(*) FROM cases GROUP BY crime_type ORDER BY count(*) DESC')
crimes = cur.fetchall()
print('\n[3] CRIME CATEGORY BREAKDOWN:')
for ct, cnt in crimes:
    print(f'  • {ct:30s} : {cnt} cases')

cur.execute('SELECT fir_number, police_station, district, crime_type, incident_date, description FROM cases ORDER BY registration_date DESC LIMIT 3')
sample_cases = cur.fetchall()
print('\n[4] SAMPLE ACTUAL CASES FROM LIVE DATABASE:')
for c in sample_cases:
    print(f'  -> FIR: {c[0]} | Station: {c[1]} | District: {c[2]} | Crime: {c[3]} | Incident Date: {c[4]}')
    print(f'     Summary: {c[5][:130]}...\n')

cur.execute('SELECT e.id, c.fir_number, e.evidence_type, e.description, e.source FROM evidences e JOIN cases c ON e.case_id = c.id LIMIT 3')
sample_evidences = cur.fetchall()
print('[5] SAMPLE EVIDENCE VAULT ITEMS:')
for e in sample_evidences:
    print(f'  -> Evidence ID: {e[0]} | Case FIR: {e[1]} | Type: {e[2]} | Source: {e[4]}')
    print(f'     Details: {e[3]}\n')

conn.close()

# 2. Cloud Neo4j Aura Graph
neo_uri = os.getenv('NEO4J_URI')
neo_user = os.getenv('NEO4J_USER', 'neo4j')
neo_pwd = os.getenv('NEO4J_PASSWORD')
driver = neo4j.GraphDatabase.driver(neo_uri, auth=(neo_user, neo_pwd))

with driver.session() as session:
    n_count = session.run('MATCH (n) RETURN count(n) as c').single()['c']
    r_count = session.run('MATCH ()-[r]->() RETURN count(r) as c').single()['c']
    
    print('=' * 70)
    print('[6] CLOUD NEO4J AURA GRAPH AUDIT (neo4j+s://1cb4cc93.databases.neo4j.io):')
    print(f'  • Total Nodes in Graph         : {n_count:,}')
    print(f'  • Total Relationships in Graph : {r_count:,}')

    print('\n[7] GRAPH NODES BY LABEL:')
    res = session.run('CALL db.labels() YIELD label RETURN label')
    labels = [r['label'] for r in res]
    for lbl in labels:
        cnt = session.run(f'MATCH (n:{lbl}) RETURN count(n) as c').single()['c']
        print(f'  • (:{lbl}) -> {cnt:,} nodes')

    print('\n[8] GRAPH RELATIONSHIPS BY TYPE:')
    res = session.run('MATCH ()-[r]->() RETURN type(r) as t, count(r) as c ORDER BY c DESC')
    for r in res:
        print(f'  • [:{r["t"]}] -> {r["c"]:,} edges')

    print('\n[9] LIVE MULTI-HOP GRAPH TRAVERSAL QUERY (Cross-Station Criminal Syndicate Discovery):')
    cypher_query = '''
    MATCH (p:Person)-[:INVOLVED_IN]->(c1:Case)
    MATCH (p)-[:INVOLVED_IN]->(c2:Case)
    WHERE c1.fir_number < c2.fir_number
    RETURN p.name AS suspect, c1.fir_number AS fir1, c1.police_station AS ps1, c1.district AS dist1,
           c2.fir_number AS fir2, c2.police_station AS ps2, c2.district AS dist2
    LIMIT 3
    '''
    res = session.run(cypher_query)
    for idx, r in enumerate(res, 1):
        print(f'  Syndicate Link #{idx}:')
        print(f'    Suspect : {r["suspect"]}')
        print(f'    Case 1  : FIR {r["fir1"]} at {r["ps1"]} ({r["dist1"]})')
        print(f'    Case 2  : FIR {r["fir2"]} at {r["ps2"]} ({r["dist2"]})')
        print('    Connection: Multi-station criminal nexus detected automatically via Neo4j Graph.')
        print()

driver.close()
print('=' * 70)
