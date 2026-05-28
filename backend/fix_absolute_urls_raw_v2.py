from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    query = text("""
        UPDATE global_user 
        SET attributes = attributes || jsonb_build_object(
            'id_picture', CASE 
                WHEN attributes->>'id_picture' LIKE '%/static/%' 
                THEN '/static/' || split_part(attributes->>'id_picture', '/static/', 2)
                ELSE attributes->>'id_picture'
            END,
            'signature', CASE 
                WHEN attributes->>'signature' LIKE '%/static/%' 
                THEN '/static/' || split_part(attributes->>'signature', '/static/', 2)
                ELSE attributes->>'signature'
            END
        )
        WHERE attributes->>'id_picture' LIKE '%/static/%' 
           OR attributes->>'signature' LIKE '%/static/%'
    """)
    result = conn.execute(query)
    conn.commit()
    print(f"Updated {result.rowcount} rows.")
