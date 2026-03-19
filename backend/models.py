from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid

class GlobalUser(Base):
    __tablename__ = "global_user"

    id = Column(Integer, primary_key=True, index=True)
    global_id = Column(UUID(as_uuid=True), unique=True, default=uuid.uuid4)
    external_id = Column(String)
    source = Column(String)
    display_name = Column(String)
    role_context = Column(String)
    attributes = Column(JSON)