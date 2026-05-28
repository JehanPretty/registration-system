import requests
import json

try:
    response = requests.get("http://localhost:8000/api/locations/states?country=Philippines")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data)} provinces.")
        print("First 5 provinces:", data[:5])
    else:
        print(f"Failed with status code: {response.status_code}")
        print("Response:", response.text)
except Exception as e:
    print(f"Error: {e}")
