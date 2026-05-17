// SidebarFloating.jsx — direction 03 — Floating Command
// A compact, expressive pill that hovers over the canvas. Command-led:
// a prominent search/command input is the centerpiece; nav collapses to
// glyph-only chips; pinned items surface as rounded tiles. Paper background
// surrounding it; heavy shadow so it reads as a true floating object.

const { useState: useStateF, useRef: useRefF, useEffect: useEffectF } = React;

const F = {
  bg:       '#ffffff',
  panel:    '#fbfaf6',
  border:   'rgba(0,0,0,0.06)',
  border2:  'rgba(0,0,0,0.09)',
  fg:       '#1d1d1f',
  mute:     'rgba(29,29,31,0.56)',
  subtle:   'rgba(29,29,31,0.40)',
  hover:    'rgba(0,0,0,0.04)',
  active:   'rgba(0,0,0,0.06)',
  accent:   'oklch(0.58 0.14 250)',
  accentBg: 'oklch(0.95 0.035 250)',
  accentFg: 'oklch(0.42 0.12 250)',
};

function SidebarFloating() {
  const [active, setActive]   = useStateF('home');
  const [query, setQuery]     = useStateF('');
  const [cmdOpen, setCmdOpen] = useStateF(false);
  const [ws, setWs]           = useStateF(WORKSPACES[0]);
  const [expanded, setExp]    = useStateF(true);
  const inputRef = useRefF(null);

  // keyboard: ⌘K toggles command
  useEffectF(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setCmdOpen(true);
        setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = query.trim()
    ? ALL_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const width = expanded ? 264 : 64;

  return (
    <div style={{
      width, height:'100%',
      background:F.bg,
      border:`1px solid ${F.border}`,
      borderRadius:16,
      boxShadow:'0 18px 48px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      display:'flex', flexDirection:'column',
      fontSize:13, color:F.fg,
      overflow:'hidden',
      transition:'width .22s cubic-bezier(.2,.8,.2,1)',
      position:'relative',
    }}>
      {/* Header — workspace + collapse */}
      <div style={{
        padding: expanded ? '14px 12px 10px' : '14px 8px 10px',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <button onClick={()=>{
            const i = WORKSPACES.findIndex(w=>w.id===ws.id);
            setWs(WORKSPACES[(i+1)%WORKSPACES.length]);
          }}
          title={ws.name}
          style={{ width:32, height:32, borderRadius:9, border:'none', cursor:'pointer',
                   background:ws.tint, color:'#fff', fontWeight:700, fontSize:13,
                   display:'grid', placeItems:'center',
                   boxShadow:'inset 0 -1px 0 rgba(0,0,0,0.15)' }}>
          {ws.initial}
        </button>
        {expanded && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:600, letterSpacing:-0.1,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {ws.name}
            </div>
            <div style={{ fontSize:10.5, color:F.subtle, fontFamily:"'JetBrains Mono', monospace",
                          marginTop:1 }}>
              PRO · 6.8M ev
            </div>
          </div>
        )}
        <button onClick={()=>setExp(x=>!x)} title={expanded ? 'Collapse' : 'Expand'}
          style={{ width:22, height:22, display:'grid', placeItems:'center',
                   background:'transparent', border:'none', cursor:'pointer',
                   color:F.mute, borderRadius:5,
                   transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <Icon name="chev" size={12}/>
        </button>
      </div>

      {/* Command input */}
      <div style={{ padding: expanded ? '0 12px 10px' : '0 8px 10px', position:'relative' }}>
        {expanded ? (
          <button onClick={()=>{ setCmdOpen(true); setTimeout(()=>inputRef.current&&inputRef.current.focus(),0); }}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding:'9px 11px',
              background:F.panel, border:`1px solid ${F.border}`,
              borderRadius:10, cursor:'pointer', color:F.mute, textAlign:'left',
              fontFamily:'inherit', fontSize:12.5,
            }}>
            <Icon name="sparks" size={13}/>
            <span style={{ flex:1 }}>Search or run a command…</span>
            <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10,
                           color:F.subtle, padding:'1px 5px',
                           border:`1px solid ${F.border2}`, borderRadius:4 }}>⌘K</span>
          </button>
        ) : (
          <button onClick={()=>setExp(true)} title="Search"
            style={{ width:48, height:40, display:'grid', placeItems:'center',
                     background:F.panel, border:`1px solid ${F.border}`,
                     borderRadius:10, cursor:'pointer', color:F.mute }}>
            <Icon name="search" size={15}/>
          </button>
        )}

        {/* Command dropdown */}
        {cmdOpen && expanded && (
          <div style={{
            position:'absolute', left:12, right:12, top:'100%', marginTop:6, zIndex:30,
            background:F.bg, border:`1px solid ${F.border2}`, borderRadius:12,
            boxShadow:'0 16px 40px rgba(0,0,0,0.14)',
            padding:6, maxHeight:320, overflowY:'auto',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
                          borderBottom:`1px solid ${F.border}`, marginBottom:4 }}>
              <Icon name="search" size={13}/>
              <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
                     placeholder="Type to search…"
                     style={{ flex:1, background:'transparent', border:'none', outline:'none',
                              fontSize:13, fontFamily:'inherit', color:F.fg }}/>
              <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10,
                             color:F.subtle }}>ESC</span>
            </div>
            {query === '' ? (
              <>
                <Hint label="Quick actions"/>
                {[
                  { icon:'plus',   label:'New dashboard' },
                  { icon:'funnel', label:'New funnel' },
                  { icon:'down',   label:'Export report' },
                ].map(a => (
                  <CmdRow key={a.label} icon={a.icon} label={a.label} onClick={()=>setCmdOpen(false)}/>
                ))}
                <Hint label="Recent"/>
                {RECENT.slice(0,4).map(r => (
                  <CmdRow key={r.id} icon="clock" label={r.label} meta={r.when}
                          onClick={()=>{ setActive(r.id); setCmdOpen(false); }}/>
                ))}
              </>
            ) : (
              results.length
                ? results.map(r => (
                    <CmdRow key={r.id}
                      icon={r.icon || (r._pinned ? 'star' : r._recent ? 'clock' : 'search')}
                      label={r.label}
                      meta={r.when || null}
                      onClick={()=>{ setActive(r.id); setCmdOpen(false); setQuery(''); }}/>
                  ))
                : <div style={{ padding:'14px 10px', color:F.subtle, fontSize:12.5 }}>No matches.</div>
            )}
          </div>
        )}
      </div>

      {/* Nav — main as tiles/rows */}
      <div style={{ flex:1, overflowY:'auto',
                    padding: expanded ? '4px 8px 8px' : '4px 8px 8px' }}>
        {expanded ? (
          <>
            {NAV_MAIN.map(it => (
              <NavPill key={it.id} item={it} active={active===it.id} onClick={()=>setActive(it.id)}/>
            ))}

            <SectionLabel label="Pinned" trailing={
              <button style={{ width:18, height:18, border:'none', background:'transparent',
                               color:F.subtle, cursor:'pointer', display:'grid', placeItems:'center' }}>
                <Icon name="plus" size={11}/>
              </button>
            }/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, padding:'0 4px 4px' }}>
              {PINNED.slice(0,4).map(p => (
                <button key={p.id} onClick={()=>setActive(p.id)}
                  style={{
                    display:'flex', flexDirection:'column', gap:4,
                    padding:'10px 10px', background:F.panel, border:`1px solid ${F.border}`,
                    borderRadius:10, cursor:'pointer', color:F.fg, textAlign:'left',
                    fontFamily:'inherit',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=F.border2}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=F.border}>
                  <span style={{ color:F.accent, display:'flex' }}>
                    <Icon name={kindIcon(p.kind)} size={13}/>
                  </span>
                  <span style={{ fontSize:11.5, fontWeight:500, lineHeight:1.3,
                                 overflow:'hidden', display:'-webkit-box',
                                 WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            <SectionLabel label="Recent"/>
            {RECENT.slice(0,3).map(r => (
              <button key={r.id} onClick={()=>setActive(r.id)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:8,
                  padding:'6px 10px', margin:'1px 0',
                  border:'none', background: active===r.id ? F.accentBg : 'transparent',
                  color: active===r.id ? F.accentFg : F.fg,
                  borderRadius:8, cursor:'pointer', fontSize:12.5, textAlign:'left',
                  fontFamily:'inherit',
                }}
                onMouseEnter={e=>{ if(active!==r.id) e.currentTarget.style.background=F.hover }}
                onMouseLeave={e=>{ if(active!==r.id) e.currentTarget.style.background='transparent' }}>
                <span style={{ color:F.subtle, display:'flex', width:14, justifyContent:'center' }}>
                  <Icon name="dot" size={14}/>
                </span>
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:F.subtle }}>{r.when}</span>
              </button>
            ))}
          </>
        ) : (
          // Collapsed: just glyphs
          [...NAV_MAIN, ...NAV_ADMIN].map(it => (
            <button key={it.id} title={it.label} onClick={()=>setActive(it.id)}
              style={{ width:48, height:40, display:'grid', placeItems:'center',
                       border:'none', background: active===it.id ? F.accentBg : 'transparent',
                       color: active===it.id ? F.accent : F.mute, borderRadius:10,
                       cursor:'pointer', margin:'2px 0' }}>
              <Icon name={it.icon} size={15}/>
            </button>
          ))
        )}
      </div>

      {/* Footer — profile + alerts */}
      <div style={{
        padding:'10px 12px', borderTop:`1px solid ${F.border}`,
        display:'flex', alignItems:'center', gap:8,
      }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'oklch(0.78 0.08 60)',
                      color:'#3a2a15', display:'grid', placeItems:'center',
                      fontWeight:700, fontSize:11.5 }}>JM</div>
        {expanded && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:500, overflow:'hidden',
                          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Jess Morales</div>
            <div style={{ fontSize:10.5, color:F.subtle,
                          fontFamily:"'JetBrains Mono', monospace" }}>jess@acme.co</div>
          </div>
        )}
        <button title="Alerts" style={{ position:'relative', width:28, height:28,
                                        display:'grid', placeItems:'center',
                                        background:'transparent', border:'none',
                                        cursor:'pointer', color:F.mute, borderRadius:6 }}>
          <Icon name="bell" size={14}/>
          <span style={{ position:'absolute', top:3, right:3, width:6, height:6, borderRadius:3,
                         background:'oklch(0.58 0.14 25)' }}/>
        </button>
      </div>
    </div>
  );
}

