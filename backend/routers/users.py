from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import GlobalUser
from pydantic import BaseModel
import json

router = APIRouter(prefix="/users", tags=["users"])


# Pydantic model
class UserCreate(BaseModel):
    external_id: str
    source: str
    display_name: str
    role_context: str
    attributes: dict


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = GlobalUser(
        external_id=user.external_id,
        source=user.source,
        display_name=user.display_name,
        role_context=user.role_context,
        attributes=user.attributes,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
