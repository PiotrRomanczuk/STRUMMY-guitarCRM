'use client';

import { useState } from 'react';

interface CreateAssignmentInput {
  title: string;
  description?: string;
  due_date?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  student_id: string;
  lesson_id?: string | null;
  song_id?: string | null;
}

interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  due_date?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  lesson_id?: string | null;
  song_id?: string | null;
}

/**
 * Hook for assignment CRUD mutations
 */
export function useAssignmentMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAssignment = async (input: CreateAssignmentInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAssignment = async (id: string, input: UpdateAssignmentInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update assignment');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete assignment');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    isLoading,
    error,
  };
}
