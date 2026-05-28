from database import SessionLocal
from models import GlobalUser

db = SessionLocal()
all_users = db.query(GlobalUser).all()

print(f"Total users in DB: {len(all_users)}")
for u in all_users:
    if u.id == 169 or "169" in str(u.id):
        print(f"FOUND MATCH: ID={u.id}, Email={u.email}")
    if u.id > 100:
         print(f"High ID found: {u.id}")

db.close()
