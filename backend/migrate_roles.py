import psycopg2
from database import DATABASE_URL

def migrate():
    # Parse the DATABASE_URL manually as it's a simple postgres URL or use sqlalchemy
    # but direct psycopg2 is often easier for one-off DDL if we have the string.
    # The URL is: postgresql+psycopg2://postgres:Jehan%40123@127.0.0.1/registration_system
    
    # Let's use sqlalchemy engine to be safer
    from database import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        print("Checking roles table for email_domain column...")
        try:
            conn.execute(text("ALTER TABLE roles ADD COLUMN email_domain VARCHAR"))
            conn.commit()
            print("Successfully added email_domain column to roles table.")
        except Exception as e:
            if "already exists" in str(e):
                print("Column email_domain already exists.")
            else:
                print(f"Error migrating: {e}")

if __name__ == "__main__":
    migrate()
