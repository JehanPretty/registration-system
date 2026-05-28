from database import SessionLocal
from models import FormSection, FormField, Role
import json

db = SessionLocal()
results = {"roles": [], "sections": []}
try:
    roles = db.query(Role).all()
    for r in roles:
        results["roles"].append({"id": r.id, "name": r.name})
    
    sections = db.query(FormSection).all()
    for s in sections:
        section_data = {
            "id": s.id,
            "title": s.title,
            "role_name": s.role_name,
            "order": s.order,
            "fields": []
        }
        fields = db.query(FormField).filter(FormField.section_id == s.id).all()
        for f in fields:
            section_data["fields"].append({
                "id": f.id,
                "label": f.label,
                "type": f.type
            })
        results["sections"].append(section_data)
        
    with open("db_dump.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
    print("Dumped to db_dump.json")
finally:
    db.close()
