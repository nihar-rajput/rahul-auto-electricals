from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class AdminUserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = Field(default="ADMIN", pattern="^(SUPER_ADMIN|ADMIN)$")
    is_active: bool = True


class AdminUserCreate(AdminUserBase):
    password: str = Field(..., min_length=8)


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, pattern="^(SUPER_ADMIN|ADMIN)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


class AdminUserResponse(AdminUserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

