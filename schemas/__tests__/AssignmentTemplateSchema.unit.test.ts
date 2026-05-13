import {
  AssignmentTemplateSchema,
  AssignmentTemplateInputSchema,
  AssignmentTemplateUpdateSchema,
} from '@/schemas/AssignmentTemplateSchema';

const UUID = 'aaaaaaaa-1111-4111-8111-111111111111';

describe('AssignmentTemplateInputSchema', () => {
  it('accepts a minimal valid input', () => {
    const parsed = AssignmentTemplateInputSchema.parse({
      title: 'Practice routine',
      teacher_id: UUID,
    });
    expect(parsed).toEqual({ title: 'Practice routine', teacher_id: UUID });
  });

  it('requires a non-empty title', () => {
    expect(() => AssignmentTemplateInputSchema.parse({ title: '', teacher_id: UUID })).toThrow(
      /Title is required/
    );
  });

  it('caps title at 200 chars', () => {
    expect(() =>
      AssignmentTemplateInputSchema.parse({
        title: 't'.repeat(201),
        teacher_id: UUID,
      })
    ).toThrow();
  });

  it('caps description at 2000 chars', () => {
    expect(() =>
      AssignmentTemplateInputSchema.parse({
        title: 'ok',
        teacher_id: UUID,
        description: 'd'.repeat(2001),
      })
    ).toThrow();
  });

  it('accepts a null description', () => {
    const parsed = AssignmentTemplateInputSchema.parse({
      title: 'ok',
      teacher_id: UUID,
      description: null,
    });
    expect(parsed.description).toBeNull();
  });

  it('rejects a malformed teacher_id', () => {
    expect(() =>
      AssignmentTemplateInputSchema.parse({
        title: 'ok',
        teacher_id: 'not-a-uuid',
      })
    ).toThrow();
  });
});

describe('AssignmentTemplateUpdateSchema', () => {
  it('requires an id', () => {
    expect(() => AssignmentTemplateUpdateSchema.parse({ title: 'updated' })).toThrow();
  });

  it('allows updating a single field', () => {
    const parsed = AssignmentTemplateUpdateSchema.parse({
      id: UUID,
      title: 'New title',
    });
    expect(parsed).toEqual({ id: UUID, title: 'New title' });
  });
});

describe('AssignmentTemplateSchema (row)', () => {
  it('accepts a full database row', () => {
    const row = {
      id: UUID,
      title: 'Routine',
      description: null,
      teacher_id: UUID,
      created_at: '2026-05-01T00:00:00.000Z',
      updated_at: '2026-05-02T00:00:00.000Z',
    };
    expect(AssignmentTemplateSchema.parse(row)).toEqual(row);
  });

  it('rejects malformed datetime strings', () => {
    expect(() =>
      AssignmentTemplateSchema.parse({
        id: UUID,
        title: 'Routine',
        teacher_id: UUID,
        created_at: 'yesterday',
      })
    ).toThrow();
  });
});
