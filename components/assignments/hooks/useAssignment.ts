'use client';

import { useEffect, useState } from 'react';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  teacher_id: string;
  student_id: string;
  lesson_id: string | null;
  song_id: string | null;
  created_at: string;
  updated_at: string;
  teacher_profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  student_profile?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  lesson?: {
    id: string;
    lesson_teacher_number: number;
    scheduled_at: string;
    status: string;
  };
  song?: {
    id: string;
    title: string;
    author: string;
  } | null;
}

/**
 * Hook to fetch a single assignment by ID
 */
export function useAssignment(id: string | null) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/assignments/${id}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch assignment');
        }

        const data = await response.json();
        setAssignment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAssignment(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const refresh = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assignments/${id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch assignment');
      }

      const data = await response.json();
      setAssignment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assignment,
    isLoading,
    error,
    refresh,
  };
}
