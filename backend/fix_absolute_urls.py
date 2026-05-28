from database import SessionLocal
from models import GlobalUser
import json

db = SessionLocal()
users = db.query(GlobalUser).all()

fixed_count = 0

for user in users:
    attributes = user.attributes if user.attributes else {}
    changed = False
    
    for key in ['id_picture', 'signature']:
        val = attributes.get(key)
        if val and isinstance(val, str):
            # If it contains .loca.lt or looks like an absolute URL to static
            if '/static/' in val and (val.startswith('http') or '.loca.lt' in val):
                new_val = '/static/' + val.split('/static/')[-1]
                print(f"Fixing {key} for user {user.id}: {val} -> {new_val}")
                attributes[key] = new_val
                changed = True
            
            # Also clean up any lingering avatar_url if it's on the user object directly
            if hasattr(user, 'avatar_url') and user.avatar_url:
                 if '/static/' in user.avatar_url and (user.avatar_url.startswith('http') or '.loca.lt' in user.avatar_url):
                    user.avatar_url = '/static/' + user.avatar_url.split('/static/')[-1]
                    changed = True

    if changed:
        user.attributes = attributes
        fixed_count += 1

db.commit()
print(f"Finished. Fixed {fixed_count} users.")
db.close()
