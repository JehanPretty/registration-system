from fastapi import FastAPI, Depends
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from routers import users, roles, forms, id_builder, attendance, locations, applications
from models import SystemTheme, GlobalUser

from fastapi.staticfiles import StaticFiles

# Create tables in the database
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app (Synced)
app = FastAPI(title="Registration System API")

# Add CORS Middleware (Supports local network IPs and dynamic dev ports)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|.*\.ngrok-free\.app)(:[0-9]*)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static directory for uploaded files
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

