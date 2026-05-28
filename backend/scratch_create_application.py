import urllib.request
import json

try:
    req = urllib.request.Request('http://localhost:8000/users/')
    with urllib.request.urlopen(req) as response:
        users = json.loads(response.read().decode())
        
    # Find a user who is not a Super Admin
    target_user = next((u for u in users if u.get('role_context') != 'Super Admin'), None)

    if target_user:
        print(f"Found user: {target_user['name']}")
        
        # Create application
        data = json.dumps({"user_id": target_user["id"], "status": "pending"}).encode('utf-8')
        req = urllib.request.Request('http://localhost:8000/applications', data=data, headers={'Content-Type': 'application/json'})
        
        try:
            with urllib.request.urlopen(req) as response:
                res = json.loads(response.read().decode())
                print(f"Application created successfully! ID: {res.get('id')}")
        except urllib.error.HTTPError as e:
            # If the user already has a pending application, that's okay
            err_msg = e.read().decode()
            if "already have a pending application" in err_msg:
                print("This user already has a pending application! Perfect, it should show up on the dashboard.")
            else:
                print(f"Failed to create application: {e.code} - {err_msg}")
    else:
        print("No suitable user found.")
except Exception as e:
    print(f"Error: {e}")
