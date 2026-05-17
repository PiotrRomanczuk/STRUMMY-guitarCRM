// Teacher dashboard — "Who needs my attention, what's my day look like?"
// HERO: vertical day-spine timeline with a CAPO "now" marker
//   - left rail: time labels
//   - right: lesson cards stacked, current expanded, ambient string vibration behind
// SECONDARY: needs-attention, student list, song library quick-access, week density

const TeacherDashboardNew = ({ width = 1440, height = 1024 }) => (
  <div className="app-viewport" style={{
    width, height, display:'flex',
    background:'var(--ivory)', color:'var(--ink)',
    fontSize:13, lineHeight:1.4, overflow:'hidden',
    borderRadius:'var(--radius-lg)',
  }}>
    <SidebarNav active="home" />
    <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
      <TopBar variant="teacher" />
      <div style={{ flex:1, overflowY:'auto', padding:'24px 32px 64px', background:'var(--ivory)' }}>
        <TeacherGreeting />
        <div style={{ display:'grid', gridTemplateColumns:'1.45fr 1fr', gap:20 }}>
          <TeacherDaySpine />
          <TeacherSideColumn />
        </div>
        <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <TeacherStudentRoster />
          <TeacherSongLibrary />
        </div>
      </div>
    </div>
  </div>
);

const TeacherGreeting = () => (
  <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20 }}>
    <div>
      <div style={{ color:'var(--ink-4)', fontFamily:'var(--mono)', fontSize:11, textTransform:'uppercase', letterSpacing:'.16em', marginBottom:6 }}>
        {TODAY.day} · {TODAY.date}, {TODAY.year} · Week {TODAY.weekNum}
      </div>
      <h1 style={{
        margin:0, fontFamily:'var(--serif)', fontWeight:400,
        fontSize:38, letterSpacing:'-0.02em', lineHeight:1.05,
      }}>
        Good afternoon, <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>Sarah</em>.
      </h1>
      <div style={{ color:'var(--ink-3)', fontSize:14, marginTop:8, maxWidth:560 }}>
        <span style={{ color:'var(--ink)', fontWeight:500 }}>Carlos</span> hasn't practiced in 11 days. Consider an easier warm-up before today's 5:00 session.
      </div>
    </div>
    <div style={{ display:'flex', gap:8 }}>
      <button style={{
        padding:'9px 14px', borderRadius:8, border:'1px solid var(--rule)',
        background:'var(--card)', color:'var(--ink-2)', fontSize:13, cursor:'pointer',
      }}>Assignments</button>
      <button style={{
        padding:'9px 14px', borderRadius:8, background:'var(--ink)', color:'var(--paper)',
        border:'none', fontSize:13, fontWeight:500, cursor:'pointer',
        display:'inline-flex', alignItems:'center', gap:6,
      }}>
        <Icon d={I.plus} size={12} stroke="var(--paper)" /> New lesson
      </button>
    </div>
  </div>
);

