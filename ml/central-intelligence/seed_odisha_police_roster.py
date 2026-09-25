import os
import psycopg2
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('ml/central-intelligence/.env')
db_url = os.getenv('DATABASE_URL')

STATIONS = [
    {
        "id": "PS_BBSR_001",
        "name": "Kharavela Nagar PS",
        "district": "Khordha (Bhubaneswar)",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_BBSR_002",
        "name": "Saheed Nagar PS",
        "district": "Khordha (Bhubaneswar)",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_BBSR_003",
        "name": "Mancheswar PS",
        "district": "Khordha (Bhubaneswar)",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_BBSR_004",
        "name": "Chandrasekharpur PS",
        "district": "Khordha (Bhubaneswar)",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_CTC_001",
        "name": "Cuttack Sadar PS",
        "district": "Cuttack",
        "city": "Cuttack",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_PURI_001",
        "name": "Puri Town PS",
        "district": "Puri",
        "city": "Puri",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_SBP_001",
        "name": "Sambalpur Town PS",
        "district": "Sambalpur",
        "city": "Sambalpur",
        "state": "Odisha",
        "status": "ACTIVE"
    },
    {
        "id": "PS_RKL_001",
        "name": "Rourkela PS",
        "district": "Sundargarh",
        "city": "Rourkela",
        "state": "Odisha",
        "status": "ACTIVE"
    }
]

# Standard hashed representation or bcrypt
PASSWORD_HASH = "$2a$10$Sjngn7EsTmM7MvfHTMfkDeSho1K2DevxqmH.BgfnjioMJ0/Jme3Q6"

