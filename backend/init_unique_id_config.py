from sqlalchemy.orm import Session
from database import SessionLocal
from models import Role

def init_config():
    db = SessionLocal()
    try:
        # Update existing roles with some default codes for testing
        roles = db.query(Role).all()
        for role in roles:
            if role.name == "Student":
                role.institution_code = "ABC"
                role.country_code = "PH"
            elif role.name == "Administrator":
                role.institution_code = "ABC"
                role.country_code = "PH"
            else:
                role.institution_code = "GEN"
                role.country_code = "PH"
        
        db.commit()
        print("Successfully initialized Role codes for Unique ID system.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_config()
