export const meta = {
  name: 'design-preview-fan-out',
  description:
    'Fan out parallel agents to port the remaining Strummy.html design-preview sections to TypeScript. Each agent reads its assigned prototype source files, implements the section under components/design-preview/<slug>/ and app/design-preview/<slug>/, ESLint-checks its own files, and returns a structured result (file list + commit message + PR body). Orchestrator handles git/PR serially afterward.',
  phases: [{ title: 'Implement', detail: '14 sections in parallel, isolated by file path' }],
};

const SECTIONS = [
  {
    slug: 'lessons',
    title: 'Lesson Management',
    sourceFiles: [
      'lesson-app.jsx',
      'lesson-list.jsx',
      'lesson-detail.jsx',
      'lesson-primitives.jsx',
      'lesson-data.jsx',
    ],
    description:
      'List ↔ detail navigation, in-app sidebar shell, wired so artboards can boot directly into either state. Five artboards.',
    artboards: [
      "Lessons · List · Desktop (1440×1024, teacher role) — <LessonApp role='teacher' initial='list'/>",
      "Lesson detail · #042 Blackbird · Desktop (1440×1024) — <LessonApp role='teacher' initial='detail' initialLessonId='L-042'/>",
      "Lessons · List · Mobile (390×844) — <LessonAppMobile role='teacher' initial='list'/>",
      "Lesson detail · Mobile (390×844) — <LessonAppMobile role='teacher' initial='detail' initialLessonId='L-042'/>",
      "Student role · Lessons list (1440×1024) — <LessonApp role='student' initial='list'/>",
    ],
  },
  {
    slug: 'student-detail',
    title: 'Student Detail',
    sourceFiles: ['student-detail.jsx'],
    description:
      "Teacher's view of one student — overview, lessons, repertoire, practice log. Component accepts a studentId prop to switch between Emma (healthy) and Carlos (at-risk).",
    artboards: [
      "Emma Johnson · Overview · Desktop (1440×1400) — <StudentDetail studentId='s1' width={1440} height={1400}/>",
      "Carlos Reyes · At-risk · Desktop (1440×1400) — <StudentDetail studentId='s2' width={1440} height={1400}/>",
    ],
  },
  {
    slug: 'song-detail',
    title: 'Song / Repertoire Detail',
    sourceFiles: ['song-detail.jsx'],
    description: 'Chord chart, tab, lyrics, assign to student, usage stats. Single artboard.',
    artboards: [
      'Hotel California · Chords view · Desktop (1440×1300) — <SongDetail width={1440} height={1300}/>',
    ],
  },
  {
    slug: 'assignments',
    title: 'Assignments',
    sourceFiles: ['assignments.jsx'],
    description: 'Teacher: assign + review · Student: inbox + submit. Two artboards.',
    artboards: [
      'Teacher · Assignment management · Desktop (1440×1024) — <AssignmentsTeacher width={1440} height={1024}/>',
      'Student · Assignment inbox + submit · Desktop (1440×1024) — <AssignmentsStudent width={1440} height={1024}/>',
    ],
  },
  {
    slug: 'auth',
    title: 'Authentication',
    sourceFiles: ['auth.jsx'],
    description: 'Sign in (email + magic link + SSO), magic link sent confirmation, role select.',
    artboards: [
      'Sign in · email + magic link + SSO (1280×800) — <AuthSignIn width={1280} height={800}/>',
      'Magic link sent · check your inbox (1280×800) — <AuthMagicLinkSent width={1280} height={800}/>',
      'Role select · teacher · student · parent (1280×800) — <AuthRoleSelect width={1280} height={800}/>',
    ],
  },
  {
    slug: 'onboarding',
    title: 'Onboarding',
    sourceFiles: ['onboarding.jsx'],
    description: 'Teacher studio setup, student goals + level.',
    artboards: [
      'Teacher · Step 2 of 5 — Studio info (1280×800) — <OnboardTeacher width={1280} height={800}/>',
      'Student · Step 2 of 4 — Level + goals (1280×800) — <OnboardStudent width={1280} height={800}/>',
    ],
  },
  {
    slug: 'settings',
    title: 'Settings',
    sourceFiles: ['settings.jsx'],
    description:
      'Studio admin — billing, members, branding, integrations. The prototype defines <SettingsApp tab={...}/> mounted with each of the 4 tab values.',
    artboards: [
      "Settings · Billing (default tab) (1440×1024) — <SettingsApp width={1440} height={1024} tab='billing'/>",
      "Settings · Members (1440×1024) — <SettingsApp width={1440} height={1024} tab='members'/>",
      "Settings · Branding (1440×1024) — <SettingsApp width={1440} height={1024} tab='branding'/>",
      "Settings · Integrations (1440×1024) — <SettingsApp width={1440} height={1024} tab='integrations'/>",
    ],
  },
  {
    slug: 'notifications',
    title: 'Notifications / Activity',
    sourceFiles: ['notifications.jsx'],
    description: 'Full-pane activity feed with filters + daily digest rail.',
    artboards: [
      'Activity · Desktop (1440×1024) — <NotificationsPane width={1440} height={1024}/>',
      'Activity · Mobile (390×844) — <NotificationsPaneMobile/>',
    ],
  },
  {
    slug: 'states',
    title: 'Empty + Loading States',
    sourceFiles: ['states.jsx'],
    description: 'Teacher dashboard before any students, plus skeletons during load.',
    artboards: [
      'Empty · brand-new teacher, no students yet (1440×1024) — <EmptyTeacherDash width={1440} height={1024}/>',
      "Loading skeleton · 'Tuning up…' (1440×1024) — <LoadingTeacherDash width={1440} height={1024}/>",
    ],
  },
  {
    slug: 'tablet',
    title: 'Tablet — iPad on Music Stand',
    sourceFiles: ['tablet.jsx'],
    description: 'Landscape 1180×820 · LIVE lesson view, readable from 3 feet.',
    artboards: [
      'iPad · Live lesson · Big chord cards + timer (1220×860) — <TabletLiveLesson width={1180} height={820}/>',
    ],
  },
  {
    slug: 'parent',
    title: 'Parent View',
    sourceFiles: ['parent.jsx'],
    description: 'Practice log, upcoming lessons, teacher notes, billing — viewed by the parent.',
    artboards: [
      'Parent dashboard · Jenny J. → Lily P. (1440×1024) — <ParentDash width={1440} height={1024}/>',
    ],
  },
  {
    slug: 'fretboard',
    title: 'Fretboard Explorer',
    sourceFiles: ['fretboard-explorer.jsx', 'fretboard-theory.jsx', 'fretboard-svg.jsx'],
    description:
      'Interactive — pick a key & scale. The prototype supports a runtime fretboard style switch (studio/engraved/mono) via a fretboardStyle prop. Default to "engraved".',
    artboards: [
      "Desktop · 3-column · Editorial Light (1440×1024) — <FretboardExplorer fretboardStyle='engraved'/>",
      "Mobile · Stacked · Landscape hint (390×844) — <FretboardExplorerMobile fretboardStyle='engraved'/>",
    ],
  },
  {
    slug: 'song-form',
    title: 'Song Form',
    sourceFiles: ['song-form-a.jsx', 'song-form-b.jsx'],
    description:
      'Most field-heavy form in the app · Create/Edit · Spotify-assisted. Three variants kept side-by-side: A (editorial single-page), B (music manuscript), Mobile (step wizard).',
    artboards: [
      'A · Editorial single-page — desktop (1440×1200) — <SongFormA/>',
      'B · Music Manuscript — desktop (1440×1200) — <SongFormB/>',
      'C · Step wizard — mobile (390×844) — <SongFormMobile/>',
    ],
  },
  {
    slug: 'landing',
    title: 'Landing Page',
    sourceFiles: [
      'landing-page.jsx',
      'landing-hero.jsx',
      'landing-sections.jsx',
      'landing-primitives.jsx',
    ],
    description:
      'Strummy.app marketing page · editorial light, warm tone. Desktop scrolls to ~5400, mobile to ~3600.',
    artboards: [
      'Desktop · 1440 wide · full scroll (1440×5400) — <LandingPageDesktop/>',
      'Mobile · 390 wide (390×3600) — <LandingPageMobile/>',
    ],
  },
];

