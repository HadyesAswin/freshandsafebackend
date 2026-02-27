import os
from datetime import timedelta, datetime
import time
import pytest
from jose import jwt

# Ensure settings reads a fixed SECRET_KEY/ALGORITHM for deterministic tests
os.environ.setdefault("SECRET_KEY", "unit-test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

from app.core.config import settings
from app.core import security


@pytest.mark.parametrize("subject", ["user123", 42, {"id": 1}, None])
def test_create_access_token_includes_sub_and_exp(subject):
    token = security.create_access_token(subject)
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert "sub" in decoded
    assert str(subject) == decoded["sub"]
    assert "exp" in decoded
    # exp should be in the future
    assert decoded["exp"] > int(datetime.utcnow().timestamp())


def test_create_access_token_respects_expires_delta_short():
    token = security.create_access_token("abc", expires_delta=timedelta(seconds=1))
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    exp_ts = decoded["exp"]
    now_ts = int(datetime.utcnow().timestamp())
    assert now_ts <= exp_ts <= now_ts + 5  # within a few seconds window


def test_create_access_token_default_uses_settings_minutes():
    # With default 60 mins from env set above
    token = security.create_access_token("abc")
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    exp_ts = decoded["exp"]
    now_ts = int(datetime.utcnow().timestamp())
    # Should be roughly +3600 seconds (allowing slack for runtime)
    assert 3500 <= exp_ts - now_ts <= 3700


def test_create_access_token_uses_settings_secret_and_algorithm(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "another-secret")
    # Recreate settings so environment change is picked up in a new instance if cached
    from importlib import reload
    import app.core.config as cfg
    reload(cfg)
    new_settings = cfg.settings

    token = security.create_access_token("abc", expires_delta=timedelta(seconds=5))

    # Should validate with the updated secret
    decoded = jwt.decode(token, new_settings.SECRET_KEY, algorithms=[new_settings.ALGORITHM])
    assert decoded["sub"] == "abc"


@pytest.mark.parametrize(
    "password",
    [
        "simple",
        "P@ssw0rd!",
        " ",
        "a" * 128,
    ],
)
def test_password_hash_and_verify_roundtrip(password):
    hashed = security.get_password_hash(password)
    assert isinstance(hashed, str) and len(hashed) > 0
    assert security.verify_password(password, hashed) is True


def test_verify_password_rejects_incorrect_password():
    hashed = security.get_password_hash("correct")
    assert security.verify_password("wrong", hashed) is False


def test_password_hashes_are_salted_unique():
    p = "same-password"
    h1 = security.get_password_hash(p)
    h2 = security.get_password_hash(p)
    assert h1 != h2  # bcrypt should generate different salts


def test_token_expires_eventually():
    token = security.create_access_token("abc", expires_delta=timedelta(seconds=1))
    time.sleep(2)
    with pytest.raises(Exception):
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
