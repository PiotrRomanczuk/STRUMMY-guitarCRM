// Landing page — shared primitives
// Nav, Footer, Section wrapper, placeholder screenshot, browser chrome.

const LandingContainer = ({ children, width = 1440, pad = 96 }) => (
  <div style={{
    maxWidth: width,
    margin: '0 auto',
    padding: `0 ${pad}px`,
  }}>
    {children}
  </div>
);

// ─── Nav ────────────────────────────────────────────────────────
const LandingNav = ({ compact = false, width = 1440 }) => {
  const pad = compact ? 20 : 48;
  return (
    <div style={{
      position:'sticky', top:0, zIndex:20,
      background:'color-mix(in oklab, var(--ivory) 88%, transparent)',
      backdropFilter:'blur(12px)',
      WebkitBackdropFilter:'blur(12px)',
      borderBottom:'1px solid color-mix(in oklab, var(--rule) 65%, transparent)',
    }}>
      <div style={{
        maxWidth: width, margin:'0 auto',
        padding:`14px ${pad}px`,
        display:'flex', alignItems:'center', gap: compact ? 16 : 28,
      }}>
        {/* Wordmark */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            fontFamily:'var(--serif)',
            fontWeight:500,
            fontSize: compact ? 20 : 22,
            letterSpacing:'-0.02em',
            color:'var(--ink)',
          }}>
            Strummy
            <span style={{
              display:'inline-block', width:4, height:4, borderRadius:'50%',
              background:'var(--gold)', marginLeft:3, verticalAlign:'middle',
            }} />
          </div>
        </div>

        {!compact && (
          <nav style={{ display:'flex', gap:24, marginLeft:16 }}>
            {['Features','How it works','For teachers','Changelog'].map(l => (
              <a key={l} style={{
                fontSize:13, color:'var(--ink-3)', cursor:'pointer',
                textDecoration:'none',
              }}>{l}</a>
            ))}
          </nav>
        )}

        <div style={{ flex:1 }} />

        {compact ? (
          <>
            <button style={{
              border:'none', background:'var(--ink)', color:'var(--paper)',
              padding:'7px 12px', borderRadius:999, fontSize:12, fontWeight:500, cursor:'pointer',
            }}>Get started</button>
            <button style={{
              border:'1px solid var(--rule)', background:'transparent', borderRadius:8,
              padding:'6px 8px', cursor:'pointer', color:'var(--ink-3)',
              display:'grid', placeItems:'center',
            }} aria-label="Menu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/></svg>
            </button>
          </>
        ) : (
          <>
            <a style={{ fontSize:13, color:'var(--ink-3)', cursor:'pointer', marginRight:4 }}>Sign in</a>
            <button style={{
              border:'1px solid var(--rule)', background:'transparent', color:'var(--ink-2)',
              padding:'8px 14px', borderRadius:999, fontSize:13, fontWeight:500, cursor:'pointer',
              display:'inline-flex', alignItems:'center', gap:6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
              Try the demo
            </button>
            <button style={{
              border:'none',
              background:'var(--ink)',
              color:'var(--paper)',
              padding:'9px 16px', borderRadius:999, fontSize:13, fontWeight:500, cursor:'pointer',
            }}>Get started — free</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Section label kicker ──────────────────────────────────────
const SectionKicker = ({ children, align = 'left' }) => (
  <div style={{
    display:'flex', alignItems:'center', gap:10, justifyContent: align === 'center' ? 'center' : 'flex-start',
    color:'var(--gold-2)',
    fontFamily:'var(--mono)',
    fontSize:11, letterSpacing:'.22em', textTransform:'uppercase',
    marginBottom:14,
  }}>
    <span style={{ width:18, height:1, background:'var(--gold)' }} />
    <span>{children}</span>
    <span style={{ width:18, height:1, background:'var(--gold)' }} />
  </div>
);

// ─── Display serif heading ─────────────────────────────────────
const Display = ({ children, size = 72, align = 'left', style }) => (
  <h2 style={{
    margin:0,
    fontFamily:'var(--serif)',
    fontWeight:400,
    fontSize:size,
    lineHeight: 1.02,
    letterSpacing:'-0.028em',
    textAlign: align,
    color:'var(--ink)',
    textWrap:'balance',
    ...style,
  }}>{children}</h2>
);

// ─── Eyebrow (all caps) ────────────────────────────────────────
const Eyebrow = ({ children, style }) => (
  <div style={{
    fontFamily:'var(--mono)',
    fontSize:11, letterSpacing:'.22em', textTransform:'uppercase',
    color:'var(--ink-4)',
    ...style,
  }}>{children}</div>
);

// ─── Placeholder frame (striped, monospace label) ──────────────
// Used for screenshots we don't have yet — honest placeholder.
const Placeholder = ({ label, width = '100%', height = 400, note = 'screenshot' }) => (
  <div style={{
    width, height,
    position:'relative',
    background:`repeating-linear-gradient(135deg,
      var(--rule-2) 0px, var(--rule-2) 1px,
      transparent 1px, transparent 9px)`,
    backgroundColor:'var(--paper)',
    border:'1px solid var(--rule)',
    borderRadius: 12,
    display:'grid', placeItems:'center',
    overflow:'hidden',
  }}>
    <div style={{
      padding:'10px 16px',
      border:'1px solid var(--rule)',
      background:'var(--card)',
      borderRadius: 8,
      fontFamily:'var(--mono)',
      fontSize:12, color:'var(--ink-3)',
      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
      textAlign:'center',
    }}>
      <span style={{ color:'var(--gold-2)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase' }}>{note}</span>
      <span>{label}</span>
    </div>
  </div>
);

// ─── Browser chrome frame ──────────────────────────────────────
const BrowserFrame = ({ children, url = 'app.strummy.app', width = '100%', height, tilted = false, style }) => (
  <div style={{
    width,
    borderRadius: 14,
    overflow:'hidden',
    background:'var(--card)',
    border:'1px solid var(--rule)',
    boxShadow: tilted
      ? '0 40px 80px -30px rgba(26,22,19,.35), 0 20px 40px -20px rgba(26,22,19,.18)'
      : '0 20px 40px -20px rgba(26,22,19,.18), 0 8px 18px -10px rgba(26,22,19,.10)',
    transform: tilted ? 'perspective(1800px) rotateY(-6deg) rotateX(3deg)' : 'none',
    transformOrigin: 'center center',
    ...style,
  }}>
    <div style={{
      height:34, padding:'0 14px',
      display:'flex', alignItems:'center', gap:10,
      borderBottom:'1px solid var(--rule)',
      background:'var(--paper)',
    }}>
      <div style={{ display:'flex', gap:6 }}>
        {['#e0726a','#e6b64b','#7abf7a'].map(c => (
          <span key={c} style={{ width:10, height:10, borderRadius:'50%', background:c, opacity:.85 }} />
        ))}
      </div>
      <div style={{
        flex:1, maxWidth:340, margin:'0 auto',
        height:22, borderRadius: 6,
        background:'var(--card)', border:'1px solid var(--rule)',
        display:'flex', alignItems:'center', gap:6,
        padding:'0 10px',
        fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        <span>{url}</span>
      </div>
      <div style={{ width:44 }} />
    </div>
    <div style={{ height, background:'var(--ivory)' }}>
      {children}
    </div>
  </div>
);

// ─── Button primitives ─────────────────────────────────────────
const BtnPrimary = ({ children, size = 'md', style }) => {
  const padY = size === 'lg' ? 14 : size === 'sm' ? 8 : 11;
  const padX = size === 'lg' ? 26 : size === 'sm' ? 14 : 20;
  const fs   = size === 'lg' ? 15 : 13;
  return (
    <button style={{
      border:'none',
      background:'var(--ink)', color:'var(--paper)',
      padding:`${padY}px ${padX}px`,
      borderRadius: 999, fontSize:fs, fontWeight:500, cursor:'pointer',
      display:'inline-flex', alignItems:'center', gap:8,
      boxShadow:'0 1px 2px rgba(26,22,19,.1), inset 0 1px 0 rgba(255,255,255,.08)',
      letterSpacing:'-0.005em',
      ...style,
    }}>{children}</button>
  );
};

const BtnGhost = ({ children, size = 'md', style }) => {
  const padY = size === 'lg' ? 13 : size === 'sm' ? 7 : 10;
  const padX = size === 'lg' ? 24 : size === 'sm' ? 12 : 18;
  const fs   = size === 'lg' ? 15 : 13;
  return (
    <button style={{
      border:'1px solid var(--rule)',
      background:'transparent',
      color:'var(--ink-2)',
      padding:`${padY}px ${padX}px`,
      borderRadius:999, fontSize:fs, fontWeight:500, cursor:'pointer',
      display:'inline-flex', alignItems:'center', gap:8,
      letterSpacing:'-0.005em',
      ...style,
    }}>{children}</button>
  );
};

// ─── Footer ────────────────────────────────────────────────────
const LandingFooter = ({ compact = false }) => {
  const col = (title, items) => (
    <div>
      <div style={{
        fontFamily:'var(--mono)',
        fontSize:10, letterSpacing:'.18em', textTransform:'uppercase',
        color:'var(--ink-4)', marginBottom:12,
      }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {items.map(it => (
          <a key={it} style={{ fontSize:13, color:'var(--ink-2)', cursor:'pointer', textDecoration:'none' }}>{it}</a>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{
      borderTop:'1px solid var(--rule)',
      background:'var(--paper)',
    }}>
      <div style={{
        maxWidth: 1440, margin:'0 auto',
        padding: compact ? '32px 20px' : '56px 96px 32px',
        display:'grid',
        gridTemplateColumns: compact ? '1fr' : '1.4fr 1fr 1fr 1fr',
        gap: compact ? 24 : 48,
      }}>
        <div>
          <div style={{
            fontFamily:'var(--serif)',
            fontWeight:500, fontSize:26, letterSpacing:'-0.02em',
            marginBottom:10,
          }}>
            Strummy
            <span style={{
              display:'inline-block', width:5, height:5, borderRadius:'50%',
              background:'var(--gold)', marginLeft:3, verticalAlign:'middle',
            }} />
          </div>
          <div style={{ color:'var(--ink-3)', fontSize:13, maxWidth:300, lineHeight:1.55 }}>
            A quieter kind of studio software. Built in Brooklyn by a working guitar teacher.
          </div>
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            {[
              { label:'GH', d:'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z' },
              { label:'IN', d:'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z' },
            ].map(s => (
              <a key={s.label} style={{
                width:32, height:32, border:'1px solid var(--rule)',
                borderRadius:'50%', display:'grid', placeItems:'center',
                color:'var(--ink-3)', cursor:'pointer',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={s.d}/></svg>
              </a>
            ))}
          </div>
        </div>
        {col('Product', ['Features','How it works','Changelog','Roadmap'])}
        {col('Studio', ['For teachers','Founder story','Contact'])}
        {col('Legal', ['Privacy','Terms','Beta notice'])}
      </div>
      <div style={{
        maxWidth: 1440, margin:'0 auto',
        padding: compact ? '20px' : '20px 96px 40px',
        borderTop:'1px solid var(--rule)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        flexWrap:'wrap', gap:10,
      }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>
          © 2026 Strummy · Public beta
        </div>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>
          strummy.app
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  LandingContainer, LandingNav, LandingFooter,
  SectionKicker, Display, Eyebrow,
  Placeholder, BrowserFrame,
  BtnPrimary, BtnGhost,
});
