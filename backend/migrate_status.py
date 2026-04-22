from sqlalchemy import create_engine, text
DATABASE_URL = "postgresql+psycopg2://postgres:Jehan%40123@127.0.0.1/registration_system"
engine = create_engine(DATABASE_URL)
try:
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE global_user ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT \'pending\';'))
        conn.commit()
    print("Migration successful: Added 'status' column to 'global_user' table.")
except Exception as e:
    print(f"Migration error: {e}")
