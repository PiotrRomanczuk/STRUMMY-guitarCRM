/**
 * Drafted by local Gemma (gemma3:12b), corrected: mock useAIStream + server action.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmailDraftGenerator } from '@/components/dashboard/admin/EmailDraftGenerator';

jest.mock('@/hooks/useAIStream', () => ({
  useAIStream: jest.fn(() => ({
    status: 'idle',
    content: '',
    tokenCount: 0,
    error: null,
    reasoning: undefined,
    isStreaming: false,
    isError: false,
    start: jest.fn(),
    cancel: jest.fn(),
    reset: jest.fn(),
  })),
}));
jest.mock('@/app/actions/ai', () => ({ generateEmailDraftStream: jest.fn() }));

const students = [{ id: 's1', full_name: 'Emma Stone', email: 'emma@example.com' }] as never;

describe('EmailDraftGenerator', () => {
  it('renders the generator card', () => {
    render(<EmailDraftGenerator students={students} />);
    expect(screen.getByText('AI Email Draft Generator')).toBeInTheDocument();
  });

  it('renders the email type field', () => {
    render(<EmailDraftGenerator students={students} />);
    expect(screen.getByText('Email Type')).toBeInTheDocument();
  });
});
