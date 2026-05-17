// Lesson Detail — full view of a single lesson.

const LessonDetail = ({ lessonId, role='teacher', onBack, onStartLive, onEdit }) => {
  const original = LESSONS.find(l => l.id === lessonId) || LESSONS[0];
  const [lesson, setLesson] = React.useState(original);
  const [expandedSong, setExpandedSong] = React.useState(null);

  const canEdit = role !== 'student';
  const d = formatLessonDate(lesson.scheduledAt);

  const setSongProgress = (songId, progress) => {
    if (!canEdit) return;
    setLesson({
      ...lesson,
      songs: lesson.songs.map(s => s.songId === songId ? { ...s, progress } : s),
    });
  };
  const setSongNote = (songId, note) => {
    if (!canEdit) return;
    setLesson({
      ...lesson,
      songs: lesson.songs.map(s => s.songId === songId ? { ...s, note } : s),
    });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, background:'var(--ivory)' }}>
      {/* breadcrumb + actions */}
      <div style={{
        padding:'20px 32px 0',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <button onClick={onBack} style={{
          ...btnGhost, padding:'6px 10px',
        }}>
          <Icon d={LI.back} size={12} /> Lessons
        </button>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>/</span>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)' }}>
          #{lesson.number} · {lesson.student.name}
        </span>
        <div style={{ flex:1 }} />
        {canEdit && lesson.status === 'scheduled' && (
          <button onClick={() => onStartLive && onStartLive(lesson.id)} style={{
            ...btnPrimary, background:'var(--gold-2)', color:'#fff',
          }}>
            <Icon d={LI.live} size={11} stroke="#fff" /> Start live lesson
          </button>
        )}
        {canEdit && (
          <>
            <button style={btnGhost}>
              <Icon d={LI.email} size={12} /> Recap email
            </button>
            <button onClick={onEdit} style={btnGhost}>
              <Icon d={LI.edit} size={12} /> Edit
            </button>
            <button style={{ ...btnGhost, color:'var(--danger)' }}>
              <Icon d={LI.trash} size={12} stroke="var(--danger)" />
            </button>
          </>
        )}
      </div>

      {/* hero */}
      <div style={{ padding:'22px 32px 18px', display:'flex', gap:20, alignItems:'flex-start' }}>
        <DateBlock iso={lesson.scheduledAt} size="lg" />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <LessonStatusPill status={lesson.status} />
            <span style={{
              fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)',
              padding:'2px 8px', background:'var(--rule-2)', borderRadius:4,
            }}>Lesson #{lesson.number}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>
              with {lesson.student.name.split(' ')[0]}
            </span>
          </div>
          <h1 style={{
            margin:0, fontFamily:'var(--serif)', fontWeight:400,
            fontSize:34, letterSpacing:'-0.02em', lineHeight:1.08,
            fontStyle: lesson.title ? 'normal' : 'italic',
            color: lesson.title ? 'var(--ink)' : 'var(--ink-4)',
          }}>
            {lesson.title || 'Untitled lesson'}
          </h1>
          <div style={{ display:'flex', gap:18, marginTop:10, fontSize:12, color:'var(--ink-3)' }}>
            <span><span style={{ color:'var(--ink-4)' }}>Time · </span><span style={{ fontFamily:'var(--mono)' }}>{formatLessonTime(lesson.scheduledAt)} · {lesson.duration} min</span></span>
            <span><span style={{ color:'var(--ink-4)' }}>Student · </span>{lesson.student.name}</span>
            <span><span style={{ color:'var(--ink-4)' }}>Teacher · </span>{lesson.teacher.name}</span>
          </div>
        </div>
      </div>

      {/* content grid */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 32px 40px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:20 }}>
          {/* LEFT — songs + notes */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Songs */}
            <Card>
              <CardHeader
                eyebrow="Repertoire"
                title={<>Songs <span style={{ color:'var(--ink-4)', fontSize:14, fontWeight:400 }}>· {lesson.songs.length}</span></>}
                action={canEdit ? <button style={btnGhost}><Icon d={LI.plusSmall} size={11}/> Add song</button> : null}
              />
              <div style={{ padding:'4px 24px 20px' }}>
                {lesson.songs.length === 0 && (
                  <div style={{
                    padding:'28px 0', textAlign:'center', color:'var(--ink-4)',
                    fontStyle:'italic', fontFamily:'var(--serif)', fontSize:16,
                  }}>No songs attached to this lesson.</div>
                )}
                {lesson.songs.map((ls, i) => {
                  const song = songById(ls.songId);
                  const isOpen = expandedSong === ls.songId;
                  return (
                    <div key={ls.songId} style={{
                      borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                      borderBottom:'1px solid var(--rule)',
                      padding:'16px 0',
                    }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                        <div style={{
                          width:42, height:42, borderRadius:6, flex:'0 0 42px',
                          background:'linear-gradient(135deg, var(--gold-dim), var(--gold-2))',
                          display:'grid', placeItems:'center',
                          fontFamily:'var(--serif)', fontSize:14, fontWeight:500, color:'#fff',
                          boxShadow:'inset 0 -1px 0 rgba(0,0,0,.2)',
                        }}>{song.key}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                            <span style={{ fontFamily:'var(--serif)', fontSize:17, fontWeight:500, fontStyle:'italic', letterSpacing:'-0.01em' }}>
                              {song.title}
                            </span>
                          </div>
                          <div style={{ color:'var(--ink-4)', fontSize:12, fontFamily:'var(--mono)' }}>
                            {song.author}{song.year ? ` · ${song.year}` : ''} · Key {song.key}
                          </div>
                          <div style={{ marginTop:12 }}>
                            <StageStepper
                              status={ls.progress}
                              onChange={(k) => setSongProgress(ls.songId, k)}
                              readOnly={!canEdit}
                            />
                          </div>
                          <button onClick={() => setExpandedSong(isOpen ? null : ls.songId)} style={{
                            marginTop:10, background:'none', border:'none', padding:0,
                            color:'var(--ink-4)', fontSize:11, fontFamily:'var(--mono)',
                            textTransform:'uppercase', letterSpacing:'.12em', cursor:'pointer',
                            display:'inline-flex', alignItems:'center', gap:4,
                          }}>
                            <Icon d={isOpen ? LI.chevD : LI.chev} size={10} />
                            {isOpen ? 'Hide notes & history' : (ls.note ? 'Notes & history' : 'Add note')}
                          </button>
                          {isOpen && (
                            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:12 }}>
                              <textarea
                                defaultValue={ls.note}
                                onBlur={e => setSongNote(ls.songId, e.target.value)}
                                readOnly={!canEdit}
                                placeholder="Per-lesson note on this song…"
                                style={{
                                  width:'100%', minHeight:72,
                                  padding:'10px 12px',
                                  border:'1px solid var(--rule)', borderRadius:6,
                                  background:'var(--paper)', color:'var(--ink-2)',
                                  fontFamily:'var(--sans)', fontSize:13, lineHeight:1.5,
                                  resize:'vertical',
                                }}
                              />
                              <div>
                                <div style={{
                                  fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
                                  textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6,
                                }}>History</div>
                                <div style={{ fontSize:12, color:'var(--ink-3)' }}>
                                  <HistoryRow date="Apr 21" note="Started · Alternating bass pattern introduced" />
                                  <HistoryRow date="Apr 16" note="To learn · Walked through form with recording" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <button style={{
                            padding:'6px 8px', background:'transparent', border:'none',
                            color:'var(--ink-4)', cursor:'pointer', borderRadius:6,
                          }} title="Assign as homework">
                            <Icon d={LI.plusSmall} size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Lesson notes */}
            <Card>
              <CardHeader eyebrow="Plan & observations" title="Lesson notes" />
              <div style={{ padding:'0 24px 22px' }}>
                {canEdit ? (
                  <textarea
                    defaultValue={lesson.notes}
                    placeholder="Lesson plan, goals, observations…"
                    style={{
                      width:'100%', minHeight:96,
                      padding:'12px 14px',
                      border:'1px solid var(--rule)', borderRadius:8,
                      background:'var(--paper)', color:'var(--ink)',
                      fontFamily:'var(--sans)', fontSize:13, lineHeight:1.55,
                      resize:'vertical',
                    }}
                  />
                ) : (
                  <div style={{
                    padding:'14px 16px', background:'var(--paper)',
                    border:'1px solid var(--rule)', borderRadius:8,
                    fontSize:13, lineHeight:1.55, color:'var(--ink-2)',
                  }}>
                    {lesson.notes || <em style={{ color:'var(--ink-4)' }}>No notes.</em>}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT — info + assignments */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Lesson info */}
            <Card>
              <CardHeader eyebrow="Details" title="Lesson info" />
              <div style={{ padding:'0 24px 22px', display:'flex', flexDirection:'column', gap:12 }}>
                <InfoRow label="Scheduled">
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>
                    {d.wday}, {d.mon} {d.day}, {d.year}
                  </span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:13, color:'var(--ink-4)', marginLeft:8 }}>
                    · {formatLessonTime(lesson.scheduledAt)}
                  </span>
                </InfoRow>
                <InfoRow label="Duration">
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{lesson.duration} min</span>
                </InfoRow>
                <InfoRow label="Student">
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Avatar s={lesson.student} size={22} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{lesson.student.name}</div>
                      <div style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                        {lesson.student.level} · {lesson.student.years}y
                      </div>
                    </div>
                  </div>
                </InfoRow>
                <InfoRow label="Teacher">
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{
                      width:22, height:22, borderRadius:'50%',
                      background:lesson.teacher.color, color:'#fff',
                      display:'grid', placeItems:'center', fontSize:10, fontWeight:600,
                    }}>{lesson.teacher.avatar}</div>
                    <span style={{ fontSize:13 }}>{lesson.teacher.name}</span>
                  </div>
                </InfoRow>
                <InfoRow label="Sequence">
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>
                    Lesson #{lesson.number} with {lesson.student.name.split(' ')[0]}
                  </span>
                </InfoRow>
              </div>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader
                eyebrow="Homework"
                title={<>Assignments <span style={{ color:'var(--ink-4)', fontSize:14, fontWeight:400 }}>· {lesson.assignments.length}</span></>}
                action={canEdit ? <button style={btnGhost}><Icon d={LI.plusSmall} size={11}/> Add</button> : null}
              />
              <div style={{ padding:'0 24px 22px' }}>
                {canEdit && lesson.songs.length > 0 && (
                  <button style={{
                    width:'100%', marginBottom: lesson.assignments.length ? 14 : 0,
                    padding:'10px 12px',
                    border:'1px dashed var(--rule)', borderRadius:8,
                    background:'transparent',
                    color:'var(--gold-2)', fontSize:12, cursor:'pointer',
                    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
                    fontFamily:'var(--sans)',
                  }}>
                    <Icon d={LI.copy} size={12} stroke="var(--gold-2)" />
                    Quick-assign from all {lesson.songs.length} songs
                  </button>
                )}
                {lesson.assignments.map((a, i) => (
                  <div key={a.id} style={{
                    display:'flex', alignItems:'flex-start', gap:10,
                    padding:'10px 0',
                    borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                    borderBottom:'1px solid var(--rule)',
                  }}>
                    <div style={{
                      width:16, height:16, marginTop:2,
                      borderRadius:4, border:'1.5px solid var(--rule)',
                      background: a.status === 'done' ? 'var(--success)' : 'var(--card)',
                      display:'grid', placeItems:'center', flex:'0 0 16px',
                    }}>
                      {a.status === 'done' && <Icon d={LI.check2} size={10} stroke="#fff" strokeWidth={2.4} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontSize:13, lineHeight:1.4,
                        textDecoration: a.status === 'done' ? 'line-through' : 'none',
                        color: a.status === 'done' ? 'var(--ink-4)' : 'var(--ink-2)',
                      }}>{a.title}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)', marginTop:2 }}>
                        Due {a.due.slice(5).replace('-', '/')}
                      </div>
                    </div>
                  </div>
                ))}
                {lesson.assignments.length === 0 && !canEdit && (
                  <div style={{ padding:'16px 0', color:'var(--ink-4)', fontSize:12, fontStyle:'italic', fontFamily:'var(--serif)' }}>
                    No homework yet.
                  </div>
                )}
              </div>
            </Card>

            {/* Continuity */}
            <Card>
              <CardHeader eyebrow="Continuity" title={`With ${lesson.student.name.split(' ')[0]}`} />
              <div style={{ padding:'0 24px 22px' }}>
                <div style={{ fontSize:12, color:'var(--ink-4)', fontFamily:'var(--mono)',
                              textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>Previous</div>
                <PrevLessonRow number={lesson.number - 1} date="Apr 16" summary="Introduced Blackbird — walked through form" />
                <PrevLessonRow number={lesson.number - 2} date="Apr 9"  summary="Em–G transitions · 60 BPM" />
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--rule)',
                              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'var(--ink-3)' }}>
                    {lesson.student.streak}-week streak
                  </span>
                  <HealthDot health={lesson.student.health} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponents
