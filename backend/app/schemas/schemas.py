from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    username: Optional[str] = None

class UserCreate(UserBase):
    username: str
    password: str

class User(UserBase):
    id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Vault schemas
class VaultItemBase(BaseModel):
    account_name: str
    url: Optional[str] = None
    login: Optional[str] = None

class VaultItemCreate(VaultItemBase):
    password: str

class VaultItemUpdate(BaseModel):
    account_name: Optional[str] = None
    url: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None

class VaultItem(VaultItemBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    password_masked: bool = True

    model_config = ConfigDict(from_attributes=True)

class VaultItemReveal(BaseModel):
    password: str
