// Lesson-specific primitives: status pills, progress stepper, date block,
// mobile phone frame, etc.

const LESSON_STATUS = {
  scheduled:   { label:'Scheduled',   color:'var(--info)',    tint:'#3a5a7d18' },
  in_progress: { label:'In progress', color:'var(--gold-2)',  tint:'#c8952322' },
  completed:   { label:'Completed',   color:'var(--success)', tint:'#3a7d3a18' },
  cancelled:   { label:'Cancelled',   color:'var(--ink-4)',   tint:'var(--rule-2)' },
};

const LessonStatusPill = ({ status, compact=false }) => {
  const s = LESSON_STATUS[status] || LESSON_STATUS.scheduled;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: compact ? '2px 8px' : '3px 10px',
      borderRadius: 4,
      background: s.tint, color: s.color,
      fontSize: 11, fontWeight:500,
      textTransform:'uppercase', letterSpacing:'.08em',
      fontFamily:'var(--mono)',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color }} />
      {s.label}
    </span>
  );
};

// 5-stage progress stepper (to_learn → mastered) — segmented bar w/ label.
const STAGES = [
  { key:'to_learn',    short:'Learn',     label:'To learn' },
  { key:'started',     short:'Started',   label:'Started' },
  { key:'remembered',  short:'Remember',  label:'Remembered' },
  { key:'with_author', short:'w/ Author', label:'With author' },
  { key:'mastered',    short:'Mastered',  label:'Mastered' },
];

