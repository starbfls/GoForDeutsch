import json
import os
import threading
from typing import Optional

from app.config import DATA_DIR, USERS_FILE
from app.models import UserInDB


class JSONDatabase:
    _lock = threading.Lock()

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(USERS_FILE):
            self._write([])

    def _read(self) -> list[dict]:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write(self, data: list[dict]) -> None:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_all_users(self) -> list[UserInDB]:
        with self._lock:
            return [UserInDB(**u) for u in self._read()]

    def find_by_username(self, username: str) -> Optional[UserInDB]:
        with self._lock:
            for u in self._read():
                if u["username"].lower() == username.lower():
                    return UserInDB(**u)
        return None

    def find_by_id(self, user_id: str) -> Optional[UserInDB]:
        with self._lock:
            for u in self._read():
                if u["id"] == user_id:
                    return UserInDB(**u)
        return None

    def username_exists(self, username: str) -> bool:
        return self.find_by_username(username) is not None

    def save_user(self, user: UserInDB) -> None:
        with self._lock:
            users = self._read()
            users.append(user.model_dump())
            self._write(users)


db = JSONDatabase()
