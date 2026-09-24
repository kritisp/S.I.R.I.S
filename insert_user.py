import os
import secrets
import psycopg2
import bcrypt

# No hardcoded default password (was 'admin' — a real credential-exposure risk for a
# law-enforcement platform). Set ADMIN_SEED_PASSWORD explicitly to seed a known
# password (e.g. for a fresh local dev DB); otherwise a strong random one is generated
# and printed once so you can log in and change it.
seed_password = os.getenv("ADMIN_SEED_PASSWORD")
if not seed_password:
    seed_password = secrets.token_urlsafe(16)
    print(f"ADMIN_SEED_PASSWORD not set — generated a random password: {seed_password}")
    print("Save this now; it will not be shown again. Log in and change it immediately.")

salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(seed_password.encode('utf-8'), salt).decode('utf-8')

db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/postgres")
conn = psycopg2.connect(db_url)
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
