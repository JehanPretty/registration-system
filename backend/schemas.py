from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    external_id: Optional[str] = None
    avatar_url: Optional[str] = None
    role_context: Optional[str] = None
    attributes: Optional[Any] = None
    signature_url: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ChangePassword(BaseModel):
    user_id: int
    current_password: str
    new_password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    external_id: Optional[str] = None
    avatar_url: Optional[str] = None
    role_context: Optional[str] = None
    attributes: Optional[Any] = None
    status: Optional[str] = None
    password: Optional[str] = None
    signature_url: Optional[str] = None

class UserRead(BaseModel):
    id: int
    global_id: UUID
    name: str
    email: str
    external_id: Optional[str]
    avatar_url: Optional[str] = None
    role_context: Optional[str] = None
    attributes: Optional[Any] = None
    signature_url: Optional[str] = None
    status: Optional[str] = "pending"
    is_profile_complete: Optional[bool] = False
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}

# --- ROLE SCHEMAS ---
class RoleBase(BaseModel):
    name: str
    title: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    email_domain: Optional[str] = None


class RoleCreate(RoleBase):
    pass

class RoleRead(RoleBase):
    id: int
    model_config = {"from_attributes": True}

# --- FORM SCHEMAS ---
class FormFieldBase(BaseModel):
    label: str
    type: str
    required: bool = False
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None
    order: int = 0

class FormFieldCreate(FormFieldBase):
    pass

class FormFieldRead(FormFieldBase):
    id: int
    section_id: int
    model_config = {"from_attributes": True}

class FormSectionBase(BaseModel):
    role_name: str
    title: str
    order: int = 0

class FormSectionCreate(FormSectionBase):
    fields: List[FormFieldCreate] = []

class FormSectionRead(FormSectionBase):
    id: int
    fields: List[FormFieldRead] = []
    model_config = {"from_attributes": True}

# --- ATTENDANCE SCHEMAS ---
class AttendanceCreate(BaseModel):
    user_id: Optional[int] = None
    user_name: str
    role: str
    status: str

class AttendanceRead(AttendanceCreate):
    id: int
    timestamp: datetime
    model_config = {"from_attributes": True}

# --- ID BUILDER SCHEMAS ---
class IDTemplateBase(BaseModel):
    role_name: str
    template_style: Optional[str] = "corporate"
    orientation: Optional[str] = "portrait"
    primary_color: Optional[str] = "#1a234b"
    secondary_color: Optional[str] = "#2563eb"
    accent_color: Optional[str] = "#f8fafc"
    # Branding Fields
    header_text: Optional[str] = ""
    institution_name: Optional[str] = "Global Institute"
    institution_subtitle: Optional[str] = "Empowering Excellence"
    logo_url: Optional[str] = None
    # Font Sizes / Zoom
    header_font_size: Optional[int] = 6
    institution_font_size: Optional[int] = 10
    subtitle_font_size: Optional[int] = 7
    logo_size: Optional[int] = 40
    # Front Elements
    show_qr: Optional[bool] = True
    show_avatar: Optional[bool] = True
    show_id_number: Optional[bool] = True
    # Back Side Fields
    back_content: Optional[str] = "This card is the property of the issuing institution. If found, please return to the nearest security office."
    back_contact: Optional[str] = "+1 (555) 000-0000"
    show_barcode: Optional[bool] = True
    signature_label: Optional[str] = "Authorized Signature"
    background_type: Optional[str] = "solid"
    custom_bg_url: Optional[str] = None
    custom_back_bg_url: Optional[str] = None
    authorized_name: Optional[str] = "Registrar"
    authorized_signature_url: Optional[str] = None
    show_user_signature: Optional[bool] = True

class IDTemplateCreate(IDTemplateBase):
    pass

class IDTemplateRead(IDTemplateBase):
    id: int
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}

# --- ID APPLICATION SCHEMAS ---
class IDApplicationBase(BaseModel):
    user_id: int
    status: Optional[str] = "pending"
    scheduled_at: Optional[datetime] = None
    collection_location: Optional[str] = "Registrar Office"
    is_ready: Optional[bool] = False
    has_arrived: Optional[bool] = False
    admin_notes: Optional[str] = None

class IDApplicationCreate(IDApplicationBase):
    pass

class IDApplicationUpdate(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    collection_location: Optional[str] = None
    is_ready: Optional[bool] = None
    has_arrived: Optional[bool] = None
    admin_notes: Optional[str] = None

class IDApplicationRead(IDApplicationBase):
    id: int
    submitted_at: datetime
    user: Optional[UserRead] = None
    
    model_config = {"from_attributes": True}