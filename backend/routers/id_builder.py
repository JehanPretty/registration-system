from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import IDTemplate
from schemas import IDTemplateCreate, IDTemplateRead

router = APIRouter(
    prefix="/id-builder",
    tags=["id-builder"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{role_name}", response_model=IDTemplateRead)
def get_id_template(role_name: str, db: Session = Depends(get_db)):
    template = db.query(IDTemplate).filter(IDTemplate.role_name.ilike(role_name)).first()
    if not template:
        # Return a default object for the schema (FastAPI will handle response_model)
        return {
            "id": 0,
            "role_name": role_name,
            "template_style": "corporate",
            "orientation": "portrait",
            "primary_color": "#1a234b",
            "secondary_color": "#2563eb",
            "accent_color": "#f8fafc",
            "header_text": "",
            "institution_name": "Global Institute",
            "institution_subtitle": "Empowering Excellence",
            "logo_url": "",
            "header_color": "#ffffff",
            "institution_color": "#ffffff",
            "subtitle_color": "#ffffff",
            "header_font_size": 6,
            "institution_font_size": 10,
            "subtitle_font_size": 7,
            "logo_size": 40,
            "show_qr": True,
            "show_avatar": True,
            "show_id_number": True,
            "show_issue_date": True,
            "issue_date_label": "Issue Date",
            "show_expiry_date": True,
            "expiry_date_label": "Valid Until",
            "expiry_date_value": "",
            "back_content": "This card is the property of the issuing institution. If found, please return to the nearest security office.",
            "back_contact": "+1 (555) 000-0000",
            "show_barcode": True,
            "signature_label": "University Registrar",
            "custom_back_bg_url": "",
            "authorized_name": "Registrar",
            "authorized_signature_url": "",
            "show_user_signature": True,
            "custom_front_bg_url": "",
            "name_color": "",
            "role_color": "",
            "id_number_color": "",
            "name_font_size": 24.0,
            "role_font_size": 10.0,
            "id_number_font_size": 9.0,
            "background_type": "solid",
            "custom_bg_url": None,
            "updated_at": None
        }
    return template

@router.post("/save", response_model=IDTemplateRead)
def save_id_template(template_data: IDTemplateCreate, db: Session = Depends(get_db)):
    try:
        db_template = db.query(IDTemplate).filter(IDTemplate.role_name == template_data.role_name).first()
        
        if db_template:
            # Update existing
            update_data = template_data.dict()
            update_data.pop('id', None)
            update_data.pop('updated_at', None)
            for key, value in update_data.items():
                setattr(db_template, key, value)
        else:
            # Create new
            create_data = template_data.dict()
            create_data.pop('id', None)
            create_data.pop('updated_at', None)
            db_template = IDTemplate(**create_data)
            db.add(db_template)
        
        db.commit()
        db.refresh(db_template)
        return db_template
    except Exception as e:
        import traceback
        with open("scratch/save_err.log", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
