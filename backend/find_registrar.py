from database import SessionLocal
from models import GlobalUser

db = SessionLocal()
try:
    users = db.query(GlobalUser).filter(GlobalUser.role_context == 'Registrar Staff').all()
    if not users:
        print("No Registrar Staff users found.")
    for user in users:
        print(f"Email: {user.email}, Name: {user.name}")
finally:
    db.close()
