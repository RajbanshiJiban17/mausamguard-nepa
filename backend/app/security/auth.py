import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Any, Dict, List
from jose import jwt, JWTError
from app.config import settings
from app.utils.timezone import utc_now

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # bcrypt limit is 72 bytes
        plain_bytes = plain_password.encode("utf-8")[:72]
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # bcrypt limit is 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(subject: str, user_id: int, roles: List[str], expires_delta: Optional[timedelta] = None) -> str:
    now = utc_now()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode: Dict[str, Any] = {
        "sub": subject,
        "user_id": user_id,
        "roles": roles,
        "exp": expire,
        "iat": now,
        "type": "access"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(subject: str, user_id: int) -> str:
    now = utc_now()
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode: Dict[str, Any] = {
        "sub": subject,
        "user_id": user_id,
        "exp": expire,
        "iat": now,
        "type": "refresh"
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return {}
