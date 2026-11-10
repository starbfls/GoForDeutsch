from datetime import datetime, timedelta, timezone
import re

import bcrypt
import jwt

from app.config import ACCESS_TOKEN_EXPIRE_HOURS, ALGORITHM, SECRET_KEY

BCRYPT_ROUNDS = 12
BCRYPT_MAX_BYTES = 72
BCRYPT_HASH = re.compile(r"\$2[aby]\$(?:0[4-9]|[12][0-9]|3[01])\$[./A-Za-z0-9]{53}")


def hash_password(plain: str) -> str:
    encoded = plain.encode("utf-8")
    if len(encoded) > BCRYPT_MAX_BYTES:
        raise ValueError("Password must not exceed 72 UTF-8 bytes")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    encoded = plain.encode("utf-8")
    if len(encoded) > BCRYPT_MAX_BYTES or not BCRYPT_HASH.fullmatch(hashed):
        return False
    try:
        # Existing Passlib bcrypt hashes use the same standard format.
        return bcrypt.checkpw(encoded, hashed.encode("ascii"))
    except (ValueError, UnicodeError):
        return False


def create_access_token(user_id: str, username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "username": username, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
