// Student dashboard — "What do I practice today?"
// HERO: countdown to next lesson (left) + today's practice set list (right)
// SECONDARY: progress, songs, recap, achievements
// Mobile-first single column; desktop is 2-col with hero spanning full width.

const StudentDashboard = ({ width = 1440, height = 1024 }) => {
  return (
    <div className="app-viewport" style={{
      width, height, display:'flex',
      background:'var(--ivory)',
      color:'var(--ink)',
      fontSize:13, lineHeight:1.4, overflow:'hidden',
      borderRadius:'var(--radius-lg)',
    }}>
      <SidebarNav active="home" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <TopBar variant="student" />
        <div style={{ flex:1, overflowY:'auto', padding:'24px 32px 64px', background:'var(--ivory)' }}>
          <StudentHero />
          <StudentSecondary />
        </div>
      </div>
    </div>
  );
};

// ─── HERO ────────────────────────────────────────────────────
const StudentHero = () => {
  const { with: teacher, withAvatar, withColor, when, time, inMinutes, duration, location, agenda } = STUDENT_NEXT_LESSON;
  const h = Math.floor(inMinutes/60), m = inMinutes%60;

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      background:'var(--card)',
      border:'1px solid var(--rule)',
      borderRadius:18,
      boxShadow:'0 1px 2px rgba(26,22,19,.04), 0 10px 40px -20px rgba(26,22,19,.08)',
      marginBottom:24,
      display:'grid',
      gridTemplateColumns:'1.05fr 1fr',
      minHeight: 380,
    }}>
      {/* ambient string vibration */}
      <div style={{ position:'absolute', inset:0, opacity:0.55 }}>
        <StringVibration width={1400} height={380} color="var(--gold-2)" opacity={0.10} />
      </div>

      {/* LEFT — countdown */}
      <div style={{
        position:'relative', padding:'34px 38px 32px',
        display:'flex', flexDirection:'column', gap:18,
        borderRight:'1px solid var(--rule)',
        background:'linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--gold-tint) 35%, transparent) 100%)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <PulseDot color="var(--gold-2)" />
          <Eyebrow style={{ color:'var(--gold-2)' }}>Next lesson</Eyebrow>
        </div>

        <div>
          <div style={{
            fontFamily:'var(--serif)', fontSize:64, fontWeight:400, letterSpacing:'-0.035em',
            lineHeight:0.95, color:'var(--ink)',
          }}>
            in <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>{h}h {m}m</em>
          </div>
          <div style={{ marginTop:12, color:'var(--ink-3)', fontSize:15, lineHeight:1.45, maxWidth:480 }}>
            with{' '}
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, verticalAlign:'middle' }}>
              <span style={{
                width:22, height:22, borderRadius:'50%', background:withColor,
                color:'#fff', fontSize:10, fontWeight:600,
                display:'inline-flex', alignItems:'center', justifyContent:'center',
              }}>{withAvatar}</span>
              <span style={{ color:'var(--ink)', fontWeight:500 }}>{teacher}</span>
            </span>
            {' · '}<span style={{ fontFamily:'var(--mono)' }}>{when} {time}</span>
            {' · '}{duration} · {location}
          </div>
        </div>

        {/* day strip */}
        <div style={{ marginTop:8 }}>
          <Eyebrow style={{ marginBottom:8 }}>This week</Eyebrow>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, maxWidth:380 }}>
            {['M','T','W','T','F','S','S'].map((d,i)=>{
              const mins = ME_STUDENT.practiceWeek[i];
              const isToday = i === 3;
              return (
                <div key={i} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  padding:'6px 0',
                  borderRadius:8,
                  background: isToday ? 'var(--card)' : 'transparent',
                  border: isToday ? '1px solid var(--gold-dim)' : '1px solid transparent',
                }}>
                  <div style={{
                    fontSize:9, textTransform:'uppercase', letterSpacing:'.12em',
                    fontFamily:'var(--mono)',
                    color: isToday ? 'var(--gold-2)' : 'var(--ink-4)',
                  }}>{d}</div>
                  {/* vertical bar */}
                  <div style={{
                    width:6, height:36, borderRadius:3, background:'var(--rule-2)',
                    position:'relative', overflow:'hidden',
                  }}>
                    <div style={{
                      position:'absolute', bottom:0, left:0, right:0,
                      height: `${Math.min(100, (mins/45)*100)}%`,
                      background: isToday ? 'var(--gold-2)' : mins === 0 ? 'transparent' : 'var(--ink-4)',
                      borderRadius:3,
                      transition:'height 1.2s cubic-bezier(.22,.61,.36,1)',
                    }} />
                  </div>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:9,
                    color: isToday ? 'var(--gold-2)' : 'var(--ink-4)',
                    fontWeight: isToday ? 600 : 400,
                  }}>{mins || '·'}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex:1 }} />

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button style={{
            padding:'12px 20px',
            background:'var(--ink)', color:'var(--paper)',
            border:'none', borderRadius:10, fontSize:13, fontWeight:500,
            cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
            boxShadow:'0 6px 16px -8px rgba(26,22,19,.4)',
          }}>
            <Icon d={I.play} size={11} stroke="none" fill="var(--paper)" /> Start today's practice
          </button>
          <button style={{
            padding:'12px 16px', background:'transparent', color:'var(--ink-2)',
            border:'1px solid var(--rule)', borderRadius:10, fontSize:13, fontWeight:500,
            cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8,
          }}>
            Reschedule
          </button>
        </div>
      </div>

      {/* RIGHT — today's practice set list */}
      <div style={{ position:'relative', padding:'34px 38px 32px', display:'flex', flexDirection:'column', gap:14, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div>
            <Eyebrow>Today's practice</Eyebrow>
            <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:400, letterSpacing:'-0.01em', marginTop:2 }}>
              30 min · 3 pieces
            </div>
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>
            <CountUp to={ME_STUDENT.practiceMinToday} fmt={n=>Math.round(n)} />/{ME_STUDENT.practiceGoal} min
          </div>
        </div>

        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {STUDENT_PRACTICE_TODAY.map((p, i) => (
            <PracticeRow key={i} idx={i} item={p} />
          ))}
        </div>

        <div style={{
          marginTop:'auto',
          background:'var(--rule-2)',
          border:'1px dashed var(--gold-dim)',
          borderRadius:10,
          padding:'10px 14px',
          fontSize:12, color:'var(--ink-3)', lineHeight:1.45,
          display:'flex', gap:10, alignItems:'flex-start',
        }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:withColor, color:'#fff',
                        display:'grid', placeItems:'center', fontSize:10, fontWeight:600, flex:'0 0 22px' }}>{withAvatar}</div>
          <div>
            <span style={{ color:'var(--ink-2)', fontWeight:500 }}>Sarah's note:</span>{' '}
            <em style={{ fontStyle:'italic' }}>"Focus on right-hand independence. Slow is fast."</em>
          </div>
        </div>
      </div>
    </div>
  );
};

