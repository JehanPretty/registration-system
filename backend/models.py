from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from database import Base


class GlobalUser(Base):
    __tablename__ = "global_user"

    id = Column(Integer, primary_key=True, index=True)
    global_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    external_id = Column(String, nullable=True, index=True)
    source = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    role_context = Column(String, nullable=True)
    attributes = Column(JSONB, nullable=True)
    signature_url = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, verified, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    title = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    description = Column(String, nullable=True)
    email_domain = Column(String, nullable=True) # Domain mapping (e.g., student.com)


class FormSection(Base):
    __tablename__ = "form_sections"
    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, index=True)
    title = Column(String)
    order = Column(Integer, default=0)
    fields = relationship("FormField", back_populates="section", cascade="all, delete-orphan")

class FormField(Base):
    __tablename__ = "form_fields"
    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("form_sections.id"))
    label = Column(String)
    type = Column(String) # text, select, date, etc.
    required = Column(Boolean, default=False)
    placeholder = Column(String, nullable=True)
    options = Column(JSONB, nullable=True) # For select types
    order = Column(Integer, default=0)
    section = relationship("FormSection", back_populates="fields")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"), nullable=True)
    user_name = Column(String)
    role = Column(String)
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class IDTemplate(Base):
    __tablename__ = "id_templates"
    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True, index=True)
    template_style = Column(String, default="corporate") # corporate, modern, academic, minimal, bold, government
    orientation = Column(String, default="portrait") # portrait, landscape
    primary_color = Column(String, default="#1a234b")
    secondary_color = Column(String, default="#2563eb")
    accent_color = Column(String, default="#f8fafc")
    # Branding Fields
    header_text = Column(String, default="")
    institution_name = Column(String, default="Global Institute")
    institution_subtitle = Column(String, default="Empowering Excellence")
    logo_url = Column(String, nullable=True)
    # Font Sizes / Zoom
    header_font_size = Column(Integer, default=6)
    institution_font_size = Column(Integer, default=10)
    subtitle_font_size = Column(Integer, default=7)
    logo_size = Column(Integer, default=40) # Overall size in pixels/percent
    # Front Elements
    show_qr = Column(Boolean, default=True)
    show_avatar = Column(Boolean, default=True)
    show_id_number = Column(Boolean, default=True)
    # Back Side Fields
    back_content = Column(String, default="This card is the property of the issuing institution. If found, please return to the nearest security office.")
    back_contact = Column(String, default="+1 (555) 000-0000")
    show_barcode = Column(Boolean, default=True)
    signature_label = Column(String, default="Authorized Signature")
    background_type = Column(String, default="solid") # solid, gradient, pattern
    custom_bg_url = Column(String, nullable=True)
    custom_back_bg_url = Column(String, nullable=True)
    authorized_name = Column(String, default="Registrar")
    authorized_signature_url = Column(String, nullable=True)
    show_user_signature = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemTheme(Base):
    __tablename__ = "system_theme"
    id = Column(Integer, primary_key=True, index=True)
    primary_color = Column(String, default="#1a234b")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class IDApplication(Base):
    __tablename__ = "id_applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("global_user.id"))
    status = Column(String, default="pending") # pending, approved, rejected, escalated
    submitted_at = Column(DateTime, default=datetime.utcnow)
    scheduled_at = Column(DateTime, nullable=True)
    collection_location = Column(String, nullable=True, default="Registrar Office")
    is_ready = Column(Boolean, default=False)
    has_arrived = Column(Boolean, default=False)
    admin_notes = Column(String, nullable=True)
    user = relationship("GlobalUser")