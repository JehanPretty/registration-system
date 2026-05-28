from database import SessionLocal
from models import GlobalUser

db = SessionLocal()
users = db.query(GlobalUser).all()
print(f"IDs in DB: {[u.id for u in users]}")
db.close()
