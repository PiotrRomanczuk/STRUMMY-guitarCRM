// Song Form — Direction B — Music Manuscript (desktop).
// Editorial broadsheet, staff-line motifs, dark song-card preview, chord
// grids as real musical elements. Same fields and data as A.

const { useState: useStateB } = React;

const lblB = {
  fontSize:10, textTransform:'uppercase', letterSpacing:'.14em',
  color:'var(--ink-4)', fontFamily:'var(--mono)', marginBottom:6,
  display:'block',
};
const fieldB = {
  display:'block', width:'100%',
  padding:'10px 14px',
  background:'transparent',
  border:'none',
  borderBottom:'1px solid var(--rule)',
  borderRadius: 0,
  fontSize: 15,
  color:'var(--ink)',
  fontFamily:'var(--serif)',
  outline:'none',
};

const ManuscriptSection = ({ numeral, title, lead, children }) => (
  <div style={{ padding:'28px 0', borderTop:'1px solid var(--rule)' }}>
    <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:32 }}>
      <div>
        <div style={{
          fontFamily:'var(--mono)', fontSize:10,
          color:'var(--gold-2)', letterSpacing:'.18em',
          marginBottom:6,
        }}>{numeral}</div>
        <div style={{
          fontFamily:'var(--serif)', fontSize:22, fontWeight:400,
          letterSpacing:'-0.02em', lineHeight:1.1,
        }}>{title}</div>
        {lead && <div style={{
          fontSize:12, color:'var(--ink-3)', fontStyle:'italic',
          fontFamily:'var(--serif)', marginTop:8, lineHeight:1.45,
        }}>{lead}</div>}
      </div>
      <div>{children}</div>
    </div>
  </div>
);

