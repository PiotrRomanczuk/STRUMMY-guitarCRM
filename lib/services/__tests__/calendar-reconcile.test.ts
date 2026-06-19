import { reconcileCalendarForStudent } from '../calendar-reconcile';

const mockReconcileEventAttendee = jest.fn();
jest.mock('@/lib/google', () => ({
  reconcileEventAttendee: (...args: unknown[]) => mockReconcileEventAttendee(...args),
}));

jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }),
}));

const profileSingle = jest.fn();
const lessonsGt = jest.fn();
const adminFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ from: adminFrom })),
}));

const STUDENT = 'student-1';

beforeEach(() => {
  jest.clearAllMocks();
  profileSingle.mockResolvedValue({ data: { email: 'real@example.com' }, error: null });
  lessonsGt.mockResolvedValue({
    data: [
      { id: 'l1', teacher_id: 't1', google_event_id: 'g1' },
      { id: 'l2', teacher_id: 't1', google_event_id: 'g2' },
    ],
    error: null,
  });
  mockReconcileEventAttendee.mockResolvedValue(undefined);
  adminFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return { select: () => ({ eq: () => ({ single: profileSingle }) }) };
    }
    return { select: () => ({ eq: () => ({ not: () => ({ gt: lessonsGt }) }) }) };
  });
});

describe('reconcileCalendarForStudent', () => {
  it('swaps the attendee on each future event to the real email', async () => {
    const res = await reconcileCalendarForStudent(STUDENT);
    expect(res).toEqual({ reconciled: 2, failed: 0, skipped: 0 });
    expect(mockReconcileEventAttendee).toHaveBeenCalledWith('t1', 'g1', 'real@example.com');
    expect(mockReconcileEventAttendee).toHaveBeenCalledWith('t1', 'g2', 'real@example.com');
  });

  it('isolates per-event failures — one fails, the rest proceed', async () => {
    mockReconcileEventAttendee.mockImplementation((_t: string, eventId: string) =>
      eventId === 'g1' ? Promise.reject(new Error('Google 500')) : Promise.resolve()
    );
    const res = await reconcileCalendarForStudent(STUDENT);
    expect(res).toEqual({ reconciled: 1, failed: 1, skipped: 0 });
  });

  it('returns zeros and does nothing when the student email cannot be resolved', async () => {
    profileSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const res = await reconcileCalendarForStudent(STUDENT);
    expect(res).toEqual({ reconciled: 0, failed: 0, skipped: 0 });
    expect(mockReconcileEventAttendee).not.toHaveBeenCalled();
  });
});
