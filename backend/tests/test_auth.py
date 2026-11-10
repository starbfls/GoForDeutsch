"""Password compatibility and auth routes against temporary local accounts."""
import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from app.auth import hash_password, verify_password
from app import database
from app.models import UserInDB, UserLogin, UserRegister
from app.routers import auth

# Created by Passlib 1.7.4 before removing the compatibility wrapper.
# This fixture belongs to the synthetic password below, never to a real account.
LEGACY_PASSWORD = "LegacyTestPassword2026"
LEGACY_HASH = "$2b$04$C2GOJDo636u6nz0NU03zUeaY.hqaQJ.RCioWDq8nlXLE23fLbiTiu"


class PasswordTests(unittest.TestCase):
    def test_new_hashes_are_salted_and_wrong_passwords_fail(self):
        first = hash_password("TestPassword2026")
        second = hash_password("TestPassword2026")
        self.assertNotEqual(first, second)
        self.assertTrue(first.startswith("$2b$12$"))
        self.assertTrue(verify_password("TestPassword2026", first))
        self.assertFalse(verify_password("WrongPassword2026", first))

    def test_passlib_hashes_still_verify_without_warnings(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            self.assertTrue(verify_password(LEGACY_PASSWORD, LEGACY_HASH))
            self.assertFalse(verify_password("WrongPassword2026", LEGACY_HASH))
        self.assertEqual(stderr.getvalue(), "")

    def test_password_byte_limit_includes_unicode(self):
        for password in ("a" * 72, "德" * 24):
            with self.subTest(password_type="unicode" if "德" in password else "ascii"):
                UserRegister(password=password)
                self.assertTrue(verify_password(password, hash_password(password)))
        for password in ("a" * 73, "德" * 25):
            with self.assertRaises(ValidationError):
                UserRegister(password=password)
            with self.assertRaises(ValueError):
                hash_password(password)
            self.assertFalse(verify_password(password, LEGACY_HASH))

    def test_invalid_hashes_are_rejected(self):
        for hashed in ("", "invalid", "$2b$12$invalid", "无效", "$2b$03$" + "a" * 53):
            with self.subTest(hashed=hashed):
                self.assertFalse(verify_password(LEGACY_PASSWORD, hashed))


class AuthRouteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent)
        self.patches = [
            patch.object(database, "DATA_DIR", self.temp.name),
            patch.object(database, "USERS_FILE", str(Path(self.temp.name) / "users.json")),
        ]
        for item in self.patches:
            item.start()
        self.db = database.JSONDatabase()
        self.route_patch = patch.object(auth, "db", self.db)
        self.route_patch.start()

    def tearDown(self):
        self.route_patch.stop()
        for item in reversed(self.patches):
            item.stop()
        self.temp.cleanup()

    def test_registration_login_and_account_lookup(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            registered = auth.register(UserRegister(password="TestPassword2026"))
            signed_in = auth.login(UserLogin(username=registered.username, password="TestPassword2026"))
        self.assertEqual(stderr.getvalue(), "")
        self.assertEqual(signed_in.username, registered.username)
        self.assertEqual(auth.get_me(authorization="Bearer " + signed_in.access_token).username, registered.username)
        user = self.db.find_by_username(registered.username)
        self.assertTrue(user.password_hash.startswith("$2b$12$"))
        self.assertNotIn("TestPassword2026", Path(database.USERS_FILE).read_text(encoding="utf-8"))

    def test_existing_account_can_login_without_hash_rewrite(self):
        self.db.save_user(UserInDB(id="legacy-test-user", username="LegacyTestUser", password_hash=LEGACY_HASH))
        before = Path(database.USERS_FILE).read_bytes()
        # Reopen the database to check persisted account compatibility.
        with patch.object(auth, "db", database.JSONDatabase()):
            result = auth.login(UserLogin(username="legacytestuser", password=LEGACY_PASSWORD))
        self.assertEqual(result.username, "LegacyTestUser")
        self.assertEqual(Path(database.USERS_FILE).read_bytes(), before)

    def test_unknown_user_and_wrong_password_return_401(self):
        self.db.save_user(UserInDB(id="legacy-test-user", username="LegacyTestUser", password_hash=LEGACY_HASH))
        for username in ("LegacyTestUser", "UnknownUser"):
            with self.subTest(username=username):
                with self.assertRaises(HTTPException) as caught:
                    auth.login(UserLogin(username=username, password="WrongPassword2026"))
                self.assertEqual(caught.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