const StageStepper = ({ status, onChange, readOnly=false, size='md' }) => {
  const idx = STAGES.findIndex(s => s.key === status);
  const s = SONG_STATUS[status];
  const h = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: size==='lg'?8:6, width:'100%' }}>
      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
        {STAGES.map((st, i) => {
          const reached = i <= idx;
          return (
            <div
              key={st.key}
              onClick={() => !readOnly && onChange && onChange(st.key)}
              title={st.label}
              style={{
                flex:1, height:h, borderRadius:2,
                background: reached ? s.color : 'var(--rule)',
                cursor: readOnly ? 'default' : 'pointer',
                transition:'background .15s',
              }}
            />
          );
        })}
      </div>
      {size !== 'sm' && (
        <div style={{ display:'flex', justifyContent:'space-between', fontSize: size==='lg'?11:10, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
          {STAGES.map(st => (
            <span key={st.key}
              onClick={() => !readOnly && onChange && onChange(st.key)}
              style={{
                color: st.key === status ? s.color : 'var(--ink-4)',
                fontWeight: st.key === status ? 500 : 400,
                cursor: readOnly ? 'default' : 'pointer',
                textTransform:'uppercase', letterSpacing:'.06em',
              }}>
              {st.short}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Tall date block — "APR 23 · THU" style, used in list + detail headers.
const DateBlock = ({ iso, size='md' }) => {
  const d = formatLessonDate(iso);
  const big = size === 'lg';
  return (
    <div style={{
      width: big ? 72 : 56,
      flex: `0 0 ${big ? 72 : 56}px`,
      textAlign:'center',
      border:'1px solid var(--rule)',
      borderRadius: 8,
      overflow:'hidden',
      background:'var(--card)',
    }}>
      <div style={{
        background:'var(--rule-2)',
        fontFamily:'var(--mono)',
        fontSize: big ? 10 : 9, textTransform:'uppercase', letterSpacing:'.14em',
        color:'var(--gold-2)', padding: big ? '4px 0' : '3px 0', fontWeight:500,
      }}>{d.mon}</div>
      <div style={{
        fontFamily:'var(--serif)',
        fontSize: big ? 30 : 22, fontWeight:500,
        lineHeight:1, padding: big ? '6px 0 2px' : '4px 0 2px',
      }}>{d.day}</div>
      <div style={{
        fontFamily:'var(--mono)',
        fontSize: big ? 10 : 9, color:'var(--ink-4)',
        textTransform:'uppercase', letterSpacing:'.12em',
        paddingBottom: big ? 6 : 4,
      }}>{d.wday}</div>
    </div>
  );
};

// Very small filter chip
const FilterChip = ({ active, onClick, children, color }) => (
  <button onClick={onClick} style={{
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'5px 10px', borderRadius:6,
    border: active ? `1px solid ${color || 'var(--ink)'}` : '1px solid var(--rule)',
    background: active ? (color ? `${color}12` : 'var(--ink)') : 'var(--card)',
    color: active ? (color || 'var(--paper)') : 'var(--ink-3)',
    fontSize:12, cursor:'pointer',
    fontWeight: active ? 500 : 400,
  }}>
    {children}
  </button>
);

// Phone frame — for mobile variants, rendered side-by-side with desktop.
const PhoneFrame = ({ children, label='Mobile · 390 × 844' }) => (
  <div style={{ display:'inline-flex', flexDirection:'column', gap:10, alignItems:'center' }}>
    <div style={{
      width: 390 + 16, height: 844 + 16,
      padding: 8,
      borderRadius: 44,
      background:'var(--ink)',
      boxShadow:'0 30px 80px -30px rgba(26,22,19,.3), 0 0 0 1px var(--rule-2)',
      position:'relative',
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 36,
        overflow:'hidden',
        background:'var(--ivory)',
        position:'relative',
      }}>
        {children}
      </div>
      {/* notch */}
      <div style={{
        position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
        width: 110, height: 28, background:'var(--ink)', borderRadius:20, zIndex:10,
      }} />
    </div>
    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
                  textTransform:'uppercase', letterSpacing:'.14em' }}>{label}</div>
  </div>
);

// iOS-style status bar
const StatusBar = () => (
  <div style={{
    height: 44, display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 24px 0 28px', fontFamily:'var(--sans)', fontSize:14, fontWeight:600,
    color:'var(--ink)', background:'var(--paper)',
    position:'relative', zIndex:5,
  }}>
    <span>9:41</span>
    <span style={{ width:110 }} />
    <span style={{ display:'inline-flex', gap:5, alignItems:'center' }}>
      <svg width="16" height="10" viewBox="0 0 16 10"><path d="M1 9V7m3 2V5m3 4V3m3 6V1m3 8V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg>
      <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 7.5c1.8-1.5 3.5-2.2 6-2.2s4.2.7 6 2.2M3 5.3c1.3-1 2.5-1.5 4-1.5s2.7.5 4 1.5M5 3.2c.9-.6 1.6-.8 2-.8s1.1.2 2 .8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
      <svg width="22" height="10" viewBox="0 0 22 10"><rect x=".5" y=".5" width="18" height="9" rx="2" stroke="currentColor" fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor"/><rect x="19.2" y="3.5" width="1.8" height="3" rx=".5" fill="currentColor" opacity=".5"/></svg>
    </span>
  </div>
);

// Icon we'll need extra ones for lessons
const LI = {
  filter:   'M3 5h18l-7 9v6l-4-2v-4z',
  sort:     'M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4',
  edit:     'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:    'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6',
  email:    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2L12 13 2 6',
  live:     'M6 4l14 8-14 8z',
  back:     'M19 12H5M12 19l-7-7 7-7',
  close:    'M18 6L6 18M6 6l12 12',
  plusSmall:'M12 5v14M5 12h14',
  add:      'M12 5v14M5 12h14',
  grip:     'M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01',
  copy:     'M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1',
  mic:      'M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm7-3a7 7 0 0 1-14 0M12 18v3',
  check2:   'M5 12l5 5L20 7',
  chev:     'M9 6l6 6-6 6',
  chevD:    'M6 9l6 6 6-6',
  chevL:    'M15 6l-6 6 6 6',
};

Object.assign(window, {
  LESSON_STATUS, LessonStatusPill,
  STAGES, StageStepper,
  DateBlock, FilterChip,
  PhoneFrame, StatusBar, LI,
});
