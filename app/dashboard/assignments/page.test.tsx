import { render, screen } from '@testing-library/react';
import AssignmentDetailPage from '@/app/dashboard/assignments/[id]/page';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getAssignmentDetail } from '@/lib/services/assignment-detail-queries';
import { redirect, notFound } from 'next/navigation';

// Mock CSS import
jest.mock('@/app/editorial-tokens.css', () => ({}), { virtual: true });

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(),
}));

jest.mock('@/lib/services/assignment-detail-queries', () => ({
  getAssignmentDetail: jest.fn(),
}));

jest.mock('@/components/assignments/editorial/detail/AssignmentDetailEditorial', () => ({
  AssignmentDetailEditorial: ({
    assignment,
    canManage,
    canAct,
  }: {
    assignment: { title: string };
    canManage: boolean;
    canAct: boolean;
  }) => (
    <div>
      <span data-testid="assignment-title">{assignment.title}</span>
      <span data-testid="can-manage">{String(canManage)}</span>
      <span data-testid="can-act">{String(canAct)}</span>
    </div>
  ),
}));

jest.mock('@/components/_editorial/editorial-fonts', () => ({
  editorialFontClass: 'editorial-font-class',
}));

const mockGetUserWithRolesSSR = getUserWithRolesSSR as jest.MockedFunction<
  typeof getUserWithRolesSSR
>;
const mockGetAssignmentDetail = getAssignmentDetail as jest.MockedFunction<
  typeof getAssignmentDetail
>;

const mockAssignment = {
  id: '123',
  title: 'Test Assignment',
  description: 'Do this',
  status: 'pending',
  dueDate: '2023-01-01',
  teacherId: 'teacher-1',
  studentId: 'student-1',
  studentName: 'Student One',
  studentEmail: 'student@example.com',
  teacherName: 'Teacher One',
  song: { id: 'song-1', title: 'Wonderwall', author: 'Oasis' },
  lesson: { id: 'lesson-1', scheduledAt: '2023-01-01T10:00:00Z' },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('AssignmentDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to sign-in if no user', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: null,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });

    const params = Promise.resolve({ id: '123' });

    try {
      await AssignmentDetailPage({ params });
    } catch {
      // redirect throws in Next.js
    }

    expect(redirect).toHaveBeenCalledWith('/sign-in?redirect=/dashboard/assignments/123');
  });

  it('calls notFound when assignment does not exist', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'user-1', email: 'admin@example.com' } as any,
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });
    mockGetAssignmentDetail.mockResolvedValue(null);

    const params = Promise.resolve({ id: 'nonexistent' });

    try {
      await AssignmentDetailPage({ params });
    } catch {
      // notFound throws in Next.js
    }

    expect(notFound).toHaveBeenCalled();
  });

  it('renders assignment detail for admin', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'admin-1', email: 'admin@example.com' } as any,
      isAdmin: true,
      isTeacher: false,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });
    mockGetAssignmentDetail.mockResolvedValue(mockAssignment);

    const params = Promise.resolve({ id: '123' });
    const jsx = await AssignmentDetailPage({ params });
    render(jsx);

    expect(screen.getByTestId('assignment-title')).toHaveTextContent('Test Assignment');
    expect(screen.getByTestId('can-manage')).toHaveTextContent('true');
    expect(screen.getByTestId('can-act')).toHaveTextContent('true');
  });

  it('grants canManage to the owning teacher', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'teacher-1', email: 'teacher@example.com' } as any,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });
    mockGetAssignmentDetail.mockResolvedValue(mockAssignment);

    const params = Promise.resolve({ id: '123' });
    const jsx = await AssignmentDetailPage({ params });
    render(jsx);

    expect(screen.getByTestId('can-manage')).toHaveTextContent('true');
    expect(screen.getByTestId('can-act')).toHaveTextContent('true');
  });

  it('denies canManage to a different teacher', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'other-teacher', email: 'other@example.com' } as any,
      isAdmin: false,
      isTeacher: true,
      isStudent: false,
      isParent: false,
      isDevelopment: false,
    });
    mockGetAssignmentDetail.mockResolvedValue(mockAssignment);

    const params = Promise.resolve({ id: '123' });
    const jsx = await AssignmentDetailPage({ params });
    render(jsx);

    expect(screen.getByTestId('can-manage')).toHaveTextContent('false');
    expect(screen.getByTestId('can-act')).toHaveTextContent('false');
  });

  it('grants canAct to the owning student', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: { id: 'student-1', email: 'student@example.com' } as any,
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isParent: false,
      isDevelopment: false,
    });
    mockGetAssignmentDetail.mockResolvedValue(mockAssignment);

    const params = Promise.resolve({ id: '123' });
    const jsx = await AssignmentDetailPage({ params });
    render(jsx);

    expect(screen.getByTestId('can-manage')).toHaveTextContent('false');
    expect(screen.getByTestId('can-act')).toHaveTextContent('true');
  });
});