// ─── Day spine — vertical schedule timeline ───────────────────
// 9a–8p, with a CAPO marker at 3:46p, and 3 lessons mapped to their times
const TeacherDaySpine = () => {
  const STARTS = 9, ENDS = 20; // 9a–8p
  const NOW_HOUR = 15 + 46/60; // 3:46p
  const HOUR_PX = 56;

  // Map AGENDA hours
  const lessonsWithY = AGENDA.map((l, i) => {
    const hhmm = l.time.replace('p','').replace('a','').split(':');
    let hour = parseInt(hhmm[0]) + (parseInt(hhmm[1] || 0))/60;
    if (l.time.includes('p') && hour < 12) hour += 12;
    return { ...l, hour, idx:i };
  });

  const totalHours = ENDS - STARTS;
  const totalH = totalHours * HOUR_PX;

  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--rule)', borderRadius:18,
      boxShadow:'0 1px 2px rgba(26,22,19,.04), 0 10px 40px -20px rgba(26,22,19,.08)',
      overflow:'hidden', position:'relative',
    }}>
      {/* header */}
      <div style={{ padding:'22px 24px 14px 24px', display:'flex', alignItems:'flex-end', justifyContent:'space-between',
                    borderBottom:'1px solid var(--rule)' }}>
        <div>
          <Eyebrow style={{ color:'var(--gold-2)' }}>Today's schedule</Eyebrow>
          <div style={{ fontFamily:'var(--serif)', fontSize:28, fontWeight:400, letterSpacing:'-0.02em', marginTop:2 }}>
            3 lessons · <span style={{ color:'var(--ink-4)' }}>2h 0m teaching</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['Today','Week','Month'].map((t,i)=>(
            <button key={t} style={{
              padding:'6px 12px', borderRadius:999,
              border: i === 0 ? '1px solid var(--ink)' : '1px solid var(--rule)',
              background: i === 0 ? 'var(--ink)' : 'var(--card)',
              color: i === 0 ? 'var(--paper)' : 'var(--ink-3)',
              fontSize:11, cursor:'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ambient strings behind spine */}
      <div style={{ position:'absolute', left:0, right:0, top:80, height:totalH+24, opacity:0.5, pointerEvents:'none' }}>
        <StringVibration width={900} height={totalH+24} color="var(--gold-2)" opacity={0.07} />
      </div>

      {/* spine */}
      <div style={{ position:'relative', height:totalH, padding:'12px 24px 12px 24px' }}>
        {/* hour grid */}
        {Array.from({length: totalHours+1}).map((_, i) => {
          const hour = STARTS + i;
          const display = hour > 12 ? `${hour-12}p` : hour === 12 ? '12p' : `${hour}a`;
          return (
            <div key={i} style={{
              position:'absolute', left:24, right:24, top: i*HOUR_PX + 12,
              display:'grid', gridTemplateColumns:'52px 1fr', gap:14, alignItems:'center', pointerEvents:'none',
            }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', textAlign:'right' }}>{display}</div>
              <div style={{ height:1, background:'var(--rule)', opacity: hour % 2 === 0 ? 0.9 : 0.4 }} />
            </div>
          );
        })}

        {/* capo NOW marker */}
        <div style={{
          position:'absolute', left:24, right:24, top: (NOW_HOUR - STARTS) * HOUR_PX + 12,
          display:'grid', gridTemplateColumns:'52px 1fr', gap:14, alignItems:'center', zIndex:3,
        }}>
          <div style={{
            fontFamily:'var(--mono)', fontSize:10, color:'var(--gold-2)', textAlign:'right', fontWeight:600,
          }}>3:46p</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{
              padding:'2px 8px', borderRadius:4, background:'var(--gold-2)', color:'#fff',
              fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.12em', fontWeight:600,
              boxShadow:'inset 0 -1px 0 rgba(0,0,0,.18)',
            }}>CAPO · NOW</span>
            <span style={{ flex:1, height:2, background:'linear-gradient(90deg, var(--gold-2), transparent)', borderRadius:1 }} />
            <PulseDot color="var(--gold-2)" size={6} />
          </div>
        </div>

        {/* lessons */}
        {lessonsWithY.map((l, idx) => {
          const top = (l.hour - STARTS) * HOUR_PX + 12;
          const durM = parseInt(l.duration) || 45;
          const h = (durM/60) * HOUR_PX;
          const isNext = idx === 0;
          return (
            <div key={l.id} style={{
              position:'absolute', left: 24 + 52 + 14, right:24, top, height: Math.max(72, h-6),
              border:'1px solid ' + (isNext ? 'var(--gold-dim)' : 'var(--rule)'),
              background: isNext ? 'linear-gradient(135deg, var(--gold-tint), var(--card))' : 'var(--card)',
              borderRadius:12, padding:'12px 16px',
              boxShadow: isNext ? '0 8px 24px -12px rgba(200,149,35,.35)' : 'var(--shadow-sm)',
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'flex-start',
              zIndex:2, cursor:'pointer',
            }}>
              <Avatar s={l.student} size={36} />
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:15, fontWeight:500 }}>{l.student.name}</span>
                  <HealthDot health={l.student.health} size={7} />
                  <span style={{ color:'var(--ink-4)', fontSize:11 }}>· {l.student.level}</span>
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', marginTop:3 }}>
                  {l.time}–{l.endTime} · {l.duration}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                  {l.songs.slice(0, 2).map((sg, i)=>(
                    <span key={i} style={{
                      fontSize:11, padding:'3px 8px', borderRadius:6,
                      background:'rgba(0,0,0,.04)',
                      fontStyle:'italic', fontFamily:'var(--serif)',
                    }}>
                      <span style={{ fontFamily:'var(--mono)', fontStyle:'normal', color:'var(--gold-2)', marginRight:4 }}>{sg.key}</span>
                      {sg.title}
                    </span>
                  ))}
                </div>
              </div>
              <button style={{
                padding:'6px 12px', borderRadius:8,
                background: isNext ? 'var(--ink)' : 'transparent',
                color: isNext ? 'var(--paper)' : 'var(--ink-2)',
                border: isNext ? 'none' : '1px solid var(--rule)',
                fontSize:11, fontWeight:500, cursor:'pointer',
              }}>{isNext ? 'Prep →' : 'Open'}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Side column: needs attention + week density + quick add ──
const TeacherSideColumn = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <TeacherNeedsAttention />
    <TeacherWeekDensity />
    <TeacherUtilization />
  </div>
);

const TeacherNeedsAttention = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'18px 20px', boxShadow:'var(--shadow-sm)',
  }}>
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6 }}>
      <Eyebrow style={{ color:'var(--danger)' }}>Needs attention</Eyebrow>
      <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>3 flags · 2 students</span>
    </div>
    <div style={{ fontFamily:'var(--serif)', fontSize:18, marginBottom:12 }}>Before today's lessons</div>
    {NEEDS_ATTN.map((n, i) => (
      <div key={i} style={{
        display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center',
        padding:'10px 0',
        borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
        borderBottom:'1px solid var(--rule)',
      }}>
        <Avatar s={n.student} size={26} />
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500 }}>{n.student.name}</div>
          <div style={{ fontSize:11, color:'var(--ink-3)' }}>{n.reason}</div>
        </div>
        <button style={{
          padding:'4px 10px', borderRadius:6, border:'1px solid var(--rule)',
          background:'var(--card)', fontSize:10, color:'var(--ink-2)', cursor:'pointer',
        }}>Reach out</button>
      </div>
    ))}
  </div>
);

