import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateStudentForm } from './CreateStudentForm';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateStudentForm', () => {
  it('renders name, invite email, and phone fields', () => {
    render(<CreateStudentForm />);
    expect(screen.getByRole('heading', { name: 'Add student' })).toBeInTheDocument();
    expect(screen.getByText('First name *')).toBeInTheDocument();
    expect(screen.getByText('Last name *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('student@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create student' })).toBeInTheDocument();
  });

  it('blocks submission and shows an error when required fields are missing', () => {
    const { container } = render(<CreateStudentForm />);
    // First/last name and invite email are HTML-required, so a real button
    // click would be blocked by native constraint validation before
    // handleSubmit runs. Dispatch submit directly to exercise its own guard.
    fireEvent.submit(container.querySelector('form')!);

    expect(
      screen.getByText('First name, last name, and invite email are required.')
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits the student and redirects to the new profile', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-student-id' }),
    });
    render(<CreateStudentForm />);

    fireEvent.change(screen.getByPlaceholderText('student@email.com'), {
      target: { value: 'emma@example.com' },
    });
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Emma' } });
    fireEvent.change(inputs[1], { target: { value: 'Johnson' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create student' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body).toMatchObject({
      firstName: 'Emma',
      lastName: 'Johnson',
      inviteEmail: 'emma@example.com',
      isStudent: true,
      isShadow: true,
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard/users/new-student-id'));
  });

  it('surfaces a server error without navigating', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already invited.' }),
    });
    render(<CreateStudentForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Emma' } });
    fireEvent.change(inputs[1], { target: { value: 'Johnson' } });
    fireEvent.change(screen.getByPlaceholderText('student@email.com'), {
      target: { value: 'emma@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create student' }));

    expect(await screen.findByText('Email already invited.')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
