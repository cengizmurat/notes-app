import React, { useMemo } from 'react';
import { Modal, Timeline, Skeleton, Tooltip, Popconfirm } from 'antd';
import { BranchesOutlined } from '@ant-design/icons';
import { NoteVersion } from '../../types/note';
import { getTextDiff } from '../../services/textDiff';
import { formatFromUTC } from '../../utils/date';
import './NoteHistory.css';

interface NoteHistoryProps {
    isVisible: boolean;
    onClose: () => void;
    versions?: NoteVersion[];
    isLoading: boolean;
    onRestoreVersion: (versionNumber: number) => void;
    isRestoring: boolean;
}

export function NoteHistory({ 
    isVisible, 
    onClose, 
    versions, 
    isLoading, 
    onRestoreVersion,
    isRestoring 
}: NoteHistoryProps) {
    const timelineData = useMemo(() => {
        return versions?.map((currentVersion, index, array) => {
            const previousVersion = array[index + 1];

            const title = previousVersion ? getTextDiff(previousVersion.title, currentVersion.title) : currentVersion.title;
            const content = previousVersion ? getTextDiff(previousVersion.content, currentVersion.content) : currentVersion.content;

            return {
                label: formatFromUTC(currentVersion.created_at),
                position: "left",
                children: (
                    <>
                        <span className="version-title-container">
                            <div className="version-title-label">Title:</div>&nbsp;
                            <p className="version-title-content">{title}</p>
                        </span>
                        <p>{content}</p>
                    </>
                ),
                dot: index > 0 ? <Tooltip title="Go back to this version">
                    <Popconfirm
                        title={<span>Are you sure you want to go back to this version?<br/>All changes after this version will be lost</span>}
                        onConfirm={() => onRestoreVersion(currentVersion.version_number)}
                        disabled={isRestoring}
                    >
                        <BranchesOutlined 
                            className={`timeline-dot ${isRestoring ? 'note-action-disabled' : ''}`}
                        />
                    </Popconfirm>
                </Tooltip> : null,
            };
        });
    }, [versions, isRestoring, onRestoreVersion]);

    return (
        <Modal
            title="Version History"
            open={isVisible}
            onCancel={onClose}
            footer={null}
            className="history-modal"
            width={"50vw"}
        >
            <Skeleton loading={isLoading} active>
                <Timeline items={timelineData} />
            </Skeleton>
        </Modal>
    );
} 