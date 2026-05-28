from database import SessionLocal
from models import FormSection, FormField, Role

db = SessionLocal()
try:
    roles = db.query(Role).all()
    print("ROLES:")
    for r in roles:
        print(f" - {r.name} (id: {r.id})")
    
    sections = db.query(FormSection).all()
    print("\nFORM SECTIONS:")
    for s in sections:
        print(f" - Section: {s.title} (id: {s.id}, role: {s.role_name})")
        fields = db.query(FormField).filter(FormField.section_id == s.id).all()
        for f in fields:
            print(f"   * Field: {f.label} (type: {f.type})")
finally:
    db.close()
