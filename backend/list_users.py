from database import SessionLocal
from models import GlobalUser

db = SessionLocal()
users = db.query(GlobalUser).order_by(GlobalUser.id.desc()).limit(5).all()

for u in users:
    print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}")

db.close()
