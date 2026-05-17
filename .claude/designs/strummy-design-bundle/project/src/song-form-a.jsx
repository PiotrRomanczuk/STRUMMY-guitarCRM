// Song Form — Direction A — Editorial single-page (desktop).
// Matches Dashboard A: gold accent, serif display, clean fields, subtle staff accents.

const { useState: useStateA } = React;

const FIELD_STYLE = {
  display:'block', width:'100%',
  padding:'9px 12px',
  background:'var(--card)',
  border:'1px solid var(--rule)',
  borderRadius: 8,
  fontSize: 13,
  color:'var(--ink)',
  fontFamily:'var(--sans)',
  outline:'none',
  transition:'border-color .15s, box-shadow .15s',
};
const LABEL_STYLE = {
  display:'block',
  fontSize:11, textTransform:'uppercase', letterSpacing:'.12em',
  color:'var(--ink-3)', fontWeight:500, marginBottom:6,
};

const FieldA = ({ label, required, hint, children, width }) => (
  <div style={{ width }}>
    <div style={{ ...LABEL_STYLE, display:'flex', alignItems:'center', gap:4 }}>
      {label}{required && <span style={{ color:'var(--gold-2)' }}>*</span>}
    </div>
    {children}
    {hint && <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:4, fontStyle:'italic' }}>{hint}</div>}
  </div>
);

const SectionA = ({ numeral, title, count, populated, defaultOpen = true, children }) => {
  const [open, setOpen] = useStateA(defaultOpen);
  return (
    <div style={{
      background:'var(--card)',
      border:'1px solid var(--rule)',
      borderRadius: 14,
      marginBottom: 16,
      overflow:'hidden',
    }}>
      <div onClick={()=>setOpen(!open)} style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'16px 22px',
        cursor:'pointer',
        borderBottom: open ? '1px solid var(--rule)' : 'none',
      }}>
        <div style={{
          fontFamily:'var(--mono)', fontSize:10,
          color:'var(--ink-4)', letterSpacing:'.14em',
        }}>{numeral}</div>
        <div style={{ flex:1, fontFamily:'var(--serif)', fontSize:18, fontWeight:500, letterSpacing:'-0.01em' }}>
          {title}
        </div>
        {populated != null && (
          <span style={{
            fontSize:11, padding:'2px 8px', borderRadius:999,
            background: populated > 0 ? 'var(--gold-tint)' : 'var(--rule-2)',
            color: populated > 0 ? 'var(--gold-2)' : 'var(--ink-4)',
            fontFamily:'var(--mono)',
          }}>{populated}/{count}</span>
        )}
        <Icon d={open ? I.chevronD : I.chevron} size={14} style={{ color:'var(--ink-4)' }} />
      </div>
      {open && <div style={{ padding:'18px 22px 22px 22px' }}>{children}</div>}
    </div>
  );
};

