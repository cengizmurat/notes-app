import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

test('renders app title', () => {
    render(
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    );
    expect(screen.getByText('Notes App')).toBeInTheDocument();
});
