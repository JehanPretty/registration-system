import requests

API_BASE_URL = "http://127.0.0.1:8000"

def test_signup(email, password, name):
    print(f"Testing signup for: {email}")
    payload = {
        "name": name,
        "email": email,
        "password": password
    }
    try:
        res = requests.post(f"{API_BASE_URL}/users", json=payload)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
        print("-" * 30)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # 1. Test Authorized Domain (Teacher)
    test_signup("teacher_test@teacher.com", "pass123", "Test Teacher")
    
    # 2. Test Authorized Domain (Admin)
    test_signup("admin_test@admin.com", "pass123", "Test Admin")
    
    # 3. Test Unauthorized Domain (Gmail)
    test_signup("hack@gmail.com", "pass123", "Hacker")
    
    # 4. Test Authorized Domain (Student)
    test_signup("student_test@student.com", "pass123", "Test Student")
