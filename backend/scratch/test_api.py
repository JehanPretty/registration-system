import requests

try:
    res = requests.get("http://127.0.0.1:8000/applications", timeout=5)
    print(f"Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Error Text: {res.text}")
    data = res.json()
    print(f"Total apps fetched: {len(data)}")
    for app in data[:3]:
        print(f"ID: {app.get('id')}, Status: {app.get('status')}, Method: {app.get('fulfillment_method')}")
except Exception as e:
    print(f"Error fetching API: {e}")
