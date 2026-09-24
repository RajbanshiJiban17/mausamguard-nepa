import os
import sys
import pytest
from starlette.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.database import get_db, SessionLocal, init_db
from app.ingestion.data_loader import load_all_data_if_needed
from app.security.auth import create_access_token

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure database and data are seeded before tests run."""
    init_db()
    db = SessionLocal()
    try:
        load_all_data_if_needed(db)
    finally:
        db.close()

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def admin_headers():
    token = create_access_token(subject="admin", user_id=1, roles=["ADMIN"])
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def viewer_headers():
    token = create_access_token(subject="viewer_test", user_id=999, roles=["VIEWER"])
    return {"Authorization": f"Bearer {token}"}
