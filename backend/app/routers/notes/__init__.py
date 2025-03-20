from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Note, NoteVersion
from app.schemas import NoteBody, NoteVersion as NoteVersionResponse
from time import sleep
from .versions import router as versions_router
from app.routers import ARTIFICIAL_DELAY
from random import random
import os

router = APIRouter()

@router.get('/', response_model=List[NoteVersionResponse])
def list_notes(db: Session = Depends(get_db)):
    """Returns all notes with their current version"""
    if os.getenv('TESTING') != 'true' and random() < 0.5:  # Skip random error in test environment
        # Artificial error to visualize error state in frontend
        raise HTTPException(status_code=500, detail="Random server error")
        
    sleep(ARTIFICIAL_DELAY)

    return db.query(NoteVersion).join(
        Note,
        Note.current_version_id == NoteVersion.id,
    ).order_by(NoteVersion.created_at.desc()).all()

@router.post('/', response_model=NoteVersionResponse)
async def create_note(note: NoteBody, db: Session = Depends(get_db)):
    """Creates a new note with version 1"""
    
    new_note = Note()
    db.add(new_note)
    db.flush()

    version = NoteVersion(
        note_id=new_note.id,
        title=note.title,
        content=note.content,
        version_number=1
    )
    db.add(version)
    new_note.current_version = version

    db.commit()
    db.refresh(version)
    sleep(ARTIFICIAL_DELAY)
    return version

@router.delete('/{note_id}')
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Deletes a note"""
    
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if db_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    sleep(ARTIFICIAL_DELAY)
    return {"message": "Note deleted successfully"}

@router.post('/{note_id}/restore/{version_number}', response_model=NoteVersionResponse)
def restore_note_version(note_id: int, version_number: int, db: Session = Depends(get_db)):
    """Restores a note to a specific version and removes newer versions"""
    
    # Get the version to restore
    version_to_restore = db.query(NoteVersion).filter(
        NoteVersion.note_id == note_id,
        NoteVersion.version_number == version_number
    ).first()
    if version_to_restore is None:
        raise HTTPException(status_code=404, detail="Version not found")
    
    try:
        # Start transaction
        # Make sure that updating note's current version is executed alongside removing newer versions,
        # otherwise we might end up having newer versions than the current one
        db.begin_nested()
        
        # Update note's current version to prevent FK constraint violation
        note = db.query(Note).filter(Note.id == note_id).first()
        note.current_version = version_to_restore
        db.flush()
        
        # Delete all versions newer than the one being restored
        db.query(NoteVersion).filter(
            NoteVersion.note_id == note_id,
            NoteVersion.version_number > version_number
        ).delete()
        
        db.commit()
        return version_to_restore
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
router.include_router(versions_router, prefix="/{note_id}/versions", tags=["versions"])