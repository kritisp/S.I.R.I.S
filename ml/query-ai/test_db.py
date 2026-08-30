import os
import sqlite3

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "crimelens.db"))
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("""
    SELECT fir_number FROM entities WHERE value = 'MH-04-XT-2291'
""")
print(cur.fetchall())  # should show FIR-541, FIR-542, FIR-301