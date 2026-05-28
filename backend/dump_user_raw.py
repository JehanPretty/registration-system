from database import SessionLocal
from models import GlobalUser
import json

db = SessionLocal()
user = db.query(GlobalUser).filter(GlobalUser.id == 169).first()

if user:
    print(f"User ID: {user.id}")
    print(f"RAW Attributes: {json.dumps(user.attributes, indent=2)}")
else:
    print("User 169 not found.")

db.close()
