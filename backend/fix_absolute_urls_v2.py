from database import SessionLocal
from models import GlobalUser
from sqlalchemy.orm.attributes import flag_modified
import json

db = SessionLocal()
users = db.query(GlobalUser).all()

fixed_count = 0

for user in users:
    attributes = dict(user.attributes) if user.attributes else {}
    changed = False
    
    for key in ['id_picture', 'signature']:
        val = attributes.get(key)
        if val and isinstance(val, str):
            if '/static/' in val and (val.startswith('http') or '.loca.lt' in val):
                new_val = '/static/' + val.split('/static/')[-1]
                print(f"Fixing {key} for user {user.id}: {val} -> {new_val}")
                attributes[key] = new_val
                changed = True

    if changed:
        user.attributes = attributes
        flag_modified(user, "attributes")
        fixed_count += 1

db.commit()
print(f"Finished. Fixed {fixed_count} users.")
db.close()
