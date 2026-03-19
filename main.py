# from fastapi import FastAPI, Depends
# from sqlalchemy.orm import Session
# from .database import SessionLocal, engine, Base
# from .models import GlobalUser

# # Create tables
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="Registration System API")

# # Dependency to get DB session
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # Example route to get all users
# @app.get("/users")
# def get_users(db: Session = Depends(get_db)):
#     users = db.query(GlobalUser).all()
#     return users