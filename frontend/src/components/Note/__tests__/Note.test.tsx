import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Note } from '../Note';
import { noteService } from '../../../services/noteService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the note service
jest.mock('../../../services/noteService');

// Mock the date formatting function
jest.mock('../../../services/date', () => ({
    formatFromUTC: () => 'Mocked date'
}));

const mockNote = {
    id: 1,
    note_id: 1,
    title: "Test Note",
    content: "Test Content",
    version_number: 1,
    created_at: new Date('2025-03-20T00:45:30.732Z')
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderNote = (props = {}) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <Note 
                note={mockNote}
                onEdit={jest.fn()}
                onDelete={jest.fn()}
                {...props}
            />
        </QueryClientProvider>
    );
};

describe('Note Component', () => {
    beforeEach(() => {
        queryClient.clear();
        jest.clearAllMocks();
    });

    it('renders note title and content', () => {
        renderNote();
        expect(screen.getByText('Test Note')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('enters edit mode when clicking title', async () => {
        renderNote();
        fireEvent.click(screen.getByText('Test Note'));
        
        // Should show input fields with current values
        expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
    });

    it('calls onDelete when confirming deletion', async () => {
        const onDelete = jest.fn();
        renderNote({ onDelete });

        // Mock the delete service call
        (noteService.deleteNote as jest.Mock).mockResolvedValueOnce(undefined);

        // Click delete icon (using aria-label instead of button role)
        const deleteIcon = screen.getByLabelText('delete');
        fireEvent.click(deleteIcon);
        
        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(noteService.deleteNote).toHaveBeenCalledWith(mockNote.note_id);
            expect(onDelete).toHaveBeenCalledWith(mockNote.note_id);
        });
    });

    it('updates note when saving edits', async () => {
        const onEdit = jest.fn();
        renderNote({ onEdit });
    
        // Mock the update service call
        const updatedNote = { 
            ...mockNote, 
            title: "Updated Title", 
            content: "Updated Content",
            created_at: new Date('2025-03-20T00:45:30.732Z')
        };
        (noteService.updateNote as jest.Mock).mockResolvedValueOnce(updatedNote);
    
        // Enter edit mode by clicking the edit icon
        const editIcon = screen.getByLabelText('edit');
        fireEvent.click(editIcon);
    
        // Update values
        fireEvent.change(screen.getByDisplayValue('Test Note'), {
            target: { value: 'Updated Title' }
        });
        fireEvent.change(screen.getByDisplayValue('Test Content'), {
            target: { value: 'Updated Content' }
        });
    
        // Save changes
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
    
        await waitFor(() => {
            // Update expectation to match the actual data structure
            expect(noteService.updateNote).toHaveBeenCalledWith(mockNote.note_id, {
                title: "Updated Title",
                content: "Updated Content",
                note_id: mockNote.note_id,
                version_number: mockNote.version_number,
                created_at: mockNote.created_at,
                id: mockNote.id
            });
            expect(onEdit).toHaveBeenCalledWith(updatedNote);
        });
    });
    
    it('shows version history', async () => {
        renderNote();
    
        // Mock the versions service call
        const versions = [
            { 
                ...mockNote, 
                version_number: 2,
                title: "Version 2",
                content: "Updated Content",
                created_at: new Date('2025-03-20T00:45:30.732Z')
            },
            { 
                ...mockNote, 
                version_number: 1,
                title: "Version 1",
                content: "Initial Content",
                created_at: new Date('2025-03-20T00:45:30.732Z')
            }
        ];
        (noteService.getNoteVersions as jest.Mock).mockResolvedValueOnce(versions);
    
        // Click history icon
        const historyIcon = screen.getByLabelText('history');
        fireEvent.click(historyIcon);
    
        await waitFor(() => {
            expect(noteService.getNoteVersions).toHaveBeenCalledWith(mockNote.note_id);
            // Look for elements containing the version titles
            const titleElements = screen.getAllByText(/Version [12]/);
            expect(titleElements.length).toBeGreaterThan(0);
        });
    });
});