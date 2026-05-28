import sqlite3

def migrate():
    conn = sqlite3.connect('sqlite.db')
    cursor = conn.cursor()
    
    try:
        # Add columns to roles table
        cursor.execute("ALTER TABLE roles ADD COLUMN country_code TEXT DEFAULT 'PH'")
        cursor.execute("ALTER TABLE roles ADD COLUMN institution_code TEXT DEFAULT 'GEN'")
        print("Updated 'roles' table with new columns.")
    except sqlite3.OperationalError as e:
        print(f"Roles table update: {e} (might already exist)")

    try:
        # Create id_sequences table
        cursor.execute("""
        CREATE TABLE id_sequences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            institution_code TEXT,
            year_month TEXT,
            last_sequence INTEGER DEFAULT 0
        )
        """)
        cursor.execute("CREATE INDEX idx_id_sequences_inst_ym ON id_sequences (institution_code, year_month)")
        print("Created 'id_sequences' table.")
    except sqlite3.OperationalError as e:
        print(f"ID Sequences table creation: {e} (might already exist)")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
