# Teacher Data Isolation - Security Analysis

**Date**: 2026-02-02
**Status**: VULNERABILITY CONFIRMED
**Severity**: Medium (Information Disclosure)

## Executive Summary

Investigation into teacher data isolation revealed **one confirmed vulnerability** in the student list API endpoint, while lesson isolation is properly implemented.

### Findings Overview

| Component | Status | Risk Level |
|-----------|--------|------------|
| Lessons API (`/api/lessons`) | ✅ **SECURE** | None |
| Students API (`/api/teacher/students`) | 🔴 **VULNERABLE** | Medium |
| Lesson Edit/Delete | ✅ **SECURE** | None |
| Dashboard UI | ⚠️ **UNKNOWN** | TBD |

---

## 1. Vulnerability Details

### 🔴 CRITICAL: Student List Information Disclosure

**File**: `/home/piotr/Desktop/guitar-crm/app/api/teacher/students/route.ts` (lines 27-31)

**Issue**: The API endpoint `/api/teacher/students` returns ALL students in the system, not filtered by the authenticated teacher.

**Current Code**:
```typescript
const { data: students, error: studentsError } = await supabase
  .from('profiles')
  .select('id, full_name, user_roles!inner(role)')
  .eq('user_roles.role', 'student')  // ❌ NO TEACHER FILTER
  .order('full_name');
```

**Impact**:
- Teacher A can see the names and IDs of Teacher B's students
- Information disclosure violation
- Could be used to enumerate all students in the system
- May violate privacy expectations and FERPA/GDPR requirements

**Example Attack**:
```bash
# Teacher A makes authenticated request
curl -H "Authorization: Bearer <teacher-a-token>" \
  https://app/api/teacher/students

# Response includes ALL students:
{
  "students": [
    {"id": "...", "full_name": "Student 1 (Teacher A)"},
    {"id": "...", "full_name": "Student 2 (Teacher A)"},
    {"id": "...", "full_name": "Student 3 (Teacher B)"},  # ❌ LEAKED
    {"id": "...", "full_name": "Student 4 (Teacher B)"}   # ❌ LEAKED
  ]
}
```

**Fix Required**:
```typescript
// Option 1: Filter by lessons.teacher_id
const { data: students, error: studentsError } = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    user_roles!inner(role),
    lessons_as_student!inner(teacher_id)
  `)
  .eq('user_roles.role', 'student')
  .eq('lessons_as_student.teacher_id', user.id)  // ✅ FILTER BY TEACHER
  .order('full_name');

// Option 2: Subquery approach (more explicit)
// 1. Get student IDs from lessons where teacher_id = current teacher
const { data: lessons } = await supabase
  .from('lessons')
  .select('student_id')
  .eq('teacher_id', user.id);

const studentIds = [...new Set(lessons.map(l => l.student_id))];

// 2. Fetch only those students
const { data: students } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', studentIds)
  .order('full_name');
```

**Test Coverage**: `cypress/e2e/security/teacher-isolation.cy.ts`

---

## 2. Secure Implementations (No Issues Found)

### ✅ Lessons API - Properly Isolated

**File**: `/home/piotr/Desktop/guitar-crm/app/api/lessons/handlers.ts` (lines 89-96)

**Implementation**:
```typescript
if (profile.isTeacher) {
  // Teacher sees only their students' lessons
  const studentIds = await getTeacherStudentIds(supabase, user.id);
  if (studentIds.length === 0) {
    return { lessons: [], count: 0, status: 200 };
  }
  const filteredQuery = dbQuery.in('student_id', studentIds);
  return {
    query: applyLessonFilters(filteredQuery, {
      filter: params.filter,
      studentId: params.studentId,
    }),
  };
}
```

**How it works**:
1. Gets student IDs from `lessons` table where `teacher_id = current_teacher`
2. Filters lessons query to only include those student IDs
3. Teacher A cannot see Teacher B's lessons

**Verification**:
- ✅ GET `/api/lessons` filters by teacher
- ✅ Lesson update/delete operations respect teacher ownership
- ✅ RLS policies on `lessons` table enforce database-level isolation

---

## 3. Implementation Verification

### Current State (2026-02-02)

| Endpoint | Expected Behavior | Actual Behavior | Status |
|----------|-------------------|-----------------|--------|
| `GET /api/lessons` | Filter by teacher's students | ✅ Filters correctly | SECURE |
| `GET /api/teacher/students` | Filter by teacher's students | ❌ Returns ALL students | VULNERABLE |
| `PUT /api/lessons/[id]` | Block other teacher's lessons | ✅ Returns 403/404 | SECURE |
| `DELETE /api/lessons/[id]` | Block other teacher's lessons | ✅ Returns 403/404 | SECURE |
| `GET /api/lessons/[id]` | Hide other teacher's lessons | ✅ Returns 404 | SECURE |

### Test Results

Tests implemented in `/home/piotr/Desktop/guitar-crm/cypress/e2e/security/teacher-isolation.cy.ts`

**Test Scenarios**:
1. ✅ Teacher A cannot see Teacher B's lessons in API
2. ✅ Teacher A cannot edit Teacher B's lessons
3. ✅ Teacher A cannot delete Teacher B's lessons
4. 🔴 Teacher A CAN see Teacher B's students in `/api/teacher/students` (VULNERABILITY)
5. ⚠️ Dashboard isolation - needs verification
6. ⚠️ UI student list isolation - needs verification

---

## 4. Root Cause Analysis

### Why Lessons Work But Students Don't

**Lessons API** uses a proper filtering pattern:
```typescript
// Step 1: Get teacher's students
const studentIds = await getTeacherStudentIds(supabase, user.id);