const PREAMBLE = `You're porting one section of the Strummy editorial design preview from the design-handoff bundle (HTML/Babel/JSX prototypes) to React/TypeScript.

REPO: /Users/piotr/Desktop/MainCV/guitar-crm (Next.js 16 App Router, React 19, TypeScript 5.x)
BUNDLE: /tmp/strummy-design/strummy/project/src/ (Babel-on-the-page JSX prototypes, exported via Object.assign(window, {...}))

WHAT'S ALREADY ON main (the foundation — IMPORT from these, don't duplicate them):

  Foundation (do NOT recreate):
    @/components/design-preview/lib/icons        — Icon component + I (icon path dictionary: home, lesson, song, assign, theory, students, stats, lessonStats, calendar, fretboard, ai, bell, search, plus, chevron, chevronD, arrowUp, arrowDn, arrowRt, clock, check, mastered, flame, play, pause, more, filter, mic, user, logout, sun, book, spark)
    @/components/design-preview/lib/types        — Health, SongStatusKey, Student, AgendaSong, AgendaLesson, WeekDay, StudentSong, PracticeItem, ActivityItem, Achievement, AtRiskRow, CohortRow, ServiceRow, AuditRow, PendingInvite
    @/components/design-preview/lib/mock-data    — TODAY, STUDENTS, AGENDA, NEEDS_ATTN, WEEK_DAYS, ME_STUDENT, STUDENT_NEXT_LESSON, STUDENT_LAST_LESSON, STUDENT_SONGS, STUDENT_PRACTICE_TODAY, STUDENT_ACTIVITY, STUDENT_ACHIEVEMENTS, ADMIN_PLATFORM, ADMIN_SERVICES, ADMIN_AT_RISK, ADMIN_COHORT_INSIGHTS, ADMIN_AUDIT, ADMIN_PENDING
    @/components/design-preview/primitives/atoms — Avatar, HealthDot, healthColor, Eyebrow, PulseDot, TimeAgo
    @/components/design-preview/primitives/CountUp        — CountUp({to,duration,format?:'plain'|'comma'})
    @/components/design-preview/primitives/ProgressBar    — ProgressBar({value,max,color?,height?,delay?,label?})
    @/components/design-preview/primitives/StatusPill     — StatusPill({status,compact?}); SONG_STATUS dict
    @/components/design-preview/primitives/StringVibration — StringVibration({width,height,opacity?,color?,running?})
    @/components/design-preview/primitives/FretProgress    — FretProgress({status,frets?,width?,height?,color?,accent?,showLabels?})
    @/components/design-preview/primitives/TabRule         — TabRule({color?,strong?,height?,padding?})
    @/components/design-preview/primitives/TabNotation     — TabNotation({items:[{label,value}],width?,height?,color?})
    @/components/design-preview/shell/SidebarNav  — SidebarNav with embedded SEARCH at the top of the sidebar (NOT the prototype's TopBar search; that's been moved up). Accepts {active?, roleLabel?, userInitials?, userName?, userRole?}.
    @/components/design-preview/shell/TopBar      — TopBar({weekLabel?, primaryLabel?}). Slim — no search, no greeting; those live in the SidebarNav or the page hero.
    @/components/design-preview/shell/ArtboardStage — ArtboardStage({title, subtitle?, artboards:[{label,width,height,node}]}) — use this to mount your artboards in the page.tsx.

  Theme:
    The theme is scoped to .theme-editorial (set in app/design-preview/layout.tsx). Inside it, CSS variables are defined: --ivory --paper --card --ink --ink-2 --ink-3 --ink-4 --ink-5 --rule --rule-2 --gold --gold-2 --gold-dim --gold-tint --success --warn --danger --info --serif --sans --mono --radius-sm --radius --radius-lg --shadow-sm --shadow-md. Don't redefine them. The @keyframes strummy-pulse is also defined globally.

PORT THIS SECTION:
{sectionTitle}

DESCRIPTION: {sectionDescription}

SOURCE FILES TO READ (from /tmp/strummy-design/strummy/project/src/):
{sourceFiles}

ARTBOARDS TO MOUNT (in app/design-preview/{slug}/page.tsx via <ArtboardStage>):
{artboards}

TARGETS:
- Section components: components/design-preview/{slug}/<...>.tsx (split into multiple files where natural; aim for ≤200 LOC per file)
- Section-specific mock data: components/design-preview/{slug}/data.ts (DO NOT extend lib/mock-data.ts — that creates merge conflicts across parallel agents' PRs)
- Section-specific types: components/design-preview/{slug}/types.ts (DO NOT extend lib/types.ts for the same reason)
- Page route: app/design-preview/{slug}/page.tsx that imports <ArtboardStage> and mounts the artboards

CONVENTIONS (NON-NEGOTIABLE):
1. TypeScript only. NO \`any\` types. Use \`unknown\` if truly opaque.
2. Inline styles via style={{...}}. MATCH PROTOTYPE PIXEL-PERFECTLY. Do not translate to Tailwind classes. Use var(--ink) etc.
3. Use CURLY QUOTES inside JSX text: ' for apostrophes, " " for double quotes. The straight ASCII forms ' and " trigger react/no-unescaped-entities errors. Example: "Today's practice" → "Today's practice".
4. Mark client components with 'use client' ONLY when the component uses useState, useEffect, useRef, or DOM event handlers (onClick, onChange). Pure-render components stay server components (no directive). The page.tsx that mounts ArtboardStage CAN stay server.
5. Foundation primitives are imported from @/components/design-preview/... — use those paths, not relative.
6. Inside your section folder, use relative imports (../).
7. If the prototype uses an icon not present in the @/components/design-preview/lib/icons \`I\` dictionary, inline the SVG path directly with the Icon component: <Icon d="M12 3v18..." size={14}/>.
8. If the prototype uses StaffLines, ChordGrid, or Fretboard (full multi-fret) from primitives.jsx — those aren't in the foundation yet. Inline them as local components in your section files (re-port from /tmp/strummy-design/strummy/project/src/primitives.jsx if needed).
9. Mock data: prefer importing existing constants from @/components/design-preview/lib/mock-data when applicable. New data goes in YOUR section's data.ts ONLY.

DELIVERABLES:
1. Read all source files in full.
2. Implement.
3. Run lint on your own files only:
     npx eslint --no-error-on-unmatched-pattern components/design-preview/{slug} app/design-preview/{slug} 2>&1 | tail -40
   Fix any errors (warnings about file/function size are OK to leave).
4. Return STRUCTURED JSON matching the provided schema:
     - slug: your section's slug
     - success: true if lint passed (0 errors) and all artboards render
     - filesAdded: array of file paths (RELATIVE to repo root) that you created
     - commitMessage: a multi-line conventional commit message starting with "feat(design-preview/{slug}): ..." (NO Co-Authored-By line)
     - prTitle: short PR title, e.g. "feat(design-preview/{slug}): <section title>"
     - prBody: user-facing release notes for this section — markdown, sections like ## Summary / ## What's new / ## Test plan
     - notes: any caveats, gotchas, or follow-up items worth flagging (e.g. "needed to port StaffLines locally", "skipped DnD interactions")

DO NOT:
- Touch files outside app/design-preview/{slug}/ or components/design-preview/{slug}/. (One exception: if the prototype shows a component that already exists in the foundation but you need to extend it, DO NOT extend it — re-port locally and note it.)
- Run git/commit/push/gh — the orchestrator handles those serially after you return.
- Add Linear ticket numbers — none assigned.
- Add Co-Authored-By: Claude lines to commit messages.
- Run npx tsc — too slow with 14 parallel agents.

If something in the prototype is interactive (useState, hover, drag) but isolated to ONE artboard's rendering, port it. If it's cross-artboard state (the design-canvas reorder UI), skip it.

Return ONLY the structured JSON. Do not output prose, code, or commentary.`;

