import psycopg2

conn = psycopg2.connect('postgresql://postgres:Pf7eqEttsmsw8Jdt@db.pbhhuilzqlnwsalgcvbn.supabase.co:5432/postgres')
cur = conn.cursor()

# Drop existing tables to fix schema issues
cur.execute("""
DROP TABLE IF EXISTS intelligence_alerts CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS evidence_extracted_entities CASCADE;
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS case_extracted_entities CASCADE;
DROP TABLE IF EXISTS case_linked_ids CASCADE;
DROP TABLE IF EXISTS case_cctv_refs CASCADE;
DROP TABLE IF EXISTS case_evidence_refs CASCADE;
DROP TABLE IF EXISTS case_locations CASCADE;
DROP TABLE IF EXISTS case_vehicles CASCADE;
DROP TABLE IF EXISTS case_suspects CASCADE;
DROP TABLE IF EXISTS case_bns_sections CASCADE;
DROP TABLE IF EXISTS case_records CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS police_stations CASCADE;
""")

with open('backend/src/main/resources/schema-postgresql.sql', 'r') as f:
    sql = f.read()

cur.execute(sql)
conn.commit()
cur.close()
conn.close()
print('Recreated schema successfully.')
