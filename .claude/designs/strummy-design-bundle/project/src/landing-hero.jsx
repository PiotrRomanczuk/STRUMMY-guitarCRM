// Landing — Hero section (split-screen).
// Left: expressive serif typography.
// Right: calm, simple mock dashboard in a browser chrome frame.

// Simplified dashboard — designed for ~620px column width.
const HeroDashboard = () => {
  const cardBase = {
    background:'var(--card)',
    border:'1px solid var(--rule)',
    borderRadius: 8,
  };
  return (
    <div className="app-viewport" style={{
      width:'100%', height:'100%',
      display:'flex',
      background:'var(--ivory)',
      color:'var(--ink)',
      fontSize:12,
      lineHeight:1.4,
      overflow:'hidden',
    }}>
      {/* Slim sidebar — icon-only to save width */}
      <aside style={{
        width: 54, flex:'0 0 54px',
        background:'var(--paper)',
        borderRight:'1px solid var(--rule)',
        display:'flex', flexDirection:'column',
        alignItems:'center',
        padding:'14px 0',
        gap:4,
      }}>
        <div style={{
          width:26, height:26, borderRadius:6, marginBottom:8,
          background:'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)',
          display:'grid', placeItems:'center',
        }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M5 19c0-3 2-5 4-6s2-4 5-4 5 3 5 3-2 2-5 2-3 2-5 3-4 2-4 2z" />
          </svg>
        </div>
        {[
          { d:I.home, active:true },
          { d:I.lesson },
          { d:I.students },
          { d:I.song },
          { d:I.assign },
          { d:I.stats },
          { d:I.calendar },
          { d:I.fretboard },
        ].map((it, i) => (
          <div key={i} style={{
            width:32, height:32, borderRadius:6,
            display:'grid', placeItems:'center',
            color: it.active ? 'var(--ink)' : 'var(--ink-4)',
            background: it.active ? 'var(--rule-2)' : 'transparent',
            position:'relative',
          }}>
            {it.active && <span style={{
              position:'absolute', left:-10, top:8, bottom:8, width:2,
              background:'var(--gold)', borderRadius:'0 2px 2px 0',
            }} />}
            <Icon d={it.d} size={15} />
          </div>
        ))}
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Top bar */}
        <div style={{
          height: 42,
          borderBottom:'1px solid var(--rule)',
          background:'var(--paper)',
          display:'flex', alignItems:'center', padding:'0 16px', gap:10,
        }}>
          <div style={{
            padding:'5px 12px', background:'var(--rule-2)',
            borderRadius:999, color:'var(--ink-4)', fontSize:11,
            display:'flex', alignItems:'center', gap:6,
            minWidth: 200,
          }}>
            <Icon d={I.search} size={11} />
            <span>Search students, songs…</span>
          </div>
          <div style={{ flex:1 }} />
          <div style={{
            padding:'4px 10px', borderRadius:999,
            background:'var(--gold-tint)', color:'var(--gold-2)',
            fontSize:10, fontWeight:500,
          }}>Wk 17</div>
          <div style={{
            background:'var(--ink)', color:'var(--paper)',
            padding:'6px 12px', borderRadius:6,
            fontSize:11, fontWeight:500,
          }}>+ New lesson</div>
        </div>

        {/* Body */}
        <div style={{ flex:1, padding:'22px 24px', background:'var(--ivory)', overflow:'hidden' }}>
          {/* Greeting */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              color:'var(--ink-4)', fontSize:10, textTransform:'uppercase',
              letterSpacing:'.18em', fontFamily:'var(--mono)', marginBottom:4,
            }}>Thursday · April 23</div>
            <div style={{
              fontFamily:'var(--serif)', fontSize:26, fontWeight:400,
              letterSpacing:'-0.02em', lineHeight:1.05,
            }}>
              Good afternoon, <em style={{ color:'var(--gold-2)' }}>Sarah</em>.
            </div>
          </div>

          {/* 3-up stat row — roomier than 4 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
            {[
              { l:'Lessons today', v:'3', u:'2h 0m total' },
              { l:'Active students', v:'27', u:'of 31 this week' },
              { l:'Studio streak', v:'11', u:'days on average' },
            ].map((s,i)=>(
              <div key={i} style={{ ...cardBase, padding:'12px 14px' }}>
                <div style={{
                  color:'var(--ink-4)', fontSize:9, textTransform:'uppercase',
                  letterSpacing:'.12em', fontWeight:500,
                }}>{s.l}</div>
                <div style={{
                  fontFamily:'var(--serif)', fontSize:28, fontWeight:400,
                  letterSpacing:'-0.03em', lineHeight:1, marginTop:6,
                }}>{s.v}</div>
                <div style={{ color:'var(--ink-4)', fontSize:10, marginTop:6 }}>{s.u}</div>
              </div>
            ))}
          </div>

          {/* Today's agenda — single hero card */}
          <div style={{ ...cardBase, padding:'14px 18px' }}>
            <div style={{
              display:'flex', alignItems:'baseline', justifyContent:'space-between',
              paddingBottom:8, borderBottom:'1px solid var(--rule)',
            }}>
              <div>
                <div style={{
                  color:'var(--ink-4)', fontSize:9, textTransform:'uppercase',
                  letterSpacing:'.14em', fontWeight:500,
                }}>Today's agenda</div>
                <div style={{
                  fontFamily:'var(--serif)', fontSize:16, letterSpacing:'-0.01em', marginTop:2,
                }}>3 lessons · 2h 0m</div>
              </div>
              <span style={{ color:'var(--ink-4)', fontSize:10 }}>Open calendar →</span>
            </div>

            {[
              { time:'4:00p', dur:'45m', s: students[0], song:'Blackbird',                 k:'G' },
              { time:'5:00p', dur:'30m', s: students[1], song:'Wonderwall',                k:'Em' },
              { time:'6:30p', dur:'45m', s: students[2], song:'House of the Rising Sun',   k:'Am' },
            ].map((l, idx) => (
              <div key={idx} style={{
                display:'grid',
                gridTemplateColumns:'54px 1fr auto',
                gap:12, padding:'10px 0',
                borderBottom: idx === 2 ? 'none' : '1px solid var(--rule)',
                alignItems:'center',
              }}>
                <div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:500, color:'var(--ink)' }}>{l.time}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>{l.dur}</div>
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <Avatar s={l.s} size={22} />
                    <div style={{ fontSize:12.5, fontWeight:500 }}>{l.s.name}</div>
                    <HealthDot health={l.s.health} size={6} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:30 }}>
                    <span style={{
                      fontFamily:'var(--mono)', fontSize:10, color:'var(--gold-2)',
                      padding:'1px 5px', border:'1px solid var(--gold-dim)', borderRadius:3,
                    }}>{l.k}</span>
                    <span style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:12, color:'var(--ink-2)' }}>
                      {l.song}
                    </span>
                  </div>
                </div>
                <button style={{
                  padding:'5px 12px',
                  border:'1px solid var(--rule)', background:'var(--card)',
                  borderRadius:6, fontSize:11, color:'var(--ink-2)', cursor:'pointer',
                }}>Start</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Hero ──────────────────────────────────────────────────────
