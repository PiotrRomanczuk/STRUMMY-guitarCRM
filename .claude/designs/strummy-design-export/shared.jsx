// shared.jsx — AppFrame wraps a sidebar with a placeholder analytics canvas
// so each design has real context around it.

const { useState: useStateS, useEffect: useEffectS } = React;

// ── data ────────────────────────────────────────────────────────────────
const WORKSPACES = [
  { id: 'acme', name: 'Acme Analytics', initial: 'A', tint: 'oklch(0.58 0.14 250)' },
  { id: 'north', name: 'Northwind Co.', initial: 'N', tint: 'oklch(0.60 0.13 160)' },
  { id: 'lumen', name: 'Lumen Labs', initial: 'L', tint: 'oklch(0.62 0.14 30)' },
];

const NAV_MAIN = [
  { id: 'home', label: 'Overview', icon: 'home', badge: null },
  { id: 'reports', label: 'Reports', icon: 'chart', badge: '12' },
  { id: 'funnels', label: 'Funnels', icon: 'funnel', badge: null },
  { id: 'cohorts', label: 'Cohorts', icon: 'users', badge: null },
  { id: 'segments', label: 'Segments', icon: 'layers', badge: '3' },
  { id: 'events', label: 'Events', icon: 'bolt', badge: null },
];
const NAV_WORK = [
  { id: 'dashboards', label: 'Dashboards', icon: 'grid', badge: null },
  { id: 'notebooks', label: 'Notebooks', icon: 'book', badge: null },
  { id: 'alerts', label: 'Alerts', icon: 'bell', badge: '2' },
  { id: 'exports', label: 'Exports', icon: 'down', badge: null },
];
const NAV_ADMIN = [
  { id: 'sources', label: 'Data sources', icon: 'plug', badge: null },
  { id: 'team', label: 'Team', icon: 'team', badge: null },
  { id: 'settings', label: 'Settings', icon: 'gear', badge: null },
];

const PINNED = [
  { id: 'p1', label: 'Weekly KPI scan', kind: 'dashboard' },
  { id: 'p2', label: 'Signup → Activation', kind: 'funnel' },
  { id: 'p3', label: 'Retention · 30d', kind: 'cohort' },
];
const RECENT = [
  { id: 'r1', label: 'Q2 Revenue by plan', when: '2m' },
  { id: 'r2', label: 'Mobile onboarding funnel', when: '18m' },
  { id: 'r3', label: 'EU trial conversions', when: '1h' },
  { id: 'r4', label: 'Churn cohort — Mar', when: '3h' },
  { id: 'r5', label: 'Feature flag impact', when: 'yest' },
];

// Flatten everything for the shared search/command lookup
const ALL_ITEMS = [
  ...NAV_MAIN,
  ...NAV_WORK,
  ...NAV_ADMIN,
  ...PINNED.map((p) => ({ ...p, _pinned: true })),
  ...RECENT.map((r) => ({ ...r, _recent: true })),
];

// ── icon set (stroke-based, 16px grid) ──────────────────────────────────
function Icon({ name, size = 16, stroke = 1.5 }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'home':
      return (
        <svg {...p}>
          <path d="M2.5 7 8 2.5 13.5 7v6.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7Z" />
          <path d="M6.5 14.5v-4h3v4" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...p}>
          <path d="M2.5 13.5h11" />
          <path d="M4.5 11V7.5M8 11V4M11.5 11V8.5" />
        </svg>
      );
    case 'funnel':
      return (
        <svg {...p}>
          <path d="M2.5 3h11l-4.2 5v5.5L6.7 12V8L2.5 3Z" />
        </svg>
      );
    case 'users':
      return (
        <svg {...p}>
          <circle cx="6" cy="6.5" r="2.5" />
          <path d="M2 13.5c.6-2 2.1-3 4-3s3.4 1 4 3" />
          <circle cx="11" cy="6" r="2" />
          <path d="M10.5 10.6c1.7.2 2.9 1.1 3.5 2.9" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...p}>
          <path d="M8 2.5 2.5 5.5 8 8.5l5.5-3L8 2.5Z" />
          <path d="M2.5 8.5 8 11.5l5.5-3" />
          <path d="M2.5 11.5 8 14.5l5.5-3" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...p}>
          <path d="M9 2.5 4 9h3.5L7 13.5 12 7H8.5L9 2.5Z" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...p}>
          <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
          <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
          <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
          <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
        </svg>
      );
    case 'book':
      return (
        <svg {...p}>
          <path d="M3 2.5h7a2 2 0 0 1 2 2v9H5a2 2 0 0 0-2 2v-13Z" />
          <path d="M3 13.5a2 2 0 0 1 2-2h7" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...p}>
          <path d="M4 11V7a4 4 0 1 1 8 0v4l1 1.5H3L4 11Z" />
          <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
        </svg>
      );
    case 'down':
      return (
        <svg {...p}>
          <path d="M8 2.5v8" />
          <path d="M4.5 7.5 8 11l3.5-3.5" />
          <path d="M2.5 13.5h11" />
        </svg>
      );
    case 'plug':
      return (
        <svg {...p}>
          <path d="M6 2.5v3M10 2.5v3" />
          <path d="M4 5.5h8v3a4 4 0 0 1-8 0v-3Z" />
          <path d="M8 12.5v1" />
        </svg>
      );
    case 'team':
      return (
        <svg {...p}>
          <circle cx="8" cy="6" r="2.5" />
          <path d="M3 13.5c.8-2.4 2.7-3.5 5-3.5s4.2 1.1 5 3.5" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="2" />
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
        </svg>
      );
    case 'search':
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="4" />
          <path d="m10 10 3.5 3.5" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...p}>
          <path d="M8 3.5v9M3.5 8h9" />
        </svg>
      );
    case 'chev':
      return (
        <svg {...p}>
          <path d="m6 4 4 4-4 4" />
        </svg>
      );
    case 'chevd':
      return (
        <svg {...p}>
          <path d="m4 6 4 4 4-4" />
        </svg>
      );
    case 'star':
      return (
        <svg {...p}>
          <path d="m8 2.5 1.8 3.7 4 .6-2.9 2.8.7 4L8 11.7l-3.6 1.9.7-4-2.9-2.8 4-.6L8 2.5Z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v3l2 1.5" />
        </svg>
      );
    case 'sparks':
      return (
        <svg {...p}>
          <path d="M8 2.5v4M8 9.5v4M2.5 8h4M9.5 8h4" />
          <path d="M5 5l1.5 1.5M9.5 9.5 11 11M5 11l1.5-1.5M9.5 6.5 11 5" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...p}>
          <path d="M2.5 4.5a1 1 0 0 1 1-1h2.5l1.5 1.5h5a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5Z" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...p}>
          <path d="M6 2.5h4l-.5 3 2 2-6 1 2-2-1.5-4Z" />
          <path d="m7 9 -3.5 4.5" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...p}>
          <path d="M3 5h10M3 8h10M3 11h10" />
        </svg>
      );
    case 'dot':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <rect x="3" y="3" width="10" height="10" rx="2" />
        </svg>
      );
  }
}

