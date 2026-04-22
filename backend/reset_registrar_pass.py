from database import SessionLocal
from models import GlobalUser
from auth_utils import get_password_hash

db = SessionLocal()
email = "staff@registrar.com"
new_password = "Password123!"

try:
    user = db.query(GlobalUser).filter(GlobalUser.email == email).first()
    if user:
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        print(f"Successfully reset password for {email} to: {new_password}")
    else:
        print(f"User {email} not found.")
finally:
    db.close()
