import sqlite3
import json

conn = sqlite3.connect('registration_system.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, attributes FROM users WHERE id = 169")
user = cursor.fetchone()

if user:
    uid, name, attr_json = user
    attributes = json.loads(attr_json) if attr_json else {}
    print(f"User ID: {uid}")
    print(f"Name: {name}")
    print(f"ID Picture: {attributes.get('id_picture')[:100] if attributes.get('id_picture') else 'None'}")
    print(f"Signature: {attributes.get('signature')[:100] if attributes.get('signature') else 'None'}")
else:
    print("User 169 not found.")

conn.close()
