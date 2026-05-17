// Shared primitives for both directions.
// Sidebar, TopBar, icons, health badges, chord diagrams, fretboard, stave.

const { useState, useEffect, useMemo, useRef } = React;

// ─── Icons (minimal, stroke-based) ─────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 1.6, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const I = {
  home:     'M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  lesson:   'M4 5h13a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3zM4 5a3 3 0 0 0 3 3h13',
  song:     'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  assign:   'M9 11l3 3 7-7M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  theory:   'M12 3v18M5 7h14M5 17h14',
  students: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  stats:    'M3 3v18h18M7 14l3-3 4 4 6-6',
  lessonStats: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  calendar: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 4h18M8 3v4M16 3v4',
  fretboard:'M3 6h18M3 10h18M3 14h18M3 18h18M7 3v18M13 3v18M19 3v18',
  ai:       'M12 3L4 7v7c0 4 3 6 8 7 5-1 8-3 8-7V7z',
  bell:     'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM10 22a2 2 0 0 0 4 0',
  search:   'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm10 2l-4.35-4.35',
  plus:     'M12 5v14M5 12h14',
  chevron:  'M9 6l6 6-6 6',
  chevronD: 'M6 9l6 6 6-6',
  arrowUp:  'M12 19V5M5 12l7-7 7 7',
  arrowDn:  'M12 5v14M5 12l7 7 7-7',
  arrowRt:  'M5 12h14M12 5l7 7-7 7',
  clock:    'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zm0-14v5l3 2',
  check:    'M5 12l5 5L20 7',
  mastered: 'M8 21l4-8 4 8M12 13V3M6 7h12',
  flame:    'M12 3s4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s0 2 2 2c0-3 1-5 1-8z',
  play:     'M6 4l14 8-14 8z',
  pause:    'M6 4h4v16H6zM14 4h4v16h-4z',
  more:     'M12 6h.01M12 12h.01M12 18h.01',
  filter:   'M3 5h18l-7 9v6l-4-2v-4z',
  mic:      'M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm7-3a7 7 0 0 1-14 0M12 18v3',
  user:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logout:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  sun:      'M12 4V2M12 22v-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
  book:     'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5v1a.5.5 0 0 0 .5.5H20',
  spark:    'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
};