const SongFormB = () => {
  const [title, setTitle] = useStateB('Hotel California');
  const [author, setAuthor] = useStateB('Eagles');
  const [level, setLevel] = useStateB('intermediate');

  return (
    <div className="app-viewport" style={{
      width:1440, height:1200, display:'flex',
      background:'var(--ivory)', color:'var(--ink)', fontSize:13,
      overflow:'hidden', borderRadius:14,
    }}>
      <SidebarNav active="songs" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <TopBar variant="B" />

        <div style={{ flex:1, overflowY:'auto', background:'var(--ivory)' }}>

          {/* Masthead */}
          <div style={{
            padding:'28px 48px 24px 48px',
            borderBottom:'1px solid var(--rule)',
            background:'var(--paper)',
            position:'relative',
          }}>
            <div style={{ position:'absolute', inset:0, opacity:.25, pointerEvents:'none' }}>
              <StaffLines width="100%" height={140} color="var(--ink-4)" strokeWidth={0.4} count={9} />
            </div>
            <div style={{ position:'relative' }}>
              <div style={{
                display:'flex', gap:12, alignItems:'center',
                fontFamily:'var(--mono)', fontSize:11,
                color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.2em',
                marginBottom:12,
              }}>
                <span>Library</span>
                <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--gold-2)' }} />
                <span style={{ color:'var(--gold-2)' }}>Composing an entry</span>
              </div>
              <h1 style={{
                margin:0, fontFamily:'var(--serif)', fontWeight:300,
                fontSize:60, letterSpacing:'-0.035em', lineHeight:.98,
              }}>
                A new <em style={{ fontStyle:'italic', fontWeight:400, color:'var(--gold-2)' }}>song</em>,
                transcribed.
              </h1>
              <div style={{ marginTop:10, fontFamily:'var(--serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-3)', maxWidth:520 }}>
                Begin with Spotify for a shortcut, or compose by hand. Four essentials,
                then as much or as little detail as you wish.
              </div>
            </div>
          </div>

          {/* Spotify wizard strip */}
          <div style={{
            margin:'20px 48px 0 48px',
            display:'flex', alignItems:'center', gap:14,
            padding:'14px 20px',
            background:'var(--ink)', color:'var(--paper)',
            borderRadius:12,
          }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#1db954', boxShadow:'0 0 0 4px #1db95433' }} />
            <span style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'.16em', color:'#1db954', fontWeight:600 }}>Spotify</span>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,.06)', borderRadius:8 }}>
              <Icon d={I.search} size={13} stroke="var(--ink-5)" />
              <span style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14 }}>Hotel California</span>
              <span style={{ color:'var(--ink-5)', fontSize:12 }}>— Eagles · 1976</span>
              <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:'#1db954' }}>MATCH ✓</span>
            </div>
            <span style={{
              fontFamily:'var(--mono)', fontSize:10,
              color:'var(--gold-dim)', textTransform:'uppercase', letterSpacing:'.14em',
            }}>Filled 8 fields</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:0, padding:'8px 48px 140px' }}>
            {/* LEFT: manuscript body */}
            <div>
              {/* I — Essentials */}
              <ManuscriptSection numeral="CANTO I" title="The essentials" lead="Four fields. Without these, the song cannot be saved in full.">
                <div style={{ marginBottom:24 }}>
                  <div style={lblB}>Title · required</div>
                  <input value={title} onChange={e=>setTitle(e.target.value)} style={{ ...fieldB, fontSize:28, fontStyle:'italic', fontWeight:400, letterSpacing:'-0.02em', paddingLeft:0 }} />
                </div>
                <div style={{ marginBottom:24 }}>
                  <div style={lblB}>Artist · required</div>
                  <input value={author} onChange={e=>setAuthor(e.target.value)} style={{ ...fieldB, fontSize:22, paddingLeft:0, fontWeight:400 }} />
                </div>

                {/* duplicate notice */}
                <div style={{
                  margin:'0 0 24px 0', padding:'12px 16px',
                  background:'transparent',
                  borderLeft:'3px solid var(--gold-2)',
                  fontFamily:'var(--serif)', fontSize:13, fontStyle:'italic',
                  color:'var(--ink-2)', lineHeight:1.5,
                }}>
                  <span style={{ color:'var(--gold-2)', fontWeight:600, fontStyle:'normal', fontFamily:'var(--mono)', fontSize:10, textTransform:'uppercase', letterSpacing:'.14em', display:'block', marginBottom:4 }}>A note</span>
                  A song by this title and artist already exists in your library. 
                  <a style={{ color:'var(--gold-2)', fontWeight:500, marginLeft:6, cursor:'pointer', fontStyle:'normal' }}>View existing →</a>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24 }}>
                  <div>
                    <div style={lblB}>Difficulty · required</div>
                    <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--rule)' }}>
                      {[
                        { v:'beginner',     l:'Beginner' },
                        { v:'intermediate', l:'Intermediate' },
                        { v:'advanced',     l:'Advanced' },
                      ].map(o => (
                        <button key={o.v} onClick={()=>setLevel(o.v)} style={{
                          flex:1, padding:'10px 4px',
                          border:'none', background:'transparent',
                          fontFamily:'var(--serif)', fontSize:14, fontStyle:'italic',
                          color: level === o.v ? 'var(--ink)' : 'var(--ink-4)',
                          fontWeight: level === o.v ? 600 : 400,
                          cursor:'pointer',
                          borderBottom: level === o.v ? '2px solid var(--gold-2)' : '2px solid transparent',
                          marginBottom:-1,
                        }}>{o.l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={lblB}>Key · required</div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:14, padding:'8px 0', borderBottom:'1px solid var(--rule)' }}>
                      <span style={{ fontFamily:'var(--serif)', fontSize:34, fontWeight:400, lineHeight:1, color:'var(--gold-2)' }}>B</span>
                      <span style={{ fontFamily:'var(--serif)', fontSize:20, fontStyle:'italic', color:'var(--ink-3)', fontWeight:400 }}>minor</span>
                      <Icon d={I.chevronD} size={14} style={{ color:'var(--ink-4)', marginLeft:'auto' }} />
                    </div>
                  </div>
                  <div>
                    <div style={lblB}>Category</div>
                    <input style={{ ...fieldB, fontSize:18, paddingLeft:0 }} defaultValue="Rock" />
                  </div>
                </div>
              </ManuscriptSection>

              {/* II — Musical */}
              <ManuscriptSection numeral="CANTO II" title="Musical details" lead="How the piece moves.">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24, marginBottom:28 }}>
                  {[
                    { l:'Capo',   v:'7',   u:'fr' },
                    { l:'Tempo',  v:'75',  u:'♩' },
                    { l:'Meter',  v:'4/4', u:'' },
                    { l:'Year',   v:'1976',u:'' },
                  ].map(f=>(
                    <div key={f.l} style={{ borderLeft:'1px solid var(--rule)', paddingLeft:14, paddingTop:4 }}>
                      <div style={lblB}>{f.l}</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        {f.u === '♩' && <span style={{ fontFamily:'var(--serif)', fontSize:22, color:'var(--ink-3)' }}>♩</span>}
                        <span style={{ fontFamily:'var(--serif)', fontSize:36, fontWeight:300, letterSpacing:'-0.02em', color:'var(--ink)' }}>{f.v}</span>
                        {f.u && f.u !== '♩' && <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{f.u}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={lblB}>Chords</div>
                <div style={{
                  display:'flex', gap:18, padding:'14px 0 18px 0',
                  borderBottom:'1px solid var(--rule)', overflow:'hidden',
                }}>
                  {['Bm','F#','A','E','G','D','Em','F#7'].map(c=>(
                    <ChordGrid key={c} name={c} size={52} color="var(--ink-2)" />
                  ))}
                  <div style={{
                    width:52, height:52*1.28, borderRadius:8,
                    border:'1.5px dashed var(--rule)',
                    display:'grid', placeItems:'center',
                    color:'var(--ink-4)', fontSize:18, cursor:'pointer',
                    alignSelf:'flex-end',
                  }}>+</div>
                </div>

                <div style={{ marginTop:22 }}>
                  <div style={lblB}>Strumming pattern</div>
                  <div style={{
                    display:'flex', gap:10, alignItems:'center',
                    padding:'14px 0 18px 0',
                    borderBottom:'1px solid var(--rule)',
                  }}>
                    {[
                      { s:'D',dur:1 },{ s:'D',dur:1 },{ s:'U',dur:0.5 },{ s:'U',dur:0.5 },
                      { s:'D',dur:1 },{ s:'U',dur:0.5 },
                    ].map((n,i)=>(
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <span style={{
                          fontFamily:'var(--serif)', fontSize: n.s === 'D' ? 30 : 22, fontWeight:400,
                          color: n.s === 'D' ? 'var(--ink)' : 'var(--gold-2)',
                          lineHeight:1,
                        }}>{n.s === 'D' ? '↓' : '↑'}</span>
                        <span style={{
                          fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-4)',
                          letterSpacing:'.1em',
                        }}>{n.s}</span>
                      </div>
                    ))}
                    <button style={{
                      marginLeft:'auto', padding:'4px 10px',
                      border:'1px solid var(--rule)', background:'var(--card)',
                      borderRadius:6, fontSize:11, fontFamily:'var(--mono)', cursor:'pointer', color:'var(--ink-3)',
                    }}>EDIT PATTERN</button>
                  </div>
                </div>
              </ManuscriptSection>

              {/* III — Resources */}
              <ManuscriptSection numeral="CANTO III" title="External references" lead="Links to the outside world.">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
                  {[
                    { label:'YouTube',        color:'#ff0000', val:'youtube.com/watch?v=EqPtz…', filled:true  },
                    { label:'Spotify',        color:'#1db954', val:'open.spotify.com/track/40ri…', filled:true  },
                    { label:'Ultimate Guitar',color:'#f58220', val:'',                          filled:false },
                    { label:'TikTok',         color:'#1a1613', val:'',                          filled:false },
                  ].map(r => (
                    <div key={r.label}>
                      <div style={{ ...lblB, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:r.color }} />
                        {r.label}
                      </div>
                      <div style={{ borderBottom:'1px solid var(--rule)', padding:'8px 0' }}>
                        {r.filled ? (
                          <span style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--ink-2)' }}>{r.val}</span>
                        ) : (
                          <span style={{ fontFamily:'var(--serif)', fontSize:13, fontStyle:'italic', color:'var(--ink-4)' }}>— paste a URL here</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ManuscriptSection>

              {/* IV — Rich content */}
              <ManuscriptSection numeral="CANTO IV" title="Lyrics &amp; notes" lead="The body of the work.">
                <div style={{ marginBottom:24 }}>
                  <div style={lblB}>Lyrics, with chord symbols</div>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:12, lineHeight:1.85,
                    whiteSpace:'pre-wrap',
                    padding:'14px 16px',
                    background:'var(--paper)',
                    border:'1px solid var(--rule)',
                    borderRadius:8,
                    minHeight:140,
                  }}>
<div><span style={{ color:'var(--gold-2)' }}>[Intro: Bm · F# · A · E · G · D · Em · F#7]</span></div>
<div>&nbsp;</div>
<div><span style={{ color:'var(--gold-2)' }}>Bm</span>{'                  '}<span style={{ color:'var(--gold-2)' }}>F#</span></div>
<div style={{ color:'var(--ink-2)' }}>On a dark desert highway, cool wind in my hair</div>
<div><span style={{ color:'var(--gold-2)' }}>A</span>{'                      '}<span style={{ color:'var(--gold-2)' }}>E</span></div>
<div style={{ color:'var(--ink-2)' }}>Warm smell of colitas, rising up through the air…</div>
                  </div>
                </div>

                <div style={{ marginBottom:24 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={lblB}>Teaching notes</div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button style={{
                        padding:'5px 11px', fontSize:11,
                        border:'1px solid var(--gold-dim)', background:'transparent',
                        color:'var(--gold-2)', fontWeight:500, cursor:'pointer',
                        borderRadius:999,
                        display:'flex', alignItems:'center', gap:5,
                        fontFamily:'var(--mono)', letterSpacing:'.08em', textTransform:'uppercase',
                      }}>
                        <Icon d={I.spark} size={10} stroke="var(--gold-2)" />
                        Generate
                      </button>
                      <button style={{
                        padding:'5px 11px', fontSize:11,
                        border:'1px solid var(--rule)', background:'transparent',
                        color:'var(--ink-3)', cursor:'pointer',
                        borderRadius:999,
                        fontFamily:'var(--mono)', letterSpacing:'.08em', textTransform:'uppercase',
                      }}>Enhance</button>
                    </div>
                  </div>
                  <div style={{
                    padding:'12px 16px', marginTop:6,
                    background:'var(--gold-tint)', border:'1px solid var(--gold-dim)',
                    borderRadius:8,
                    fontFamily:'var(--serif)', fontSize:14, fontStyle:'italic',
                    color:'var(--ink-2)', lineHeight:1.55,
                  }}>
                    This piece is a rite of passage for intermediate players — the arpeggiated
                    intro demands clean fretting through Bm and F#. Watch for tension in the
                    fretting hand on the F# barre…
                    <span style={{
                      display:'inline-block', width:2, height:14, background:'var(--gold-2)',
                      verticalAlign:'middle', marginLeft:4, animation:'blink 1s infinite',
                    }} />
                  </div>
                </div>

                <div>
                  <div style={lblB}>Gallery</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <div style={{
                      width:100, height:100, borderRadius:6,
                      background:'linear-gradient(135deg, #b84a3a, #c89523)',
                      position:'relative',
                      display:'grid', placeItems:'center',
                      color:'#fff', fontFamily:'var(--serif)', fontSize:26,
                    }}>
                      HC
                      <span style={{
                        position:'absolute', top:6, left:6, fontSize:13, color:'var(--gold-dim)',
                      }}>★</span>
                    </div>
                    {[1,2].map(i=>(
                      <div key={i} style={{
                        width:100, height:100, borderRadius:6,
                        background:'var(--rule-2)',
                        display:'grid', placeItems:'center',
                        fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)',
                      }}>IMG</div>
                    ))}
                    <button style={{
                      width:100, height:100, borderRadius:6,
                      border:'1.5px dashed var(--rule)',
                      background:'transparent', color:'var(--ink-4)',
                      fontSize:11, cursor:'pointer',
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                      fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.1em',
                    }}>
                      <Icon d={I.plus} size={14} />
                      Add
                    </button>
                  </div>
                </div>
              </ManuscriptSection>
            </div>

            {/* RIGHT: sticky score-card preview */}
            <div style={{ position:'sticky', top:20, alignSelf:'flex-start', paddingLeft:32 }}>
              <div style={{
                background:'var(--ink)', color:'var(--paper)',
                borderRadius:14, overflow:'hidden',
                position:'relative',
              }}>
                <div style={{ position:'absolute', inset:0, opacity:.06, pointerEvents:'none' }}>
                  <StaffLines width="100%" height={500} color="var(--paper)" count={13} strokeWidth={0.5} />
                </div>
                <div style={{
                  aspectRatio:'1', width:'100%',
                  background:'linear-gradient(135deg, #b84a3a, #c89523)',
                  position:'relative',
                  display:'grid', placeItems:'center',
                  color:'#fff', fontFamily:'var(--serif)', fontSize:56,
                }}>
                  HC
                  <span style={{
                    position:'absolute', top:12, left:12,
                    fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.14em',
                    color:'var(--gold-dim)', textTransform:'uppercase',
                  }}>Cover · preview</span>
                </div>
                <div style={{ padding:'18px 20px 20px 20px', position:'relative' }}>
                  <div style={{
                    fontFamily:'var(--serif)', fontSize:26, fontStyle:'italic', fontWeight:400,
                    letterSpacing:'-0.02em', lineHeight:1.05,
                  }}>{title}</div>
                  <div style={{ color:'var(--ink-5)', fontSize:13, marginTop:6, fontFamily:'var(--serif)' }}>— {author}, 1976</div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.15)' }}>
                    {[
                      { l:'KEY',v:'Bm' },{ l:'CAPO',v:'7fr' },{ l:'♩',v:'75' },{ l:'LEVEL',v:'INT' },
                    ].map((m,i)=>(
                      <div key={i} style={{ borderRight: i<3 ? '1px solid rgba(255,255,255,.15)' : 'none', paddingLeft: i===0 ? 0 : 10 }}>
                        <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-5)', letterSpacing:'.12em' }}>{m.l}</div>
                        <div style={{ fontFamily:'var(--serif)', fontSize:18, fontWeight:400, marginTop:2 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', gap:8, marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.15)' }}>
                    {['Bm','F#','A','E','G'].map(c => (
                      <ChordGrid key={c} name={c} size={34} color="var(--gold-dim)" />
                    ))}
                  </div>
                </div>
              </div>

              {/* actions */}
              <div style={{
                marginTop:14, padding:'16px 20px',
                background:'var(--card)', border:'1px solid var(--rule)',
                borderRadius:14,
              }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', letterSpacing:'.14em', marginBottom:10 }}>COMPLETION · 14 / 18</div>
                <div style={{ height:4, background:'var(--rule-2)', borderRadius:999, overflow:'hidden', marginBottom:14 }}>
                  <div style={{ height:'100%', width:'78%', background:'linear-gradient(90deg, var(--gold-2), var(--gold))' }} />
                </div>
                <button style={{
                  width:'100%', padding:'12px',
                  background:'var(--ink)', color:'var(--paper)', border:'none',
                  borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  marginBottom:8,
                }}>
                  <Icon d={I.check} size={13} stroke="var(--paper)" />
                  Create song
                </button>
                <button style={{
                  width:'100%', padding:'10px',
                  background:'transparent', color:'var(--ink-2)',
                  border:'1px solid var(--rule)',
                  borderRadius:8, fontSize:12, cursor:'pointer',
                }}>Save as draft</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile wizard variant
const SongFormMobile = () => {
  const [step, setStep] = useStateB(1);
  const steps = [
    { n:1, label:'Essentials' },
    { n:2, label:'Resources' },
    { n:3, label:'Musical' },
    { n:4, label:'Content' },
  ];

  return (
    <div className="app-viewport" style={{
      width:390, height:844, display:'flex', flexDirection:'column',
      background:'var(--ivory)', color:'var(--ink)', fontSize:13,
      overflow:'hidden', borderRadius:32,
      border:'8px solid #0a0807',
      boxShadow:'0 10px 40px rgba(0,0,0,.2)',
    }}>
      {/* status bar */}
      <div style={{ height:44, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', fontFamily:'var(--mono)', fontSize:13, fontWeight:600, flex:'0 0 44px' }}>
        <span>4:23</span>
        <span style={{ display:'flex', gap:4, alignItems:'center' }}>
          <span style={{ width:16, height:10, borderRadius:2, border:'1px solid var(--ink)', position:'relative' }}>
            <span style={{ position:'absolute', inset:1, background:'var(--ink)', borderRadius:1, width:'80%' }} />
          </span>
        </span>
      </div>

      {/* header */}
      <div style={{ padding:'6px 20px 16px 20px', borderBottom:'1px solid var(--rule)', background:'var(--paper)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <button style={{ border:'none', background:'transparent', fontFamily:'var(--serif)', fontSize:14, color:'var(--ink-3)', cursor:'pointer', padding:0 }}>Cancel</button>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', letterSpacing:'.14em' }}>NEW SONG</div>
          <button style={{ border:'none', background:'transparent', fontSize:12, color:'var(--gold-2)', fontWeight:500, cursor:'pointer', padding:0 }}>Draft</button>
        </div>
        <h2 style={{
          margin:0, fontFamily:'var(--serif)', fontWeight:400,
          fontSize:26, letterSpacing:'-0.02em', lineHeight:1,
        }}>
          <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>Canto {['I','II','III','IV'][step-1]}</em> · {steps[step-1].label}
        </h2>
        {/* stepper */}
        <div style={{ display:'flex', gap:4, marginTop:14 }}>
          {steps.map(s=>(
            <div key={s.n} onClick={()=>setStep(s.n)} style={{
              flex:1, height:4, borderRadius:2, cursor:'pointer',
              background: s.n === step ? 'var(--gold-2)' : s.n < step ? 'var(--ink-2)' : 'var(--rule-2)',
            }} />
          ))}
        </div>
      </div>

      {/* content */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
        {step === 1 && (
          <>
            {/* Spotify */}
            <div style={{
              padding:'10px 14px', background:'var(--ink)', color:'var(--paper)',
              borderRadius:10, display:'flex', alignItems:'center', gap:10, marginBottom:22,
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#1db954' }} />
              <span style={{ fontSize:12, flex:1, color:'var(--ink-5)' }}>Search Spotify…</span>
              <Icon d={I.search} size={13} stroke="var(--ink-5)" />
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={lblB}>Title · required</div>
              <input defaultValue="Hotel California" style={{ ...fieldB, fontSize:22, fontStyle:'italic', paddingLeft:0 }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={lblB}>Artist · required</div>
              <input defaultValue="Eagles" style={{ ...fieldB, fontSize:18, paddingLeft:0 }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={lblB}>Difficulty · required</div>
              <div style={{ display:'flex', gap:2, borderBottom:'1px solid var(--rule)' }}>
                {['Beg','Int','Adv'].map((l,i)=>(
                  <button key={l} style={{
                    flex:1, padding:'10px 4px',
                    border:'none', background:'transparent',
                    fontFamily:'var(--serif)', fontSize:13, fontStyle:'italic',
                    color: i===1 ? 'var(--ink)' : 'var(--ink-4)',
                    fontWeight: i===1 ? 600 : 400,
                    borderBottom: i===1 ? '2px solid var(--gold-2)' : 'none',
                    marginBottom:-1,
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <div style={lblB}>Key</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:8, padding:'8px 0', borderBottom:'1px solid var(--rule)' }}>
                  <span style={{ fontFamily:'var(--serif)', fontSize:28, color:'var(--gold-2)' }}>B</span>
                  <span style={{ fontFamily:'var(--serif)', fontSize:15, fontStyle:'italic', color:'var(--ink-3)' }}>minor</span>
                </div>
              </div>
              <div>
                <div style={lblB}>Category</div>
                <input defaultValue="Rock" style={{ ...fieldB, fontSize:16, paddingLeft:0 }} />
              </div>
            </div>
          </>
        )}

        {step !== 1 && (
          <div style={{ padding:'40px 0', textAlign:'center', color:'var(--ink-4)' }}>
            <div style={{ fontFamily:'var(--serif)', fontSize:18, fontStyle:'italic', marginBottom:6 }}>Canto {['II','III','IV'][step-2]}</div>
            <div style={{ fontSize:12 }}>Tap back to continue with Essentials</div>
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{
        flex:'0 0 auto', padding:'14px 20px 24px 20px',
        borderTop:'1px solid var(--rule)', background:'var(--paper)',
        display:'flex', gap:10,
      }}>
        <button disabled={step===1} onClick={()=>setStep(Math.max(1,step-1))} style={{
          padding:'12px 18px', border:'1px solid var(--rule)', background:'var(--card)',
          borderRadius:10, fontSize:13, cursor: step===1 ? 'default' : 'pointer',
          color: step===1 ? 'var(--ink-4)' : 'var(--ink-2)', opacity: step===1 ? .5 : 1,
        }}>← Back</button>
        <button onClick={()=>setStep(Math.min(4,step+1))} style={{
          flex:1, padding:'12px 16px', border:'none', background:'var(--ink)',
          color:'var(--paper)', borderRadius:10, fontSize:13, cursor:'pointer',
          fontWeight:500,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          {step === 4 ? <><Icon d={I.check} size={13} stroke="var(--paper)" /> Create</> : <>Next <Icon d={I.arrowRt} size={13} stroke="var(--paper)" /></>}
        </button>
      </div>
    </div>
  );
};

window.SongFormB = SongFormB;
window.SongFormMobile = SongFormMobile;
