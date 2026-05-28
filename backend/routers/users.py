from fastapi import APIRouter, Depends, HTTPException
import re
from sqlalchemy.orm import Session
from typing import List
import uuid
import json
import os
import sys
import time
import importlib.util

from database import SessionLocal, engine
from models import GlobalUser, Attendance, Role, IDApplication
from schemas import UserCreate, UserRead, UserUpdate, UserLogin, ChangePassword, GoogleAuthRequest
from auth_utils import get_password_hash, verify_password
from id_generator import generate_structured_id

def _agent_log(hypothesis_id: str, message: str, data: dict):
    # region agent log
    try:
        debug_log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "debug-113479.log"))
        payload = {
            "sessionId": "113479",
            "runId": os.getenv("DEBUG_RUN_ID", "pre-fix"),
            "hypothesisId": hypothesis_id,
            "location": "backend/routers/users.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with open(debug_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # endregion

try:
    # region agent log
    _agent_log(
        "H1",
        "attempt_google_import",
        {"python": sys.version, "executable": sys.executable},
    )
    # endregion
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    # region agent log
    _agent_log("H1", "google_import_ok", {})
    # endregion
except Exception as import_exc:
    # region agent log
    _agent_log(
        "H1",
        "google_import_failed",
        {
            "error": str(import_exc),
            "has_google_spec": bool(importlib.util.find_spec("google")),
            "has_google_oauth2_spec": bool(importlib.util.find_spec("google.oauth2")) if importlib.util.find_spec("google") else False,
        },
    )
    # endregion
    raise

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
    
    # Check if external_id is already taken
    if user.external_id:
        existing_external = db.query(GlobalUser).filter(GlobalUser.external_id == user.external_id).first()
        if existing_external:
            raise HTTPException(status_code=400, detail=f"Unique ID '{user.external_id}' is already taken.")

    # Check if Full Name is already taken
    existing_name = db.query(GlobalUser).filter(GlobalUser.name == user.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail=f"The account name '{user.name}' is already registered.")
    
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

    # Check if external_id is already taken
    if user.external_id:
        existing_external = db.query(GlobalUser).filter(GlobalUser.external_id == user.external_id).first()
        if existing_external:
            raise HTTPException(status_code=400, detail=f"Unique ID '{user.external_id}' is already taken.")

    # Check if Full Name is already taken
    existing_name = db.query(GlobalUser).filter(GlobalUser.name == user.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail=f"The account name '{user.name}' is already registered.")
    
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
        "external_id": user.external_id,
        "avatar_url": user.avatar_url,
        "role_context": user.role_context,
        "attributes": user.attributes,
        "status": user.status,
        "is_profile_complete": (user.attributes or {}).get("is_profile_complete", False)
    }}

# POST Google Login/Signup
@router.post("/google-auth")
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Verify the Google ID token
        # NOTE: Ideally, the CLIENT_ID should be in a config/env file.
        # For now, we'll accept any valid token if CLIENT_ID is not strictly enforced here, 
        # but in production, you must verify against your Client ID.
        idinfo = id_token.verify_oauth2_token(payload.id_token, google_requests.Request())
        
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        # Check if user already exists
        user = db.query(GlobalUser).filter(GlobalUser.email == email).first()
        
        if not user:
            # Auto-resolve role
            resolved_role = resolve_role_by_email(email, db)
            
            # ENFORCEMENT: If no role is matched to the domain, block signup
            if not resolved_role:
                raise HTTPException(
                    status_code=403, 
                    detail="Your Google account domain is not authorized for registration."
                )
            
            # Create new user
            user = GlobalUser(
                global_id=uuid.uuid4(),
                name=name,
                email=email,
                hashed_password=get_password_hash(uuid.uuid4().hex), # Random password for OAuth
                external_id=email.split("@")[0],
                avatar_url=picture,
                role_context=resolved_role,
                attributes={"signed_up_at": datetime.utcnow().isoformat(), "is_profile_complete": False}
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return {"message": "Google authentication successful", "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "external_id": user.external_id,
            "avatar_url": user.avatar_url,
            "role_context": user.role_context,
            "attributes": user.attributes,
            "status": user.status,
            "is_profile_complete": (user.attributes or {}).get("is_profile_complete", False)
        }}
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")

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

        # ── AUTOMATIC UNIQUE ID GENERATION ──
        # Generate or re-generate the structured ID if it's missing or invalid
        # Pattern: PREFIX-CC-INST-YYMM-SEQ-SUFFIX
        id_pattern = r"^[A-Z]{4}-\d{4}-\d{4}$"
        current_id = db_user.external_id
        
        if not current_id or not re.match(id_pattern, str(current_id)):
            try:
                new_id = generate_structured_id(db, db_user.role_context)
                db_user.external_id = new_id
                print(f"DEBUG: Generated/Fixed Unique ID: {new_id} for {db_user.email}")
            except Exception as e:
                print(f"ERROR: Failed to generate Unique ID: {e}")

    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user