// ─── Sidebar ───────────────────────────────────────────────────
const SidebarNav = ({ active = 'home' }) => {
  const groups = [
    { label:'Teaching', items:[
      { k:'home',     icon:I.home,     label:'Dashboard' },
      { k:'lessons',  icon:I.lesson,   label:'Lessons' },
      { k:'songs',    icon:I.song,     label:'Songs' },
      { k:'assign',   icon:I.assign,   label:'Assignments' },
      { k:'theory',   icon:I.theory,   label:'Theory' },
    ]},
    { label:'Students', items:[
      { k:'students', icon:I.students, label:'Students' },
    ]},
    { label:'Analytics', items:[
      { k:'stats',    icon:I.stats,        label:'Song Stats' },
      { k:'lstats',   icon:I.lessonStats,  label:'Lesson Stats' },
    ]},
    { label:'Tools', items:[
      { k:'calendar', icon:I.calendar,  label:'Calendar' },
      { k:'fretboard',icon:I.fretboard, label:'Fretboard' },
      { k:'ai',       icon:I.ai,        label:'AI Assistant' },
    ]},
  ];

  return (
    <aside style={{
      width: 232, flex: '0 0 232px',
      background: 'var(--paper)',
      borderRight: '1px solid var(--rule)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 12px',
      gap: 4,
      fontSize: 13,
    }}>
      {/* brand */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px 12px 8px' }}>
        <div style={{
          width:28, height:28, borderRadius:8,
          background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)',
          display:'grid', placeItems:'center', color:'#fff',
          boxShadow:'inset 0 -1px 0 rgba(0,0,0,.15)',
        }}>
          {/* guitar headstock glyph */}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M5 19c0-3 2-5 4-6s2-4 5-4 5 3 5 3-2 2-5 2-3 2-5 3-4 2-4 2z" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:17, letterSpacing:'-0.01em' }}>Strummy</div>
          <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.1em' }}>Teacher</div>
        </div>
      </div>

      {groups.map(g => (
        <div key={g.label} style={{ marginTop: 8 }}>
          <div style={{
            padding:'8px 10px 4px 10px',
            color:'var(--ink-4)', fontSize:10, textTransform:'uppercase', letterSpacing:'.14em',
            fontWeight:500,
          }}>{g.label}</div>
          {g.items.map(it => {
            const isActive = it.k === active;
            return (
              <div key={it.k} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'7px 10px',
                borderRadius: 8,
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                background: isActive ? 'var(--rule-2)' : 'transparent',
                fontWeight: isActive ? 500 : 400,
                cursor:'pointer',
                position: 'relative',
              }}>
                {isActive && <span style={{
                  position:'absolute', left:-12, top:8, bottom:8, width:3,
                  background:'var(--gold)', borderRadius:'0 3px 3px 0',
                }} />}
                <Icon d={it.icon} size={15} />
                <span>{it.label}</span>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop:'auto', borderTop:'1px solid var(--rule)', paddingTop:10, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:30, height:30, borderRadius:'50%',
          background:'var(--ink-2)', color:'var(--paper)',
          display:'grid', placeItems:'center', fontSize:12, fontWeight:500,
        }}>SC</div>
        <div style={{ flex:1, lineHeight: 1.15 }}>
          <div style={{ fontSize:13, fontWeight:500 }}>Sarah Chen</div>
          <div style={{ fontSize:11, color:'var(--ink-4)' }}>Teacher · Pro</div>
        </div>
        <Icon d={I.logout} size={14} style={{ color:'var(--ink-4)' }} />
      </div>
    </aside>
  );
};

// ─── TopBar ────────────────────────────────────────────────────
const TopBar = ({ variant = 'A' }) => (
  <div style={{
    height: 56, flex:'0 0 56px',
    borderBottom: '1px solid var(--rule)',
    background: 'var(--paper)',
    display:'flex', alignItems:'center', gap:12, padding:'0 20px',
  }}>
    <div style={{
      flex:1, maxWidth: 420,
      display:'flex', alignItems:'center', gap:8,
      padding:'7px 12px',
      background:'var(--rule-2)',
      borderRadius: 999,
      color:'var(--ink-4)', fontSize:13,
    }}>
      <Icon d={I.search} size={14} />
      <span>Search students, songs, lessons…</span>
      <span style={{
        marginLeft:'auto', fontSize:11, color:'var(--ink-4)',
        padding:'1px 6px', border:'1px solid var(--rule)', borderRadius: 4,
        fontFamily:'var(--mono)'
      }}>⌘K</span>
    </div>

    <div style={{ flex:1 }} />

    <div style={{
      padding:'6px 12px', borderRadius: 999,
      background:'var(--gold-tint)', color:'var(--gold-2)',
      fontSize:12, fontWeight:500,
      display:'flex', alignItems:'center', gap:6,
    }}>
      <Icon d={I.spark} size={12} /> Week 17
    </div>

    <button style={{
      border:'1px solid var(--rule)', background:'var(--card)',
      padding:'7px 10px', borderRadius:8, cursor:'pointer',
      display:'flex', alignItems:'center', gap:6, color:'var(--ink-3)',
    }}>
      <Icon d={I.bell} size={14} />
    </button>

    <button style={{
      border:'none', background:'var(--ink)', color:'var(--paper)',
      padding:'8px 14px', borderRadius:8, cursor:'pointer',
      display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500,
    }}>
      <Icon d={I.plus} size={13} stroke="var(--paper)" /> New lesson
    </button>
  </div>
);

// ─── Health dot ────────────────────────────────────────────────
const healthColor = (h) => ({
  excellent: 'var(--success)',
  good:      'var(--success)',
  needs_attention: 'var(--warn)',
  at_risk:   'var(--danger)',
  critical:  'var(--danger)',
}[h] || 'var(--ink-4)');

const HealthDot = ({ health, size = 8 }) => (
  <span style={{
    display:'inline-block',
    width: size, height: size, borderRadius: '50%',
    background: healthColor(health),
    boxShadow: `0 0 0 3px ${healthColor(health)}22`,
  }} />
);

// ─── Avatar ───────────────────────────────────────────────────
const Avatar = ({ s, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius:'50%',
    background: s.color, color:'#fff',
    display:'grid', placeItems:'center',
    fontSize: size*.38, fontWeight:600,
    flex:'0 0 auto',
    fontFamily:'var(--sans)',
  }}>{s.avatar}</div>
);

// ─── Chord diagram ────────────────────────────────────────────
// tiny SVG chord box — stylized, minimal, never cartoonish.
const CHORD_SHAPES = {
  'Bm':  { frets:[2,2,4,4,4,2], open:[], muted:[], start:2 },
  'F#':  { frets:[2,4,4,3,2,2], open:[], muted:[], start:2 },
  'A':   { frets:[0,0,2,2,2,0], open:[0,1,5], muted:[], start:1 },
  'E':   { frets:[0,2,2,1,0,0], open:[0,4,5], muted:[], start:1 },
  'G':   { frets:[3,2,0,0,0,3], open:[2,3,4], muted:[], start:1 },
  'D':   { frets:[0,0,0,2,3,2], open:[2], muted:[0,1], start:1 },
  'Em':  { frets:[0,2,2,0,0,0], open:[0,3,4,5], muted:[], start:1 },
  'F#7': { frets:[2,4,3,4,2,2], open:[], muted:[], start:2 },
  'C':   { frets:[0,3,2,0,1,0], open:[0,3,5], muted:[], start:1 },
  'Am':  { frets:[0,0,2,2,1,0], open:[0,1,5], muted:[], start:1 },
  'F':   { frets:[1,3,3,2,1,1], open:[], muted:[], start:1 },
};

const ChordGrid = ({ name, size = 48, color = 'var(--ink-2)' }) => {
  const shape = CHORD_SHAPES[name] || CHORD_SHAPES['G'];
  const w = size, h = size * 1.28;
  const padL = size*.18, padR = size*.12, padT = size*.28, padB = size*.14;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const strings = 6, frets = 4;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <text x={w/2} y={padT - 10} textAnchor="middle" fontFamily="var(--serif)" fontSize={size*.28} fill={color} fontWeight="500">{name}</text>
      {/* nut / top */}
      <rect x={padL} y={padT} width={innerW} height={shape.start === 1 ? 2.5 : 1} fill={color} />
      {shape.start > 1 && (
        <text x={padL - 4} y={padT + innerH/frets*.6 + 3} textAnchor="end" fontSize={size*.18} fontFamily="var(--mono)" fill={color}>{shape.start}fr</text>
      )}
      {/* strings (vertical) */}
      {Array.from({length:strings}).map((_,i)=>(
        <line key={`s${i}`} x1={padL + innerW*i/(strings-1)} y1={padT} x2={padL + innerW*i/(strings-1)} y2={padT+innerH} stroke={color} strokeWidth="0.8" opacity=".55" />
      ))}
      {/* frets (horizontal) */}
      {Array.from({length:frets+1}).map((_,i)=>(
        <line key={`f${i}`} x1={padL} y1={padT + innerH*i/frets} x2={padL+innerW} y2={padT + innerH*i/frets} stroke={color} strokeWidth="0.8" opacity=".55" />
      ))}
      {/* finger dots */}
      {shape.frets.map((f, i) => {
        if (f === 0) return null;
        const stringX = padL + innerW*i/(strings-1);
        const fretOffset = shape.start === 1 ? f : f - shape.start + 1;
        const y = padT + innerH*(fretOffset - 0.5)/frets;
        return <circle key={i} cx={stringX} cy={y} r={size*.08} fill={color} />;
      })}
      {/* open strings */}
      {shape.open.map(i => (
        <circle key={`o${i}`} cx={padL + innerW*i/(strings-1)} cy={padT - 5} r={size*.06} fill="none" stroke={color} strokeWidth="1" />
      ))}
    </svg>
  );
};

// ─── Fretboard progress ───────────────────────────────────────
// used as a decorative element + progress strip
const Fretboard = ({ frets = 12, highlighted = [], width = '100%', height = 44, color = 'var(--ink-2)' }) => {
  const h = height, strings = 6;
  return (
    <svg viewBox={`0 0 ${frets*40} ${h}`} preserveAspectRatio="none" width={width} height={h} style={{ display:'block' }}>
      <rect x="0" y="2" width={frets*40} height={h-4} fill="none" stroke={color} strokeWidth="0.5" opacity=".35" />
      {Array.from({length:frets+1}).map((_,i)=>(
        <line key={i} x1={i*40} y1="2" x2={i*40} y2={h-2} stroke={color} strokeWidth={i===0?1.5:0.5} opacity={i===0?.9:.4} />
      ))}
      {Array.from({length:strings}).map((_,i)=>(
        <line key={i} x1="0" y1={4 + (h-8)*i/(strings-1)} x2={frets*40} y2={4 + (h-8)*i/(strings-1)} stroke={color} strokeWidth="0.5" opacity=".5" />
      ))}
      {/* dots on 3, 5, 7, 9, 12 */}
      {[3,5,7,9].map(f => (
        <circle key={f} cx={f*40 - 20} cy={h/2} r="2" fill={color} opacity=".5" />
      ))}
      <circle cx={12*40 - 25} cy={h/2-8} r="2" fill={color} opacity=".5" />
      <circle cx={12*40 - 15} cy={h/2+8} r="2" fill={color} opacity=".5" />
      {highlighted.map((n,i)=>(
        <circle key={`h${i}`} cx={n.fret*40 - 20} cy={4 + (h-8)*(n.string-1)/5} r="5" fill="var(--gold)" />
      ))}
    </svg>
  );
};

// ─── Staff line (decorative) ──────────────────────────────────
const StaffLines = ({ width = '100%', height = 40, color = 'var(--rule)', strokeWidth = 0.7, count = 5 }) => {
  const numH = typeof height === 'number' ? height : 100;
  return (
    <svg width={width} height={height} preserveAspectRatio="none" viewBox={`0 0 100 ${numH}`}>
      {Array.from({length:count}).map((_,i)=>(
        <line key={i} x1="0" y1={numH*(i+1)/(count+1)} x2="100" y2={numH*(i+1)/(count+1)} stroke={color} strokeWidth={strokeWidth} />
      ))}
    </svg>
  );
};

// ─── Status pill for songs ────────────────────────────────────
const SONG_STATUS = {
  to_learn:     { label:'To learn',     dots:1, color:'var(--ink-4)' },
  started:      { label:'Started',      dots:2, color:'var(--info)' },
  remembered:   { label:'Remembered',   dots:3, color:'var(--warn)' },
  with_author:  { label:'With author',  dots:4, color:'#7a6aa0' },
  mastered:     { label:'Mastered',     dots:5, color:'var(--success)' },
};

const StatusPill = ({ status, compact = false }) => {
  const s = SONG_STATUS[status];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: compact ? '2px 8px' : '3px 10px',
      borderRadius: 999,
      background: `${s.color}15`,
      color: s.color,
      fontSize: 11, fontWeight:500, letterSpacing:'.01em',
    }}>
      <span style={{ display:'inline-flex', gap:2 }}>
        {Array.from({length:5}).map((_,i)=>(
          <span key={i} style={{
            width:4, height:4, borderRadius:'50%',
            background: i < s.dots ? s.color : `${s.color}40`,
          }} />
        ))}
      </span>
      {s.label}
    </span>
  );
};

// ─── Export ───────────────────────────────────────────────────
Object.assign(window, {
  SidebarNav, TopBar, Icon, I,
  HealthDot, Avatar, healthColor,
  ChordGrid, Fretboard, StaffLines,
  StatusPill, SONG_STATUS,
});
