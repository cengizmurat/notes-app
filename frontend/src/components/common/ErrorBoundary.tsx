import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

/**
 * ErrorBoundary component that catches and displays React Query errors
 * Uses Ant Design's message component to show error notifications
 */
export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    // Track shown error messages to prevent duplicates
    const shownErrors = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Subscribe to query cache changes to catch failed API queries
        const unsubscribeQuery = queryClient.getQueryCache().subscribe(() => {
            const queries = queryClient.getQueryCache().findAll();
            // Find all active queries that are in an error state
            const failedQueries = queries.filter(query => 
                query.state.status === 'error' && 
                query.isActive()
            );

            failedQueries.forEach(query => {
                const error = query.state.error as Error;
                // Only show each unique error message once
                if (!shownErrors.current.has(error.message)) {
                    shownErrors.current.add(error.message);
                    // Display error message and remove from tracking when closed
                    messageApi.open({
                        type: 'error',
                        content: error.message,
                        onClose: () => {
                            shownErrors.current.delete(error.message);
                        }
                    });
                }
            });
        });

        // Subscribe to mutation cache changes to catch failed API mutations
        const unsubscribeMutation = queryClient.getMutationCache().subscribe(() => {
            const mutations = queryClient.getMutationCache().getAll();
            // Find all mutations that are in an error state
            const failedMutations = mutations.filter(mutation => 
                mutation.state.status === 'error'
            );

            failedMutations.forEach(mutation => {
                const error = mutation.state.error as Error;
                // Only show each unique error message once
                if (!shownErrors.current.has(error.message)) {
                    shownErrors.current.add(error.message);
                    // Display error message and remove from tracking when closed
                    messageApi.open({
                        type: 'error',
                        content: error.message,
                        onClose: () => {
                            shownErrors.current.delete(error.message);
                        }
                    });
                }
            });
        });

        return () => {
            unsubscribeQuery();
            unsubscribeMutation();
        };
    }, [queryClient, messageApi]);

    return (
        <>
            {contextHolder}
            {children}
        </>
    );
}; 