// SidebarRail.jsx — direction 02 — Dual-Rail
// Dark, dense, IDE-like. 52px icon rail on the left routes between "spaces"
// (Analyze, Workspaces, Admin, Pinned, Recent, Search, Notifs). Selecting
// a rail item expands a 232px panel with that space's contents. Panel can
// be collapsed to just the rail.

const { useState: useStateR, useRef: useRefR } = React;

const R = {
  bg:       '#131418',
  panel:    '#191a1f',
  rail:     '#0e0f12',
  border:   'rgba(255,255,255,0.06)',
  border2:  'rgba(255,255,255,0.10)',
  fg:       '#e8e8ec',
  mute:     'rgba(232,232,236,0.55)',
  subtle:   'rgba(232,232,236,0.38)',
  hover:    'rgba(255,255,255,0.05)',
  active:   'rgba(255,255,255,0.08)',
  accent:   'oklch(0.72 0.14 250)',
  accentBg: 'oklch(0.32 0.10 250)',
};

const SPACES = [
  { id: 'analyze',  label: 'Analyze',    icon: 'chart',  kind: 'nav',    items: NAV_MAIN },
  { id: 'work',     label: 'Workspace',  icon: 'grid',   kind: 'nav',    items: NAV_WORK },
  { id: 'pinned',   label: 'Pinned',     icon: 'star',   kind: 'list',   items: PINNED },
  { id: 'recent',   label: 'Recent',     icon: 'clock',  kind: 'recent', items: RECENT },
  { id: 'search',   label: 'Search',     icon: 'search', kind: 'search', items: ALL_ITEMS },
  { id: 'notifs',   label: 'Alerts',     icon: 'bell',   kind: 'notifs', count: 2 },
  { id: 'admin',    label: 'Admin',      icon: 'gear',   kind: 'nav',    items: NAV_ADMIN },
];

function SidebarRail() {
  const [space, setSpace]       = useStateR('analyze');
  const [collapsed, setColl]    = useStateR(false);
  const [active, setActive]     = useStateR('home');
  const [query, setQuery]       = useStateR('');
  const [ws, setWs]             = useStateR(WORKSPACES[0]);
  const current = SPACES.find(s => s.id === space);

  return (
    <div style={{ display:'flex', height:'100%', background:R.bg, color:R.fg,
                  borderRight:`1px solid ${R.border}`, fontSize:13 }}>
      {/* Rail */}
      <div style={{ width:52, background:R.rail, borderRight:`1px solid ${R.border}`,
                    display:'flex', flexDirection:'column', alignItems:'center',
                    padding:'10px 0 10px', gap:2 }}>
        {/* Workspace token */}
        <button title={ws.name} onClick={()=>{
            const i = WORKSPACES.findIndex(w=>w.id===ws.id);
            setWs(WORKSPACES[(i+1)%WORKSPACES.length]);
          }}
          style={{ width:32, height:32, borderRadius:7, border:'none', cursor:'pointer',
                   background:ws.tint, color:'#fff', fontWeight:700, fontSize:13,
                   marginBottom:8 }}>{ws.initial}</button>
        <div style={{ width:22, height:1, background:R.border, marginBottom:6 }}/>

        {SPACES.map(s => {
          const isActive = space === s.id;
          return (
            <button key={s.id} title={s.label}
              onClick={()=>{ if (isActive && !collapsed) setColl(true); else { setSpace(s.id); setColl(false); } }}
              style={{ position:'relative', width:36, height:34, display:'grid', placeItems:'center',
                       border:'none', background: isActive ? R.accentBg : 'transparent',
                       color: isActive ? R.accent : R.mute,
                       borderRadius:7, cursor:'pointer', transition:'all .12s' }}
              onMouseEnter={e=>{ if(!isActive) { e.currentTarget.style.background=R.hover; e.currentTarget.style.color=R.fg; } }}
              onMouseLeave={e=>{ if(!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=R.mute; } }}>
              <Icon name={s.icon} size={15}/>
              {s.count && (
                <span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:3,
                               background:'oklch(0.65 0.18 25)' }}/>
              )}
              {isActive && !collapsed && (
                <span style={{ position:'absolute', left:-1, top:6, bottom:6, width:2, background:R.accent, borderRadius:1 }}/>
              )}
            </button>
          );
        })}
        <div style={{ flex:1 }}/>
        <button title="Profile" style={{ width:32, height:32, borderRadius:'50%', border:'none',
                 background:'oklch(0.78 0.08 60)', color:'#2c2012', fontWeight:700, fontSize:12,
                 cursor:'pointer', marginTop:6 }}>JM</button>
      </div>

      {/* Panel */}
      {!collapsed && (
        <div style={{ width:232, background:R.panel, display:'flex', flexDirection:'column',
                      borderRight:`1px solid ${R.border}` }}>
          {/* Panel header */}
          <div style={{ height:44, padding:'0 10px 0 14px', display:'flex', alignItems:'center',
                        gap:8, borderBottom:`1px solid ${R.border}` }}>
            <span style={{ color:R.fg, fontWeight:600, fontSize:12.5, letterSpacing:0.2,
                           textTransform:'uppercase' }}>{current.label}</span>
            <div style={{ flex:1 }}/>
            <button onClick={()=>setColl(true)} title="Collapse panel"
              style={{ width:24, height:24, display:'grid', placeItems:'center', background:'transparent',
                       border:'none', cursor:'pointer', color:R.mute, borderRadius:4 }}>
              <Icon name="chev" size={12}/>
            </button>
          </div>

          {/* Panel body */}
          <div style={{ flex:1, overflowY:'auto', padding:'8px 8px 12px' }}>
            {current.kind === 'search' && <SearchSpace query={query} setQuery={setQuery} setActive={setActive} active={active}/>}
            {current.kind === 'nav' && current.items.map(it => (
              <DenseRow key={it.id} item={it} active={active===it.id} onClick={()=>setActive(it.id)}/>
            ))}
            {current.kind === 'list' && (
              <>
                {current.items.map(it => (
                  <DenseRow key={it.id}
                    item={{ ...it, icon: kindIcon(it.kind) }}
                    active={active===it.id} onClick={()=>setActive(it.id)}
                    rightMeta={<Icon name="pin" size={11}/>}/>
                ))}
                <button style={addBtn}>
                  <Icon name="plus" size={12}/><span>Pin a view</span>
                </button>
              </>
            )}
            {current.kind === 'recent' && current.items.map(it => (
              <DenseRow key={it.id}
                item={{ ...it, icon:'dot' }}
                active={active===it.id} onClick={()=>setActive(it.id)}
                rightMeta={<span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:R.subtle }}>{it.when}</span>}/>
            ))}
            {current.kind === 'notifs' && <NotifsSpace/>}
          </div>

          {/* Panel footer — storage/usage meter, very pro-tool */}
          <div style={{ padding:'10px 14px', borderTop:`1px solid ${R.border}`,
                        display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:R.mute }}>
              <span style={{ fontFamily:"'JetBrains Mono', monospace" }}>EVENTS · 68%</span>
              <div style={{ flex:1 }}/>
              <span style={{ fontFamily:"'JetBrains Mono', monospace", color:R.subtle }}>6.8M / 10M</span>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:'68%', height:'100%', background:R.accent }}/>
            </div>
          </div>
        </div>
      )}

      {/* Re-open tab when collapsed */}
      {collapsed && (
        <button onClick={()=>setColl(false)} title="Expand panel"
          style={{ width:14, background:'transparent', borderRight:`1px solid ${R.border}`,
                   border:'none', cursor:'pointer', color:R.mute, display:'grid', placeItems:'center' }}>
          <Icon name="chev" size={11}/>
        </button>
      )}
    </div>
  );
}

