import psycopg2

try:
    conn = psycopg2.connect(
        dbname="registration_system",
        user="postgres",
        password="Jehan@123",
        host="127.0.0.1"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    tables = cursor.fetchall()
    print("Tables in public:")
    for t in tables:
        print(f" - {t[0]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
