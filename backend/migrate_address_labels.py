from database import SessionLocal
from models import FormSection, FormField
import sys

def migrate_and_cleanup():
    db = SessionLocal()
    try:
        # 1. Rename "Live Address" to "Address Information" across all roles
        print("Migrating section titles...")
        sections_to_rename = db.query(FormSection).filter(FormSection.title == "Live Address").all()
        for s in sections_to_rename:
            print(f" - Renaming section {s.id} for role '{s.role_name}'")
            s.title = "Address Information"
        
        # 2. Cleanup "MSU Student" role sections to ensure a clean start
        print("\nCleaning up 'MSU Student' sections...")
        msu_sections = db.query(FormSection).filter(FormSection.role_name == "MSU Student").all()
        for s in msu_sections:
            print(f" - Deleting section {s.id} ('{s.title}') and its fields")
            db.delete(s) # This will trigger cascade delete-orphan for fields
        
        db.commit()
        print("\nMigration and cleanup complete.")
    except Exception as e:
        db.rollback()
        print(f"\nError during migration: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    migrate_and_cleanup()
