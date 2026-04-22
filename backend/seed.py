from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Role

def seed_data():
    db = SessionLocal()
    try:
        print("Seeding/Updating roles and domains...")
        roles_to_seed = [
            {"name": "Student", "title": "Student", "icon": "school-outline", "description": "Access student services and registration.", "email_domain": "student.com"},
            {"name": "Staff", "title": "Staff", "icon": "business-outline", "description": "Administrative and support services.", "email_domain": "staff.com"},
            {"name": "Teacher", "title": "Teacher", "icon": "book-outline", "description": "Manage courses and academic data.", "email_domain": "teacher.com"},
            {"name": "Administrator", "title": "Administrator", "icon": "shield-checkmark-outline", "description": "Full system access and management.", "email_domain": "admin.com"},
            {"name": "Assistant Admin", "title": "Assistant Admin", "icon": "shield-half-outline", "description": "Sub-admin access for managing students and generating IDs.", "email_domain": "subadmin.com"},
            {"name": "Registrar Staff", "title": "Registrar Staff", "icon": "document-text-outline", "description": "Manage student records, info, and print ID cards.", "email_domain": "registrar.com"},
        ]

        for role_data in roles_to_seed:
            db_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not db_role:
                print(f"Adding new role: {role_data['name']}")
                db_role = Role(**role_data)
                db.add(db_role)
            else:
                # Update domain if missing or different
                if not db_role.email_domain:
                    print(f"Updating domain for {role_data['name']} to {role_data['email_domain']}")
                    db_role.email_domain = role_data["email_domain"]
        
        db.commit()
        print("Role seeding/update complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