const PracticeRow = ({ idx, item }) => {
  const [done, setDone] = useStateD(item.done);
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'28px 38px 1fr auto auto',
      gap:14, alignItems:'center',
      padding:'12px 0',
      borderTop:'1px solid var(--rule)',
    }}>
      <button onClick={()=>setDone(d=>!d)} style={{
        width:22, height:22, borderRadius:'50%',
        border:'1.5px solid ' + (done ? 'var(--gold-2)' : 'var(--ink-5)'),
        background: done ? 'var(--gold-2)' : 'transparent',
        cursor:'pointer', display:'grid', placeItems:'center', padding:0,
      }}>
        {done && <Icon d={I.check} size={11} stroke="#fff" strokeWidth={2.2} />}
      </button>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', textAlign:'right' }}>
        <span style={{ display:'block', fontSize:9, letterSpacing:'.1em' }}>KEY</span>
        <span style={{ display:'block', color: item.key === '—' ? 'var(--ink-5)' : 'var(--gold-2)', fontSize:12, fontWeight:500 }}>{item.key}</span>
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{
          fontFamily:'var(--serif)', fontSize:17, fontStyle: item.kind === 'song' ? 'italic' : 'normal',
          fontWeight:500, letterSpacing:'-0.01em',
          textDecoration: done ? 'line-through' : 'none',
          color: done ? 'var(--ink-4)' : 'var(--ink)',
        }}>{item.title}</div>
        <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:2 }}>{item.sub}</div>
      </div>
      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)' }}>{item.mins}m</div>
      <button style={{
        width:30, height:30, borderRadius:'50%',
        background:'var(--rule-2)', border:'none', cursor:'pointer',
        display:'grid', placeItems:'center', color:'var(--ink-2)',
      }}>
        <Icon d={I.play} size={11} stroke="none" fill="currentColor" />
      </button>
    </div>
  );
};

// ─── SECONDARY ───────────────────────────────────────────────
const StudentSecondary = () => {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:20 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <StudentLastLessonCard />
        <StudentSongsCard />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <StudentStreakCard />
        <StudentActivityCard />
        <StudentAchievementsCard />
      </div>
    </div>
  );
};

