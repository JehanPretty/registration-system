from sqlalchemy.orm import Session
from . import models, schemas
import uuid

def create_user(db: Session, user: schemas.UserCreate):
    # In a real app, you would hash the password here!
    db_user = models.GlobalUser(
        global_id=uuid.uuid4(),
        display_name=user.display_name,
        external_id=user.external_id,
        role_context=user.role_context,
        source=user.source,
        attributes=user.attributes
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user