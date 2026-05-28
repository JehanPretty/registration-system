import requests
API = 'http://localhost:8000'
res = requests.post(f'{API}/id-builder/save', data='{"role_name": "Student"}', headers={'Content-Type': 'text/plain'})
print(res.status_code)
print(res.text)
