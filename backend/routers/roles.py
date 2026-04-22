from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal
from models import Role
from schemas import RoleCreate, RoleRead

router = APIRouter(
    prefix="/roles",
    tags=["roles"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[RoleRead])
def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

@router.post("/", response_model=RoleRead)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    db_role = Role(**role.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@router.get("/resolve", response_model=Optional[RoleRead])
def resolve_role(email: str, db: Session = Depends(get_db)):
    """Resolve role by email domain. Pass email as a query param: /roles/resolve?email=user@domain.com"""
    if "@" not in email:
        return None
    domain = email.split("@")[-1].lower()
    # Search for a role that matches this domain
    role = db.query(Role).filter(Role.email_domain == domain).first()
    return role

@router.put("/{role_id}", response_model=RoleRead)
def update_role(role_id: int, role_update: RoleCreate, db: Session = Depends(get_db)):
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    for key, value in role_update.dict().items():
        setattr(db_role, key, value)
    
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(db_role)
    db.commit()
    return {"message": "Role deleted"}
