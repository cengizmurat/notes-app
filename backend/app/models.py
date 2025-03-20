from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Note(Base):
    __tablename__ = 'notes'

    id = Column(Integer, primary_key=True, index=True)
    current_version_id = Column(Integer, ForeignKey('note_versions.id'), nullable=True)

    current_version = relationship("NoteVersion", 
                                 foreign_keys=[current_version_id],
                                 uselist=False)
    versions = relationship("NoteVersion", 
                          back_populates="note",
                          foreign_keys="[NoteVersion.note_id]",
                          order_by="NoteVersion.version_number.desc()")

    @property
    def title(self):
        return self.current_version.title if self.current_version else ""

    @property
    def content(self):
        return self.current_version.content if self.current_version else ""


class NoteVersion(Base):
    __tablename__ = 'note_versions'

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey('notes.id', ondelete='CASCADE'))
    version_number = Column(Integer)
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    note = relationship("Note", 
                       back_populates="versions",
                       foreign_keys=[note_id])

    # Enable only one version for each note
    __table_args__ = (
        UniqueConstraint('note_id', 'version_number', name='uq_note_version'),
    )
