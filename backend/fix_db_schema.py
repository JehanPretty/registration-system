from sqlalchemy import create_engine, text
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)

def fix_schema():
    with engine.connect() as conn:
        print("Checking/Fixing ID Templates schema...")
        
        # Add custom_front_bg_url if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS custom_front_bg_url VARCHAR"))
            conn.commit()
            print("Added custom_front_bg_url column.")
        except Exception as e:
            print(f"Column custom_front_bg_url might already exist: {e}")

        # Change font size columns to FLOAT
        try:
            conn.execute(text("ALTER TABLE id_templates ALTER COLUMN header_font_size TYPE FLOAT USING header_font_size::float"))
            conn.execute(text("ALTER TABLE id_templates ALTER COLUMN institution_font_size TYPE FLOAT USING institution_font_size::float"))
            conn.execute(text("ALTER TABLE id_templates ALTER COLUMN subtitle_font_size TYPE FLOAT USING subtitle_font_size::float"))
            conn.commit()
            print("Converted font size columns to FLOAT.")
        except Exception as e:
            print(f"Error converting columns: {e}")

if __name__ == "__main__":
    fix_schema()
