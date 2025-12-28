import pytest
import base64
import os
from app.core import security
from app.core.config import settings

def test_encryption_decryption_roundtrip():
    # Mock settings for test
    settings.VAULT_MASTER_KEY = base64.b64encode(os.urandom(32)).decode()
    
    user_id = "test-user-id"
    password = "secret-password-123"
    
    encrypted, nonce = security.encrypt_password(password, user_id)
    assert encrypted != password
    assert encrypted != ""
    assert nonce != ""
    
    decrypted = security.decrypt_password(encrypted, nonce, user_id)
    assert decrypted == password

def test_invalid_decryption():
    settings.VAULT_MASTER_KEY = base64.b64encode(os.urandom(32)).decode()
    user_id = "user-1"
    wrong_user_id = "user-2"
    password = "secret-password"
    
    encrypted, nonce = security.encrypt_password(password, user_id)
    
    # Decrypt with wrong user_id (different derived key)
    decrypted = security.decrypt_password(encrypted, nonce, wrong_user_id)
    assert decrypted == "DECRYPTION_FAILED"
