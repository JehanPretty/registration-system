# /tmp/check_db.py
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
from models import GlobalUser
import uuid

def check_and_create():
    db = SessionLocal()
    try:
        user = db.query(GlobalUser).filter(GlobalUser.id == 1).first()
        if user:
            print(f"User 1 exists: {user.name} ({user.email}), Avatar: {user.avatar_url}")
        else:
            print("User 1 does not exist. Creating default admin...")
            new_user = GlobalUser(
                id=1,
                global_id=uuid.uuid4(),
                name="Jehan Macararic",
                email="jehan.macararic@philceb.ph",
                avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574&auto=format&fit=crop"
            )
            db.add(new_user)
            db.commit()
            print("Default admin created.")
    finally:
        db.close()

if __name__ == "__main__":
    check_and_create()
