from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import Note, NoteVersion
from app.schemas import NoteBody, NoteVersion as NoteVersionResponse
from app.routers import ARTIFICIAL_DELAY
from time import sleep

router = APIRouter()

# get note_id from path
async def get_note_id(note_id: int) -> int:
    return note_id

@router.get('/', response_model=List[NoteVersionResponse])
def get_note_versions(note_id: int = Depends(get_note_id), db: Session = Depends(get_db)):
    """Returns all versions of a note"""
    
    versions = db.query(NoteVersion).filter(
        NoteVersion.note_id == note_id
    ).order_by(NoteVersion.version_number.desc()).all()
    if not versions:
        raise HTTPException(status_code=404, detail="Note not found")
    
    sleep(ARTIFICIAL_DELAY)
    return versions

@router.post('/', response_model=NoteVersionResponse)
def create_note_version(note: NoteBody, note_id: int = Depends(get_note_id), db: Session = Depends(get_db)):
    """Creates a new version of a note"""
    
    db_note = db.query(Note).options(
        joinedload(Note.current_version)
    ).filter(Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    old_version = db_note.current_version
    version_number = old_version.version_number + 1 if old_version else 1
    
    new_version = NoteVersion(
        note_id=note_id,
        title=note.title,
        content=note.content,
        version_number=version_number
    )
    db.add(new_version)
    db_note.current_version = new_version
    db.commit()
    db.refresh(new_version)
    return new_version

@router.get('/{version_number}', response_model=NoteVersionResponse)
def get_note_version(version_number: int, note_id: int = Depends(get_note_id), db: Session = Depends(get_db)):
    """Returns a specific version of a note"""
    
    version = db.query(NoteVersion).filter(
        NoteVersion.note_id == note_id,
        NoteVersion.version_number == version_number
    ).first()
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    return version
