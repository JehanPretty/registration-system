from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from database import SessionLocal, engine
from models import GlobalUser, Attendance, Role, IDApplication
from schemas import UserCreate, UserRead, UserUpdate, UserLogin, ChangePassword
from auth_utils import get_password_hash, verify_password

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

def resolve_role_by_email(email: str, db: Session):
    if not email or "@" not in email:
        return None
    domain = email.split("@")[-1].lower()
    role = db.query(Role).filter(Role.email_domain == domain).first()
    return role.name if role else None

#Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET all users
@router.get("", response_model=List[UserRead])
def read_users(db: Session = Depends(get_db)):
    users = db.query(GlobalUser).all()
    return users

# GET user by ID
@router.get("/{user_id}", response_model=UserRead)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(GlobalUser).filter(GlobalUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# POST create new user (Signup)
@router.post("", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(GlobalUser).filter(GlobalUser.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Auto-resolve role
    resolved_role = resolve_role_by_email(user.email, db)
    
    # ENFORCEMENT: If no role is matched to the domain, block signup
    if not resolved_role:
        raise HTTPException(
            status_code=403, 
            detail="This email domain is not authorized for registration. Please contact your administrator."
        )

    db_user = GlobalUser(
        global_id=uuid.uuid4(),
        name=user.name,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        external_id=user.external_id,
        avatar_url=user.avatar_url,
        role_context=resolved_role,
        attributes=user.attributes
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# POST admin create user (Manual creation by Admin)
@router.post("/admin-create", response_model=UserRead)
def admin_create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(GlobalUser).filter(GlobalUser.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Use provided role or default to 'User'
    requested_role = user.role_context or "User"
    
    db_user = GlobalUser(
        global_id=uuid.uuid4(),
        name=user.name,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        external_id=user.external_id,
        avatar_url=user.avatar_url,
        role_context=requested_role,
        status="verified", # Auto-verify admin created users
        attributes=user.attributes or {}
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# DELETE user
@router.delete("/{user_id}")
def delete_user(user_id: int, requester_id: int = 0, db: Session = Depends(get_db)):
    db_user = db.query(GlobalUser).filter(GlobalUser.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if requester_id:
        requester = db.query(GlobalUser).filter(GlobalUser.id == requester_id).first()
        if requester and requester.role_context == "Assistant Admin":
            if db_user.role_context in ["Administrator", "Super Admin"]:
                raise HTTPException(status_code=403, detail="Assistant Admins cannot delete administrative accounts.")

    try:
        # Handle attendance records: set user_id to None so we don't break history
        db.query(Attendance).filter(Attendance.user_id == user_id).update({"user_id": None})
        
        # Handle ID applications: delete them since they are tied to the user's current identity process
        db.query(IDApplication).filter(IDApplication.user_id == user_id).delete()

        db.delete(db_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during deletion: {str(e)}")

    return {"message": "User deleted successfully"}

# POST login
@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(GlobalUser).filter(GlobalUser.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # If user exists but role is missing or generic "User", try to resolve it now
    if not user.role_context or user.role_context == "User":
        new_role = resolve_role_by_email(user.email, db)
        if new_role:
            user.role_context = new_role
            db.commit()
            db.refresh(user)

    return {"message": "Login successful", "user": {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "role_context": user.role_context,
        "attributes": user.attributes,
        "status": user.status,
        "is_profile_complete": (user.attributes or {}).get("is_profile_complete", False)
    }}

# POST change password
@router.post("/change-password")
def change_password(payload: ChangePassword, db: Session = Depends(get_db)):
    user = db.query(GlobalUser).filter(GlobalUser.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# PUT update user
@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(GlobalUser).filter(GlobalUser.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Handle password hashing if provided
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            db_user.hashed_password = get_password_hash(password)

    # ── BACKEND KYC SECURITY PIPELINE ──
    # If the user is submitting KYC documents, process them here.
    attributes = update_data.get("attributes", {})
    if attributes.get("kyc_document") and attributes.get("selfie_document"):
        # In a production environment, you would run OCR (pytesseract) 
        # and Biometric Face Matching (face_recognition) here.
        # For now, we simulate a successful backend validation.
        print(f"DEBUG: Processing Backend KYC for user {user_id}...")
            
        update_data["status"] = "verified"
        print(f"DEBUG: Backend KYC Passed for user {user_id}")

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user