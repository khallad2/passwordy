from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core import security
from app.db.session import get_db
from app.models.models import User, VaultItem
from app.schemas.schemas import VaultItem as VaultItemSchema, VaultItemCreate, VaultItemUpdate, VaultItemReveal

router = APIRouter()

async def get_current_user_id(request: Request) -> UUID:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        from app.core.config import settings
        payload = security.jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return UUID(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/", response_model=List[VaultItemSchema])
async def read_vault_items(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    query: Optional[str] = None,
) -> Any:
    """
    Retrieve vault items.
    """
    stmt = select(VaultItem).where(VaultItem.user_id == user_id)
    if query:
        stmt = stmt.where(VaultItem.account_name.ilike(f"%{query}%"))
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=VaultItemSchema)
async def create_vault_item(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    item_in: VaultItemCreate,
) -> Any:
    """
    Create new vault item.
    """
    encrypted_pw, nonce = security.encrypt_password(item_in.password, str(user_id))
    
    item = VaultItem(
        **item_in.model_dump(exclude={"password"}),
        user_id=user_id,
        password_encrypted=encrypted_pw,
        password_nonce=nonce
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/{id}", response_model=VaultItemSchema)
async def update_vault_item(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    id: UUID,
    item_in: VaultItemUpdate,
) -> Any:
    """
    Update a vault item.
    """
    result = await db.execute(select(VaultItem).where(VaultItem.id == id, VaultItem.user_id == user_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        encrypted_pw, nonce = security.encrypt_password(update_data["password"], str(user_id))
        item.password_encrypted = encrypted_pw
        item.password_nonce = nonce
        del update_data["password"]
    
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{id}")
async def delete_vault_item(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    id: UUID,
) -> Any:
    """
    Delete a vault item.
    """
    await db.execute(delete(VaultItem).where(VaultItem.id == id, VaultItem.user_id == user_id))
    await db.commit()
    return {"msg": "Item deleted"}

@router.post("/{id}/reveal", response_model=VaultItemReveal)
async def reveal_vault_item(
    *,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
    id: UUID,
) -> Any:
    """
    Reveal decrypted password.
    """
    result = await db.execute(select(VaultItem).where(VaultItem.id == id, VaultItem.user_id == user_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    password = security.decrypt_password(item.password_encrypted, item.password_nonce, str(user_id))
    return {"password": password}
