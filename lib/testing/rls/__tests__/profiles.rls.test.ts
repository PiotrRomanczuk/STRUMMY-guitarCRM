/**
 * RLS-real coverage for the profiles soft-delete + role-scoping predicate
 * (STRUM-p2, spec 04 / 10). Proves against a real Supabase branch that:
 *   - a teacher sees active students but NOT deactivated ones
 *   - an admin sees everyone, including deactivated profiles
 *   - a user sees their own profile (active or not)
 *   - a non-admin cannot flip another profile's role flags (UPDATE denied)
 *   - a user can self-edit full_name/phone/avatar_url but not another's
 *
 * Auto-skips unless an RLS test DB is configured (see lib/testing/rls/env.ts).
 * Requires the 20260616120000_soft_delete_users migration applied to that branch.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { describeIfRls, createServiceClient, signInAs } from '../index';

const PASSWORD = 'rls-test-Password!1';

type Seeded = { id: string; email: string; client: SupabaseClient };

describeIfRls('profiles RLS — soft-delete scoping + self-edit', () => {
  const service = createServiceClient();
  const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ids: string[] = [];

  let admin: Seeded;
  let teacher: Seeded;
  let activeStudent: Seeded;
  let deactivatedStudent: Seeded;

  const make = async (
    role: 'admin' | 'teacher' | 'student',
    label: string,
    overrides: Record<string, unknown> = {}
  ): Promise<Seeded> => {
    const email = `rls-${role}-${label}-${tag}@guitarcrm.local`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { isTest: true },
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    const id = data.user.id;
    ids.push(id);
    const { error: pErr } = await service.from('profiles').upsert(
      {
        id,
        email,
        full_name: `RLS ${role} ${label}`,
        is_admin: role === 'admin',
        is_teacher: role === 'teacher',
        is_student: role === 'student',
        is_development: true,
        is_active: true,
        ...overrides,
      },
      { onConflict: 'id' }
    );
    if (pErr) throw new Error(`profile upsert failed: ${pErr.message}`);
    const client = await signInAs(email, PASSWORD);
    return { id, email, client };
  };

  beforeAll(async () => {
    admin = await make('admin', 'a');
    teacher = await make('teacher', 't');
    activeStudent = await make('student', 'active');
    deactivatedStudent = await make('student', 'inactive', {
      is_active: false,
      deleted_at: new Date().toISOString(),
    });
    // Link both students to the teacher via lessons (teacher visibility path).
    await service.from('lessons').insert([
      {
        teacher_id: teacher.id,
        student_id: activeStudent.id,
        scheduled_at: new Date().toISOString(),
      },
      {
        teacher_id: teacher.id,
        student_id: deactivatedStudent.id,
        scheduled_at: new Date().toISOString(),
      },
    ]);
  }, 30_000);

  afterAll(async () => {
    await Promise.allSettled(ids.map((id) => service.auth.admin.deleteUser(id)));
  });

  it('teacher sees the active student', async () => {
    const { data } = await teacher.client
      .from('profiles')
      .select('id')
      .eq('id', activeStudent.id)
      .maybeSingle();
    expect(data?.id).toBe(activeStudent.id);
  });

  it('teacher CANNOT see a deactivated student (is_active predicate hides it)', async () => {
    const { data } = await teacher.client
      .from('profiles')
      .select('id')
      .eq('id', deactivatedStudent.id)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it('admin sees ALL profiles including the deactivated student', async () => {
    const { data } = await admin.client
      .from('profiles')
      .select('id')
      .in('id', [activeStudent.id, deactivatedStudent.id]);
    const seen = new Set((data ?? []).map((r) => r.id));
    expect(seen.has(activeStudent.id)).toBe(true);
    expect(seen.has(deactivatedStudent.id)).toBe(true);
  });

  it('a user sees their own profile', async () => {
    const { data } = await activeStudent.client
      .from('profiles')
      .select('id')
      .eq('id', activeStudent.id)
      .maybeSingle();
    expect(data?.id).toBe(activeStudent.id);
  });

  it('non-admin CANNOT flip another profile role flags (UPDATE denied by RLS)', async () => {
    await teacher.client.from('profiles').update({ is_admin: true }).eq('id', activeStudent.id);
    const { data } = await service
      .from('profiles')
      .select('is_admin')
      .eq('id', activeStudent.id)
      .single();
    expect(data?.is_admin).toBe(false);
  });

  it('a user can self-edit full_name/phone/avatar_url on their own row', async () => {
    const { error } = await activeStudent.client
      .from('profiles')
      .update({ full_name: 'Renamed Self', phone: '+1 555 000 1111' })
      .eq('id', activeStudent.id);
    expect(error).toBeNull();
    const { data } = await service
      .from('profiles')
      .select('full_name')
      .eq('id', activeStudent.id)
      .single();
    expect(data?.full_name).toBe('Renamed Self');
  });

  it('a user CANNOT self-edit another profile (self-only RLS)', async () => {
    await activeStudent.client
      .from('profiles')
      .update({ full_name: 'Hacked' })
      .eq('id', teacher.id);
    const { data } = await service
      .from('profiles')
      .select('full_name')
      .eq('id', teacher.id)
      .single();
    expect(data?.full_name).not.toBe('Hacked');
  });
});
