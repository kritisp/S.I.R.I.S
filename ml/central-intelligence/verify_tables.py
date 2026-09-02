from app.database.postgres import engine
from sqlalchemy import text

with engine.connect() as conn:
    cols = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='cases'")).scalars().all()
    print("Table 'cases' Columns:", cols)
