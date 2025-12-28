import os
import base64
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Tuple

from jose import jwt
from passlib.context import CryptContext
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Vault Encryption Logic
def derive_user_key(user_id: str) -> bytes:
    """
    Derive a per-user key from the master key and user_id using HKDF.
    """
    master_key = base64.b64decode(settings.VAULT_MASTER_KEY)
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=user_id.encode(),
    )
    return hkdf.derive(master_key)

def encrypt_password(plain_password: str, user_id: str) -> Tuple[str, str]:
    """
    Encrypt password using AES-GCM. Returns (encrypted_data_base64, nonce_base64).
    """
    user_key = derive_user_key(user_id)
    aesgcm = AESGCM(user_key)
    nonce = os.urandom(12)
    encrypted_data = aesgcm.encrypt(nonce, plain_password.encode(), None)
    return (
        base64.b64encode(encrypted_data).decode("utf-8"),
        base64.b64encode(nonce).decode("utf-8")
    )

def decrypt_password(encrypted_password: str, nonce: str, user_id: str) -> str:
    """
    Decrypt password using AES-GCM.
    """
    user_key = derive_user_key(user_id)
    aesgcm = AESGCM(user_key)
    try:
        decrypted_data = aesgcm.decrypt(
            base64.b64decode(nonce),
            base64.b64decode(encrypted_password),
            None
        )
        return decrypted_data.decode("utf-8")
    except Exception:
        return "DECRYPTION_FAILED"
