import React from 'react';
import { NoteList } from './components/Note/NoteList';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const App: React.FC = () => {
    return (
        <div style={{ padding: 20 }}>
            <h1>Notes App</h1>
            <ErrorBoundary>
                <NoteList/>
            </ErrorBoundary>
        </div>
    );
};

export default App; 