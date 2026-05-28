import psycopg2

try:
    conn = psycopg2.connect("postgresql+psycopg2://postgres:Jehan%40123@127.0.0.1/postgres")
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("SELECT datname FROM pg_database;")
    dbs = cursor.fetchall()
    print("Databases:")
    for db in dbs:
        print(f" - {db[0]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
