import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnsavedNote } from '../UnsavedNote';
import { NoteVersion } from '../../../types/note';

describe('UnsavedNote', () => {
    const mockNote = {
        title: 'Test Note',
        content: 'Test Content',
        note_id: 1,
        version_number: 1
    };

    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with initial values', () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
    });

    it('handles successful save', async () => {
        mockOnSave.mockResolvedValueOnce({} as NoteVersion);
        
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                ...mockNote,
                title: 'Test Note',
                content: 'Test Content'
            });
        });
    });

    it('handles cancel', () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });

    // New tests for validation features
    it('shows validation error for empty title', async () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const titleInput = screen.getByDisplayValue('Test Note');
        fireEvent.change(titleInput, { target: { value: '' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Title is required')).toBeInTheDocument();
        });
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid title characters', async () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const titleInput = screen.getByDisplayValue('Test Note');
        fireEvent.change(titleInput, { target: { value: '<script>alert("xss")</script>' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        expect(await screen.findByText('Title contains invalid characters')).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('shows validation error for empty content', async () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const contentInput = screen.getByDisplayValue('Test Content');
        fireEvent.change(contentInput, { target: { value: '' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Content is required')).toBeInTheDocument();
        });
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('disables inputs and buttons during save', async () => {
        // Mock a delayed save
        mockOnSave.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const titleInput = screen.getByDisplayValue('Test Note');
        const contentInput = screen.getByDisplayValue('Test Content');
        const saveButton = screen.getByRole('button', { name: 'Save' });
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });

        fireEvent.click(saveButton);

        // Check that inputs and buttons are disabled during save
        expect(titleInput).toBeDisabled();
        expect(contentInput).toBeDisabled();
        expect(cancelButton).toBeDisabled();
        expect(saveButton).toHaveClass('ant-btn-loading');

        // Wait for save to complete
        await waitFor(() => {
            expect(titleInput).not.toBeDisabled();
            expect(contentInput).not.toBeDisabled();
            expect(cancelButton).not.toBeDisabled();
            expect(saveButton).not.toHaveClass('ant-btn-loading');
        });
    });

    it('shows error message on save failure', async () => {
        mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Failed to save note. Please try again.')).toBeInTheDocument();
        });
    });

    it('calls onSave with trimmed values when validation passes', async () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const titleInput = screen.getByDisplayValue('Test Note');
        const contentInput = screen.getByDisplayValue('Test Content');
        
        // Add spaces to test trimming
        fireEvent.change(titleInput, { target: { value: '  Updated Title  ' } });
        fireEvent.change(contentInput, { target: { value: '  Updated Content  ' } });

        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                ...mockNote,
                title: 'Updated Title',
                content: 'Updated Content'
            });
        });
    });

    it('calls onCancel when cancel button is clicked', () => {
        render(
            <UnsavedNote 
                note={mockNote} 
                onSave={mockOnSave} 
                onCancel={mockOnCancel} 
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });
}); 