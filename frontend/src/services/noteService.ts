import axios from 'axios';
import { NoteVersion, UnsavedNoteType, LocalNoteType } from '../types/note';

const BASE_URL = 'http://localhost:8000';

export const noteService = {
    fetchNotes: async (): Promise<NoteVersion[]> => {
        const response = await axios.get(`${BASE_URL}/notes`);
        return response.data;
    },

    createNote: async (note: LocalNoteType): Promise<NoteVersion> => {
        const response = await axios.post(`${BASE_URL}/notes`, note);
        return response.data;
    },

    deleteNote: async (noteId: number): Promise<void> => {
        await axios.delete(`${BASE_URL}/notes/${noteId}`);
    },

    updateNote: async (noteId: number, note: UnsavedNoteType): Promise<NoteVersion> => {
        const response = await axios.post(`${BASE_URL}/notes/${noteId}/versions`, note);
        return response.data;
    },

    getNoteVersions: async (noteId: number): Promise<NoteVersion[]> => {
        const response = await axios.get(`${BASE_URL}/notes/${noteId}/versions`);
        return response.data;
    },

    restoreVersion: async (noteId: number, versionNumber: number): Promise<NoteVersion> => {
        const response = await axios.post(`${BASE_URL}/notes/${noteId}/restore/${versionNumber}`);
        return response.data;
    },
}; 