const Card = ({ children }) => (
  <div style={{
    background:'var(--card)', border:'1px solid var(--rule)',
    borderRadius:10, boxShadow:'var(--shadow-sm)', overflow:'hidden',
  }}>{children}</div>
);
const CardHeader = ({ eyebrow, title, action }) => (
  <div style={{ padding:'20px 24px 12px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
    <div>
      <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
                    textTransform:'uppercase', letterSpacing:'.14em', fontWeight:500 }}>{eyebrow}</div>
      <div style={{ fontFamily:'var(--serif)', fontSize:20, fontWeight:400, letterSpacing:'-0.01em', marginTop:2 }}>{title}</div>
    </div>
    {action}
  </div>
);
const InfoRow = ({ label, children }) => (
  <div style={{ display:'grid', gridTemplateColumns:'88px 1fr', alignItems:'center', gap:12 }}>
    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
                  textTransform:'uppercase', letterSpacing:'.12em' }}>{label}</div>
    <div>{children}</div>
  </div>
);
const HistoryRow = ({ date, note }) => (
  <div style={{ display:'grid', gridTemplateColumns:'56px 1fr', gap:10,
                padding:'6px 0', borderBottom:'1px solid var(--rule-2)' }}>
    <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{date}</div>
    <div>{note}</div>
  </div>
);
const PrevLessonRow = ({ number, date, summary }) => (
  <div style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid var(--rule-2)' }}>
    <span style={{
      fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
      padding:'2px 6px', background:'var(--rule-2)', borderRadius:4, height:'fit-content',
    }}>#{number}</span>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:12, fontFamily:'var(--mono)', color:'var(--ink-4)' }}>{date}</div>
      <div style={{ fontSize:13, color:'var(--ink-2)', marginTop:1 }}>{summary}</div>
    </div>
  </div>
);

