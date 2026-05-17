// Shared primitives + data for the three role-specific dashboards.
// Builds on src/primitives.jsx + src/data.jsx with motion + dashboard-only motifs.

const { useState: useStateD, useEffect: useEffectD, useMemo: useMemoD, useRef: useRefD } = React;

// ─── Tab rule — 6 strings, varying weights ────────────────────
// Use instead of plain <hr> inside dashboards.
const TabRule = ({ color = 'var(--rule)', strong = 'var(--ink-5)', height = 22, padding = 0 }) => (
  <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
       style={{ display:'block', overflow:'visible', marginTop:padding, marginBottom:padding }}>
    {[0,1,2,3,4,5].map(i => {
      const y = (height/7) * (i+1);
      const w = i === 0 ? 0.7 : i === 5 ? 0.4 : 0.5;
      const c = i === 0 ? strong : color;
      return <line key={i} x1="0" y1={y} x2="100" y2={y} stroke={c} strokeWidth={w} vectorEffect="non-scaling-stroke" />;
    })}
  </svg>
);

// ─── String vibration — ambient sine waves behind the hero ────
const StringVibration = ({ width = 1000, height = 240, opacity = 0.12, color = 'var(--gold-2)', running = true }) => {
  const [t, setT] = useStateD(0);
  useEffectD(() => {
    if (!running) return;
    let raf;
    let start = performance.now();
    const tick = (now) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // 6 strings, decreasing amplitude — vibrate softly, slightly different freq
  const lines = [
    { y: 0.18, amp: 1.6, f: 1.7, ph: 0.0 },
    { y: 0.31, amp: 1.4, f: 1.4, ph: 0.6 },
    { y: 0.44, amp: 1.2, f: 1.9, ph: 1.2 },
    { y: 0.57, amp: 1.0, f: 1.5, ph: 1.8 },
    { y: 0.70, amp: 0.8, f: 1.3, ph: 2.4 },
    { y: 0.83, amp: 0.6, f: 1.8, ph: 3.0 },
  ];
  const samples = 32;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block', pointerEvents:'none' }}>
      {lines.map((ln, idx) => {
        const baseY = ln.y * height;
        let d = `M 0 ${baseY}`;
        for (let i = 1; i <= samples; i++) {
          const x = (i / samples) * width;
          const env = Math.sin((i / samples) * Math.PI); // higher in middle
          const y = baseY + Math.sin((i / samples) * Math.PI * 6 + t * ln.f + ln.ph) * ln.amp * env;
          d += ` L ${x} ${y}`;
        }
        return (
          <path key={idx} d={d} stroke={color} strokeWidth={1 - idx * 0.07}
                fill="none" opacity={opacity * (1 - idx * 0.08)}
                vectorEffect="non-scaling-stroke" />
        );
      })}
    </svg>
  );
};

// ─── Fret progress — song mastery as fretboard position ───────
// status 0–4 maps to "fret 0,3,5,7,12" — show a marker that has slid up the neck.
const FRET_FOR_STATUS = { to_learn:0, started:1, remembered:2, with_author:3, mastered:4 };
const FretProgress = ({ status = 'started', frets = 5, width = 180, height = 28, color = 'var(--ink-3)', accent = 'var(--gold-2)', showLabels = true }) => {
  const padL = 14, padR = 8;
  const innerW = width - padL - padR;
  const fretIdx = FRET_FOR_STATUS[status] ?? 0;
  const mid = height / 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:'block', overflow:'visible' }}>
      {/* nut */}
      <line x1={padL} y1={4} x2={padL} y2={height-4} stroke={color} strokeWidth="1.6" />
      {/* fret lines */}
      {Array.from({length: frets}).map((_,i)=>{
        const x = padL + ((i+1)/frets) * innerW;
        return <line key={i} x1={x} y1={4} x2={x} y2={height-4} stroke={color} strokeWidth="0.6" opacity="0.45" />;
      })}
      {/* strings */}
      {[0,1,2,3,4,5].map(i => {
        const y = 4 + ((height-8)/5) * i;
        return <line key={i} x1={padL} y1={y} x2={padL+innerW} y2={y} stroke={color} strokeWidth="0.45" opacity="0.5" />;
      })}
      {/* fret dots */}
      {[3,5].map(f => {
        if (f - 1 >= frets) return null;
        return <circle key={f} cx={padL + (f-0.5)/frets * innerW} cy={mid} r="1.4" fill={color} opacity="0.4" />;
      })}
      {/* progress dot */}
      {fretIdx > 0 && (
        <g>
          <line x1={padL + (fretIdx-0.5)/frets * innerW} y1={4} x2={padL + (fretIdx-0.5)/frets * innerW} y2={height-4}
                stroke={accent} strokeWidth="2" opacity="0.85" />
          <circle cx={padL + (fretIdx-0.5)/frets * innerW} cy={mid} r="4.5" fill={accent} />
        </g>
      )}
      {showLabels && (
        <text x={padL - 4} y={mid+3} textAnchor="end" fontSize="9" fontFamily="var(--mono)" fill={color} opacity="0.6">0</text>
      )}
    </svg>
  );
};

