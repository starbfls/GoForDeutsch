from pydantic import BaseModel, field_validator


class UserRegister(BaseModel):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    username: str


class UserPublic(BaseModel):
    id: str
    username: str


class UserInDB(BaseModel):
    id: str
    username: str
    password_hash: str
