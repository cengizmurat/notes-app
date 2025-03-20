import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteList } from '../NoteList';
import { noteService } from '../../../services/noteService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../services/noteService');

const mockNotes = [
    {
        id: 1,
        note_id: 1,
        title: "Note 1",
        content: "Content 1",
        version_number: 1,
        created_at: new Date()
    },
    {
        id: 2,
        note_id: 2,
        title: "Note 2",
        content: "Content 2",
        version_number: 1,
        created_at: new Date()
    }
];

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderNoteList = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <NoteList />
        </QueryClientProvider>
    );
};

describe('NoteList Component', () => {
    beforeEach(() => {
        queryClient.clear();
        jest.clearAllMocks();
        (noteService.fetchNotes as jest.Mock).mockResolvedValue(mockNotes);
    });

    it('renders list of notes', async () => {
        renderNoteList();

        await waitFor(() => {
            expect(screen.getByText('Note 1')).toBeInTheDocument();
            expect(screen.getByText('Note 2')).toBeInTheDocument();
        });
    });

    it('creates new note', async () => {
        // Mock successful notes fetch
        (noteService.fetchNotes as jest.Mock).mockResolvedValueOnce([]);
        
        renderNoteList();

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        // Click add note button
        fireEvent.click(screen.getByText('Add a note'));
        
        const newNote = {
            id: 3,
            note_id: 3,
            title: "New Note",
            content: "New Content",
            version_number: 1,
            created_at: new Date()
        };
        (noteService.createNote as jest.Mock).mockResolvedValueOnce(newNote);

        // Fill in the form
        fireEvent.change(screen.getByPlaceholderText('Title'), {
            target: { value: 'New Note' }
        });
        fireEvent.change(screen.getByPlaceholderText('Content'), {
            target: { value: 'New Content' }
        });

        // Save the note
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(noteService.createNote).toHaveBeenCalledWith({
                title: "New Note",
                content: "New Content"
            });
            expect(screen.getByText('New Note')).toBeInTheDocument();
        });
    });

    it('shows loading state', async () => {
        // Mock a delayed response
        (noteService.fetchNotes as jest.Mock).mockImplementationOnce(() => 
            new Promise(resolve => setTimeout(() => resolve([]), 100))
        );
        
        renderNoteList();

        // Check for Skeleton component instead of alert role
        expect(screen.getByRole('heading')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Add a note')).toBeInTheDocument();
        });
    });
});