// ─── Tab notation — like ASCII tab for stats / counters ───────
// renders 4 metrics inside a 6-line tab system, with numbers floating on string-2
const TabNotation = ({ items = [], width = '100%', height = 64, color = 'var(--ink-3)' }) => (
  <div style={{ position:'relative', width, height, fontFamily:'var(--mono)' }}>
    <TabRule height={height} color="var(--ink-5)" strong="var(--ink-4)" />
    <div style={{ position:'absolute', inset:0, display:'grid', gridTemplateColumns:`repeat(${items.length},1fr)` }}>
      {items.map((m, i) => (
        <div key={i} style={{
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          borderLeft: i === 0 ? 'none' : '1px dashed var(--rule)',
        }}>
          <div style={{
            background:'var(--card)', padding:'1px 8px',
            fontFamily:'var(--serif)', fontSize:24, lineHeight:1, color:'var(--ink)', fontWeight:500,
            letterSpacing:'-0.02em', position:'relative', zIndex:1,
          }}>{m.value}</div>
          <div style={{
            color, fontSize:9, textTransform:'uppercase', letterSpacing:'.12em',
            background:'var(--card)', padding:'2px 8px 0 8px', marginTop:2, position:'relative', zIndex:1,
          }}>{m.label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Eyebrow label ────────────────────────────────────────────
const Eyebrow = ({ children, color = 'var(--ink-4)', style }) => (
  <div style={{
    color, fontSize:10, textTransform:'uppercase', letterSpacing:'.16em', fontWeight:500,
    fontFamily:'var(--mono)', ...style,
  }}>{children}</div>
);

// ─── Animated number (count up on mount) ──────────────────────
const CountUp = ({ to = 0, duration = 900, fmt = (n)=>String(Math.round(n)), style }) => {
  const [v, setV] = useStateD(0);
  useEffectD(() => {
    let raf, start;
    const tick = (now) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span style={style}>{fmt(v)}</span>;
};

// ─── Progress bar (animates fill on mount) ────────────────────
const ProgressBar = ({ value = 0, max = 100, color = 'var(--gold-2)', height = 4, delay = 0, label }) => {
  const [w, setW] = useStateD(0);
  useEffectD(() => {
    const id = setTimeout(() => setW((value/max)*100), 80 + delay);
    return () => clearTimeout(id);
  }, [value, max, delay]);
  return (
    <div style={{ width:'100%' }}>
      {label && (
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4,
                      fontSize:11, color:'var(--ink-3)', fontFamily:'var(--mono)' }}>
          <span>{label}</span><span>{Math.round((value/max)*100)}%</span>
        </div>
      )}
      <div style={{ height, background:'var(--rule-2)', borderRadius: height, overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${w}%`, background:color, borderRadius:height,
          transition:'width 1.1s cubic-bezier(.22,.61,.36,1)',
        }} />
      </div>
    </div>
  );
};

// ─── Pulse (subtle on now/active items) ───────────────────────
const PulseDot = ({ color = 'var(--gold-2)', size = 8 }) => (
  <span style={{ position:'relative', display:'inline-flex', width:size, height:size }}>
    <span style={{
      position:'absolute', inset:0, borderRadius:'50%', background:color, opacity:0.45,
      animation:'strummy-pulse 1.8s ease-out infinite',
    }} />
    <span style={{
      position:'absolute', inset:size*0.2, borderRadius:'50%', background:color,
    }} />
    <style>{`@keyframes strummy-pulse {
      0% { transform:scale(1); opacity:.55 }
      80% { transform:scale(2.4); opacity:0 }
      100% { opacity:0 }
    }`}</style>
  </span>
);

// ─── Capo marker — for "now" position on the day spine ────────
const CapoMarker = ({ label = 'NOW', color = 'var(--gold-2)' }) => (
  <div style={{
    position:'relative', display:'flex', alignItems:'center', gap:8,
    fontFamily:'var(--mono)', fontSize:10, color, letterSpacing:'.12em', fontWeight:500,
  }}>
    <span style={{
      width:24, height:10, borderRadius:3,
      background:color, color:'#fff',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontSize:8, letterSpacing:'.1em', fontWeight:600,
      boxShadow:'inset 0 -1px 0 rgba(0,0,0,.18)',
    }}>CAPO</span>
    <span>{label}</span>
    <span style={{ flex:1, height:1, background:color, opacity:.6 }} />
  </div>
);

// ─── Ticker — small running time / counter strip ──────────────
const TimeAgo = ({ minutes, color = 'var(--ink-4)' }) => {
  const h = Math.floor(minutes/60), m = minutes%60;
  if (h >= 24) return <span style={{ color }}>{Math.floor(h/24)}d ago</span>;
  if (h > 0)  return <span style={{ color }}>{h}h {m}m ago</span>;
  return <span style={{ color }}>{minutes}m ago</span>;
};

// ─── Extended data ────────────────────────────────────────────
// Student data (for the student dashboard — viewer is Liam Chen)
const ME_STUDENT = {
  id:'me', name:'Liam Chen', avatar:'LC', color:'#3a7d3a',
  level:'Intermediate · Year 2',
  streak: 11,
  practiceMinToday: 14, practiceGoal: 30,
  practiceWeek: [22, 35, 0, 28, 41, 12, 14], // mon–sun
  achievements: 3,
  totalSongs: 14, mastered: 5,
};

const STUDENT_NEXT_LESSON = {
  with: 'Sarah Chen',
  withAvatar: 'SC', withColor:'#c89523',
  when: 'Today',
  time: '4:00p',
  inMinutes: 134, // 2h 14m
  duration: '45m',
  location: 'Studio A — Mission St',
  agenda: [
    { title:'Blackbird', sub:'fingerpicking pattern + bridge', key:'G' },
    { title:'Landslide', sub:'verse review', key:'C' },
    { title:'Open chord drill', sub:'10 min warm-up', key:'—' },
  ],
};

const STUDENT_LAST_LESSON = {
  when:'Last Thursday · Apr 16',
  duration:'45m',
  recap:'Alternating bass pattern clicked in measure 2–4. Right-hand independence is the next unlock — 10 min/day fingerpicking drill, slow.',
  homework:[
    { task:'Blackbird — measures 1–8 at 60 BPM', done:true },
    { task:'10 min/day fingerpicking drill', done:false, progress:5 },
    { task:'Listen to live version (Anthology)', done:true },
  ],
};

const STUDENT_SONGS = [
  { title:'Blackbird',         author:'The Beatles',     status:'started',     key:'G',  capo:0, lastPracticed:'1d ago',  myMins:42 },
  { title:'Landslide',         author:'Fleetwood Mac',   status:'remembered',  key:'C',  capo:3, lastPracticed:'2d ago',  myMins:96 },
  { title:'Tears in Heaven',   author:'Eric Clapton',    status:'with_author', key:'A',  capo:0, lastPracticed:'today',   myMins:118 },
  { title:'Wonderwall',        author:'Oasis',           status:'mastered',    key:'Em', capo:2, lastPracticed:'3d ago',  myMins:230 },
  { title:'House of the R.S.', author:'Trad.',           status:'started',     key:'Am', capo:0, lastPracticed:'5d ago',  myMins:18 },
  { title:'Hotel California',  author:'Eagles',          status:'to_learn',    key:'Bm', capo:7, lastPracticed:'—',       myMins:0 },
];

const STUDENT_PRACTICE_TODAY = [
  { kind:'song', title:'Blackbird', sub:'measures 1–8, slow', mins:10, done:false, key:'G' },
  { kind:'drill', title:'Fingerpicking drill', sub:'PIMA pattern · metronome 60', mins:10, done:false, key:'—' },
  { kind:'song', title:'Landslide', sub:'verse + chorus run', mins:10, done:false, key:'C' },
];

const STUDENT_ACTIVITY = [
  { id:'sa1', mins: 22, label:'Sarah assigned',  obj:'"Tears in Heaven" — verse', type:'assignment' },
  { id:'sa2', mins: 80, label:'You mastered',    obj:'"Wonderwall"', type:'mastered' },
  { id:'sa3', mins:240, label:'Lesson rescheduled', obj:'Thu 4:00p → 4:30p', type:'lesson' },
  { id:'sa4', mins:380, label:'Sarah added note', obj:'"Try the slower live version"', type:'note' },
  { id:'sa5', mins:1320,label:'You logged',      obj:'35 min practice', type:'practice' },
];

const STUDENT_ACHIEVEMENTS = [
  { name:'First song mastered', sub:'Wonderwall',          when:'Apr 8',  unlocked:true },
  { name:'Two-week streak',     sub:'14 days in a row',    when:'Apr 14', unlocked:true },
  { name:'Barre breakthrough',  sub:'First clean F major', when:'Apr 19', unlocked:true },
  { name:'30-min club',         sub:'10 sessions ≥ 30m',   when:'—',      unlocked:false, progress: 7, max:10 },
];

// Admin data
const ADMIN_PLATFORM = {
  health: 'healthy', // healthy | degraded | down
  activeUsers30d: 1284, activeUsersΔ: '+8.2%',
  lessonsThisWeek: 412, lessonsThisWeekΔ: '+12%',
  newSignups7d: 38, newSignupsΔ: '+4',
  mrr: 18420, mrrΔ: '+$640',
  retention28d: 87.4, retentionΔ: '+1.1pp',
};

const ADMIN_SERVICES = [
  { name:'Supabase',    status:'ok',       latency:'42ms',  uptime:'99.99%' },
  { name:'OpenRouter',  status:'ok',       latency:'320ms', uptime:'99.92%' },
  { name:'Spotify',     status:'degraded', latency:'1.2s',  uptime:'99.45%', note:'Elevated latency · last 30m' },
  { name:'Resend',      status:'ok',       latency:'180ms', uptime:'99.98%' },
  { name:'Stripe',      status:'ok',       latency:'95ms',  uptime:'99.99%' },
  { name:'Sentry',      status:'ok',       latency:'—',     uptime:'99.95%' },
];

const ADMIN_AT_RISK = [
  { name:'Carlos Reyes',    teacher:'Sarah Chen',     avatar:'CR', color:'#b84a3a', reason:'0 practice · 11 days',   churn: 78 },
  { name:'James O\u2019Brien',teacher:'Sarah Chen',     avatar:'JO', color:'#3a5a7d', reason:'Assignment overdue 3d', churn: 54 },
  { name:'Priya Sharma',    teacher:'Marcus Webb',    avatar:'PS', color:'#6d4fa0', reason:'Missed last 2 lessons',  churn: 49 },
  { name:'Daniel Cho',      teacher:'Marcus Webb',    avatar:'DC', color:'#c17a3a', reason:'Cancelled subscription', churn: 92 },
  { name:'Aisha Bah',       teacher:'Elena Ruiz',     avatar:'AB', color:'#3a7d3a', reason:'Login frequency ↓ 60%',  churn: 41 },
];

const ADMIN_COHORT_INSIGHTS = [
  { cohort:'New beginners (0–3mo)', count: 142, healthy: 108, atRisk: 21, dormant: 13 },
  { cohort:'Active (3–12mo)',       count: 384, healthy: 312, atRisk: 48, dormant: 24 },
  { cohort:'Long-term (1y+)',       count: 218, healthy: 188, atRisk: 22, dormant: 8  },
];

const ADMIN_AUDIT = [
  { who:'sarah.chen@strummy.app', verb:'reset password for',  obj:'carlos.reyes@…',    mins:8,   role:'teacher' },
  { who:'admin@strummy.app',      verb:'invited',             obj:'priya.s@gmail.com', mins:42,  role:'admin' },
  { who:'system',                 verb:'auto-suspended',      obj:'spotify integration · degraded', mins:90, role:'system' },
  { who:'marcus.w@strummy.app',   verb:'archived student',    obj:'Tom Reeves (inactive 90d)',     mins:240, role:'teacher' },
  { who:'admin@strummy.app',      verb:'sent broadcast',      obj:'Holiday recital reminder · 412 users', mins:480, role:'admin' },
];

const ADMIN_PENDING = [
  { email:'priya.s@gmail.com',   role:'student', invitedBy:'admin',         when:'2h ago' },
  { email:'aaron.k@strummy.app', role:'teacher', invitedBy:'admin',         when:'1d ago' },
  { email:'lena.h@gmail.com',    role:'student', invitedBy:'sarah.chen',    when:'2d ago' },
];

Object.assign(window, {
  TabRule, StringVibration, FretProgress, FRET_FOR_STATUS,
  TabNotation, Eyebrow, CountUp, ProgressBar, PulseDot, CapoMarker, TimeAgo,
  ME_STUDENT, STUDENT_NEXT_LESSON, STUDENT_LAST_LESSON, STUDENT_SONGS,
  STUDENT_PRACTICE_TODAY, STUDENT_ACTIVITY, STUDENT_ACHIEVEMENTS,
  ADMIN_PLATFORM, ADMIN_SERVICES, ADMIN_AT_RISK, ADMIN_COHORT_INSIGHTS,
  ADMIN_AUDIT, ADMIN_PENDING,
});
