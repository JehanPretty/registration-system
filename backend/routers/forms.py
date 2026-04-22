from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from models import FormSection, FormField
from schemas import FormSectionCreate, FormSectionRead

router = APIRouter(
    prefix="/forms",
    tags=["forms"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{role_name}", response_model=List[FormSectionRead])
def get_form_by_role(role_name: str, db: Session = Depends(get_db)):
    return db.query(FormSection).filter(FormSection.role_name.ilike(role_name)).order_by(FormSection.order).all()

@router.post("/save-all")
def save_form_sections(
    role_name: str, 
    sections: List[FormSectionCreate] = Body(...), 
    db: Session = Depends(get_db)
):
    try:
        # Fetch and delete existing sections using ORM to trigger cascades for FormFields
        existing_sections = db.query(FormSection).filter(FormSection.role_name == role_name).all()
        for section in existing_sections:
            db.delete(section)
        db.flush()
        
        for sec_data in sections:
            db_section = FormSection(role_name=role_name, title=sec_data.title, order=sec_data.order)
            db.add(db_section)
            db.flush() # Get ID
            
            for field_data in sec_data.fields:
                db_field = FormField(
                    section_id=db_section.id,
                    label=field_data.label,
                    type=field_data.type,
                    required=field_data.required,
                    placeholder=field_data.placeholder,
                    options=field_data.options,
                    order=field_data.order
                )
                db.add(db_field)
                
        db.commit()
        return {"message": "Form design saved successfully"}
    except Exception as e:
        db.rollback()
        print(f"[FormSave Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
