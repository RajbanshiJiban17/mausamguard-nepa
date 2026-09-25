from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    user_id: Optional[int] = None
    roles: List[str] = []
    exp: Optional[int] = None

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    password: str
    role: Optional[str] = "VIEWER"

class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None

class SavedLocationCreate(BaseModel):
    name: str
    district_name: str
    municipality_name: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    alert_enabled: bool = True

class SavedLocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    district_name: str
    municipality_name: Optional[str] = None
    alert_enabled: bool
    created_at: datetime

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    roles: List[RoleOut] = []
    saved_locations: List[SavedLocationOut] = []

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut
