from fastapi import FastAPI, Depends
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from routers import users, roles, forms, id_builder, attendance, locations, applications, face_detect
from models import SystemTheme, GlobalUser, IDApplication, SystemMaintenance
import asyncio
from datetime import datetime, timedelta

from fastapi.staticfiles import StaticFiles

# Create tables in the database
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app (Synced)
app = FastAPI(title="Registration System API")

# Add CORS Middleware (Supports local network IPs and dynamic dev ports)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|100\.\d+\.\d+\.\d+|.*\.ts\.net|.*\.ngrok-free\.app|.*\.loca\.lt|.*\.trycloudflare\.com)(:[0-9]*)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory for uploaded files
import os
from fastapi import Response

class CORSStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

os.makedirs("uploads", exist_ok=True)
app.mount("/static", CORSStaticFiles(directory="uploads"), name="static")

from routers import users, roles, forms, id_builder, attendance, locations, uploads

# Include routers
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(forms.router)
app.include_router(id_builder.router)
app.include_router(attendance.router)
app.include_router(locations.router)
app.include_router(uploads.router)
app.include_router(applications.router)
app.include_router(face_detect.router)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Registration System API"}

@app.get("/locations/ph")
def get_philippine_locations():
    import json
    try:
        with open("philippine_locations.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

@app.get("/debug/db")
def debug_db():
    from database import DATABASE_URL
    return {"database_url": DATABASE_URL}

@app.get("/ping")
def ping():
    return {"status": "online"}

# Example GET route to fetch all users
@app.get("/users")
def read_users(db: Session = Depends(get_db)):
    return db.query(GlobalUser).all()

# THEME ROUTES
from pydantic import BaseModel
class ThemeUpdate(BaseModel):
    primary_color: str

@app.get("/settings/theme")
def get_theme(db: Session = Depends(get_db)):
    theme = db.query(SystemTheme).first()
    if not theme:
        theme = SystemTheme(primary_color="#1a234b")
        db.add(theme)
        db.commit()
        db.refresh(theme)
    return {"primary_color": theme.primary_color}

@app.put("/settings/theme")
def update_theme(data: ThemeUpdate, db: Session = Depends(get_db)):
    theme = db.query(SystemTheme).first()
    if not theme:
        theme = SystemTheme(primary_color=data.primary_color)
        db.add(theme)
    else:
        theme.primary_color = data.primary_color
    db.commit()
    db.refresh(theme)
    return {"primary_color": theme.primary_color}

async def purge_signatures_task():
    """Background task to delete signatures from archived/rejected apps older than 30 days."""
    while True:
        print("Running Archive & Purge Task...")
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(days=30)
            # Find apps that are completed/rejected and older than 30 days
            apps = db.query(IDApplication).join(GlobalUser).filter(
                IDApplication.status.in_(["completed", "rejected"]),
                IDApplication.updated_at <= cutoff,
                GlobalUser.signature_url.isnot(None)
            ).all()
            
            count = 0
            for app in apps:
                user = app.user
                if user and user.signature_url:
                    # Extracts filename from /static/filename.png
                    filename = user.signature_url.split("/")[-1]
                    file_path = os.path.join("uploads", filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        count += 1
                    user.signature_url = None
            
            
            if count > 0:
                db.commit()
                # Record the maintenance event
                maint = db.query(SystemMaintenance).first()
                if not maint:
                    maint = SystemMaintenance(last_purge_count=count, last_purge_at=datetime.utcnow(), is_notified=False)
                    db.add(maint)
                else:
                    maint.last_purge_count = count
                    maint.last_purge_at = datetime.utcnow()
                    maint.is_notified = False
                db.commit()
                print(f"Purge complete: Deleted {count} signature files.")
            else:
                print("Purge complete: No signatures to delete.")
                
        except Exception as e:
            print(f"Purge Task Error: {e}")
        finally:
            db.close()
        
        await asyncio.sleep(86400) # Run every 24 hours

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(purge_signatures_task())

@app.get("/maintenance/purge-stats")
def get_purge_stats(db: Session = Depends(get_db)):
    maint = db.query(SystemMaintenance).order_by(SystemMaintenance.id.desc()).first()
    if not maint or maint.is_notified:
        return {"show_notification": False}
    return {
        "show_notification": True,
        "count": maint.last_purge_count,
        "date": maint.last_purge_at
    }

@app.post("/maintenance/acknowledge")
def acknowledge_purge(db: Session = Depends(get_db)):
    maint = db.query(SystemMaintenance).filter(SystemMaintenance.is_notified == False).first()
    if maint:
        maint.is_notified = True
        db.commit()
    return {"status": "ok"}

if __name__ == "__main__":
    import os
    ssl_cert = "cert.pem"
    ssl_key = "key.pem"
    
    print("Starting server without SSL (HTTP only)")
    uvicorn.run(app, host="0.0.0.0", port=8000)

