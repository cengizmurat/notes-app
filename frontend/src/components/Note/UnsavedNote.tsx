import React, { useState } from 'react';
import { Card, Input, Button, message } from 'antd';
import { UnsavedNoteType, LocalNoteType, NoteVersion } from '../../types/note';
import { validateNote } from '../../utils/validation';
import './Note.css';

interface UnsavedNoteProps<T extends UnsavedNoteType | LocalNoteType> {
    note: T;
    onSave: (note: T) => Promise<NoteVersion>;
    onCancel: () => void;
}

export function UnsavedNote<T extends UnsavedNoteType | LocalNoteType>({ 
    note, 
    onSave, 
    onCancel 
}: UnsavedNoteProps<T>) {
    const [title, setTitle] = useState(note.title || '');
    const [content, setContent] = useState(note.content || '');
    const [isLoading, setIsLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const handleSave = async () => {
        const validationErrors = validateNote(title, content);
        if (validationErrors.length > 0) {
            messageApi.error(validationErrors[0]);
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                ...note,
                title: title.trim(),
                content: content.trim()
            });
        } catch (error) {
            messageApi.error('Failed to save note. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const actions = [
        <Button key="cancel" onClick={onCancel} disabled={isLoading}>
            Cancel
        </Button>,
        <Button 
            key="save" 
            type="primary" 
            onClick={handleSave}
            loading={isLoading}
        >
            Save
        </Button>
    ];

    return (
        <>
            {contextHolder}
            <Card 
                actions={actions}
                className="note-card"
            >
                <Input
                    placeholder="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ marginBottom: 8 }}
                    disabled={isLoading}
                />
                <Input.TextArea
                    placeholder="Content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{ marginBottom: 8 }}
                    rows={4}
                    disabled={isLoading}
                />
            </Card>
        </>
    );
}
