import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
import os

# Use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

import app.routers
app.routers.ARTIFICIAL_DELAY = 0  # Set delay to 0 for all tests

# Override database settings before importing app
import app.database
app.database.engine = engine
app.database.SessionLocal = TestingSessionLocal

# Now import the app after database settings are overridden
from app.main import app
from app.models import Note, NoteVersion

os.environ['TESTING'] = 'true'

@pytest.fixture
def test_db():
    # Create test database
    Base.metadata.create_all(bind=engine)
    
    # Override get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield  # Run the tests
    
    # Clean up
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    return TestClient(app)

@pytest.fixture
def sample_note(test_db):
    db = TestingSessionLocal()
    note = Note()
    db.add(note)
    db.flush()
    
    version = NoteVersion(
        note_id=note.id,
        title="Test Note",
        content="Test Content",
        version_number=1
    )
    db.add(version)
    note.current_version = version
    db.commit()
    
    return note.id, version.id

def test_create_note(client):
    response = client.post("/notes/", json={
        "title": "New Note",
        "content": "New Content"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Note"
    assert data["content"] == "New Content"
    assert data["version_number"] == 1

def test_list_notes(client, sample_note):
    response = client.get("/notes/")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Note"
    assert data[0]["content"] == "Test Content"

def test_delete_note(client, sample_note):
    note_id, _ = sample_note
    response = client.delete(f"/notes/{note_id}")
    
    assert response.status_code == 200
    assert response.json()["message"] == "Note deleted successfully"
    
    # Verify note is deleted
    response = client.get("/notes/")
    assert len(response.json()) == 0

def test_create_version(client, sample_note):
    note_id, _ = sample_note
    response = client.post(f"/notes/{note_id}/versions", json={
        "title": "Updated Title",
        "content": "Updated Content"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "Updated Content"
    assert data["version_number"] == 2

def test_get_versions(client, sample_note):
    note_id, _ = sample_note
    
    # Create a second version
    client.post(f"/notes/{note_id}/versions", json={
        "title": "Version 2",
        "content": "Content 2"
    })
    
    response = client.get(f"/notes/{note_id}/versions")
    
    assert response.status_code == 200
    versions = response.json()
    assert len(versions) == 2
    assert versions[0]["version_number"] == 2
    assert versions[1]["version_number"] == 1

def test_restore_version(client, sample_note):
    note_id, _ = sample_note
    
    # Create versions 2 and 3
    client.post(f"/notes/{note_id}/versions", json={
        "title": "Version 2",
        "content": "Content 2"
    })
    client.post(f"/notes/{note_id}/versions", json={
        "title": "Version 3",
        "content": "Content 3"
    })
    
    # Restore to version 1
    response = client.post(f"/notes/{note_id}/restore/1")
    
    assert response.status_code == 200
    data = response.json()
    assert data["version_number"] == 1
    assert data["title"] == "Test Note"
    
    # Verify later versions are deleted
    versions_response = client.get(f"/notes/{note_id}/versions")
    versions = versions_response.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1

def test_delete_nonexistent_note(client):
    response = client.delete("/notes/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"

def test_restore_nonexistent_version(client, sample_note):
    note_id, _ = sample_note
    response = client.post(f"/notes/{note_id}/restore/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Version not found"

def test_create_version_nonexistent_note(client):
    response = client.post("/notes/999/versions", json={
        "title": "Updated Title",
        "content": "Updated Content"
    })
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Note not found"
