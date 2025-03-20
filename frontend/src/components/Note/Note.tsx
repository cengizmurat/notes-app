import React, { useMemo, useState } from 'react';
import { Card, Popconfirm, Spin } from 'antd';
import { EditOutlined, HistoryOutlined, DeleteOutlined, WarningFilled, LoadingOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { NoteVersion, UnsavedNoteType } from '../../types/note';
import { UnsavedNote } from './UnsavedNote';
import { noteService } from '../../services/noteService';
import { NoteHistory } from './NoteHistory';
import { formatFromUTC } from '../../utils/date';
import './Note.css';

interface NoteProps {
    note: NoteVersion;
    onEdit?: (note: NoteVersion) => void;
    onDelete: (id: number) => void;
}

export function Note({ note, onEdit, onDelete }: NoteProps) {
    const queryClient = useQueryClient();
    
    // Local state to control edit mode and history modal visibility
    const [isEditing, setIsEditing] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    // Generate random rotation degree between -2 and 2
    const randomRotation = useMemo(() => {
        return Math.floor(Math.random() * 5) - 2;
    }, []);

    // Mutation to handle note deletion
    const deleteMutation = useMutation({
        mutationFn: () => noteService.deleteNote(note.note_id),
        onSuccess: () => {
            onDelete(note.note_id);
        },
    });

    const isDeleting = useMemo(() => deleteMutation.isPending, [deleteMutation.isPending]);

    // Query to fetch note versions when history modal is opened
    // Uses infinite stale time to prevent unnecessary refetches
    const versionsQuery = useQuery({
        queryKey: ['noteVersions', note.note_id],
        queryFn: () => noteService.getNoteVersions(note.note_id),
        enabled: isHistoryVisible,
        staleTime: Number.POSITIVE_INFINITY,
    });

    // Mutation to handle note updates
    const updateNoteMutation = useMutation({
        mutationFn: (note: UnsavedNoteType) => noteService.updateNote(note.note_id, note),
        onSuccess: (updatedNote: NoteVersion) => {
            // Invalidate versions cache as a new version was created
            queryClient.invalidateQueries({ 
                queryKey: ['noteVersions', note.note_id],
            });
            onEdit?.(updatedNote);
            setIsEditing(false);
        }
    });

    // Mutation to handle restoring previous versions
    const restoreVersionMutation = useMutation({
        mutationFn: (versionNumber: number) => 
            noteService.restoreVersion(note.note_id, versionNumber),
        onSuccess: (restoredNote: NoteVersion) => {
            // Invalidate versions cache as version history has changed
            queryClient.invalidateQueries({ 
                queryKey: ['noteVersions', note.note_id] 
            });
            onEdit?.(restoredNote);
            setIsHistoryVisible(false);
        }
    });

    const actions = useMemo(() => [
        <EditOutlined 
            key="edit" 
            onClick={() => !isDeleting && setIsEditing(true)} 
            className={isDeleting ? 'note-action-disabled' : ''}
        />,
        <HistoryOutlined 
            key="versions" 
            onClick={() => !isDeleting && setIsHistoryVisible(true)}
            className={isDeleting ? 'note-action-disabled' : ''}
        />,
        <Popconfirm
            key="delete"
            title={<span>The note and all its versions will be deleted.<br/>This action is irreversible.</span>}
            onConfirm={() => deleteMutation.mutate()}
            icon={<WarningFilled style={{ color: 'red' }} />}
            okType="danger"
            okText="Delete"
            cancelText="Cancel"
            disabled={isDeleting}
        >
            {isDeleting ? 
                <Spin indicator={<LoadingOutlined spin />} /> : 
                <DeleteOutlined className="note-action-delete" />
            }
        </Popconfirm>,
    ], [isDeleting]);

    if (isEditing) {
        return <UnsavedNote 
            note={note} 
            onSave={updateNoteMutation.mutateAsync} 
            onCancel={() => setIsEditing(false)} 
        />;
    }

    return (
        <Card
            title={
                <div onClick={() => !isDeleting && setIsEditing(true)}>
                    {note.title}
                </div>
            }
            extra={<i>Last edited on<br/>{formatFromUTC(note.created_at)}</i>}
            actions={actions}
            className="note-card"
            style={{ transform: `rotate(${randomRotation}deg)` }}
        >
            <div onClick={() => !isDeleting && setIsEditing(true)}>
                {note.content}
            </div>
            
            <NoteHistory
                isVisible={isHistoryVisible}
                onClose={() => setIsHistoryVisible(false)}
                versions={versionsQuery.data}
                isLoading={versionsQuery.isFetching}
                onRestoreVersion={(versionNumber) => restoreVersionMutation.mutate(versionNumber)}
                isRestoring={restoreVersionMutation.isPending}
            />
        </Card>
    );
}