USERS = [
    # Statewide Super Admin
    {
        "id": "USR-HQ-001",
        "name": "Dr. Sudhanshu Sarangi, IPS",
        "role": "SUPER_ADMIN",
        "station_id": None,
        "rank_title": "Director General of Police / Commissioner",
        "email": "dgp.odishapolice@odishapolice.gov.in"
    },
    # Kharavela Nagar PS (PS_BBSR_001)
    {
        "id": "USR-KHN-001",
        "name": "Insp. Ramesh Chandra Mohanty",
        "role": "STATION_ADMIN",
        "station_id": "PS_BBSR_001",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.kharavela@odishapolice.gov.in"
    },
    {
        "id": "USR-KHN-002",
        "name": "SI Ranjan Kumar Samal",
        "role": "OFFICER",
        "station_id": "PS_BBSR_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "ranjan.samal@odishapolice.gov.in"
    },
    {
        "id": "USR-KHN-003",
        "name": "SI Priyadarshi Nayak",
        "role": "OFFICER",
        "station_id": "PS_BBSR_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "priyadarshi.n@odishapolice.gov.in"
    },
    {
        "id": "USR-KHN-004",
        "name": "ASI Soumya Ranjan Das",
        "role": "OFFICER",
        "station_id": "PS_BBSR_001",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "soumya.das@odishapolice.gov.in"
    },
    {
        "id": "USR-KHN-005",
        "name": "SI Ananya Patnaik",
        "role": "OFFICER",
        "station_id": "PS_BBSR_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "ananya.patnaik@odishapolice.gov.in"
    },
    {
        "id": "USR-KHN-006",
        "name": "SI Bikram Keshari Rout",
        "role": "OFFICER",
        "station_id": "PS_BBSR_001",
        "rank_title": "Sub-Inspector / Cyber Specialist",
        "email": "bikram.rout@odishapolice.gov.in"
    },

    # Saheed Nagar PS (PS_BBSR_002)
    {
        "id": "USR-SHN-001",
        "name": "Insp. Debasis Biswal",
        "role": "STATION_ADMIN",
        "station_id": "PS_BBSR_002",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.saheednagar@odishapolice.gov.in"
    },
    {
        "id": "USR-SHN-002",
        "name": "SI Manoj Kumar Swain",
        "role": "OFFICER",
        "station_id": "PS_BBSR_002",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "manoj.swain@odishapolice.gov.in"
    },
    {
        "id": "USR-SHN-003",
        "name": "SI Subhashree Tripathy",
        "role": "OFFICER",
        "station_id": "PS_BBSR_002",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "subhashree.t@odishapolice.gov.in"
    },
    {
        "id": "USR-SHN-004",
        "name": "ASI Pradeep Kumar Jena",
        "role": "OFFICER",
        "station_id": "PS_BBSR_002",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "pradeep.jena@odishapolice.gov.in"
    },
    {
        "id": "USR-SHN-005",
        "name": "SI Alok Kumar Barik",
        "role": "OFFICER",
        "station_id": "PS_BBSR_002",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "alok.barik@odishapolice.gov.in"
    },

    # Mancheswar PS (PS_BBSR_003)
    {
        "id": "USR-MAN-001",
        "name": "Insp. Sudhanshu Sekhar Sahoo",
        "role": "STATION_ADMIN",
        "station_id": "PS_BBSR_003",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.mancheswar@odishapolice.gov.in"
    },
    {
        "id": "USR-MAN-002",
        "name": "SI Tapan Kumar Behera",
        "role": "OFFICER",
        "station_id": "PS_BBSR_003",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "tapan.behera@odishapolice.gov.in"
    },
    {
        "id": "USR-MAN-003",
        "name": "SI Lipsa Mishra",
        "role": "OFFICER",
        "station_id": "PS_BBSR_003",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "lipsa.mishra@odishapolice.gov.in"
    },
    {
        "id": "USR-MAN-004",
        "name": "ASI Rabindra Kumar Pradhan",
        "role": "OFFICER",
        "station_id": "PS_BBSR_003",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "rabindra.pradhan@odishapolice.gov.in"
    },
    {
        "id": "USR-MAN-005",
        "name": "SI Jyoti Prakash Das",
        "role": "OFFICER",
        "station_id": "PS_BBSR_003",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "jyoti.das@odishapolice.gov.in"
    },

    # Chandrasekharpur PS (PS_BBSR_004)
    {
        "id": "USR-CSP-001",
        "name": "Insp. Prasanta Kumar Panda",
        "role": "STATION_ADMIN",
        "station_id": "PS_BBSR_004",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.csapur@odishapolice.gov.in"
    },
    {
        "id": "USR-CSP-002",
        "name": "SI Smruti Rekha Mohapatra",
        "role": "OFFICER",
        "station_id": "PS_BBSR_004",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "smruti.m@odishapolice.gov.in"
    },
    {
        "id": "USR-CSP-003",
        "name": "SI Abhash Kumar Sethi",
        "role": "OFFICER",
        "station_id": "PS_BBSR_004",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "abhash.sethi@odishapolice.gov.in"
    },
    {
        "id": "USR-CSP-004",
        "name": "ASI Niranjan Mallick",
        "role": "OFFICER",
        "station_id": "PS_BBSR_004",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "niranjan.m@odishapolice.gov.in"
    },
    {
        "id": "USR-CSP-005",
        "name": "SI Dipti Ranjan Sahu",
        "role": "OFFICER",
        "station_id": "PS_BBSR_004",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "dipti.sahu@odishapolice.gov.in"
    },

    # Cuttack Sadar PS (PS_CTC_001)
    {
        "id": "USR-CTC-001",
        "name": "Insp. Amarendra Kumar Patnaik",
        "role": "STATION_ADMIN",
        "station_id": "PS_CTC_001",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.cuttacksadar@odishapolice.gov.in"
    },
    {
        "id": "USR-CTC-002",
        "name": "SI Bimal Kumar Mahanta",
        "role": "OFFICER",
        "station_id": "PS_CTC_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "bimal.mahanta@odishapolice.gov.in"
    },
    {
        "id": "USR-CTC-003",
        "name": "SI Rasmita Sutar",
        "role": "OFFICER",
        "station_id": "PS_CTC_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "rasmita.sutar@odishapolice.gov.in"
    },
    {
        "id": "USR-CTC-004",
        "name": "ASI Chandrasekhar Parida",
        "role": "OFFICER",
        "station_id": "PS_CTC_001",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "chandra.parida@odishapolice.gov.in"
    },
    {
        "id": "USR-CTC-005",
        "name": "SI Kshirod Chandra Ray",
        "role": "OFFICER",
        "station_id": "PS_CTC_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "kshirod.ray@odishapolice.gov.in"
    },

    # Puri Town PS (PS_PURI_001)
    {
        "id": "USR-PURI-001",
        "name": "Insp. Jagannath Mishra",
        "role": "STATION_ADMIN",
        "station_id": "PS_PURI_001",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.puritown@odishapolice.gov.in"
    },
    {
        "id": "USR-PURI-002",
        "name": "SI Sanjay Kumar Tripathy",
        "role": "OFFICER",
        "station_id": "PS_PURI_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "sanjay.tripathy@odishapolice.gov.in"
    },
    {
        "id": "USR-PURI-003",
        "name": "SI Madhusmita Panda",
        "role": "OFFICER",
        "station_id": "PS_PURI_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "madhu.panda@odishapolice.gov.in"
    },
    {
        "id": "USR-PURI-004",
        "name": "ASI Gagan Bihari Acharya",
        "role": "OFFICER",
        "station_id": "PS_PURI_001",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "gagan.acharya@odishapolice.gov.in"
    },
    {
        "id": "USR-PURI-005",
        "name": "SI Bhagirathi Nayak",
        "role": "OFFICER",
        "station_id": "PS_PURI_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "bhagirathi.n@odishapolice.gov.in"
    },

    # Sambalpur Town PS (PS_SBP_001)
    {
        "id": "USR-SBP-001",
        "name": "Insp. Surendra Nath Pradhan",
        "role": "STATION_ADMIN",
        "station_id": "PS_SBP_001",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.sambalpur@odishapolice.gov.in"
    },
    {
        "id": "USR-SBP-002",
        "name": "SI Ashish Kumar Purohit",
        "role": "OFFICER",
        "station_id": "PS_SBP_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "ashish.purohit@odishapolice.gov.in"
    },
    {
        "id": "USR-SBP-003",
        "name": "SI Meenakshi Patel",
        "role": "OFFICER",
        "station_id": "PS_SBP_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "meenakshi.patel@odishapolice.gov.in"
    },
    {
        "id": "USR-SBP-004",
        "name": "ASI Hemant Kumar Bag",
        "role": "OFFICER",
        "station_id": "PS_SBP_001",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "hemant.bag@odishapolice.gov.in"
    },
    {
        "id": "USR-SBP-005",
        "name": "SI Dillip Kumar Naik",
        "role": "OFFICER",
        "station_id": "PS_SBP_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "dillip.naik@odishapolice.gov.in"
    },

    # Rourkela PS (PS_RKL_001)
    {
        "id": "USR-RKL-001",
        "name": "Insp. Arun Kumar Tirkey",
        "role": "STATION_ADMIN",
        "station_id": "PS_RKL_001",
        "rank_title": "Inspector in Charge (IIC)",
        "email": "iic.rourkela@odishapolice.gov.in"
    },
    {
        "id": "USR-RKL-002",
        "name": "SI Tapas Ranjan Ekka",
        "role": "OFFICER",
        "station_id": "PS_RKL_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "tapas.ekka@odishapolice.gov.in"
    },
    {
        "id": "USR-RKL-003",
        "name": "SI Swagatika Minz",
        "role": "OFFICER",
        "station_id": "PS_RKL_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "swagatika.minz@odishapolice.gov.in"
    },
    {
        "id": "USR-RKL-004",
        "name": "ASI Birendra Kujur",
        "role": "OFFICER",
        "station_id": "PS_RKL_001",
        "rank_title": "Asst. Sub-Inspector (ASI)",
        "email": "birendra.kujur@odishapolice.gov.in"
    },
    {
        "id": "USR-RKL-005",
        "name": "SI Sukanta Kumar Oram",
        "role": "OFFICER",
        "station_id": "PS_RKL_001",
        "rank_title": "Sub-Inspector of Police (SI)",
        "email": "sukanta.oram@odishapolice.gov.in"
    }
]

