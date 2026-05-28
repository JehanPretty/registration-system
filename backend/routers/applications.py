from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date, timedelta

from database import SessionLocal
from models import IDApplication, GlobalUser
from schemas import IDApplicationRead, IDApplicationCreate, IDApplicationUpdate

router = APIRouter(
    prefix="/applications",
    tags=["applications"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[IDApplicationRead])
def read_applications(status: str = None, fulfillment_method: str = None, db: Session = Depends(get_db)):
    query = db.query(IDApplication).options(joinedload(IDApplication.user))
    if status:
        query = query.filter(IDApplication.status == status)
    if fulfillment_method:
        query = query.filter(IDApplication.fulfillment_method == fulfillment_method)
    return query.order_by(IDApplication.submitted_at.desc()).all()

@router.post("", response_model=IDApplicationRead)
def submit_application(app: IDApplicationCreate, db: Session = Depends(get_db)):
    # Check if user already has a pending application
    existing = db.query(IDApplication).filter(
        IDApplication.user_id == app.user_id,
        IDApplication.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application.")
    
    # Calculate scheduled_at (One week process, weekdays only, Max 50 per day)
    target_date = date.today() + timedelta(days=7)
    while True:
        # Skip weekends (5=Saturday, 6=Sunday)
        if target_date.weekday() >= 5:
            target_date += timedelta(days=1)
            continue
            
        # Check if the target_date has reached capacity (50)
        # We only count apps scheduled on this date regardless of time
        next_date = target_date + timedelta(days=1)
        count = db.query(IDApplication).filter(
            IDApplication.scheduled_at >= target_date,
            IDApplication.scheduled_at < next_date
        ).count()
        
        if count < 50:
            break
            
        target_date += timedelta(days=1)
        
    app_dict = app.dict()
    # Combine with a default time (e.g., 8:00 AM) or just start of day
    app_dict["scheduled_at"] = datetime.combine(target_date, datetime.min.time()).replace(hour=8)
    
    db_app = IDApplication(**app_dict)
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    # Reload with user relationship for the response_model
    return db.query(IDApplication).options(joinedload(IDApplication.user)).filter(IDApplication.id == db_app.id).first()

@router.put("/{app_id}", response_model=IDApplicationRead)
def update_application(app_id: int, app_update: IDApplicationUpdate, db: Session = Depends(get_db)):
    db_app = db.query(IDApplication).filter(IDApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = app_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_app, key, value)
    
    # If approved, also update the user status
    if update_data.get("status") == "approved":
        user = db.query(GlobalUser).filter(GlobalUser.id == db_app.user_id).first()
        if user:
            user.status = "verified"
    
    # Remove automated archive to allow Fulfillment workflow
    # if update_data.get("status") == "printed":
    #     db_app.status = "completed"
    
    db.commit()
    db.refresh(db_app)
    
    # Reload with user relationship for the response_model
    return db.query(IDApplication).options(joinedload(IDApplication.user)).filter(IDApplication.id == db_app.id).first()

@router.post("/{app_id}/arrive", response_model=IDApplicationRead)
def mark_arrival(app_id: int, db: Session = Depends(get_db)):
    db_app = db.query(IDApplication).filter(IDApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db_app.has_arrived = True
    db.commit()
    db.refresh(db_app)
    
    # Reload with user relationship for the response_model
    return db.query(IDApplication).options(joinedload(IDApplication.user)).filter(IDApplication.id == db_app.id).first()

@router.post("/{app_id}/ready", response_model=IDApplicationRead)
def mark_ready(app_id: int, db: Session = Depends(get_db)):
    db_app = db.query(IDApplication).filter(IDApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db_app.is_ready = True
    db_app.status = "approved" # Ensure it's approved if it's ready
    
    # Also verify the user if they weren't already
    user = db.query(GlobalUser).filter(GlobalUser.id == db_app.user_id).first()
    if user:
        user.status = "verified"

    db.commit()
    db.refresh(db_app)
    return db_app

@router.get("/user/{user_id}", response_model=IDApplicationRead)
def get_user_application(user_id: int, db: Session = Depends(get_db)):
    app = db.query(IDApplication).filter(IDApplication.user_id == user_id).order_by(IDApplication.submitted_at.desc()).first()
    if not app:
        raise HTTPException(status_code=404, detail="No application found for this user")
    return app

@router.get("/print-queue", response_model=List[IDApplicationRead])
def get_print_queue(target_date: date = None, db: Session = Depends(get_db)):
    if not target_date:
        target_date = date.today()
    
    # Filter by applications scheduled for this date
    next_date = target_date + timedelta(days=1)
    apps = db.query(IDApplication).options(joinedload(IDApplication.user)).filter(
        IDApplication.scheduled_at >= target_date,
        IDApplication.scheduled_at < next_date,
        IDApplication.status == "approved"
    ).all()
    return apps

# ── QR SCANNER: Resolve a claim stub payload ──────────────────────────────────
@router.post("/scan", response_model=IDApplicationRead)
def scan_claim_stub(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Accepts the decoded QR payload and returns the matching application + user."""
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid QR payload: missing user_id")

    app = (
        db.query(IDApplication)
        .options(joinedload(IDApplication.user))
        .filter(IDApplication.user_id == user_id)
        .order_by(IDApplication.submitted_at.desc())
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="No application found for this QR code")
    return app

# ── CLAIM: Confirm physical handover and complete the application ─────────────
@router.post("/{app_id}/claim", response_model=IDApplicationRead)
def confirm_claim(
    app_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Marks application as completed and logs who handed it over and when."""
    db_app = db.query(IDApplication).filter(IDApplication.id == app_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    if db_app.status == "completed":
        raise HTTPException(status_code=409, detail="This ID card has already been claimed")

    db_app.status = "completed"
    db_app.claimed_at = datetime.utcnow()
    db_app.claimed_by = payload.get("claimed_by", "Admin")

    db.commit()
    db.refresh(db_app)
    return db.query(IDApplication).options(joinedload(IDApplication.user)).filter(IDApplication.id == db_app.id).first()
