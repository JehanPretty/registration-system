from database import SessionLocal
from models import GlobalUser

db = SessionLocal()
users = db.query(GlobalUser).all()

for u in users:
    print(f"ID={u.id}, Email={u.email}, Name={u.name}")

db.close()
