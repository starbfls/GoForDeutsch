import uuid

from fastapi import APIRouter, HTTPException, status

from app.auth import create_access_token, hash_password, verify_password
from app.database import db
from app.models import Token, UserInDB, UserLogin, UserPublic, UserRegister
from app.username_generator import generate_username

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister):
    existing_usernames = {u.username for u in db.get_all_users()}
    username = generate_username(taken=existing_usernames)

    new_user = UserInDB(
        id=str(uuid.uuid4()),
        username=username,
        password_hash=hash_password(body.password),
    )
    db.save_user(new_user)

    token = create_access_token(new_user.id, new_user.username)
    return Token(access_token=token, token_type="bearer", username=new_user.username)


@router.post("/login", response_model=Token)
def login(body: UserLogin):
    user = db.find_by_username(body.username)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(user.id, user.username)
    return Token(access_token=token, token_type="bearer", username=user.username)


@router.get("/me", response_model=UserPublic)
def get_me(token: str):
    from app.auth import decode_access_token
    import jwt

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.find_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserPublic(id=user.id, username=user.username)
