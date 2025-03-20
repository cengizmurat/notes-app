import React from 'react';
import { Note } from './Note';
import { UnsavedNote } from './UnsavedNote';
import { NoteVersion, LocalNoteType } from '../../types/note';
import { noteService } from '../../services/noteService';
import { Button, Skeleton } from 'antd';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const NoteList: React.FC = () => {
    const queryClient = useQueryClient();
    const [unsavedNote, setUnsavedNote] = useState<LocalNoteType | null>(null);

    const { isLoading, data: notes = [] } = useQuery<NoteVersion[]>({
        queryKey: ['notes'],
        queryFn: noteService.fetchNotes,
    });

    const setNotes = (notes: NoteVersion[]) => {
        queryClient.setQueryData(['notes'], notes);
    }

    const createNoteMutation = useMutation({
        mutationFn: noteService.createNote,
        onSuccess: (createdNote: NoteVersion) => {
            // Update notes cache by filtering out any existing version
            // and adding the new note at the beginning
            setNotes([createdNote, ...notes.filter(n => n.note_id !== createdNote.note_id)]);
            setUnsavedNote(null);
        },
    });

    return (
        <Skeleton loading={isLoading} active>
            <Button 
                type='primary' 
                style={{ marginBottom: 20 }}
                onClick={() => setUnsavedNote({ title: '', content: '' })}
                disabled={unsavedNote !== null}
            >
                Add a note
            </Button>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {unsavedNote && 
                    <UnsavedNote<LocalNoteType>
                        note={unsavedNote} 
                        onSave={createNoteMutation.mutateAsync}
                        onCancel={() => setUnsavedNote(null)}
                    />
                }
                {notes.map(note => (
                    <Note key={note.id} note={note} onEdit={(updatedNote: NoteVersion) => {
                        setNotes(notes.map(n => n.note_id === updatedNote.note_id ? updatedNote : n));
                    }} onDelete={(id: number) => {
                        setNotes(notes.filter(n => n.note_id !== id));
                    }} />
                ))}
            </div>
        </Skeleton>
    );
}; 