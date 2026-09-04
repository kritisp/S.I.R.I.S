import psycopg2
import bcrypt

salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(b'admin', salt).decode('utf-8')

conn = psycopg2.connect('postgresql://postgres:Pf7eqEttsmsw8Jdt@db.pbhhuilzqlnwsalgcvbn.supabase.co:5432/postgres')
cur = conn.cursor()

# Insert Station
cur.execute("""
INSERT INTO police_stations (id, name, district, city, state, status, created_at, updated_at) 
VALUES ('STA-BBSR', 'Bhubaneswar Capital PS', 'Khurda', 'Bhubaneswar', 'Odisha', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
""")

# Insert User
cur.execute("""
INSERT INTO users (id, name, role, station_id, rank_title, email, password_hash, status, created_at, updated_at) 
VALUES ('admin', 'Admin Officer', 'SUPER_ADMIN', 'STA-BBSR', 'Inspector', 'admin@odishapolice.gov.in', %s, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
""", (password_hash,))

conn.commit()
cur.close()
conn.close()
print('Inserted User and Station.')
