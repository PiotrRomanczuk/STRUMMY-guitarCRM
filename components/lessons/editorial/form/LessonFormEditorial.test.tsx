import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LessonFormEditorial } from './LessonFormEditorial';
import { createLessonAction, updateLessonAction } from '@/app/actions/lesson-edit';

jest.mock('@/lib/config/features', () => ({ SHOW_AI_FEATURES: false }));
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));
jest.mock('@/app/actions/lesson-edit', () => ({
  createLessonAction: jest.fn(),
  updateLessonAction: jest.fn(),
}));
jest.mock('@/app/dashboard/lessons/recurring-actions', () => ({
  generateRecurringLessons: jest.fn(),
}));

const students = [
  { id: 's1', name: 'Emma Johnson', email: 'emma@example.com' },
  { id: 's2', name: 'Kuba Nowak', email: null },
];
const songs = [
  { id: 'sg1', title: 'Blackbird', author: 'The Beatles' },
  { id: 'sg2', title: 'Landslide', author: 'Fleetwood Mac' },
];

beforeEach(() => jest.clearAllMocks());

describe('LessonFormEditorial', () => {
  it('renders create-mode fields: student select, title, scheduled, songs, notes', () => {
    render(<LessonFormEditorial mode="create" students={students} songs={songs} />);

    expect(screen.getByRole('heading', { name: 'Schedule a lesson' })).toBeInTheDocument();
    expect(screen.getByLabelText('Student')).toBeInTheDocument();
    expect(screen.getByText('Emma Johnson · emma@example.com')).toBeInTheDocument();
    expect(screen.getByText('+ New student by email…')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Scheduled')).toBeInTheDocument();
    expect(screen.getByLabelText('Repertoire')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create lesson' })).toBeInTheDocument();
  });

  it('shows the invite-by-email field once the new-student option is picked', () => {
    render(<LessonFormEditorial mode="create" students={students} songs={songs} />);
    fireEvent.change(screen.getByLabelText('Student'), { target: { value: '__new__' } });
    expect(screen.getByPlaceholderText('student@email.com')).toBeInTheDocument();
  });

  it('renders the repeat-weekly toggle only in create mode', () => {
    render(<LessonFormEditorial mode="create" students={students} songs={songs} />);
    expect(screen.getByTestId('lesson-repeat-weekly-checkbox')).toBeInTheDocument();

    render(
      <LessonFormEditorial
        mode="edit"
        students={students}
        songs={songs}
        initial={{
          lessonId: 'l1',
          studentId: 's1',
          title: 'Warm-up',
          notes: null,
          scheduledAt: '2026-04-30T16:00:00.000Z',
          status: 'SCHEDULED',
          songIds: [],
        }}
      />
    );
    expect(screen.queryAllByTestId('lesson-repeat-weekly-checkbox')).toHaveLength(1);
  });

  it('requires a date/time before submitting', async () => {
    const { container } = render(
      <LessonFormEditorial mode="create" students={students} songs={songs} />
    );
    // The "Scheduled" input is HTML-required, so a real button click would be
    // blocked by native constraint validation before handleSubmit ever runs.
    // Dispatching submit directly exercises the handler's own guard instead.
    fireEvent.submit(container.querySelector('form')!);

    expect(await screen.findByText('Pick a date and time for the lesson.')).toBeInTheDocument();
    expect(createLessonAction).not.toHaveBeenCalled();
  });

  it('requires a student (or invite email) on create', async () => {
    render(<LessonFormEditorial mode="create" students={students} songs={songs} />);
    fireEvent.change(screen.getByLabelText('Scheduled'), {
      target: { value: '2026-04-30T16:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create lesson' }));

    expect(await screen.findByText('Choose a student or add one by email.')).toBeInTheDocument();
    expect(createLessonAction).not.toHaveBeenCalled();
  });

  it('submits create lessons and redirects to the new lesson', async () => {
    (createLessonAction as jest.Mock).mockResolvedValue({ lessonId: 'new-lesson-id' });
    render(<LessonFormEditorial mode="create" students={students} songs={songs} />);

    fireEvent.change(screen.getByLabelText('Student'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fingerpicking' } });
    fireEvent.change(screen.getByLabelText('Scheduled'), {
      target: { value: '2026-04-30T16:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create lesson' }));

    await waitFor(() => expect(createLessonAction).toHaveBeenCalled());
    expect(createLessonAction).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 's1', title: 'Fingerpicking' })
    );
    expect(mockPush).toHaveBeenCalledWith('/dashboard/lessons/new-lesson-id');
  });

  it('surfaces a server error without navigating', async () => {
    (createLessonAction as jest.Mock).mockResolvedValue({ error: 'Something went wrong.' });
    render(<LessonFormEditorial mode="create" students={students} songs={songs} />);

    fireEvent.change(screen.getByLabelText('Student'), { target: { value: 's1' } });
    fireEvent.change(screen.getByLabelText('Scheduled'), {
      target: { value: '2026-04-30T16:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create lesson' }));

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('edit mode pre-fills fields and submits via updateLessonAction', async () => {
    (updateLessonAction as jest.Mock).mockResolvedValue({ lessonId: 'l1' });
    render(
      <LessonFormEditorial
        mode="edit"
        students={students}
        songs={songs}
        initial={{
          lessonId: 'l1',
          studentId: 's1',
          title: 'Warm-up',
          notes: 'Focus on scales',
          scheduledAt: '2026-04-30T16:00:00.000Z',
          status: 'SCHEDULED',
          songIds: ['sg1'],
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit lesson' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Warm-up')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateLessonAction).toHaveBeenCalledWith('l1', expect.anything()));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/lessons/l1');
  });
});