const TeacherWeekDensity = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'18px 20px', boxShadow:'var(--shadow-sm)',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <Eyebrow>Week 17 · density</Eyebrow>
      <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>APR 20–26</span>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
      {WEEK_DAYS.map((d,i)=>(
        <div key={i} style={{
          borderRadius:8, padding:'10px 4px 8px',
          textAlign:'center',
          background: d.isToday ? 'var(--gold-tint)' : 'var(--rule-2)',
          border: d.isToday ? '1px solid var(--gold-dim)' : '1px solid transparent',
        }}>
          <div style={{ color: d.isToday ? 'var(--gold-2)' : 'var(--ink-4)', fontFamily:'var(--mono)',
                        fontSize:9, letterSpacing:'.12em' }}>{d.d}</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:18, fontWeight: d.isToday ? 500 : 400,
                        color: d.isToday ? 'var(--gold-2)' : 'var(--ink)', marginTop:2 }}>{d.n}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:6, height:4 }}>
            {Array.from({length:d.lessons}).map((_,j)=>(
              <span key={j} style={{ width:4, height:4, borderRadius:'50%',
                                     background: d.isToday ? 'var(--gold-2)' : 'var(--ink-4)' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop:12, fontSize:11, color:'var(--ink-4)', textAlign:'center', fontFamily:'var(--mono)' }}>
      12 LESSONS · 9h TEACHING · 78% UTILIZATION
    </div>
  </div>
);

const TeacherUtilization = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'18px 20px', boxShadow:'var(--shadow-sm)',
  }}>
    <Eyebrow style={{ marginBottom:10 }}>This week vs last</Eyebrow>
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {[
        { label:'Teaching hours', curr:9.0, prev:7.5, unit:'h', max:15 },
        { label:'Practice logged (studio-wide)', curr:18.2, prev:16.8, unit:'h', max:25 },
        { label:'Songs assigned',  curr:14,  prev:11,  unit:'',  max:20 },
      ].map((m,i)=>{
        const delta = m.curr - m.prev;
        const dpos = delta >= 0;
        return (
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', fontSize:12 }}>
              <span style={{ color:'var(--ink-3)' }}>{m.label}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:11 }}>
                <span style={{ fontWeight:500 }}>{m.curr}{m.unit}</span>
                <span style={{ color: dpos ? 'var(--success)' : 'var(--danger)', marginLeft:6 }}>
                  {dpos ? '+' : ''}{delta.toFixed(m.unit ? 1 : 0)}
                </span>
              </span>
            </div>
            <div style={{ marginTop:6 }}>
              <ProgressBar value={m.curr} max={m.max} delay={120 * i} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TeacherStudentRoster = () => {
  const sorted = [...STUDENTS].sort((a,b) => {
    const order = { at_risk:0, needs_attention:1, good:2, excellent:3 };
    return order[a.health] - order[b.health];
  });
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
      padding:'20px 22px', boxShadow:'var(--shadow-sm)',
    }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <Eyebrow>Studio</Eyebrow>
          <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>6 active students</div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {['Health','Recent','A–Z'].map((t,i)=>(
            <button key={t} style={{
              padding:'4px 10px', borderRadius:999,
              background: i === 0 ? 'var(--ink)' : 'transparent',
              color: i === 0 ? 'var(--paper)' : 'var(--ink-3)',
              border: i === 0 ? 'none' : '1px solid var(--rule)',
              fontSize:10, cursor:'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {sorted.map((s, i) => (
          <div key={s.id} style={{
            display:'grid',
            gridTemplateColumns:'28px 1fr 80px 120px 60px',
            gap:12, alignItems:'center',
            padding:'10px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <Avatar s={s} size={26} />
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{s.name}</span>
                <HealthDot health={s.health} size={6} />
              </div>
              <div style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                {s.level.toUpperCase()} · {s.years}Y
              </div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)' }}>
              <div>{s.songs} songs</div>
              <div>{s.streak}w streak</div>
            </div>
            <ProgressBar value={s.progress} max={100} delay={80*i} color={
              s.health === 'at_risk' ? 'var(--danger)' :
              s.health === 'needs_attention' ? 'var(--warn)' :
              'var(--gold-2)'
            } />
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', textAlign:'right' }}>
              {s.nextLesson.startsWith('Today') ? (
                <span style={{ color:'var(--gold-2)', fontWeight:500 }}>{s.nextLesson.replace('Today · ', '')}</span>
              ) : s.nextLesson.replace('Apr ', '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TeacherSongLibrary = () => {
  const SONGS = [
    { title:'Hotel California',  author:'Eagles',         key:'Bm', capo:7, status:'remembered', assigned:4 },
    { title:'Blackbird',         author:'The Beatles',    key:'G',  capo:0, status:'started',    assigned:2 },
    { title:'Wish You Were Here',author:'Pink Floyd',     key:'C',  capo:0, status:'remembered', assigned:3 },
    { title:'Tears in Heaven',   author:'Eric Clapton',   key:'A',  capo:0, status:'with_author',assigned:1 },
    { title:'Classical Gas',     author:'Mason Williams', key:'C',  capo:0, status:'started',    assigned:1 },
  ];
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
      padding:'20px 22px', boxShadow:'var(--shadow-sm)',
    }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <Eyebrow>Song library · quick assign</Eyebrow>
          <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>128 songs in your library</div>
        </div>
        <a style={{ color:'var(--ink-4)', fontSize:12, cursor:'pointer' }}>Open library →</a>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {SONGS.map((s, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'56px 1fr auto auto', gap:12, alignItems:'center',
            padding:'10px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--gold-2)' }}>
              <span style={{ display:'block', fontSize:9, color:'var(--ink-4)', letterSpacing:'.1em' }}>KEY</span>
              {s.key}{s.capo > 0 && <span style={{ color:'var(--ink-4)' }}> · {s.capo}</span>}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:14, fontStyle:'italic', fontWeight:500 }}>{s.title}</div>
              <div style={{ fontSize:11, color:'var(--ink-4)' }}>{s.author}</div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)', textAlign:'right' }}>
              {s.assigned} assigned
            </div>
            <button style={{
              padding:'5px 10px', borderRadius:6, border:'1px solid var(--rule)',
              background:'var(--card)', color:'var(--ink-2)', fontSize:11, cursor:'pointer',
            }}>Assign</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MOBILE ───────────────────────────────────────────────────
const TeacherDashboardMobile = () => (
  <div className="app-viewport" style={{
    width:390, height:844, background:'var(--ivory)', color:'var(--ink)',
    overflow:'hidden', borderRadius:'var(--radius-lg)', display:'flex', flexDirection:'column',
  }}>
    <div style={{ height:44, padding:'12px 24px 0', display:'flex', justifyContent:'space-between',
                  alignItems:'center', fontFamily:'var(--mono)', fontSize:13, fontWeight:600 }}>
      <span>3:46</span><span>● ● ●</span>
    </div>
    <div style={{ padding:'8px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <Eyebrow>Thursday · Apr 23</Eyebrow>
        <div style={{ fontFamily:'var(--serif)', fontSize:24, marginTop:2, letterSpacing:'-0.02em' }}>
          Hi, <em style={{ color:'var(--gold-2)' }}>Sarah</em>
        </div>
      </div>
      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--ink-2)', color:'var(--paper)',
                    display:'grid', placeItems:'center', fontSize:13, fontWeight:600 }}>SC</div>
    </div>

    <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:12 }}>
      {/* Hero — next lesson big */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'var(--card)', borderRadius:16, border:'1px solid var(--gold-dim)',
        padding:'16px 18px 18px',
        boxShadow:'0 8px 24px -12px rgba(200,149,35,.35)',
      }}>
        <div style={{ position:'absolute', inset:0, opacity:0.5 }}>
          <StringVibration width={400} height={200} color="var(--gold-2)" opacity={0.10} />
        </div>
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <PulseDot size={6} />
            <Eyebrow style={{ color:'var(--gold-2)' }}>Next · in 14m</Eyebrow>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10 }}>
            <Avatar s={AGENDA[0].student} size={42} />
            <div>
              <div style={{ fontFamily:'var(--serif)', fontSize:22, letterSpacing:'-0.02em' }}>{AGENDA[0].student.name}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)' }}>4:00–4:45p · {AGENDA[0].student.level}</div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
            {AGENDA[0].songs.map((sg, i) => (
              <span key={i} style={{
                fontSize:11, padding:'3px 8px', borderRadius:6, background:'rgba(0,0,0,.04)',
                fontStyle:'italic', fontFamily:'var(--serif)',
              }}>
                <span style={{ fontFamily:'var(--mono)', fontStyle:'normal', color:'var(--gold-2)', marginRight:4 }}>{sg.key}</span>
                {sg.title}
              </span>
            ))}
          </div>
          <button style={{
            width:'100%', marginTop:14, padding:'12px',
            background:'var(--ink)', color:'var(--paper)', border:'none', borderRadius:10,
            fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            Open lesson prep →
          </button>
        </div>
      </div>

      {/* day spine */}
      <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'14px 16px', boxShadow:'var(--shadow-sm)' }}>
        <Eyebrow style={{ marginBottom:10 }}>Today · 3 lessons · 2h</Eyebrow>
        <div style={{ position:'relative', paddingLeft:50 }}>
          <span style={{
            position:'absolute', left:46, top:0, bottom:0, width:1, background:'var(--rule)',
          }} />
          {AGENDA.map((l, i) => (
            <div key={l.id} style={{
              position:'relative', marginBottom:10, padding:'10px 12px',
              border:'1px solid var(--rule)', borderRadius:10,
            }}>
              <div style={{
                position:'absolute', left:-50, top:8, fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-3)',
                width:36, textAlign:'right',
              }}>{l.time}</div>
              <span style={{
                position:'absolute', left:-9, top:14, width:8, height:8, borderRadius:'50%',
                background: i === 0 ? 'var(--gold-2)' : 'var(--card)',
                border:'1.5px solid ' + (i === 0 ? 'var(--gold-2)' : 'var(--ink-5)'),
              }} />
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Avatar s={l.student} size={22} />
                <span style={{ fontSize:13, fontWeight:500 }}>{l.student.name}</span>
                <HealthDot health={l.student.health} size={6} />
              </div>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', marginTop:4 }}>
                {l.duration} · {l.songs.length} pieces
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* needs attention */}
      <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'14px 16px', boxShadow:'var(--shadow-sm)' }}>
        <Eyebrow style={{ color:'var(--danger)', marginBottom:8 }}>Needs attention · 3</Eyebrow>
        {NEEDS_ATTN.map((n, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'auto 1fr', gap:10, alignItems:'center', padding:'8px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none', borderBottom:'1px solid var(--rule)',
          }}>
            <Avatar s={n.student} size={22} />
            <div>
              <div style={{ fontSize:12, fontWeight:500 }}>{n.student.name}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)' }}>{n.reason}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign:'center', fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', marginTop:6, letterSpacing:'.1em' }}>
        STUDIO · LIBRARY · WEEK
      </div>
    </div>
  </div>
);

window.TeacherDashboardNew = TeacherDashboardNew;
window.TeacherDashboardMobile = TeacherDashboardMobile;