// Kind → glyph for pinned/recent items
function kindIcon(kind) {
  if (kind === 'dashboard') return 'grid';
  if (kind === 'funnel') return 'funnel';
  if (kind === 'cohort') return 'users';
  return 'folder';
}

// ── AppFrame ────────────────────────────────────────────────────────────
// Wraps a sidebar with a placeholder canvas for visual context.
function AppFrame({ sidebar, variant = 'light', floating = false }) {
  const bg = variant === 'dark' ? '#131418' : variant === 'paper' ? '#f4f1ea' : '#fafaf8';
  const fg = variant === 'dark' ? '#e8e8ec' : '#1d1d1f';
  const rule = variant === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const mute = variant === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: bg,
        color: fg,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {!floating && sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {floating && (
          <div style={{ position: 'absolute', left: 16, top: 16, bottom: 16, zIndex: 10 }}>
            {sidebar}
          </div>
        )}
        {/* Top bar */}
        <div
          style={{
            height: 48,
            borderBottom: `1px solid ${rule}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px 0 ' + (floating ? '96px' : '20px'),
            gap: 12,
            fontSize: 13,
          }}
        >
          <span style={{ color: mute }}>Acme Analytics</span>
          <span style={{ color: mute }}>/</span>
          <span style={{ fontWeight: 500 }}>Overview</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: mute }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                padding: '3px 6px',
                border: `1px solid ${rule}`,
                borderRadius: 4,
              }}
            >
              Last 30d
            </span>
          </div>
        </div>
        {/* Canvas */}
        <div
          style={{
            flex: 1,
            padding: 24,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: 'auto 1fr',
            gap: 16,
            overflow: 'hidden',
          }}
        >
          <KPI label="Weekly active" value="48.2k" delta="+4.1%" mute={mute} rule={rule} />
          <KPI label="Activation" value="62.7%" delta="+0.9%" mute={mute} rule={rule} />
          <KPI label="Net MRR" value="$128.4k" delta="-1.2%" mute={mute} rule={rule} negative />
          <div
            className="ph-stripes"
            style={{
              gridColumn: 'span 2',
              border: `1px solid ${rule}`,
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 0,
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: mute }}
            >
              <span style={{ fontWeight: 500, color: fg }}>Weekly active users</span>
              <span>· 30 days</span>
            </div>
            <FakeChart variant={variant} />
          </div>
          <div
            style={{
              border: `1px solid ${rule}`,
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 0,
            }}
          >
            <div style={{ fontSize: 12, color: mute, fontWeight: 500 }}>Top events</div>
            {['page_view', 'signup_complete', 'feature_used', 'invite_sent', 'upgrade_clicked'].map(
              (e, i) => (
                <div
                  key={e}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}
                >
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: mute, width: 28 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ flex: 1 }}>{e}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: mute }}>
                    {[128420, 8421, 6102, 3044, 1218][i].toLocaleString()}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, mute, rule, negative }) {
  return (
    <div
      style={{
        border: `1px solid ${rule}`,
        borderRadius: 8,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 11, color: mute, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: -0.3,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 11,
            color: negative ? 'oklch(0.55 0.14 25)' : 'oklch(0.55 0.12 150)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}

function FakeChart({ variant }) {
  // Quiet line chart as SVG — not AI-sloppy, just a rhythm of bars.
  const bars = [
    32, 38, 28, 44, 40, 52, 48, 58, 54, 62, 58, 70, 66, 74, 82, 78, 84, 88, 82, 92, 88, 96,
  ];
  const max = 100;
  const color = variant === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const accent = 'oklch(0.58 0.14 250)';
  return (
    <svg
      viewBox={`0 0 ${bars.length * 12} 100`}
      preserveAspectRatio="none"
      style={{ width: '100%', flex: 1, minHeight: 0 }}
    >
      {bars.map((b, i) => (
        <rect key={i} x={i * 12 + 1} y={max - b} width={10} height={b} fill={color} rx={2} />
      ))}
      <polyline
        points={bars.map((b, i) => `${i * 12 + 6},${max - b - 4}`).join(' ')}
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Expose to the other component scripts
Object.assign(window, {
  WORKSPACES,
  NAV_MAIN,
  NAV_WORK,
  NAV_ADMIN,
  PINNED,
  RECENT,
  ALL_ITEMS,
  Icon,
  kindIcon,
  AppFrame,
});