// ── Mobile ────────────────────────────────────────────────────
const LessonDetailMobile = ({ lessonId, role='teacher', onBack, onStartLive }) => {
  const lesson = LESSONS.find(l => l.id === lessonId) || LESSONS[0];
  const d = formatLessonDate(lesson.scheduledAt);
  const canEdit = role !== 'student';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--ivory)', overflow:'hidden' }}>
      <StatusBar />
      {/* top nav */}
      <div style={{ padding:'4px 16px 10px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{
          width:32, height:32, borderRadius:'50%',
          background:'var(--card)', border:'1px solid var(--rule)',
          display:'grid', placeItems:'center', cursor:'pointer',
        }}>
          <Icon d={LI.back} size={13} />
        </button>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>
          Lesson #{lesson.number}
        </span>
        <div style={{ flex:1 }} />
        {canEdit && <button style={{ ...btnGhost, padding:'6px 10px' }}>
          <Icon d={LI.edit} size={12} />
        </button>}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 20px' }}>
        {/* hero */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
          <DateBlock iso={lesson.scheduledAt} size="md" />
          <div style={{ flex:1, minWidth:0 }}>
            <LessonStatusPill status={lesson.status} compact />
            <h1 style={{
              margin:'6px 0 4px', fontFamily:'var(--serif)', fontWeight:400,
              fontSize:22, letterSpacing:'-0.02em', lineHeight:1.1,
              fontStyle: lesson.title ? 'normal' : 'italic',
              color: lesson.title ? 'var(--ink)' : 'var(--ink-4)',
            }}>
              {lesson.title || 'Untitled lesson'}
            </h1>
            <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>
              {formatLessonTime(lesson.scheduledAt)} · {lesson.duration}m
            </div>
          </div>
        </div>

        {/* student */}
        <div style={{
          background:'var(--card)', border:'1px solid var(--rule)', borderRadius:10,
          padding:'12px 14px', marginBottom:12,
          display:'flex', alignItems:'center', gap:12,
        }}>
          <Avatar s={lesson.student} size={36} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:500 }}>{lesson.student.name}</div>
            <div style={{ fontSize:12, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
              {lesson.student.level} · {lesson.student.years}y
            </div>
          </div>
          <HealthDot health={lesson.student.health} size={10} />
        </div>

        {canEdit && lesson.status === 'scheduled' && (
          <button onClick={() => onStartLive && onStartLive(lesson.id)} style={{
            width:'100%', padding:'14px', borderRadius:10, border:'none',
            background:'var(--gold-2)', color:'#fff',
            fontSize:14, fontWeight:500, cursor:'pointer',
            display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
            marginBottom:12,
          }}>
            <Icon d={LI.live} size={12} stroke="#fff" /> Start live lesson
          </button>
        )}

        {/* songs */}
        <MobileSection title="Songs" count={lesson.songs.length}>
          {lesson.songs.map((ls, i) => {
            const song = songById(ls.songId);
            return (
              <div key={ls.songId} style={{
                padding:'12px 0',
                borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                borderBottom: '1px solid var(--rule)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{
                    width:32, height:32, borderRadius:6, flex:'0 0 32px',
                    background:'linear-gradient(135deg, var(--gold-dim), var(--gold-2))',
                    display:'grid', placeItems:'center',
                    fontFamily:'var(--serif)', fontSize:12, fontWeight:500, color:'#fff',
                  }}>{song.key}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--serif)', fontSize:15, fontStyle:'italic', fontWeight:500 }}>{song.title}</div>
                    <div style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>{song.author}</div>
                  </div>
                </div>
                <StageStepper status={ls.progress} readOnly={!canEdit} size="sm" />
              </div>
            );
          })}
        </MobileSection>

        {/* notes */}
        <MobileSection title="Notes">
          <div style={{
            padding:'10px 12px', background:'var(--paper)',
            border:'1px solid var(--rule)', borderRadius:8,
            fontSize:13, lineHeight:1.5, color:'var(--ink-2)',
          }}>
            {lesson.notes || <em style={{ color:'var(--ink-4)' }}>No notes.</em>}
          </div>
        </MobileSection>

        {/* assignments */}
        {lesson.assignments.length > 0 && (
          <MobileSection title="Assignments" count={lesson.assignments.length}>
            {lesson.assignments.map((a, i) => (
              <div key={a.id} style={{
                display:'flex', gap:10, padding:'10px 0',
                borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                borderBottom:'1px solid var(--rule)',
              }}>
                <div style={{
                  width:16, height:16, marginTop:2,
                  borderRadius:4, border:'1.5px solid var(--rule)',
                  background: a.status === 'done' ? 'var(--success)' : 'var(--card)',
                  display:'grid', placeItems:'center', flex:'0 0 16px',
                }}>
                  {a.status === 'done' && <Icon d={LI.check2} size={10} stroke="#fff" strokeWidth={2.4} />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, lineHeight:1.4 }}>{a.title}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)', marginTop:2 }}>
                    Due {a.due.slice(5).replace('-','/')}
                  </div>
                </div>
              </div>
            ))}
          </MobileSection>
        )}
      </div>
    </div>
  );
};

const MobileSection = ({ title, count, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      display:'flex', alignItems:'baseline', gap:8, padding:'6px 2px',
      fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)',
      textTransform:'uppercase', letterSpacing:'.14em', marginBottom:4,
    }}>
      <span>{title}</span>
      {count != null && <span style={{ color:'var(--ink-3)' }}>· {count}</span>}
    </div>
    <div style={{
      background:'var(--card)', border:'1px solid var(--rule)',
      borderRadius:10, padding:'4px 14px 10px',
    }}>
      {children}
    </div>
  </div>
);

Object.assign(window, {
  LessonDetail, LessonDetailMobile, Card, CardHeader, InfoRow,
});
