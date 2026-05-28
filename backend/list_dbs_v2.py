import psycopg2

try:
    # Connect to the default 'postgres' database to list others
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="Jehan@123",
        host="127.0.0.1"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
    dbs = cursor.fetchall()
    print("Databases:")
    for db in dbs:
        print(f" - {db[0]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
