// Direction A — "Editorial Light" — clean, modern, music-studio SaaS.
// Gold accent, serif display for numerals/titles, subtle staff-line and
// fretboard motifs used as textural accents, not decoration.

const DirectionA = () => {
  const cardBase = {
    background:'var(--card)',
    border:'1px solid var(--rule)',
    borderRadius:'var(--radius-lg)',
    boxShadow:'var(--shadow-sm)',
  };

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
        <TopBar variant="A" />

        <div style={{ flex:1, overflowY:'auto', padding:'28px 32px 64px', background:'var(--ivory)' }}>

          {/* ── Greeting / briefing ─────────────────── */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.16em', marginBottom:6, fontFamily:'var(--mono)' }}>
                {TODAY.day} · {TODAY.date}, {TODAY.year}
              </div>
              <h1 style={{
                margin:0,
                fontFamily:'var(--serif)',
                fontWeight:400,
                fontSize:38,
                letterSpacing:'-0.02em',
                lineHeight:1.05,
              }}>
                Good afternoon, <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>Sarah</em>.
              </h1>
              <div style={{ color:'var(--ink-3)', fontSize:14, marginTop:8, maxWidth:540 }}>
                Three lessons this afternoon. <span style={{ color:'var(--ink)' }}>Carlos</span> hasn't practiced in 11 days — consider an easier warm-up.
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {['New lesson','Add song','Invite'].map((l,i)=>(
                <button key={l} style={{
                  padding:'8px 14px',
                  borderRadius: 8,
                  border:'1px solid var(--rule)',
                  background: i===0 ? 'var(--ink)' : 'var(--card)',
                  color: i===0 ? 'var(--paper)' : 'var(--ink-2)',
                  fontSize:13, fontWeight:500, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:6,
                }}>
                  {i===0 && <Icon d={I.plus} size={12} stroke="var(--paper)" />}
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* ── Stat strip ──────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
            {STATS.map((s, i) => (
              <div key={s.key} style={{
                ...cardBase,
                padding:'18px 20px',
                position:'relative',
                overflow:'hidden',
              }}>
                <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.12em', fontWeight:500 }}>{s.label}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, marginTop:6 }}>
                  <span style={{ fontFamily:'var(--serif)', fontSize:40, fontWeight:400, letterSpacing:'-0.03em', lineHeight:1 }}>{s.value}</span>
                  <span style={{
                    fontSize:11, fontFamily:'var(--mono)',
                    color: s.trend.startsWith('+') ? 'var(--success)' : s.trend.startsWith('-') ? 'var(--danger)' : 'var(--ink-4)',
                  }}>{s.trend}</span>
                </div>
                <div style={{ color:'var(--ink-4)', fontSize:11, marginTop:4 }}>{s.unit}</div>
                {/* subtle staff lines accent */}
                <div style={{ position:'absolute', right:-6, top:16, width:64, height:36, opacity:.25 }}>
                  <StaffLines width="100%" height={36} color="var(--ink-4)" />
                </div>
              </div>
            ))}
          </div>

          {/* ── Main grid: agenda + side column ─────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20 }}>
            {/* LEFT ────────────────────────────────── */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Today's agenda */}
              <div style={{ ...cardBase, overflow:'hidden' }}>
                <div style={{ padding:'20px 24px 4px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>Today's agenda</div>
                    <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:400, letterSpacing:'-0.01em', marginTop:2 }}>
                      3 lessons · 2h 0m
                    </div>
                  </div>
                  <a style={{ color:'var(--ink-4)', fontSize:12, cursor:'pointer' }}>Open calendar →</a>
                </div>

                {/* timeline */}
                <div style={{ padding:'16px 24px 20px 24px' }}>
                  {AGENDA.map((l, idx) => (
                    <div key={l.id} style={{
                      display:'grid', gridTemplateColumns:'56px 1fr auto',
                      gap:16, padding:'16px 0',
                      borderTop: idx === 0 ? '1px solid var(--rule)' : 'none',
                      borderBottom: '1px solid var(--rule)',
                      alignItems:'flex-start',
                    }}>
                      {/* time */}
                      <div style={{ textAlign:'right', paddingTop:2 }}>
                        <div style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--ink)', fontWeight:500 }}>{l.time}</div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)', marginTop:2 }}>{l.duration}</div>
                      </div>
                      {/* body */}
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                          <Avatar s={l.student} size={28} />
                          <div style={{ fontSize:15, fontWeight:500 }}>{l.student.name}</div>
                          <HealthDot health={l.student.health} />
                          <span style={{ color:'var(--ink-4)', fontSize:12 }}>· {l.student.level}</span>
                        </div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                          {l.songs.map((sg,i)=>(
                            <div key={i} style={{
                              display:'flex', alignItems:'center', gap:8,
                              padding:'4px 10px',
                              background:'var(--rule-2)',
                              borderRadius: 6,
                              fontSize:12,
                            }}>
                              <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--gold-2)' }}>{sg.key}</span>
                              <span style={{ fontStyle:'italic', fontFamily:'var(--serif)', fontSize:13 }}>{sg.title}</span>
                              <StatusPill status={sg.status} compact />
                            </div>
                          ))}
                        </div>
                        <div style={{
                          color:'var(--ink-3)', fontSize:12, paddingLeft:10,
                          borderLeft:'2px solid var(--rule)', lineHeight:1.45,
                        }}>
                          Last time: {l.lastSummary}
                        </div>
                      </div>
                      {/* actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                        <button style={{
                          padding:'6px 12px', border:'1px solid var(--rule)',
                          background:'var(--card)', borderRadius:8,
                          fontSize:12, cursor:'pointer', color:'var(--ink-2)',
                        }}>Start</button>
                        <button style={{
                          padding:'4px 10px', border:'none', background:'transparent',
                          borderRadius:8, fontSize:11, cursor:'pointer', color:'var(--ink-4)',
                        }}>Notes</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs attention */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div>
                    <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>Needs attention</div>
                    <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>3 flags across 2 students</div>
                  </div>
                  <a style={{ color:'var(--ink-4)', fontSize:12, cursor:'pointer' }}>View all →</a>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {NEEDS_ATTN.map((n,i)=>(
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'10px 0',
                      borderTop: i===0 ? '1px solid var(--rule)' : 'none',
                      borderBottom:'1px solid var(--rule)',
                    }}>
                      <Avatar s={n.student} size={28} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{n.student.name}</div>
                        <div style={{ color:'var(--ink-3)', fontSize:12, marginTop:1 }}>{n.reason}</div>
                      </div>
                      <span style={{
                        padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:500,
                        background: n.severity === 'at_risk' ? '#b84a3a18' : '#c8952318',
                        color: n.severity === 'at_risk' ? 'var(--danger)' : 'var(--gold-2)',
                        textTransform:'uppercase', letterSpacing:'.06em',
                      }}>
                        {n.severity.replace('_',' ')}
                      </span>
                      <button style={{
                        padding:'5px 10px', border:'1px solid var(--rule)',
                        background:'var(--card)', borderRadius:6, fontSize:11, cursor:'pointer', color:'var(--ink-2)'
                      }}>Message</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div>
                    <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>Activity</div>
                    <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>Recent across your studio</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {['All','Practice','Lessons','Songs'].map((t,i)=>(
                      <button key={t} style={{
                        padding:'4px 10px', border:'1px solid var(--rule)',
                        background: i===0 ? 'var(--ink)' : 'var(--card)',
                        color: i===0 ? 'var(--paper)' : 'var(--ink-3)',
                        borderRadius: 999, fontSize:11, cursor:'pointer',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {ACTIVITY.map((a,i)=>{
                    const verbColor = {
                      mastered:'var(--success)',
                      practice:'var(--info)',
                      assignment:'var(--gold-2)',
                      repertoire:'var(--ink-2)',
                      lesson:'var(--ink-2)',
                    }[a.type];
                    return (
                      <div key={a.id} style={{
                        display:'grid', gridTemplateColumns:'24px 1fr auto',
                        gap:12, alignItems:'center',
                        padding:'10px 0',
                        borderBottom:'1px solid var(--rule)',
                      }}>
                        <Avatar s={a.who} size={22} />
                        <div style={{ fontSize:13 }}>
                          <span style={{ fontWeight:500 }}>{a.who.name}</span>{' '}
                          <span style={{ color: verbColor, fontWeight:500 }}>{a.verb}</span>{' '}
                          <span style={{ color:'var(--ink-3)' }}>{a.obj}</span>
                        </div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{a.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT ───────────────────────────────── */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Quick actions */}
              <div style={{ ...cardBase, padding:'18px 20px' }}>
                <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500, marginBottom:12 }}>Quick actions</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { icon:I.lesson, label:'New lesson' },
                    { icon:I.assign, label:'Assignment' },
                    { icon:I.song, label:'Add song' },
                    { icon:I.user, label:'Invite student' },
                  ].map((a,i)=>(
                    <button key={i} style={{
                      display:'flex', alignItems:'center', gap:10,
                      padding:'10px 12px', border:'1px solid var(--rule)',
                      background:'var(--card)', borderRadius: 8,
                      cursor:'pointer', fontSize:13, color:'var(--ink-2)',
                      textAlign:'left',
                    }}>
                      <Icon d={a.icon} size={15} stroke="var(--gold-2)" />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Week at a glance */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>Week 17</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>APR 20–26</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
                  {WEEK_DAYS.map((d,i)=>(
                    <div key={i} style={{
                      borderRadius:8,
                      padding:'10px 4px 8px 4px',
                      textAlign:'center',
                      background: d.isToday ? 'var(--gold-tint)' : 'var(--rule-2)',
                      border: d.isToday ? '1px solid var(--gold-dim)' : '1px solid transparent',
                    }}>
                      <div style={{ color: d.isToday ? 'var(--gold-2)' : 'var(--ink-4)', fontSize:10, textTransform:'uppercase', letterSpacing:'.1em' }}>{d.d}</div>
                      <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight: d.isToday ? 500 : 400, marginTop:2, color: d.isToday ? 'var(--gold-2)' : 'var(--ink)' }}>{d.n}</div>
                      <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:6, height:4 }}>
                        {Array.from({length:d.lessons}).map((_,j)=>(
                          <span key={j} style={{ width:4, height:4, borderRadius:'50%', background: d.isToday ? 'var(--gold-2)' : 'var(--ink-4)' }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student progress list */}
              <div style={{ ...cardBase, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div>
                    <div style={{ color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>Studio</div>
                    <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>6 active students</div>
                  </div>
                  <a style={{ color:'var(--ink-4)', fontSize:12, cursor:'pointer' }}>View all →</a>
                </div>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {STUDENTS.map((s,i)=>(
                    <div key={s.id} style={{
                      display:'grid', gridTemplateColumns:'auto 1fr auto',
                      gap:10, alignItems:'center',
                      padding:'10px 0',
                      borderBottom: i < STUDENTS.length-1 ? '1px solid var(--rule)' : 'none',
                    }}>
                      <Avatar s={s} size={28} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:13, fontWeight:500 }}>{s.name}</span>
                          <HealthDot health={s.health} size={6} />
                        </div>
                        <div style={{ color:'var(--ink-4)', fontSize:11, marginTop:1, fontFamily:'var(--mono)' }}>
                          {s.songs} songs · {s.mastered} mastered · {s.streak}w streak
                        </div>
                      </div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', textAlign:'right' }}>
                        {s.nextLesson.startsWith('Today') ? <span style={{ color:'var(--gold-2)', fontWeight:500 }}>{s.nextLesson}</span> : s.nextLesson}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Song of the week */}
              <div style={{
                ...cardBase,
                padding: 0,
                overflow:'hidden',
                position:'relative',
                background:'linear-gradient(165deg, var(--gold-tint) 0%, var(--card) 45%)',
              }}>
                <div style={{ padding:'20px 24px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <Icon d={I.spark} size={12} stroke="var(--gold-2)" />
                    <span style={{ color:'var(--gold-2)', fontSize:10, textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>Song of the week</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <div style={{
                      width:56, height:56, borderRadius:8,
                      background:'linear-gradient(135deg, #b84a3a, #c89523)',
                      display:'grid', placeItems:'center', color:'#fff',
                      fontFamily:'var(--serif)', fontSize:22, fontWeight:500,
                      boxShadow:'inset 0 -2px 0 rgba(0,0,0,.25)',
                    }}>HC</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--serif)', fontSize:22, fontStyle:'italic', fontWeight:500, lineHeight:1.1, letterSpacing:'-0.01em' }}>
                        {SONG_OF_WEEK.title}
                      </div>
                      <div style={{ color:'var(--ink-3)', fontSize:12, marginTop:2 }}>
                        {SONG_OF_WEEK.author} · {SONG_OF_WEEK.year}
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:8, fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)' }}>
                        <span>KEY {SONG_OF_WEEK.key}</span>
                        <span>CAPO {SONG_OF_WEEK.capo}</span>
                        <span>♩ {SONG_OF_WEEK.tempo}</span>
                        <span style={{ color:'var(--gold-2)' }}>{SONG_OF_WEEK.level.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* chord strip */}
                  <div style={{
                    marginTop:16, paddingTop:16,
                    borderTop:'1px dashed var(--gold-dim)',
                    display:'flex', gap:12, overflow:'hidden',
                  }}>
                    {SONG_OF_WEEK.chords.slice(0,6).map(c => (
                      <ChordGrid key={c} name={c} size={40} color="var(--ink-2)" />
                    ))}
                  </div>
                  <div style={{
                    marginTop:12, paddingTop:10, borderTop:'1px solid var(--rule)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <div style={{ fontSize:11, color:'var(--ink-3)' }}>Assigned to <span style={{ color:'var(--ink)', fontWeight:500 }}>4 students</span> this week</div>
                    <button style={{
                      padding:'6px 12px', border:'none', background:'var(--ink)', color:'var(--paper)',
                      borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:500,
                    }}>Assign →</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.DirectionA = DirectionA;