def run_seed():
    print(f"Connecting to database: {db_url[:40]}...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    now = datetime.now()

    # 1. Upsert Police Stations
    print(f"Cleaning legacy stations and seeding {len(STATIONS)} Police Stations...")
    cur.execute("DELETE FROM police_stations WHERE id LIKE 'OP-%';")
    for st in STATIONS:
        cur.execute("""
            INSERT INTO police_stations (id, name, district, city, state, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                district = EXCLUDED.district,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                status = EXCLUDED.status,
                updated_at = EXCLUDED.updated_at;
        """, (st["id"], st["name"], st["district"], st["city"], st["state"], st["status"], now, now))
    
    conn.commit()
    print("Police Stations upserted successfully.")

    # 2. Upsert Users
    print(f"Clearing old demo users and seeding {len(USERS)} Odisha Police Officers...")
    cur.execute("DELETE FROM users WHERE id IN ('OP-HQ-001', 'IIC-BBSR-01', 'INV-BBSR-001', 'INV-BBSR-002', 'IIC-CTC-01', 'INV-CTC-001');")
    for u in USERS:
        cur.execute("""
            INSERT INTO users (id, name, role, station_id, rank_title, email, password_hash, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                station_id = EXCLUDED.station_id,
                rank_title = EXCLUDED.rank_title,
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                status = EXCLUDED.status,
                updated_at = EXCLUDED.updated_at;
        """, (u["id"], u["name"], u["role"], u["station_id"], u["rank_title"], u["email"], PASSWORD_HASH, "ACTIVE", now, now))

    conn.commit()
    print("Officers and Station Admins seeded successfully.")

    cur.execute("SELECT COUNT(*) FROM users;")
    user_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM police_stations WHERE id LIKE 'PS_%';")
    st_cnt = cur.fetchone()[0]
    print(f"Verification: Total Users in DB: {user_cnt}, Total Active Target Stations: {st_cnt}")

    conn.close()

if __name__ == "__main__":
    run_seed()
