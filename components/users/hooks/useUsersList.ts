import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  isAdmin: boolean;
  isTeacher: boolean | null;
  isStudent: boolean | null;
  isActive: boolean;
  isRegistered: boolean;
  studentStatus: 'active' | 'archived';
  avatar_url: string | null;
  created_at: string | null;
}

interface UsersListResponse {
  data: UserProfile[];
  total: number;
  limit: number;
  offset: number;
}

export function useUsersList(
  search: string,
  roleFilter: '' | 'admin' | 'teacher' | 'student',
  activeFilter: '' | 'true' | 'false',
  studentStatusFilter: '' | 'active' | 'archived',
  initialUsers?: UserProfile[]
) {
  const isDefaultState = !search && !roleFilter && !activeFilter && !studentStatusFilter;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', search, roleFilter, activeFilter, studentStatusFilter],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.active = activeFilter;
      if (studentStatusFilter) params.studentStatus = studentStatusFilter;

      const response = await apiClient.get<UsersListResponse>('/api/users', { params });
      return response.data || [];
    },
    enabled: true,
    initialData: isDefaultState && initialUsers ? initialUsers : undefined,
  });

  return {
    users: data || [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Unknown error') : null,
    refetch,
  };
}