const SECTION_RESULT_SCHEMA = {
  type: 'object',
  required: ['slug', 'success', 'filesAdded', 'commitMessage', 'prTitle', 'prBody', 'notes'],
  additionalProperties: false,
  properties: {
    slug: { type: 'string', description: 'Section slug (kebab-case)' },
    success: { type: 'boolean', description: 'true if lint passed and all artboards implemented' },
    filesAdded: {
      type: 'array',
      items: { type: 'string' },
      description: 'File paths relative to repo root',
    },
    commitMessage: {
      type: 'string',
      description: 'Multi-line conventional commit message — no Co-Authored-By: Claude line.',
    },
    prTitle: { type: 'string', description: 'Short PR title' },
    prBody: { type: 'string', description: 'User-facing release notes — markdown.' },
    notes: { type: 'string', description: 'Caveats, gotchas, or follow-ups.' },
  },
};

function buildPrompt(s) {
  const sourceFiles = s.sourceFiles
    .map((f) => '  /tmp/strummy-design/strummy/project/src/' + f)
    .join('\n');
  const artboards = s.artboards.map((a) => '  - ' + a).join('\n');
  return PREAMBLE.replace('{sectionTitle}', s.title)
    .replace('{sectionDescription}', s.description)
    .replace(/\{slug\}/g, s.slug)
    .replace('{sourceFiles}', sourceFiles)
    .replace('{artboards}', artboards);
}

phase('Implement');

log(`Fanning out ${SECTIONS.length} section ports in parallel.`);

const results = await parallel(
  SECTIONS.map(
    (s) => () =>
      agent(buildPrompt(s), {
        label: 'port:' + s.slug,
        schema: SECTION_RESULT_SCHEMA,
      })
  )
);

const filtered = results.map(
  (r, i) =>
    r ?? {
      slug: SECTIONS[i].slug,
      success: false,
      filesAdded: [],
      commitMessage: '',
      prTitle: '',
      prBody: '',
      notes: 'agent returned null',
    }
);

const successCount = filtered.filter((r) => r.success).length;
log(`${successCount}/${SECTIONS.length} sections completed successfully.`);

return { results: filtered, sections: SECTIONS };