const StudentLastLessonCard = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'22px 24px', boxShadow:'var(--shadow-sm)',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
      <div>
        <Eyebrow>Last lesson · recap</Eyebrow>
        <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>{STUDENT_LAST_LESSON.when}</div>
      </div>
      <a style={{ color:'var(--ink-4)', fontSize:12, cursor:'pointer' }}>Open lesson →</a>
    </div>
    <div style={{
      fontSize:14, color:'var(--ink-2)', lineHeight:1.55,
      paddingLeft:14, borderLeft:'2px solid var(--gold-dim)',
      fontStyle:'italic', fontFamily:'var(--serif)',
    }}>
      "{STUDENT_LAST_LESSON.recap}"
    </div>
    <div style={{ marginTop:16 }}>
      <Eyebrow style={{ marginBottom:8 }}>Homework</Eyebrow>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {STUDENT_LAST_LESSON.homework.map((h, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'22px 1fr auto', gap:12, alignItems:'center',
            padding:'8px 0', borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <div style={{
              width:18, height:18, borderRadius:4,
              border:'1.5px solid ' + (h.done ? 'var(--success)' : 'var(--ink-5)'),
              background: h.done ? 'var(--success)' : 'transparent',
              display:'grid', placeItems:'center',
            }}>{h.done && <Icon d={I.check} size={10} stroke="#fff" strokeWidth={2.4} />}</div>
            <div style={{
              fontSize:13, color: h.done ? 'var(--ink-4)' : 'var(--ink-2)',
              textDecoration: h.done ? 'line-through' : 'none',
            }}>{h.task}</div>
            {!h.done && h.progress !== undefined && (
              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{h.progress}/7d</div>
            )}
            {h.done && <Eyebrow style={{ color:'var(--success)' }}>Done</Eyebrow>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StudentSongsCard = () => {
  const [filter, setFilter] = useStateD('all');
  const songs = filter === 'all'
    ? STUDENT_SONGS
    : STUDENT_SONGS.filter(s => s.status === filter);
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
      padding:'22px 24px', boxShadow:'var(--shadow-sm)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <div>
          <Eyebrow>Repertoire</Eyebrow>
          <div style={{ fontFamily:'var(--serif)', fontSize:18, marginTop:2 }}>
            {ME_STUDENT.totalSongs} songs · <span style={{ color:'var(--success)' }}>{ME_STUDENT.mastered} mastered</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, background:'var(--rule-2)', padding:3, borderRadius:999, fontSize:11 }}>
          {[
            ['all','All'], ['to_learn','To learn'], ['started','Started'],
            ['remembered','Remembered'], ['with_author','With author'], ['mastered','Mastered'],
          ].map(([k,l]) => (
            <button key={k} onClick={()=>setFilter(k)} style={{
              padding:'4px 10px', border:'none', borderRadius:999, cursor:'pointer',
              background: filter === k ? 'var(--card)' : 'transparent',
              color: filter === k ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: filter === k ? 500 : 400,
              boxShadow: filter === k ? 'var(--shadow-sm)' : 'none',
              fontFamily:'var(--sans)', fontSize:11,
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column' }}>
        {songs.map((s, i) => (
          <div key={i} style={{
            display:'grid',
            gridTemplateColumns:'40px 1fr 200px 80px 28px',
            gap:14, alignItems:'center',
            padding:'12px 0',
            borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--gold-2)', textAlign:'left' }}>
              <span style={{ display:'block', fontSize:9, color:'var(--ink-4)', letterSpacing:'.1em' }}>KEY</span>
              {s.key}{s.capo > 0 && <span style={{ color:'var(--ink-4)' }}> · capo {s.capo}</span>}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:16, fontStyle:'italic', fontWeight:500 }}>{s.title}</div>
              <div style={{ fontSize:11, color:'var(--ink-4)', marginTop:1 }}>{s.author}</div>
            </div>
            <div>
              <FretProgress status={s.status} width={170} height={22} showLabels={false} />
              <div style={{ marginTop:4 }}>
                <StatusPill status={s.status} compact />
              </div>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)', textAlign:'right' }}>
              <div>{s.myMins}m</div>
              <div style={{ fontSize:10, marginTop:1 }}>{s.lastPracticed}</div>
            </div>
            <Icon d={I.chevron} size={14} style={{ color:'var(--ink-4)' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const StudentStreakCard = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'22px 24px', boxShadow:'var(--shadow-sm)',
    position:'relative', overflow:'hidden',
  }}>
    <div style={{ position:'absolute', top:-10, right:-10, opacity:0.5 }}>
      <Icon d={I.flame} size={80} stroke="var(--gold-dim)" fill="var(--gold-tint)" strokeWidth={1} />
    </div>
    <Eyebrow style={{ color:'var(--gold-2)' }}>Streak</Eyebrow>
    <div style={{
      fontFamily:'var(--serif)', fontSize:64, fontWeight:400, letterSpacing:'-0.03em', lineHeight:1, marginTop:6,
      color:'var(--ink)',
    }}>
      <CountUp to={ME_STUDENT.streak} />
      <span style={{ fontSize:22, color:'var(--ink-4)', marginLeft:8, fontStyle:'italic' }}>days</span>
    </div>
    <div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>
      3 more days to your <span style={{ color:'var(--gold-2)', fontWeight:500 }}>14-day badge</span>
    </div>
    <div style={{ marginTop:14 }}>
      <ProgressBar value={ME_STUDENT.streak} max={14} delay={120} />
    </div>
  </div>
);

const StudentActivityCard = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'22px 24px', boxShadow:'var(--shadow-sm)',
  }}>
    <Eyebrow style={{ marginBottom:12 }}>Activity</Eyebrow>
    <div style={{ display:'flex', flexDirection:'column' }}>
      {STUDENT_ACTIVITY.map((a, i) => {
        const c = { assignment:'var(--gold-2)', mastered:'var(--success)', lesson:'var(--info)', note:'var(--ink-2)', practice:'var(--ink-2)' }[a.type];
        return (
          <div key={a.id} style={{
            display:'grid', gridTemplateColumns:'14px 1fr auto', gap:12, alignItems:'flex-start',
            padding:'10px 0', borderTop: i === 0 ? '1px solid var(--rule)' : 'none', borderBottom:'1px solid var(--rule)',
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:c, marginTop:5 }} />
            <div style={{ fontSize:12, lineHeight:1.45 }}>
              <span style={{ color:c, fontWeight:500 }}>{a.label}</span>{' '}
              <span style={{ color:'var(--ink-2)' }}>{a.obj}</span>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)' }}>
              <TimeAgo minutes={a.mins} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const StudentAchievementsCard = () => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)', borderRadius:14,
    padding:'22px 24px', boxShadow:'var(--shadow-sm)',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
      <Eyebrow>Achievements</Eyebrow>
      <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{ME_STUDENT.achievements}/12</span>
    </div>
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {STUDENT_ACHIEVEMENTS.map((a, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'32px 1fr auto', gap:12, alignItems:'center',
          opacity: a.unlocked ? 1 : 0.65,
        }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background: a.unlocked ? 'var(--gold-tint)' : 'var(--rule-2)',
            display:'grid', placeItems:'center',
            border: a.unlocked ? '1px solid var(--gold-dim)' : '1px dashed var(--rule)',
          }}>
            <Icon d={a.unlocked ? I.mastered : I.spark} size={14} stroke={a.unlocked ? 'var(--gold-2)' : 'var(--ink-4)'} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>{a.name}</div>
            <div style={{ fontSize:11, color:'var(--ink-4)' }}>{a.sub}</div>
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color: a.unlocked ? 'var(--success)' : 'var(--ink-4)' }}>
            {a.unlocked ? a.when : `${a.progress}/${a.max}`}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── MOBILE ───────────────────────────────────────────────────
const StudentDashboardMobile = () => {
  const { with: teacher, withAvatar, withColor, time, inMinutes, duration } = STUDENT_NEXT_LESSON;
  const h = Math.floor(inMinutes/60), m = inMinutes%60;
  return (
    <div className="app-viewport" style={{
      width:390, height:844, background:'var(--ivory)', color:'var(--ink)',
      overflow:'hidden', borderRadius:'var(--radius-lg)',
      display:'flex', flexDirection:'column',
    }}>
      {/* status bar */}
      <div style={{
        height:44, padding:'12px 24px 0', display:'flex',
        justifyContent:'space-between', alignItems:'center',
        fontFamily:'var(--mono)', fontSize:13, fontWeight:600,
      }}>
        <span>4:42</span>
        <span>● ● ●</span>
      </div>
      {/* header */}
      <div style={{ padding:'8px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <Eyebrow>Thursday · Apr 23</Eyebrow>
          <div style={{ fontFamily:'var(--serif)', fontSize:24, marginTop:2, letterSpacing:'-0.02em' }}>
            Hi, <em style={{ color:'var(--gold-2)' }}>Liam</em>
          </div>
        </div>
        <div style={{ width:36, height:36, borderRadius:'50%', background:ME_STUDENT.color,
                      color:'#fff', display:'grid', placeItems:'center', fontSize:13, fontWeight:600 }}>
          {ME_STUDENT.avatar}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Hero — pinned countdown */}
        <div style={{
          position:'relative', overflow:'hidden',
          background:'var(--card)', borderRadius:16, border:'1px solid var(--rule)',
          padding:'18px 18px 20px', boxShadow:'var(--shadow-sm)',
        }}>
          <div style={{ position:'absolute', inset:0, opacity:0.4 }}>
            <StringVibration width={400} height={220} color="var(--gold-2)" opacity={0.12} />
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <PulseDot size={6} />
              <Eyebrow style={{ color:'var(--gold-2)' }}>Lesson with {teacher}</Eyebrow>
            </div>
            <div style={{
              fontFamily:'var(--serif)', fontSize:52, lineHeight:0.95, letterSpacing:'-0.035em',
              fontWeight:400, marginTop:8,
            }}>in <em style={{ color:'var(--gold-2)' }}>{h}h {m}m</em></div>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)', marginTop:8 }}>
              {time} · {duration} · Studio A
            </div>
            <button style={{
              width:'100%', marginTop:14, padding:'12px',
              background:'var(--ink)', color:'var(--paper)', border:'none', borderRadius:10,
              fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              <Icon d={I.play} size={11} stroke="none" fill="var(--paper)" /> Start today's practice
            </button>
          </div>
        </div>

        {/* practice today */}
        <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'18px', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
            <Eyebrow>Today's practice</Eyebrow>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{ME_STUDENT.practiceMinToday}/{ME_STUDENT.practiceGoal} min</span>
          </div>
          <div style={{ fontFamily:'var(--serif)', fontSize:18, marginBottom:10 }}>30 min · 3 pieces</div>
          <ProgressBar value={ME_STUDENT.practiceMinToday} max={ME_STUDENT.practiceGoal} delay={100} />
          <div style={{ marginTop:10, display:'flex', flexDirection:'column' }}>
            {STUDENT_PRACTICE_TODAY.map((p,i)=>(
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'20px 1fr auto', gap:10, alignItems:'center',
                padding:'10px 0', borderTop: i === 0 ? '1px solid var(--rule)' : 'none', borderBottom:'1px solid var(--rule)',
              }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:'1.5px solid var(--ink-5)' }} />
                <div>
                  <div style={{ fontFamily:'var(--serif)', fontSize:14, fontStyle: p.kind === 'song' ? 'italic' : 'normal', fontWeight:500 }}>{p.title}</div>
                  <div style={{ fontSize:11, color:'var(--ink-4)' }}>{p.sub}</div>
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)' }}>{p.mins}m</div>
              </div>
            ))}
          </div>
        </div>

        {/* streak strip */}
        <div style={{
          background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'16px 18px',
          display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14,
          boxShadow:'var(--shadow-sm)',
        }}>
          {[
            { label:'Streak', value:`${ME_STUDENT.streak}d`, accent:'var(--gold-2)' },
            { label:'Songs', value:ME_STUDENT.totalSongs },
            { label:'Mastered', value:ME_STUDENT.mastered, accent:'var(--success)' },
          ].map((m,i)=>(
            <div key={i} style={{ textAlign:'center', borderLeft: i === 0 ? 'none' : '1px solid var(--rule)' }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:24, letterSpacing:'-0.02em', color: m.accent || 'var(--ink)', fontWeight:500 }}>{m.value}</div>
              <Eyebrow style={{ marginTop:2 }}>{m.label}</Eyebrow>
            </div>
          ))}
        </div>

        {/* recap */}
        <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--rule)', padding:'16px 18px', boxShadow:'var(--shadow-sm)' }}>
          <Eyebrow>Last lesson</Eyebrow>
          <div style={{
            marginTop:8, fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, lineHeight:1.5,
            paddingLeft:12, borderLeft:'2px solid var(--gold-dim)', color:'var(--ink-2)',
          }}>"{STUDENT_LAST_LESSON.recap.slice(0, 140)}…"</div>
        </div>

        {/* bottom hint */}
        <div style={{ textAlign:'center', fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', marginTop:6, letterSpacing:'.1em' }}>
          KEEP SCROLLING · REPERTOIRE · ACHIEVEMENTS · ACTIVITY
        </div>
      </div>
    </div>
  );
};

window.StudentDashboard = StudentDashboard;
window.StudentDashboardMobile = StudentDashboardMobile;