// Step 2: Filter lessons by those students
query.in('student_id', studentIds);
```

**Students API** skips the filtering step:
```typescript
// ❌ MISSING: No teacher filter
query.eq('user_roles.role', 'student');  // All students, regardless of teacher
```

### Why This Happened

Likely causes:
1. **Different implementation times** - Lessons API was refactored with proper isolation, Students API was not updated
2. **Ambiguous requirements** - Unclear whether teachers should see all students or only their own
3. **Missing test coverage** - No integration tests for teacher isolation until now
4. **Incomplete security review** - Students API not audited for RBAC compliance

---

## 5. Risk Assessment

### Exploitability: **MEDIUM**

- Requires authenticated teacher account
- No privilege escalation (teacher role already has elevated access)
- Cannot directly access lesson data, only student metadata (names, IDs)

### Impact: **MEDIUM**

**Information Disclosed**:
- Student full names
- Student user IDs (UUIDs)

**NOT Disclosed**:
- Student contact info (email, phone) - not returned by endpoint
- Student lesson details
- Student grades/progress
- Student personal information beyond name

**Compliance Concerns**:
- **FERPA** (US): May violate student privacy expectations
- **GDPR** (EU): Unnecessary data access could be considered excessive processing
- **Internal Policy**: Violates principle of least privilege

### Overall Risk: **MEDIUM**

Not a critical security flaw, but should be fixed before production release to:
- Comply with privacy regulations
- Follow security best practices
- Prevent potential misuse
- Maintain user trust

---

## 6. Remediation Plan

### Immediate Actions (Week 1)

1. **Fix the API endpoint** (1-2 hours)
   - Update `/app/api/teacher/students/route.ts`
   - Implement teacher-student relationship filtering
   - Use lessons table to determine teacher's students

2. **Add unit tests** (1 hour)
   - Test API returns only teacher's students
   - Test empty result when teacher has no students
   - Test multiple teachers don't see each other's students

3. **Run E2E tests** (30 minutes)
   - Execute `cypress/e2e/security/teacher-isolation.cy.ts`
   - Verify all tests pass
   - Document test results

### Verification Steps (Week 1)

1. **Manual verification**:
   ```bash
   # Create Teacher A with Student S1
   # Create Teacher B with Student S2
   # Login as Teacher A
   # GET /api/teacher/students
   # Verify: Response contains only S1, not S2
   ```

2. **Automated verification**:
   ```bash
   npm run cypress:run -- --spec "cypress/e2e/security/teacher-isolation.cy.ts"
   ```

3. **Code review**:
   - Review fix with security mindset
   - Check for similar patterns in other APIs
   - Verify RLS policies align with application logic

### Follow-up Actions (Week 2-3)

4. **Audit similar endpoints**:
   - Check all `/api/teacher/*` routes
   - Check all `/api/admin/*` routes
   - Verify consistent isolation patterns

5. **Dashboard UI verification**:
   - Test teacher dashboard shows only own students
   - Test student list page filters correctly
   - Test student detail pages block unauthorized access

6. **Documentation**:
   - Update API documentation with teacher isolation rules
   - Document teacher-student relationship model
   - Add security testing guidelines for new features

---

## 7. Proposed Fix

### Code Changes

**File**: `/app/api/teacher/students/route.ts`

```typescript
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);

    const userRoles = roles?.map((r) => r.role) || [];

    if (!userRoles.includes('teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ FIX: Get students assigned to this teacher via lessons table
    // Step 1: Get unique student IDs from lessons where teacher_id = current teacher
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('student_id')
      .eq('teacher_id', user.id);

    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 500 });
    }

    // Extract unique student IDs
    const studentIds = lessons
      ? [...new Set(lessons.map((l) => l.student_id))]
      : [];

    if (studentIds.length === 0) {
      // Teacher has no students yet
      return NextResponse.json({ students: [] });
    }

    // Step 2: Fetch only those students
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, user_roles!inner(role)')
      .eq('user_roles.role', 'student')
      .in('id', studentIds)  // ✅ FILTER BY TEACHER'S STUDENTS
      .order('full_name');

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }

    // Map back to flat structure
    const flatStudents = students?.map((s) => ({
      id: s.id,
      full_name: s.full_name,
      is_student: true,
    }));

    return NextResponse.json({ students: flatStudents || [] });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### Alternative: Direct Join Approach

```typescript
// Alternative: Use a join to get students in one query
const { data: students, error: studentsError } = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    user_roles!inner(role),
    lessons_as_student!inner(teacher_id)
  `)
  .eq('user_roles.role', 'student')
  .eq('lessons_as_student.teacher_id', user.id)
  .order('full_name');
```

**Note**: The join approach requires proper foreign key relationships and may return duplicate students if they have multiple lessons. The subquery approach (recommended) handles this cleanly.

---

## 8. Testing Strategy

### Test Coverage

**Unit Tests** (Not yet implemented):
- `app/api/teacher/students/route.test.ts`
- Test teacher with no students returns empty array
- Test teacher with 2 students returns only those 2
- Test teacher A doesn't see teacher B's students

**Integration Tests** (Implemented):
- `cypress/e2e/security/teacher-isolation.cy.ts`
- Full E2E testing with 2 teachers, 2 students
- API endpoint verification
- UI verification
- Cross-teacher operation blocking

**Manual Testing Checklist**:
- [ ] Create Teacher A with Student S1
- [ ] Create Teacher B with Student S2
- [ ] Login as Teacher A
- [ ] Call `/api/teacher/students` - verify only S1 returned
- [ ] Visit `/dashboard/users` - verify only S1 visible
- [ ] Try to access Student S2's profile - verify blocked
- [ ] Login as Teacher B
- [ ] Call `/api/teacher/students` - verify only S2 returned
- [ ] Verify cannot see Student S1

---

## 9. Additional Recommendations

### Security Best Practices

1. **Consistent filtering pattern**:
   - All teacher-scoped endpoints should use the same student filtering logic
   - Extract to a reusable helper function: `getTeacherStudentIds(teacherId)`

2. **RLS policy alignment**:
   - Verify database RLS policies match application logic
   - Consider adding RLS policy on `profiles` table for teacher-student relationships

3. **Least privilege principle**:
   - Teachers should only access students they actively teach
   - Past students (no active lessons) may need different handling

4. **Audit logging**:
   - Log when teachers access student data
   - Monitor for unusual access patterns

### Future Enhancements

1. **Teacher-student assignment table**:
   - Currently, relationship is inferred from `lessons` table
   - Consider explicit `teacher_students` table for clarity
   - Would support "assigned but no lessons yet" scenario

2. **Role-based caching**:
   - Cache teacher's student list to reduce database queries
   - Invalidate cache when lessons are created/deleted

3. **Admin override**:
   - Admins should still see all students
   - Ensure admin role bypasses teacher filtering

---

## 10. Appendix

### Related Files

**API Implementation**:
- `/app/api/teacher/students/route.ts` - VULNERABLE endpoint
- `/app/api/lessons/handlers.ts` - SECURE reference implementation
- `/app/api/lessons/route.ts` - API route entry point

**Test Files**:
- `/cypress/e2e/security/teacher-isolation.cy.ts` - E2E security tests
- `/cypress/support/commands.ts` - Test utilities

**Documentation**:
- `/PLAYWRIGHT_MIGRATION_PROGRESS.md` - Original analysis document
- `/CLAUDE.md` - Project overview and conventions

### Database Schema

**Lessons Table** (used for teacher-student relationship):
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ,
  status TEXT,
  ...
);
```

**Profiles Table**:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  is_admin BOOLEAN,
  is_teacher BOOLEAN,
  is_student BOOLEAN,
  ...
);
```

**User Roles Table**:
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES profiles(id),
  role TEXT,
  PRIMARY KEY (user_id, role)
);
```

### Test Credentials

**Admin**:
- Email: `p.romanczuk@gmail.com`
- Password: `test123_admin`

**Teacher A**:
- Email: `teacher@example.com`
- Password: `test123_teacher`

**Teacher B** (created by test):
- Email: `teacher_b_isolation_test@example.com`
- Password: `test123_teacher_b`

**Students** (created by test):
- Student A: `student_a_teacher_test@example.com`
- Student B: `student_b_teacher_test@example.com`

---

## Conclusion

This investigation confirms **one medium-severity vulnerability** in the teacher student list API endpoint. The issue is straightforward to fix (estimated 1-2 hours) and comprehensive tests are now in place to verify the fix and prevent regression.

**Next Steps**:
1. Apply the proposed fix to `/app/api/teacher/students/route.ts`
2. Run Cypress tests to verify: `npm run cypress:run -- --spec "cypress/e2e/security/teacher-isolation.cy.ts"`
3. Code review the fix
4. Deploy to staging and verify
5. Deploy to production

**Timeline**: Can be completed within 1 week.

---

**Document Version**: 1.0
**Last Updated**: 2026-02-02
**Author**: Claude Code (Security Analysis)
**Status**: PENDING FIX
