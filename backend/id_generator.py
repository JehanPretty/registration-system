import random
import string
from datetime import datetime
from sqlalchemy.orm import Session
from models import IDSequence, Role

def generate_checksum(base_str: str) -> str:
    """Simple alphanumeric checksum."""
    total = sum(ord(c) for c in base_str)
    chars = string.ascii_uppercase + string.digits
    return chars[total % len(chars)]

def get_role_prefix(role_name: str) -> str:
    """Map role names to 4-letter prefixes dynamically."""
    if not role_name:
        return "USER"
        
    mapping = {
        "Student": "STUD",
        "Teacher": "TEAC",
        "Employee": "EMPL",
        "Administrator": "ADMN",
        "Super Admin": "SADM",
        "Registrar Staff": "REGS",
        "Staff": "STAF"
    }
    
    # Return from explicit mapping if exists
    if role_name in mapping:
        return mapping[role_name]
        
    # Dynamically generate 4-letter prefix for custom roles
    # Remove spaces and non-alpha, upper case, take first 4 chars
    clean_role = ''.join(c for c in role_name if c.isalpha()).upper()
    if len(clean_role) >= 4:
        return clean_role[:4]
    elif len(clean_role) > 0:
        return clean_role.ljust(4, 'X')
    
    return "USER"

def generate_structured_id(db: Session, role_name: str) -> str:
    """
    Generates a simplified unique ID following the format:
    PREFIX-YYYY-SEQ
    Example: STUD-2026-0001
    """
    # 1. Resolve Prefix
    prefix = get_role_prefix(role_name)

    # 2. Date Component (YYYY)
    now = datetime.now()
    year_str = now.strftime("%Y")

    # 3. Sequence Tracking (Thread-safe increment within year)
    # Using 'GEN' as a default institution code to keep the DB schema compatible
    inst_code = "GEN" 
    
    seq_record = db.query(IDSequence).filter(
        IDSequence.institution_code == inst_code,
        IDSequence.year_month == year_str
    ).with_for_update().first()

    if not seq_record:
        seq_record = IDSequence(institution_code=inst_code, year_month=year_str, last_sequence=0)
        db.add(seq_record)
        db.flush()
    
    seq_record.last_sequence += 1
    current_seq = seq_record.last_sequence
    db.commit()

    seq_str = str(current_seq).zfill(4)

    # 4. Assemble Final ID
    final_id = f"{prefix}-{year_str}-{seq_str}"
    
    return final_id