// Primary nav "pill" — full-width row with icon + label + badge
function NavPill({ item, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        padding:'7px 10px', margin:'1px 0',
        border:'none',
        background: active ? F.accentBg : 'transparent',
        color: active ? F.accentFg : F.fg,
        borderRadius:8, cursor:'pointer', fontSize:13, textAlign:'left',
        fontFamily:'inherit', fontWeight: active ? 500 : 400,
        transition:'background .12s',
      }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=F.hover }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent' }}>
      <span style={{ color: active ? F.accent : F.mute, display:'flex' }}>
        <Icon name={item.icon} size={14}/>
      </span>
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {item.label}
      </span>
      {item.badge && (
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10,
                       padding:'1px 6px',
                       background: active ? F.accent : 'rgba(0,0,0,0.05)',
                       color: active ? '#fff' : F.mute,
                       borderRadius:10 }}>{item.badge}</span>
      )}
    </button>
  );
}

function SectionLabel({ label, trailing }) {
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'12px 10px 4px', gap:6 }}>
      <span style={{ fontSize:10, fontWeight:600, letterSpacing:0.7, textTransform:'uppercase',
                     color:F.subtle, flex:1 }}>{label}</span>
      {trailing}
    </div>
  );
}

function CmdRow({ icon, label, meta, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:10,
        padding:'7px 8px', border:'none', background:'transparent',
        borderRadius:7, cursor:'pointer', color:F.fg, fontSize:12.5, textAlign:'left',
        fontFamily:'inherit',
      }}
      onMouseEnter={e=>e.currentTarget.style.background=F.hover}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <span style={{ color:F.mute, display:'flex', width:14, justifyContent:'center' }}>
        <Icon name={icon} size={13}/>
      </span>
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      {meta && <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:F.subtle }}>{meta}</span>}
    </button>
  );
}

function Hint({ label }) {
  return (
    <div style={{ fontSize:10, fontWeight:600, letterSpacing:0.6, textTransform:'uppercase',
                  color:F.subtle, padding:'8px 10px 4px' }}>
      {label}
    </div>
  );
}

window.SidebarFloating = SidebarFloating;
