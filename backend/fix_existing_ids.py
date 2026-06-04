import re
from sqlalchemy.orm import Session
from database import SessionLocal
from models import GlobalUser
from id_generator import generate_structured_id

ID_PATTERN = r"^[A-Z]{4}-\d{4}-\d{4}$"

def fix_ids():
    db = SessionLocal()
    try:
        users = db.query(GlobalUser).all()
        fixed_count = 0
        
        for user in users:
            current_id = user.external_id
            
            # If ID is missing, doesn't match the new structured format, or is a generic 'USER' prefix
            if not current_id or not re.match(ID_PATTERN, current_id) or current_id.startswith("USER-"):
                # Only generate if the user is verified or has a role
                if user.status == 'verified' or user.role_context:
                    role_name = user.role_context or "User"
                    try:
                        new_id = generate_structured_id(db, role_name)
                        user.external_id = new_id
                        print(f"Fixed User {user.email}: {current_id} -> {new_id}")
                        fixed_count += 1
                    except Exception as e:
                        print(f"Error generating ID for {user.email}: {e}")
        
        db.commit()
        print(f"Total IDs fixed/generated: {fixed_count}")
    except Exception as e:
        print(f"Migration Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_ids()