function DenseRow({ item, active, onClick, rightMeta }) {
  return (
    <button onClick={onClick}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:9,
        padding:'5px 9px', margin:'1px 0', border:'none',
        background: active ? R.active : 'transparent',
        color: active ? R.fg : R.mute,
        borderRadius:5, cursor:'pointer', fontSize:12.5, textAlign:'left',
        fontFamily:'inherit', transition:'background .12s, color .12s',
      }}
      onMouseEnter={e=>{ if(!active) { e.currentTarget.style.background=R.hover; e.currentTarget.style.color=R.fg; } }}
      onMouseLeave={e=>{ if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=R.mute; } }}>
      <span style={{ color: active ? R.accent : 'inherit', display:'flex', width:14, justifyContent:'center' }}>
        <Icon name={item.icon} size={13}/>
      </span>
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>
      {item.badge && (
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10,
                       padding:'1px 5px', background:'rgba(255,255,255,0.08)',
                       color:R.fg, borderRadius:3 }}>{item.badge}</span>
      )}
      {rightMeta}
    </button>
  );
}

function SearchSpace({ query, setQuery, active, setActive }) {
  const results = query.trim()
    ? ALL_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 20)
    : ALL_ITEMS.slice(0, 12);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                    background:R.bg, border:`1px solid ${R.border2}`, borderRadius:6, margin:'0 0 6px' }}>
        <span style={{ color:R.mute }}><Icon name="search" size={13}/></span>
        <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find anything…"
          style={{ flex:1, background:'transparent', border:'none', outline:'none',
                   color:R.fg, fontSize:12.5, fontFamily:'inherit' }}/>
      </div>
      {query === '' && (
        <div style={{ fontSize:10, color:R.subtle, letterSpacing:0.6, textTransform:'uppercase',
                      padding:'4px 9px' }}>Suggested</div>
      )}
      {results.map(r => (
        <DenseRow key={r.id}
          item={{ ...r, icon: r.icon || (r._pinned ? 'star' : r._recent ? 'clock' : 'search') }}
          active={active===r.id} onClick={()=>setActive(r.id)}
          rightMeta={r.when ? <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:R.subtle }}>{r.when}</span> : null}/>
      ))}
      {results.length === 0 && (
        <div style={{ padding:'12px 10px', color:R.subtle, fontSize:12 }}>No matches.</div>
      )}
    </div>
  );
}

function NotifsSpace() {
  const items = [
    { title:'Signup funnel dropped 4.1%', meta:'alert · 12m', tint:'oklch(0.65 0.18 25)' },
    { title:'Weekly KPI scan ready',       meta:'report · 1h', tint:'oklch(0.72 0.14 250)' },
    { title:'Data source "Stripe" synced', meta:'system · 3h', tint:'oklch(0.66 0.12 160)' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {items.map((n,i)=>(
        <div key={i} style={{ padding:'8px 9px', borderRadius:5,
                              background:'rgba(255,255,255,0.03)', display:'flex', gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:3, marginTop:6, background:n.tint, flex:'0 0 auto' }}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, color:R.fg, lineHeight:1.35 }}>{n.title}</div>
            <div style={{ fontSize:10.5, color:R.subtle, fontFamily:"'JetBrains Mono', monospace", marginTop:2 }}>{n.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const addBtn = {
  width:'100%', display:'flex', alignItems:'center', gap:8,
  padding:'6px 9px', marginTop:4, border:`1px dashed ${R.border2}`,
  background:'transparent', color:R.subtle, borderRadius:5, cursor:'pointer',
  fontSize:12, fontFamily:'inherit',
};

window.SidebarRail = SidebarRail;
