from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        try:
            # Add columns to roles table
            conn.execute(text("ALTER TABLE roles ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'PH'"))
            conn.execute(text("ALTER TABLE roles ADD COLUMN IF NOT EXISTS institution_code VARCHAR(5) DEFAULT 'GEN'"))
            conn.commit()
            print("Updated 'roles' table with new columns.")
        except Exception as e:
            print(f"Roles table update error: {e}")

        try:
            # Create id_sequences table if not exists (create_all should handle this if called in main, 
            # but let's be sure since we need the index)
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS id_sequences (
                id SERIAL PRIMARY KEY,
                institution_code VARCHAR,
                year_month VARCHAR,
                last_sequence INTEGER DEFAULT 0
            )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_id_sequences_inst_ym ON id_sequences (institution_code, year_month)"))
            conn.commit()
            print("Ensured 'id_sequences' table exists.")
        except Exception as e:
            print(f"ID Sequences table creation error: {e}")

if __name__ == "__main__":
    migrate()
