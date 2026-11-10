"""Shared authenticated or anonymous learner identity."""
import uuid
import jwt
from fastapi import Header, HTTPException
from app.auth import decode_access_token

def learner(authorization: str | None = Header(default=None), x_learner_id: str | None = Header(default=None)):
    if authorization:
        try:
            token = authorization.removeprefix("Bearer ")
            return "user:" + decode_access_token(token)["sub"]
        except (jwt.PyJWTError, KeyError, TypeError):
            raise HTTPException(401, "登录已过期，请重新登录。")
    try:
        return "guest:" + str(uuid.UUID(x_learner_id or ""))
    except ValueError:
        raise HTTPException(400, "请刷新页面以创建本地体验身份。")


