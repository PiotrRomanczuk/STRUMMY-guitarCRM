// SidebarClassic.jsx — direction 01 — Classic Wide
// Light neutral surface, grouped sections, workspace switcher up top,
// pinned + recent sections, expandable groups, inline search, profile row.

const { useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;

const C = {
  bg:      '#fafaf8',
  panel:   '#f4f2ec',
  border:  'rgba(0,0,0,0.07)',
  fg:      '#1d1d1f',
  mute:    'rgba(29,29,31,0.58)',
  subtle:  'rgba(29,29,31,0.42)',
  hover:   'rgba(0,0,0,0.04)',
  active:  'rgba(0,0,0,0.06)',
  accent:  'oklch(0.58 0.14 250)',
  accentBg:'oklch(0.94 0.03 250)',
};

function SidebarClassic() {
  const [active, setActive] = useStateC('home');
  const [query, setQuery]   = useStateC('');
  const [openGroups, setOpenGroups] = useStateC({ main: true, work: true, admin: true, pinned: true, recent: true });
  const [ws, setWs]         = useStateC(WORKSPACES[0]);
  const [wsOpen, setWsOpen] = useStateC(false);

  const filt = (arr) => query.trim()
    ? arr.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : arr;

  const toggle = (k) => setOpenGroups(g => ({ ...g, [k]: !g[k] }));

  return (
    <div style={{ width:260, height:'100%', background:C.bg, borderRight:`1px solid ${C.border}`,
                  display:'flex', flexDirection:'column', fontSize:13, color:C.fg }}>
      {/* Workspace switcher */}
      <div style={{ padding:'12px 12px 10px', position:'relative' }}>
        <button onClick={()=>setWsOpen(o=>!o)}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                   background:'transparent', border:`1px solid ${C.border}`, borderRadius:7,
                   cursor:'pointer', color:C.fg, textAlign:'left' }}>
          <span style={{ width:22, height:22, borderRadius:5, background:ws.tint, color:'#fff',
                         display:'grid', placeItems:'center', fontWeight:600, fontSize:12 }}>{ws.initial}</span>
          <span style={{ flex:1, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ws.name}</span>
          <span style={{ color:C.mute, transform: wsOpen ? 'rotate(180deg)' : 'none', transition:'transform .15s' }}>
            <Icon name="chevd" size={12}/>
          </span>
        </button>
        {wsOpen && (
          <div style={{ position:'absolute', left:12, right:12, top:'100%', marginTop:4, zIndex:20,
                        background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                        boxShadow:'0 8px 24px rgba(0,0,0,0.08)', padding:4 }}>
            {WORKSPACES.map(w => (
              <button key={w.id} onClick={()=>{ setWs(w); setWsOpen(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'6px 8px',
                         background: w.id===ws.id ? C.active : 'transparent', border:'none', borderRadius:5,
                         cursor:'pointer', color:C.fg, textAlign:'left', fontSize:13 }}>
                <span style={{ width:20, height:20, borderRadius:4, background:w.tint, color:'#fff',
                               display:'grid', placeItems:'center', fontWeight:600, fontSize:11 }}>{w.initial}</span>
                <span style={{ flex:1 }}>{w.name}</span>
              </button>
            ))}
            <div style={{ height:1, background:C.border, margin:'4px 0' }}/>
            <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
                             background:'transparent', border:'none', borderRadius:5, cursor:'pointer',
                             color:C.mute, fontSize:12 }}>
              <Icon name="plus" size={12}/> New workspace
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ padding:'0 12px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                      background:C.panel, border:`1px solid transparent`, borderRadius:7,
                      transition:'border-color .15s' }}
             onFocus={e=>e.currentTarget.style.borderColor=C.border}
             onBlur={e=>e.currentTarget.style.borderColor='transparent'}>
          <span style={{ color:C.mute }}><Icon name="search" size={13}/></span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search"
            style={{ flex:1, background:'transparent', border:'none', outline:'none',
                     fontSize:12.5, color:C.fg, fontFamily:'inherit' }}/>
          <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:C.subtle,
                         padding:'1px 4px', border:`1px solid ${C.border}`, borderRadius:3 }}>⌘K</span>
        </div>
      </div>

      {/* Nav body */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'4px 8px 12px' }}>
        <NavGroup label="Analyze" open={openGroups.main} onToggle={()=>toggle('main')}>
          {filt(NAV_MAIN).map(it => <NavRow key={it.id} item={it} active={active===it.id} onClick={()=>setActive(it.id)} />)}
        </NavGroup>
        <NavGroup label="Workspaces" open={openGroups.work} onToggle={()=>toggle('work')}>
          {filt(NAV_WORK).map(it => <NavRow key={it.id} item={it} active={active===it.id} onClick={()=>setActive(it.id)} />)}
        </NavGroup>

        <GroupLabel label="Pinned" icon="star" open={openGroups.pinned} onToggle={()=>toggle('pinned')} />
        {openGroups.pinned && filt(PINNED).map(p => (
          <button key={p.id} onClick={()=>setActive(p.id)}
            style={{ ...rowBase, ...(active===p.id ? rowActive : {}) }}
            onMouseEnter={e=>{ if(active!==p.id) e.currentTarget.style.background=C.hover }}
            onMouseLeave={e=>{ if(active!==p.id) e.currentTarget.style.background='transparent' }}>
            <span style={{ color: active===p.id ? C.accent : C.mute, display:'flex' }}>
              <Icon name={kindIcon(p.kind)} size={14}/>
            </span>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.label}</span>
          </button>
        ))}

        <GroupLabel label="Recent" icon="clock" open={openGroups.recent} onToggle={()=>toggle('recent')} />
        {openGroups.recent && filt(RECENT).slice(0,4).map(r => (
          <button key={r.id} onClick={()=>setActive(r.id)}
            style={{ ...rowBase, ...(active===r.id ? rowActive : {}) }}
            onMouseEnter={e=>{ if(active!==r.id) e.currentTarget.style.background=C.hover }}
            onMouseLeave={e=>{ if(active!==r.id) e.currentTarget.style.background='transparent' }}>
            <span style={{ width:14, display:'flex', justifyContent:'center', color:C.subtle }}>
              <Icon name="dot" size={14}/>
            </span>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.label}</span>
            <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:C.subtle }}>{r.when}</span>
          </button>
        ))}

        <NavGroup label="Admin" open={openGroups.admin} onToggle={()=>toggle('admin')}>
          {filt(NAV_ADMIN).map(it => <NavRow key={it.id} item={it} active={active===it.id} onClick={()=>setActive(it.id)} />)}
        </NavGroup>
      </div>

      {/* Profile */}
      <div style={{ padding:10, borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'oklch(0.78 0.08 60)',
                      color:'#3a2a15', display:'grid', placeItems:'center', fontWeight:600, fontSize:12 }}>JM</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Jess Morales</div>
          <div style={{ fontSize:11, color:C.mute, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>jess@acme.co</div>
        </div>
        <button style={iconBtn(C)} title="Notifications">
          <Icon name="bell" size={14}/>
          <span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:3,
                         background:'oklch(0.58 0.14 25)' }}/>
        </button>
        <button style={iconBtn(C)} title="Settings"><Icon name="gear" size={14}/></button>
      </div>
    </div>
  );
}

