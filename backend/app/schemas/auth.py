from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=2, max_length=120)
    role: str = Field(default="teacher", pattern="^(teacher|student)$")
    timezone: str = Field(default="Asia/Kolkata", max_length=60)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    display_name: str
    role: str
    timezone: str
    created_at: datetime

class AuthResponse(BaseModel):
    user: UserResponse
