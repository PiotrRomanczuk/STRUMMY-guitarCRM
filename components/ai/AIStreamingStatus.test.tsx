/**
 * Drafted by local Gemma (gemma3:12b), corrected to match the real component:
 * `status` is a string union (not an enum), UI primitives render for real, and
 * the component is purely presentational (no module mocks needed).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIStreamingStatus } from '@/components/ai/AIStreamingStatus';

describe('AIStreamingStatus', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<AIStreamingStatus status="idle" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders connecting state', () => {
    render(<AIStreamingStatus status="connecting" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders streaming state with progress and token badge', () => {
    render(<AIStreamingStatus status="streaming" tokenCount={100} estimatedTotal={1000} />);
    expect(screen.getByText('Streaming response...')).toBeInTheDocument();
    expect(screen.getByText('100 tokens')).toBeInTheDocument();
    // progress = 100/1000 = 10%
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('shows a cancel button that invokes onCancel', () => {
    const onCancel = jest.fn();
    render(<AIStreamingStatus status="streaming" onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel streaming/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders an error with a retry button', () => {
    const onRetry = jest.fn();
    render(<AIStreamingStatus status="error" error={new Error('boom')} onRetry={onRetry} />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('toggles the reasoning section', () => {
    render(<AIStreamingStatus status="streaming" reasoning="chain of thought" />);
    expect(screen.queryByText('chain of thought')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show reasoning/i }));
    expect(screen.getByText('chain of thought')).toBeInTheDocument();
  });
});