const LandingHero = () => {
  return (
    <div style={{
      position:'relative',
      padding:'72px 0 120px',
      overflow:'hidden',
    }}>
      {/* staff line motif top */}
      <div style={{
        position:'absolute', top:56, left:0, right:0, height:32,
        opacity:.18, pointerEvents:'none',
      }}>
        <StaffLines width="100%" height={32} color="var(--ink-4)" strokeWidth={0.6} />
      </div>

      <div style={{ maxWidth: 1440, margin:'0 auto', padding:'0 96px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.18fr', gap:72, alignItems:'center' }}>
          {/* LEFT — typography */}
          <div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:10,
              padding:'4px 12px 4px 4px',
              border:'1px solid var(--rule)',
              borderRadius:999,
              background:'var(--card)',
              marginBottom:36,
            }}>
              <span style={{
                padding:'2px 10px', borderRadius:999,
                background:'var(--gold-tint)', color:'var(--gold-2)',
                fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase',
              }}>Public beta</span>
              <span style={{ fontSize:12, color:'var(--ink-3)' }}>Free for teachers — no card.</span>
            </div>

            <h1 style={{
              margin:0,
              fontFamily:'var(--serif)',
              fontWeight:400,
              fontSize:76,
              lineHeight:1.04,
              letterSpacing:'-0.028em',
              color:'var(--ink)',
              textWrap:'balance',
              marginBottom:32,
            }}>
              The studio your students <em style={{
                fontStyle:'italic',
                color:'var(--gold-2)',
              }}>deserve</em>.
            </h1>

            <div style={{
              fontSize:18, lineHeight:1.6, color:'var(--ink-3)',
              maxWidth: 480, marginBottom:40,
              textWrap:'pretty',
            }}>
              A calm, crafted workspace for guitar teachers. Lessons, students,
              songs, and progress — organised the way a working musician actually
              thinks.
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
              <BtnPrimary size="lg">
                Start free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </BtnPrimary>
              <BtnGhost size="lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
                Watch the 2-min tour
              </BtnGhost>
            </div>

            {/* Trust line */}
            <div style={{
              display:'flex', alignItems:'center', gap:14,
              color:'var(--ink-4)', fontSize:12.5,
            }}>
              <div style={{ display:'flex' }}>
                {students.slice(0,4).map((s,i)=>(
                  <div key={i} style={{
                    width:26, height:26, borderRadius:'50%',
                    background: s.color, color:'#fff',
                    display:'grid', placeItems:'center',
                    fontSize:10, fontWeight:600,
                    border:'2px solid var(--ivory)',
                    marginLeft: i === 0 ? 0 : -8,
                  }}>{s.avatar}</div>
                ))}
              </div>
              <span>Used by teachers in <span style={{ color:'var(--ink-2)', fontWeight:500 }}>3 countries</span> · 1,040 lessons tracked this month</span>
            </div>
          </div>

          {/* RIGHT — product shot */}
          <div style={{ position:'relative' }}>
            {/* gold glow */}
            <div style={{
              position:'absolute',
              inset:'-80px -40px -80px -40px',
              background:'radial-gradient(50% 55% at 55% 45%, var(--gold-tint), transparent 70%)',
              opacity:.9, pointerEvents:'none', zIndex:0,
            }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <BrowserFrame url="app.strummy.app/dashboard" height={420}>
                <HeroDashboard />
              </BrowserFrame>
            </div>

            {/* floating chord diagram */}
            <div style={{
              position:'absolute', left:-52, bottom:-44, zIndex:2,
              background:'var(--card)', border:'1px solid var(--rule)',
              borderRadius:12, padding:'12px 16px',
              boxShadow:'0 14px 30px -10px rgba(26,22,19,.18)',
              display:'flex', alignItems:'center', gap:14,
            }}>
              <ChordGrid name="G" size={44} color="var(--ink-2)" />
              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-4)', letterSpacing:'.14em', textTransform:'uppercase' }}>Today · 4:00p · Emma</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:16, fontStyle:'italic', lineHeight:1.1, marginTop:3 }}>Blackbird</div>
                <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3 }}>Fingerpicking · 10 min</div>
              </div>
            </div>

            {/* floating activity pill */}
            <div style={{
              position:'absolute', right:-24, top:-22, zIndex:2,
              background:'var(--card)', border:'1px solid var(--rule)',
              borderRadius:999, padding:'7px 14px 7px 7px',
              boxShadow:'0 14px 30px -10px rgba(26,22,19,.18)',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <Avatar s={students[4]} size={24} />
              <div style={{ fontSize:12, lineHeight:1.25 }}>
                <span style={{ fontWeight:500 }}>Maya</span>{' '}
                <span style={{ color:'var(--success)', fontWeight:500 }}>mastered</span>{' '}
                <span style={{ fontStyle:'italic', fontFamily:'var(--serif)' }}>Classical Gas</span>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>22m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LandingHero, HeroDashboard });
