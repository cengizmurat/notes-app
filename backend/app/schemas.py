from pydantic import BaseModel
from datetime import datetime

class NoteBody(BaseModel):
    title: str
    content: str

class NoteVersion(NoteBody):
    id: int
    note_id: int
    version_number: int
    created_at: datetime

    class Config:
        from_attributes = True 