const rowBase = {
  width:'100%', display:'flex', alignItems:'center', gap:10,
  padding:'6px 10px', margin:'1px 0', border:'none', background:'transparent',
  borderRadius:6, cursor:'pointer', color:C.fg, fontSize:13, textAlign:'left',
  fontFamily:'inherit', transition:'background .12s',
};
const rowActive = { background:C.accentBg, color:C.accent, fontWeight:500 };

function NavRow({ item, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ ...rowBase, ...(active ? rowActive : {}) }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background=C.hover }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent' }}>
      <span style={{ color: active ? C.accent : C.mute, display:'flex' }}>
        <Icon name={item.icon} size={14}/>
      </span>
      <span style={{ flex:1 }}>{item.label}</span>
      {item.badge && (
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10,
                       padding:'1px 5px', background: active ? C.accent : 'rgba(0,0,0,0.06)',
                       color: active ? '#fff' : C.mute, borderRadius:10 }}>{item.badge}</span>
      )}
    </button>
  );
}

function NavGroup({ label, open, onToggle, children }) {
  return (
    <div style={{ marginTop:6 }}>
      <GroupLabel label={label} open={open} onToggle={onToggle}/>
      {open && <div>{children}</div>}
    </div>
  );
}

function GroupLabel({ label, icon, open, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:6,
               padding:'10px 10px 4px', background:'transparent', border:'none', cursor:'pointer',
               color:C.subtle, fontSize:10.5, fontWeight:600, letterSpacing:0.7,
               textTransform:'uppercase', textAlign:'left', fontFamily:'inherit' }}>
      {icon && <Icon name={icon} size={11}/>}
      <span style={{ flex:1 }}>{label}</span>
      <span style={{ transform: open ? 'rotate(90deg)' : 'none', transition:'transform .15s', display:'flex' }}>
        <Icon name="chev" size={11}/>
      </span>
    </button>
  );
}

function iconBtn(theme) {
  return {
    position:'relative',
    width:28, height:28, display:'grid', placeItems:'center',
    background:'transparent', border:'none', borderRadius:5, cursor:'pointer',
    color: theme.mute,
  };
}

window.SidebarClassic = SidebarClassic;
