from sqlalchemy import create_engine, text
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)

def fix_schema():
    with engine.connect() as conn:
        print("Checking/Fixing ID Templates schema...")
        
        # Add custom_front_bg_url if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS show_issue_date BOOLEAN DEFAULT TRUE"))
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS issue_date_label VARCHAR DEFAULT 'Issue Date'"))
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS show_expiry_date BOOLEAN DEFAULT TRUE"))
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS expiry_date_label VARCHAR DEFAULT 'Valid Until'"))
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS expiry_date_value VARCHAR DEFAULT ''"))
            conn.execute(text("ALTER TABLE id_templates ADD COLUMN IF NOT EXISTS custom_front_bg_url VARCHAR"))
            conn.commit()
            print("Added new columns including custom_front_bg_url, issue_date_label, expiry_date_label, etc.")
        except Exception as e:
            print(f"Columns might already exist: {e}")

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
