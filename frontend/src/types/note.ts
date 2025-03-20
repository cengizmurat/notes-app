export interface LocalNoteType {
    title: string;
    content: string;
}

export interface UnsavedNoteType extends LocalNoteType {
    note_id: number;
    version_number: number;
}

export interface NoteVersion extends UnsavedNoteType {
    id: number;
    created_at: Date;
} 