const SongFormA = () => {
  const [title, setTitle] = useStateA('Hotel California');
  const [author, setAuthor] = useStateA('Eagles');
  const [level, setLevel] = useStateA('intermediate');
  const [key, setKey] = useStateA('Bm');
  const [capo, setCapo] = useStateA(7);
  const [tempo, setTempo] = useStateA(75);

  return (
    <div className="app-viewport" style={{
      width:1440, height:1200, display:'flex',
      background:'var(--ivory)', color:'var(--ink)', fontSize:13,
      overflow:'hidden', borderRadius:14,
    }}>
      <SidebarNav active="songs" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <TopBar variant="A" />

        <div style={{ flex:1, overflowY:'auto', padding:'28px 40px 120px', background:'var(--ivory)' }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--ink-4)', fontSize:12, fontFamily:'var(--mono)', marginBottom:14 }}>
            <span>Songs</span>
            <Icon d={I.chevron} size={11} />
            <span style={{ color:'var(--ink-2)' }}>New song</span>
          </div>

          {/* Title row */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
            <div>
              <h1 style={{
                margin:0, fontFamily:'var(--serif)', fontWeight:400,
                fontSize:40, letterSpacing:'-0.02em', lineHeight:1,
              }}>
                Add a <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>song</em>.
              </h1>
              <div style={{ color:'var(--ink-3)', fontSize:14, marginTop:8, maxWidth:520 }}>
                Search Spotify to auto-fill, or enter manually. Only title, artist, level and key are required.
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button style={{
                padding:'8px 14px', borderRadius:8,
                border:'1px solid var(--rule)', background:'var(--card)',
                color:'var(--ink-2)', fontSize:13, cursor:'pointer',
              }}>Cancel</button>
              <button style={{
                padding:'8px 14px', borderRadius:8,
                border:'1px solid var(--rule)', background:'var(--card)',
                color:'var(--ink-2)', fontSize:13, cursor:'pointer', fontWeight:500,
              }}>Save draft</button>
              <button style={{
                padding:'8px 16px', borderRadius:8, border:'none',
                background:'var(--ink)', color:'var(--paper)',
                fontSize:13, cursor:'pointer', fontWeight:500,
                display:'flex', alignItems:'center', gap:6,
              }}>
                <Icon d={I.check} size={13} stroke="var(--paper)" />
                Create song
              </button>
            </div>
          </div>

          {/* Spotify accelerator */}
          <div style={{
            background:'linear-gradient(180deg, #1db9541a 0%, var(--card) 80%)',
            border:'1px solid #1db95440',
            borderRadius:14, padding:'16px 20px',
            marginBottom:22,
            position:'relative',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#1db954', boxShadow:'0 0 0 3px #1db95422' }} />
              <span style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', color:'#1db954', fontWeight:600 }}>Spotify accelerator</span>
              <span style={{ fontSize:11, color:'var(--ink-4)', fontStyle:'italic' }}>— auto-fills 8 fields</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{
                flex:1, display:'flex', alignItems:'center', gap:10,
                padding:'10px 14px', background:'var(--card)',
                border:'1px solid var(--rule)', borderRadius:8,
              }}>
                <Icon d={I.search} size={14} stroke="var(--ink-4)" />
                <span style={{ color:'var(--ink-2)', fontSize:14 }}>Hotel California</span>
                <span style={{ color:'var(--ink-4)', fontSize:13 }}>— Eagles</span>
                <span style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:'#1db954' }}>✓ matched</span>
              </div>
              <button style={{
                padding:'10px 16px', background:'#1db954', color:'#fff', border:'none',
                borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
              }}>Search again</button>
            </div>
            {/* matched result */}
            <div style={{
              marginTop:10, display:'flex', alignItems:'center', gap:12,
              padding:'10px', background:'var(--card)',
              border:'1px solid var(--rule)', borderRadius:8,
            }}>
              <div style={{
                width:40, height:40, borderRadius:4,
                background:'linear-gradient(135deg, #b84a3a, #c89523)',
                display:'grid', placeItems:'center', color:'#fff',
                fontFamily:'var(--serif)', fontSize:14, fontWeight:500,
              }}>HC</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>Hotel California <span style={{ color:'var(--ink-4)', fontWeight:400 }}>· Eagles</span></div>
                <div style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>1976 · HOTEL CALIFORNIA · 6:31</div>
              </div>
              <span style={{ padding:'3px 8px', borderRadius:999, background:'var(--gold-tint)', color:'var(--gold-2)', fontSize:11, fontFamily:'var(--mono)' }}>AUTO-FILLED</span>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
            {/* LEFT — fields */}
            <div>
              {/* Essentials */}
              <SectionA numeral="I · ESSENTIALS" title="The basics" count={4} populated={4}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <FieldA label="Title" required>
                    <input style={{ ...FIELD_STYLE, background:'var(--gold-tint)', borderColor:'var(--gold-dim)' }} value={title} onChange={e=>setTitle(e.target.value)} />
                  </FieldA>
                  <FieldA label="Artist / Author" required>
                    <input style={{ ...FIELD_STYLE, background:'var(--gold-tint)', borderColor:'var(--gold-dim)' }} value={author} onChange={e=>setAuthor(e.target.value)} />
                  </FieldA>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                  <FieldA label="Difficulty" required>
                    <div style={{ display:'flex', gap:6 }}>
                      {['beginner','intermediate','advanced'].map(v => (
                        <button key={v} onClick={()=>setLevel(v)} style={{
                          flex:1, padding:'8px', fontSize:11,
                          borderRadius:8, cursor:'pointer',
                          border:'1px solid var(--rule)',
                          background: level === v ? 'var(--ink)' : 'var(--card)',
                          color: level === v ? 'var(--paper)' : 'var(--ink-3)',
                          textTransform:'capitalize',
                          fontWeight: level === v ? 500 : 400,
                        }}>{v}</button>
                      ))}
                    </div>
                  </FieldA>
                  <FieldA label="Musical key" required>
                    <select value={key} onChange={e=>setKey(e.target.value)} style={{ ...FIELD_STYLE, background:'var(--gold-tint)', borderColor:'var(--gold-dim)', fontFamily:'var(--mono)' }}>
                      <optgroup label="Major">
                        {['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'].map(k=><option key={k}>{k}</option>)}
                      </optgroup>
                      <optgroup label="Minor">
                        {['Am','Bm','Cm','Dm','Em','Fm','Gm'].map(k=><option key={k}>{k}</option>)}
                      </optgroup>
                    </select>
                  </FieldA>
                  <FieldA label="Category" hint="Type to create new">
                    <input style={FIELD_STYLE} placeholder="Folk (5), Rock (23)..." defaultValue="Rock (23)" />
                  </FieldA>
                </div>

                {/* Duplicate warning */}
                <div style={{
                  marginTop:14, padding:'10px 14px',
                  background:'#c8952312', border:'1px solid var(--gold-dim)',
                  borderRadius:8,
                  display:'flex', alignItems:'flex-start', gap:10,
                  fontSize:12,
                }}>
                  <span style={{ color:'var(--gold-2)', fontSize:14, marginTop:1 }}>⚠</span>
                  <div style={{ color:'var(--ink-2)' }}>
                    A song called <em style={{ fontStyle:'italic' }}>"Hotel California"</em> by Eagles already exists.
                    You can still save if this is a different arrangement.
                  </div>
                  <a style={{ color:'var(--gold-2)', fontSize:12, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>View existing →</a>
                </div>
              </SectionA>

              {/* External resources */}
              <SectionA numeral="II · RESOURCES" title="External links" count={4} populated={2}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[
                    { label:'YouTube URL',      color:'#ff0000', val:'youtube.com/watch?v=EqP…' },
                    { label:'Spotify link',     color:'#1db954', val:'open.spotify.com/track/40ri…', auto:true },
                    { label:'Ultimate Guitar',  color:'#f58220', val:'' },
                    { label:'TikTok short',     color:'#1a1613', val:'' },
                  ].map((r,i)=>(
                    <FieldA key={i} label={r.label}>
                      <div style={{ position:'relative' }}>
                        <span style={{
                          position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
                          width:8, height:8, borderRadius:'50%', background:r.color,
                          boxShadow:`0 0 0 3px ${r.color}22`,
                        }} />
                        <input style={{
                          ...FIELD_STYLE,
                          paddingLeft:30,
                          background: r.auto ? 'var(--gold-tint)' : 'var(--card)',
                          borderColor: r.auto ? 'var(--gold-dim)' : 'var(--rule)',
                          fontFamily:'var(--mono)', fontSize:12,
                        }} placeholder="https://…" defaultValue={r.val} />
                      </div>
                    </FieldA>
                  ))}
                </div>
              </SectionA>

              {/* Musical details */}
              <SectionA numeral="III · MUSICAL" title="Performance details" count={6} populated={6}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:16 }}>
                  <FieldA label="Capo fret" hint="0–20">
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button style={{ width:28, height:28, border:'1px solid var(--rule)', background:'var(--card)', borderRadius:8, cursor:'pointer', color:'var(--ink-3)' }}>−</button>
                      <div style={{
                        flex:1, textAlign:'center',
                        fontFamily:'var(--serif)', fontSize:22, fontWeight:500,
                        padding:'3px 0',
                        background:'var(--gold-tint)', borderRadius:8,
                        border:'1px solid var(--gold-dim)',
                        color:'var(--gold-2)',
                      }}>{capo}</div>
                      <button style={{ width:28, height:28, border:'1px solid var(--rule)', background:'var(--card)', borderRadius:8, cursor:'pointer', color:'var(--ink-3)' }}>+</button>
                    </div>
                  </FieldA>
                  <FieldA label="Tempo (BPM)">
                    <input style={{ ...FIELD_STYLE, background:'var(--gold-tint)', borderColor:'var(--gold-dim)', fontFamily:'var(--mono)' }} defaultValue={tempo} />
                  </FieldA>
                  <FieldA label="Time sig">
                    <input style={{ ...FIELD_STYLE, background:'var(--gold-tint)', borderColor:'var(--gold-dim)', fontFamily:'var(--mono)' }} defaultValue="4/4" />
                  </FieldA>
                  <FieldA label="Release year">
                    <input style={{ ...FIELD_STYLE, background:'var(--gold-tint)', borderColor:'var(--gold-dim)', fontFamily:'var(--mono)' }} defaultValue="1976" />
                  </FieldA>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <FieldA label="Strumming pattern" hint='e.g. "D DU UDU"'>
                    <div style={{ display:'flex', gap:4, padding:'8px 12px', border:'1px solid var(--rule)', borderRadius:8, background:'var(--card)' }}>
                      {['D','_','D','U','_','U','D','U'].map((s,i)=>(
                        <span key={i} style={{
                          width:24, height:24, borderRadius:6,
                          display:'grid', placeItems:'center',
                          fontFamily:'var(--mono)', fontSize:11, fontWeight:600,
                          background: s === '_' ? 'transparent' : s === 'D' ? 'var(--ink)' : 'var(--gold-2)',
                          color: s === '_' ? 'var(--ink-4)' : '#fff',
                          border: s === '_' ? '1px dashed var(--rule)' : 'none',
                        }}>{s === '_' ? '·' : s}</span>
                      ))}
                      <button style={{
                        marginLeft:'auto', padding:'3px 8px', borderRadius:6,
                        border:'1px solid var(--rule)', background:'var(--card)',
                        fontSize:11, cursor:'pointer', color:'var(--ink-3)',
                      }}>Edit</button>
                    </div>
                  </FieldA>
                  <FieldA label="Chords" hint="Space-separated">
                    <div style={{ display:'flex', gap:6, padding:'8px 12px', border:'1px solid var(--rule)', borderRadius:8, background:'var(--card)', flexWrap:'wrap' }}>
                      {['Bm','F#','A','E','G','D','Em','F#7'].map(c=>(
                        <span key={c} style={{
                          fontFamily:'var(--mono)', fontSize:11, fontWeight:500,
                          padding:'2px 8px', borderRadius:999,
                          background:'var(--rule-2)', color:'var(--ink-2)',
                        }}>{c}</span>
                      ))}
                      <span style={{
                        fontSize:13, color:'var(--ink-4)', fontFamily:'var(--mono)',
                        borderLeft:'1px solid var(--rule)', paddingLeft:8,
                      }}>+</span>
                    </div>
                  </FieldA>
                </div>
              </SectionA>

              {/* Rich content */}
              <SectionA numeral="IV · CONTENT" title="Lyrics, notes & images" count={4} populated={2}>
                <div style={{ marginBottom:16 }}>
                  <FieldA label="Lyrics with chords" hint="Monospace — chords align over lyrics">
                    <textarea style={{
                      ...FIELD_STYLE,
                      fontFamily:'var(--mono)', fontSize:12, lineHeight:1.7,
                      minHeight:140, resize:'vertical',
                    }} defaultValue={`[Intro: Bm · F# · A · E · G · D · Em · F#7]

Bm                  F#
On a dark desert highway, cool wind in my hair
A                      E
Warm smell of colitas, rising up through the air
G                  D
Up ahead in the distance, I saw a shimmering light…`} />
                  </FieldA>
                </div>

                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ ...LABEL_STYLE, marginBottom:0 }}>Teaching notes</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={{
                        padding:'4px 10px', fontSize:11, borderRadius:6,
                        border:'1px solid var(--gold-dim)', background:'var(--gold-tint)',
                        color:'var(--gold-2)', fontWeight:500, cursor:'pointer',
                        display:'flex', alignItems:'center', gap:5,
                      }}>
                        <Icon d={I.spark} size={11} stroke="var(--gold-2)" />
                        Generate
                      </button>
                      <button style={{
                        padding:'4px 10px', fontSize:11, borderRadius:6,
                        border:'1px solid var(--rule)', background:'var(--card)',
                        color:'var(--ink-3)', cursor:'pointer',
                      }}>Enhance</button>
                    </div>
                  </div>
                  <textarea style={{
                    ...FIELD_STYLE, minHeight:100, resize:'vertical', fontSize:13, lineHeight:1.5,
                  }} placeholder="Teaching notes about technique, common mistakes, practice tips…" />
                </div>

                <FieldA label="Images">
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
                    <div style={{
                      aspectRatio:'1', borderRadius:8,
                      background:'linear-gradient(135deg, #b84a3a, #c89523)',
                      position:'relative',
                      display:'grid', placeItems:'center',
                      color:'#fff', fontFamily:'var(--serif)', fontSize:20,
                    }}>
                      HC
                      <span style={{
                        position:'absolute', top:6, left:6,
                        padding:'2px 6px', background:'rgba(0,0,0,.6)', color:'var(--gold-dim)',
                        borderRadius:4, fontSize:9, fontFamily:'var(--mono)', letterSpacing:'.08em',
                      }}>★ COVER</span>
                    </div>
                    {[1,2].map(i=>(
                      <div key={i} style={{
                        aspectRatio:'1', borderRadius:8,
                        background:'var(--rule-2)',
                        display:'grid', placeItems:'center',
                        color:'var(--ink-4)', fontSize:11, fontFamily:'var(--mono)',
                      }}>IMG</div>
                    ))}
                    <button style={{
                      aspectRatio:'1', borderRadius:8,
                      border:'1.5px dashed var(--rule)', background:'transparent',
                      color:'var(--ink-4)', fontSize:11, cursor:'pointer',
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                    }}>
                      <Icon d={I.plus} size={14} />
                      Add
                    </button>
                  </div>
                </FieldA>
              </SectionA>
            </div>

            {/* RIGHT — live preview */}
            <div style={{ position:'sticky', top:0, alignSelf:'flex-start' }}>
              <div style={{
                background:'var(--card)', border:'1px solid var(--rule)',
                borderRadius:14, padding:'20px', marginBottom:14,
              }}>
                <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500, marginBottom:12 }}>Preview</div>
                <div style={{
                  aspectRatio:'1', width:'100%',
                  borderRadius:10,
                  background:'linear-gradient(135deg, #b84a3a, #c89523)',
                  display:'grid', placeItems:'center', color:'#fff',
                  fontFamily:'var(--serif)', fontSize:36,
                  marginBottom:14,
                  boxShadow:'inset 0 -3px 0 rgba(0,0,0,.25)',
                }}>HC</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:20, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.01em', lineHeight:1.15 }}>
                  {title}
                </div>
                <div style={{ color:'var(--ink-3)', fontSize:13, marginTop:4 }}>— {author}</div>
                <div style={{
                  marginTop:12, paddingTop:12, borderTop:'1px solid var(--rule)',
                  display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:11,
                  fontFamily:'var(--mono)',
                }}>
                  <div><span style={{ color:'var(--ink-4)' }}>KEY</span> <span style={{ color:'var(--ink)', fontWeight:500 }}>{key}</span></div>
                  <div><span style={{ color:'var(--ink-4)' }}>CAPO</span> <span style={{ color:'var(--ink)', fontWeight:500 }}>{capo}fr</span></div>
                  <div><span style={{ color:'var(--ink-4)' }}>TEMPO</span> <span style={{ color:'var(--ink)', fontWeight:500 }}>♩{tempo}</span></div>
                  <div><span style={{ color:'var(--ink-4)' }}>LEVEL</span> <span style={{ color:'var(--gold-2)', fontWeight:500 }}>INT</span></div>
                </div>
                <div style={{ display:'flex', gap:4, marginTop:12, flexWrap:'wrap' }}>
                  {['Bm','F#','A','E','G','D'].map(c=>(
                    <span key={c} style={{
                      fontFamily:'var(--mono)', fontSize:10, fontWeight:500,
                      padding:'2px 6px', borderRadius:4,
                      background:'var(--rule-2)', color:'var(--ink-2)',
                    }}>{c}</span>
                  ))}
                </div>
              </div>

              <div style={{
                background:'var(--card)', border:'1px solid var(--rule)',
                borderRadius:14, padding:'16px 20px',
              }}>
                <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500, marginBottom:10 }}>Completion</div>
                {[
                  { g:'Essentials', n:'4/4', done:true },
                  { g:'Resources', n:'2/4', done:false },
                  { g:'Musical', n:'6/6', done:true },
                  { g:'Content', n:'2/4', done:false },
                ].map(r=>(
                  <div key={r.g} style={{
                    display:'flex', justifyContent:'space-between', padding:'6px 0',
                    borderBottom:'1px solid var(--rule)', fontSize:12,
                  }}>
                    <span style={{ color:'var(--ink-2)' }}>{r.g}</span>
                    <span style={{
                      fontFamily:'var(--mono)',
                      color: r.done ? 'var(--success)' : 'var(--ink-4)',
                    }}>{r.n} {r.done && '✓'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.SongFormA = SongFormA;
