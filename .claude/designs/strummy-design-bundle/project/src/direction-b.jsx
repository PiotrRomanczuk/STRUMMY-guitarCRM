// Direction B — "Music Manuscript" — editorial broadsheet with deep
// musical motifs. Agenda rendered as a STAVE (students = notes along a
// time-based timeline). Chord-grid stat pills. Fretboard progress.
// Asymmetric editorial layout. Serif for everything numeric/display.

const DirectionB = () => {
  const cardBase = {
    background:'var(--card)',
    border:'1px solid var(--rule)',
    borderRadius:'var(--radius-lg)',
  };

  // Build timeline: show from 3p to 8p, put each lesson as a note
  const hourStart = 15, hourEnd = 20; // 3p to 8p
  const toMin = (t) => {
    const m = t.match(/(\d+):(\d+)(a|p)/);
    let h = parseInt(m[1]); const mm = parseInt(m[2]);
    if (m[3] === 'p' && h !== 12) h += 12;
    if (m[3] === 'a' && h === 12) h = 0;
    return (h - hourStart) * 60 + mm;
  };
  const totalMin = (hourEnd - hourStart) * 60;

  return (
    <div className="app-viewport" style={{
      width:1440, height:1024, display:'flex',
      background:'var(--ivory)',
      color:'var(--ink)',
      fontSize:13,
      lineHeight:1.4,
      overflow:'hidden',
      borderRadius: 'var(--radius-lg)',
    }}>
      <SidebarNav active="home" />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <TopBar variant="B" />

        <div style={{ flex:1, overflowY:'auto', background:'var(--ivory)' }}>

          {/* ── Editorial masthead ─────────────────── */}
          <div style={{
            padding:'28px 40px 20px 40px',
            borderBottom:'1px solid var(--rule)',
            background:'var(--paper)',
            position:'relative',
          }}>
            {/* staff lines behind masthead */}
            <div style={{ position:'absolute', inset:0, opacity:.25, pointerEvents:'none' }}>
              <StaffLines width="100%" height="100%" color="var(--ink-4)" strokeWidth={0.4} count={9} />
            </div>

            <div style={{ position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24 }}>
              <div>
                <div style={{
                  display:'flex', alignItems:'center', gap:12,
                  fontFamily:'var(--mono)', fontSize:11,
                  color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.2em',
                  marginBottom:10,
                }}>
                  <span>Vol. 3 · No. 17</span>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--gold-2)' }} />
                  <span>{TODAY.day}, {TODAY.date}</span>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--gold-2)' }} />
                  <span>Late afternoon · 72°F</span>
                </div>
                <h1 style={{
                  margin:0,
                  fontFamily:'var(--serif)',
                  fontWeight:300,
                  fontSize:56,
                  letterSpacing:'-0.035em',
                  lineHeight:.98,
                  color:'var(--ink)',
                }}>
                  The Studio,{' '}
                  <em style={{
                    fontStyle:'italic',
                    fontWeight:400,
                    color:'var(--gold-2)',
                  }}>daily</em>.
                </h1>
                <div style={{
                  marginTop:12,
                  fontSize:15, fontFamily:'var(--serif)',
                  color:'var(--ink-3)', fontStyle:'italic',
                  maxWidth:560, lineHeight:1.4,
                }}>
                  An afternoon of three lessons. Emma returns to <em>Blackbird</em>;
                  Carlos needs gentleness; Lily's ready for her first barre.
                </div>
              </div>

              {/* metric block — serif numerals, editorial */}
              <div style={{
                display:'flex', gap:0,
                borderLeft:'1px solid var(--rule)',
              }}>
                {[
                  { v:6,  l:'students' },
                  { v:12, l:'lessons this wk' },
                  { v:128,l:'songs' },
                  { v:7,  l:'pending' },
                ].map((m,i)=>(
                  <div key={i} style={{
                    padding:'4px 20px',
                    borderRight:'1px solid var(--rule)',
                    textAlign:'center',
                  }}>
                    <div style={{
                      fontFamily:'var(--serif)', fontWeight:300,
                      fontSize:40, lineHeight:1, letterSpacing:'-0.03em',
                      color: i === 3 ? 'var(--danger)' : 'var(--ink)',
                    }}>{m.v}</div>
                    <div style={{
                      fontFamily:'var(--mono)', fontSize:9,
                      textTransform:'uppercase', letterSpacing:'.14em',
                      color:'var(--ink-4)', marginTop:4,
                    }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Today's stave — hero agenda ─────────── */}
          <div style={{ padding:'28px 40px 20px 40px' }}>
            <div style={{
              display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14,
            }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
                <div style={{
                  fontFamily:'var(--mono)', fontSize:10,
                  color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.16em',
                }}>I · The Day's Stave</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:28, letterSpacing:'-0.02em', fontWeight:400 }}>
                  Today's lessons, in tempo
                </div>
              </div>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>3:00P — 8:00P · 5 HOURS</div>
            </div>

            {/* STAVE */}
            <div style={{
              ...cardBase,
              padding:'24px 32px 20px 32px',
              position:'relative',
            }}>
              {/* Clef + time signature column */}
              <div style={{ display:'flex', gap:24 }}>
                <div style={{
                  width:48, flex:'0 0 48px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  position:'relative',
                }}>
                  {/* treble clef — stylized serif glyph */}
                  <div style={{
                    fontFamily:'var(--serif)',
                    fontSize:90,
                    lineHeight:1,
                    color:'var(--gold-2)',
                    fontStyle:'italic',
                    fontWeight:300,
                    marginTop:-8,
                  }}>𝄞</div>
                </div>

                {/* the stave itself */}
                <div style={{ flex:1, position:'relative', minHeight: 180, paddingTop:20, paddingBottom:20 }}>
                  {/* 5 stave lines */}
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{
                      position:'absolute', left:0, right:40,
                      top: 20 + i * 28,
                      height:1, background:'var(--ink-4)', opacity:.4,
                    }} />
                  ))}

                  {/* Hour tick marks */}
                  {Array.from({length: hourEnd - hourStart + 1}).map((_,i)=>{
                    const x = (i * 60 / totalMin) * 100;
                    const hr = hourStart + i;
                    const label = hr === 12 ? '12p' : hr > 12 ? `${hr-12}p` : `${hr}a`;
                    return (
                      <div key={i} style={{
                        position:'absolute', left:`calc(${x}% - 1px)`, top:4, bottom:4,
                        borderLeft:'1px dashed var(--rule)',
                      }}>
                        <div style={{
                          position:'absolute', top:-16, left:-12,
                          fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
                        }}>{label}</div>
                      </div>
                    );
                  })}

                  {/* "Now" line */}
                  <div style={{
                    position:'absolute',
                    left:`${((15.75 - hourStart) * 60 / totalMin) * 100}%`,
                    top:0, bottom:0,
                    borderLeft:'1.5px solid var(--danger)',
                  }}>
                    <div style={{
                      position:'absolute', top:-20, left:-18,
                      fontFamily:'var(--mono)', fontSize:9, color:'var(--danger)',
                      textTransform:'uppercase', letterSpacing:'.14em', fontWeight:600,
                    }}>NOW · 3:45P</div>
                  </div>

                  {/* The notes — each lesson */}
                  {AGENDA.map((l, idx) => {
                    const startMin = toMin(l.time);
                    const x = (startMin / totalMin) * 100;
                    const stemY = [20 + 28*0, 20 + 28*1.5, 20 + 28*3][idx]; // vary pitch
                    return (
                      <div key={l.id} style={{
                        position:'absolute', left:`${x}%`, top:0, bottom:0,
                      }}>
                        {/* note stem */}
                        <div style={{
                          position:'absolute', left:11, top: stemY - 48,
                          width:1.5, height:52, background:'var(--ink-2)',
                        }} />
                        {/* note head — avatar */}
                        <div style={{
                          position:'absolute', left:0, top: stemY - 12,
                          width:24, height:24, borderRadius:'50%',
                          background: l.student.color, color:'#fff',
                          display:'grid', placeItems:'center',
                          fontSize:10, fontWeight:600,
                          boxShadow:'0 2px 8px rgba(26,22,19,.18)',
                          transform:'rotate(-18deg)',
                        }}>{l.student.avatar}</div>

                        {/* flag / duration marker */}
                        <div style={{
                          position:'absolute', left:13, top: stemY - 48,
                          width: 8, height: 12,
                          background:'var(--gold-2)',
                          borderRadius:'0 4px 8px 0',
                        }} />

                        {/* student label card */}
                        <div style={{
                          position:'absolute', left:-8, top: stemY + 24,
                          width: 180,
                        }}>
                          <div style={{
                            fontFamily:'var(--mono)', fontSize:10,
                            color:'var(--ink-4)', marginBottom:2,
                          }}>{l.time} · {l.duration}</div>
                          <div style={{
                            fontFamily:'var(--serif)', fontSize:15, fontWeight:500, letterSpacing:'-0.01em',
                            display:'flex', alignItems:'center', gap:5,
                          }}>
                            {l.student.name.split(' ')[0]}
                            <HealthDot health={l.student.health} size={6} />
                          </div>
                          <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
                            {l.songs.map((sg,i)=>(
                              <span key={i} style={{
                                fontSize:10, fontFamily:'var(--mono)',
                                padding:'1px 6px', borderRadius:4,
                                background:'var(--rule-2)', color:'var(--ink-2)',
                              }}>{sg.key} · {sg.title.length > 14 ? sg.title.slice(0,14)+'…' : sg.title}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Main grid ─────────────────────────── */}
          <div style={{ padding:'8px 40px 64px 40px', display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:20 }}>

            {/* COL 1: Next up (hero lesson card) + attention */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Next up — featured lesson as a score cover */}
              <div style={{
                ...cardBase,
                overflow:'hidden',
                padding:0,
                background:'var(--paper)',
                position:'relative',
              }}>
                <div style={{
                  padding:'20px 24px 16px 24px',
                  borderBottom:'1px solid var(--rule)',
                  background:'linear-gradient(180deg, var(--gold-tint) 0%, transparent 100%)',
                }}>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:10,
                    color:'var(--gold-2)', textTransform:'uppercase', letterSpacing:'.16em',
                    marginBottom:10,
                  }}>II · Up Next · in 15 min</div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <Avatar s={AGENDA[0].student} size={48} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--serif)', fontSize:26, letterSpacing:'-0.02em', fontWeight:400, lineHeight:1 }}>
                        {AGENDA[0].student.name}
                      </div>
                      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4, fontFamily:'var(--mono)' }}>
                        {AGENDA[0].time} · {AGENDA[0].duration} · {AGENDA[0].student.level.toUpperCase()}
                      </div>
                    </div>
                    <button style={{
                      padding:'8px 14px', border:'none', background:'var(--gold-2)', color:'#fff',
                      borderRadius:8, fontSize:12, cursor:'pointer', fontWeight:600,
                      display:'flex', alignItems:'center', gap:6,
                    }}>
                      <Icon d={I.play} size={10} stroke="#fff" fill="#fff" /> Start
                    </button>
                  </div>
                </div>

                <div style={{ padding:'18px 24px 20px 24px' }}>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:9,
                    textTransform:'uppercase', letterSpacing:'.14em',
                    color:'var(--ink-4)', marginBottom:10,
                  }}>Repertoire for today</div>
                  {AGENDA[0].songs.map((sg,i)=>(
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:14,
                      padding:'10px 0',
                      borderBottom: i < AGENDA[0].songs.length - 1 ? '1px dashed var(--rule)' : 'none',
                    }}>
                      <ChordGrid name={sg.key} size={44} color="var(--ink-2)" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'var(--serif)', fontSize:17, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.01em' }}>
                          {sg.title}
                        </div>
                        <div style={{ color:'var(--ink-3)', fontSize:12, marginTop:2 }}>{sg.author}</div>
                      </div>
                      <StatusPill status={sg.status} compact />
                    </div>
                  ))}

                  <div style={{
                    marginTop:14, padding:'10px 12px',
                    background:'var(--rule-2)',
                    borderRadius:8,
                    fontSize:12, color:'var(--ink-2)',
                    lineHeight:1.5,
                  }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', display:'block', marginBottom:4 }}>Last session</span>
                    {AGENDA[0].lastSummary}
                  </div>
                </div>
              </div>

              {/* Needs attention */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{
                  fontFamily:'var(--mono)', fontSize:10,
                  color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.16em',
                  marginBottom:6,
                }}>III · Needs attention</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:400, letterSpacing:'-0.01em', marginBottom:12 }}>
                  Three students, listening
                </div>
                {NEEDS_ATTN.map((n,i)=>(
                  <div key={i} style={{
                    display:'flex', gap:12, padding:'12px 0',
                    borderTop:'1px solid var(--rule)',
                    alignItems:'center',
                  }}>
                    <Avatar s={n.student} size={32} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:500 }}>{n.student.name}</span>
                        <HealthDot health={n.severity} size={6} />
                      </div>
                      <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2, fontStyle:'italic', fontFamily:'var(--serif)' }}>{n.reason}</div>
                    </div>
                    <button style={{
                      padding:'4px 10px', border:'none',
                      background:'var(--ink)', color:'var(--paper)',
                      borderRadius:6, fontSize:11, cursor:'pointer',
                    }}>Nudge</button>
                  </div>
                ))}
              </div>
            </div>

            {/* COL 2: Studio roster as repertoire list */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{
                  fontFamily:'var(--mono)', fontSize:10,
                  color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.16em',
                  marginBottom:6,
                }}>IV · The studio</div>
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:400, letterSpacing:'-0.01em' }}>
                    Six students in your care
                  </div>
                  <a style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)', cursor:'pointer' }}>ALL →</a>
                </div>

                {STUDENTS.map((s,i)=>(
                  <div key={s.id} style={{
                    display:'grid', gridTemplateColumns:'32px 1fr auto',
                    gap:12, alignItems:'center',
                    padding:'12px 0',
                    borderTop: '1px solid var(--rule)',
                  }}>
                    <Avatar s={s} size={32} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'var(--serif)', fontSize:15, fontWeight:500, letterSpacing:'-0.01em' }}>{s.name}</span>
                        <HealthDot health={s.health} size={6} />
                      </div>
                      {/* progress as a mini fretboard */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', width:34 }}>{s.progress}%</span>
                        <div style={{ flex:1, position:'relative', height:4, background:'var(--rule-2)', borderRadius:999, overflow:'hidden' }}>
                          <div style={{
                            position:'absolute', left:0, top:0, bottom:0,
                            width:`${s.progress}%`,
                            background:`linear-gradient(90deg, ${s.color}bb, var(--gold-2))`,
                          }} />
                          {/* fret ticks */}
                          {[25,50,75].map(p=>(
                            <div key={p} style={{
                              position:'absolute', left:`${p}%`, top:0, bottom:0,
                              width:1, background:'rgba(0,0,0,.1)',
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.1em' }}>Next</div>
                      <div style={{
                        fontFamily:'var(--mono)', fontSize:11,
                        color: s.nextLesson.startsWith('Today') ? 'var(--gold-2)' : 'var(--ink-3)',
                        fontWeight: s.nextLesson.startsWith('Today') ? 600 : 400,
                      }}>{s.nextLesson}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Week calendar */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{
                  fontFamily:'var(--mono)', fontSize:10,
                  color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.16em',
                  marginBottom:10,
                }}>V · The week</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
                  {WEEK_DAYS.map((d,i)=>(
                    <div key={i} style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.1em' }}>{d.d}</div>
                      <div style={{
                        fontFamily:'var(--serif)', fontSize: d.isToday ? 26 : 20, fontWeight:400, marginTop:2,
                        color: d.isToday ? 'var(--gold-2)' : 'var(--ink)',
                        fontStyle: d.isToday ? 'italic' : 'normal',
                      }}>{d.n}</div>
                    </div>
                  ))}
                </div>
                {/* lesson-density bars as piano roll */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, alignItems:'flex-end', height:50, borderTop:'1px solid var(--rule)', paddingTop:8 }}>
                  {WEEK_DAYS.map((d,i)=>(
                    <div key={i} style={{ display:'flex', flexDirection:'column', gap:2 }}>
                      {Array.from({length:3}).map((_,j)=>(
                        <div key={j} style={{
                          height:10,
                          background: j < d.lessons ? (d.isToday ? 'var(--gold-2)' : 'var(--ink-3)') : 'var(--rule-2)',
                          borderRadius:2,
                        }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COL 3: Activity + Song of the Week */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Song of the week — score-cover style */}
              <div style={{
                ...cardBase,
                padding:0, overflow:'hidden',
                background:'var(--ink)',
                color:'var(--paper)',
                position:'relative',
              }}>
                {/* staff pattern bg */}
                <div style={{ position:'absolute', inset:0, opacity:.06, pointerEvents:'none' }}>
                  <StaffLines width="100%" height="100%" color="var(--paper)" count={11} strokeWidth={0.6} />
                </div>
                <div style={{ padding:'20px 24px', position:'relative' }}>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:10,
                    color:'var(--gold-dim)', textTransform:'uppercase', letterSpacing:'.2em',
                    marginBottom:8, display:'flex', alignItems:'center', gap:8,
                  }}>
                    <Icon d={I.spark} size={11} stroke="var(--gold-dim)" />
                    Song of the week
                  </div>
                  <div style={{
                    fontFamily:'var(--serif)', fontSize:32, lineHeight:1.02,
                    fontWeight:400, fontStyle:'italic', letterSpacing:'-0.02em',
                  }}>
                    {SONG_OF_WEEK.title}
                  </div>
                  <div style={{ color:'var(--ink-5)', fontSize:12, marginTop:6, fontFamily:'var(--serif)' }}>
                    — {SONG_OF_WEEK.author}, {SONG_OF_WEEK.year}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, marginTop:16, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.15)' }}>
                    {[
                      { l:'KEY',   v:SONG_OF_WEEK.key },
                      { l:'CAPO',  v:`${SONG_OF_WEEK.capo}fr` },
                      { l:'TEMPO', v:`♩${SONG_OF_WEEK.tempo}` },
                      { l:'LEVEL', v:'INT' },
                    ].map((m,i)=>(
                      <div key={i} style={{ borderRight: i<3 ? '1px solid rgba(255,255,255,.15)' : 'none', paddingLeft: i===0 ? 0 : 12 }}>
                        <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--ink-5)', letterSpacing:'.12em' }}>{m.l}</div>
                        <div style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:400, marginTop:2 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', gap:8, marginTop:16 }}>
                    {SONG_OF_WEEK.chords.slice(0,5).map(c => (
                      <ChordGrid key={c} name={c} size={38} color="var(--gold-dim)" />
                    ))}
                  </div>

                  <div style={{ display:'flex', gap:10, marginTop:16 }}>
                    <button style={{
                      flex:1,
                      padding:'8px 12px',
                      background:'var(--gold-2)', color:'var(--ink)',
                      border:'none', borderRadius:6, fontWeight:600,
                      fontSize:12, cursor:'pointer',
                    }}>Assign to students</button>
                    <button style={{
                      padding:'8px 12px',
                      background:'transparent', color:'var(--paper)',
                      border:'1px solid rgba(255,255,255,.2)', borderRadius:6,
                      fontSize:12, cursor:'pointer',
                    }}>Preview</button>
                  </div>
                </div>
              </div>

              {/* Activity — as a tabbed ledger */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{
                  fontFamily:'var(--mono)', fontSize:10,
                  color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.16em',
                  marginBottom:6,
                }}>VI · The ledger</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:400, letterSpacing:'-0.01em', marginBottom:12 }}>
                  Today at the studio
                </div>
                {ACTIVITY.slice(0,6).map((a,i)=>{
                  const verbColor = {
                    mastered:'var(--success)',
                    practice:'var(--info)',
                    assignment:'var(--gold-2)',
                    repertoire:'var(--ink-2)',
                    lesson:'var(--ink-2)',
                  }[a.type];
                  return (
                    <div key={a.id} style={{
                      display:'grid', gridTemplateColumns:'60px 1fr',
                      gap:12, padding:'10px 0',
                      borderTop:'1px solid var(--rule)',
                      alignItems:'flex-start',
                    }}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', paddingTop:3, textTransform:'uppercase', letterSpacing:'.08em' }}>
                        {a.time}
                      </div>
                      <div style={{ fontSize:13, lineHeight:1.45 }}>
                        <span style={{ fontWeight:500 }}>{a.who.name}</span>{' '}
                        <span style={{ color: verbColor, fontStyle:'italic', fontFamily:'var(--serif)', fontWeight:500 }}>{a.verb}</span>{' '}
                        <span style={{ color:'var(--ink-3)' }}>{a.obj}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.DirectionB = DirectionB;
