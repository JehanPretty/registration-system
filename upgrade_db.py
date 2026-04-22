import psycopg2

DATABASE_URL = "postgresql://postgres:Jehan%40123@127.0.0.1/registration_system"

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    c = conn.cursor()
    
    try:
        c.execute('ALTER TABLE id_templates ADD COLUMN custom_back_bg_url VARCHAR;')
        print("Added custom_back_bg_url")
    except Exception as e:
        print("Error or already exists (custom_back_bg_url):", e)
        
    try:
        c.execute("ALTER TABLE id_templates ADD COLUMN authorized_name VARCHAR DEFAULT 'Registrar';")
        print("Added authorized_name")
    except Exception as e:
        print("Error or already exists (authorized_name):", e)
        
    try:
        c.execute('ALTER TABLE id_templates ADD COLUMN authorized_signature_url VARCHAR;')
        print("Added authorized_signature_url")
    except Exception as e:
        print("Error or already exists (authorized_signature_url):", e)

    conn.close()
    print("Postgres Migration complete!")
except Exception as main_e:
    print("Connection failed:", main_e)
