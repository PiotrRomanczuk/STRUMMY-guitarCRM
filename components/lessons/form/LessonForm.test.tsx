import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LessonForm from './LessonForm';
import useLessonForm from '../hooks/useLessonForm';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../hooks/useLessonForm', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock child components to isolate LessonForm logic
jest.mock('./LessonForm.ProfileSelect', () => ({
  ProfileSelect: ({ label, value, onChange, error, options }: { label: string; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; error?: string; options: { id: string; full_name: string }[] }) => (
    <div data-testid={`profile-select-${label.toLowerCase()}`}>
      <label>{label}</label>
      <select
        data-testid={`select-${label.toLowerCase()}`}
        value={value}
        onChange={onChange}
        name={label === 'Student' ? 'student_id' : 'teacher_id'}
      >
        <option value="">Select {label}</option>
        {options?.map((opt: { id: string; full_name: string }) => (
          <option key={opt.id} value={opt.id}>{opt.full_name}</option>
        ))}
      </select>
      {error && <span data-testid={`error-${label.toLowerCase()}`}>{error}</span>}
    </div>
  ),
}));

jest.mock('./LessonForm.SongSelect', () => ({
  SongSelect: ({ selectedSongIds, onChange, error, studentId }: { selectedSongIds: string[]; onChange: (ids: string[]) => void; error?: string; studentId?: string }) => (
    <div data-testid="song-select" data-student-id={studentId || ''}>
      <input
        data-testid="input-songs"
        value={selectedSongIds?.join(',') || ''}
        onChange={(e) => onChange(e.target.value ? e.target.value.split(',') : [])}
      />
      {error && <span data-testid="error-songs">{error}</span>}
    </div>
  ),
}));

jest.mock('./LessonForm.Fields', () => ({
  LessonFormFields: ({ formData, handleChange }: { formData: { title: string }; handleChange: React.ChangeEventHandler<HTMLInputElement>; validationErrors?: Record<string, string> }) => (
    <div data-testid="lesson-form-fields">
      <input
        data-testid="input-title"
        name="title"
        value={formData.title || ''}
        onChange={handleChange}
      />
    </div>
  ),
}));

jest.mock('./LessonForm.Actions', () => ({
  LessonFormActions: ({ isSubmitting, onCancel }: { isSubmitting: boolean; onCancel: () => void }) => (
    <div data-testid="lesson-form-actions">
      <button type="submit" disabled={isSubmitting}>Submit</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('LessonForm', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  const mockHandleSubmit = jest.fn();
  const mockHandleChange = jest.fn();
  const mockHandleSongChange = jest.fn();

  const defaultHookValues = {
    formData: {
      student_id: '',
      teacher_id: '',
      title: '',
      song_ids: [],
    },
    students: [{ id: 's1', full_name: 'Student 1' }],
    teachers: [{ id: 't1', full_name: 'Teacher 1' }],
    loading: false,
    error: null,
    validationErrors: {},
    handleChange: mockHandleChange,
    handleSongChange: mockHandleSongChange,
    handleSubmit: mockHandleSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLessonForm as jest.Mock).mockReturnValue(defaultHookValues);
  });

  it('renders loading state', () => {
    (useLessonForm as jest.Mock).mockReturnValue({
      ...defaultHookValues,
      loading: true,
    });

    render(<LessonForm />);
    expect(screen.getByText('Loading form...')).toBeInTheDocument();
  });

  it('renders form fields when loaded', () => {
    render(<LessonForm />);
    
    expect(screen.getByTestId('profile-select-student')).toBeInTheDocument();
    expect(screen.getByTestId('profile-select-teacher')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-form-fields')).toBeInTheDocument();
    expect(screen.getByTestId('song-select')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-form-actions')).toBeInTheDocument();
  });

  it('displays error message if hook returns error', () => {
    (useLessonForm as jest.Mock).mockReturnValue({
      ...defaultHookValues,
      error: 'Something went wrong',
    });

    render(<LessonForm />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('handles form submission success for new lesson', async () => {
    mockHandleSubmit.mockResolvedValue({ success: true });
    
    render(<LessonForm />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/lessons?created=true');
    });
  });

  it('handles form submission success for existing lesson', async () => {
    mockHandleSubmit.mockResolvedValue({ success: true });
    
    render(<LessonForm lessonId="123" />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/lessons/123');
    });
  });

  it('handles form submission failure', async () => {
    mockHandleSubmit.mockResolvedValue({ success: false });
    
    render(<LessonForm />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it('passes validation errors to child components', () => {
    (useLessonForm as jest.Mock).mockReturnValue({
      ...defaultHookValues,
      validationErrors: {
        student_id: 'Student is required',
        teacher_id: 'Teacher is required',
        song_ids: 'Songs are required',
      },
    });

    render(<LessonForm />);
    
    expect(screen.getByTestId('error-student')).toHaveTextContent('Student is required');
    expect(screen.getByTestId('error-teacher')).toHaveTextContent('Teacher is required');
    expect(screen.getByTestId('error-songs')).toHaveTextContent('Songs are required');
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<LessonForm />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/lessons');
  });

  it('passes studentId to SongSelect for progress display', () => {
    (useLessonForm as jest.Mock).mockReturnValue({
      ...defaultHookValues,
      formData: {
        ...defaultHookValues.formData,
        student_id: 'student-abc',
      },
    });

    render(<LessonForm />);

    const songSelect = screen.getByTestId('song-select');
    expect(songSelect).toHaveAttribute('data-student-id', 'student-abc');
  });
});
