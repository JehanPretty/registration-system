from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
from database import SessionLocal
from models import Attendance
from schemas import AttendanceCreate, AttendanceRead

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"]
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[AttendanceRead])
def get_attendance(db: Session = Depends(get_db)):
    return db.query(Attendance).order_by(Attendance.timestamp.desc()).all()

@router.post("/", response_model=AttendanceRead)
async def submit_attendance(attendance: AttendanceCreate, db: Session = Depends(get_db)):
    db_attendance = Attendance(**attendance.dict())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    # Broadcast to all connected clients
    import json
    await manager.broadcast(json.dumps({
        "type": "new_attendance",
        "data": {
            "id": db_attendance.id,
            "user_name": db_attendance.user_name,
            "role": db_attendance.role,
            "status": db_attendance.status,
            "timestamp": db_attendance.timestamp.isoformat()
        }
    }))
    
    return db_attendance

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

