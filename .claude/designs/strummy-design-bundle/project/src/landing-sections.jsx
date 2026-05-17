// Landing — Body sections: Problem→Solution (day-in-the-life), Features,
// Integrations, Metrics, Founder, Beta card, Final CTA.

// ─── SECTION 1: Day in the life ────────────────────────────────
const DayInTheLife = () => {
  const before = [
    { time:'7:45a', text:'Dig through 6 WhatsApp threads to remember what Emma worked on last week.' },
    { time:'11:20a', text:'Email a parent a "progress update" you half-invent from memory.' },
    { time:'2:10p',  text:'Can\'t find the tab for "Blackbird" you promised Carlos three weeks ago.' },
    { time:'4:00p',  text:'Lesson starts. First ten minutes: catching up on your own notes.' },
    { time:'9:30p',  text:'Tonight\'s admin: copy assignments into a spreadsheet. Again.' },
  ];
  const after = [
    { time:'7:45a', text:'Open Strummy. See everyone you\'re teaching today, what they worked on, what broke.' },
    { time:'11:20a', text:'Parent report auto-drafted from lesson notes. Send in one click.' },
    { time:'2:10p',  text:'"Blackbird" is in the shared library, tabs attached, marked as started.' },
    { time:'4:00p',  text:'Lesson starts. AI summary from last session is already on screen.' },
    { time:'9:30p',  text:'You\'re done. Admin happened automatically during the day.' },
  ];

  const column = (rows, tone) => (
    <div style={{
      background: tone === 'after' ? 'var(--card)' : 'var(--paper)',
      border:'1px solid var(--rule)',
      borderRadius: 14,
      padding:'28px 32px',
      position:'relative',
      overflow:'hidden',
    }}>
      {tone === 'before' && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:`repeating-linear-gradient(-45deg,
            transparent 0, transparent 9px,
            color-mix(in oklab, var(--ink-5) 25%, transparent) 9px,
            color-mix(in oklab, var(--ink-5) 25%, transparent) 10px)`,
          opacity:.25,
        }} />
      )}
      <div style={{ position:'relative' }}>
        <div style={{
          display:'flex', alignItems:'baseline', gap:10, marginBottom:24,
        }}>
          <span style={{
            fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.18em',
            textTransform:'uppercase',
            color: tone === 'before' ? 'var(--danger)' : 'var(--success)',
          }}>
            {tone === 'before' ? 'Before' : 'After'}
          </span>
          <span style={{ fontFamily:'var(--serif)', fontSize:28, letterSpacing:'-0.02em', color:'var(--ink)' }}>
            {tone === 'before' ? 'Thursday, the hard way.' : 'Thursday, with Strummy.'}
          </span>
        </div>

        <div>
          {rows.map((r, i) => (
            <div key={i} style={{
              display:'grid',
              gridTemplateColumns:'58px 14px 1fr',
              gap:14,
              padding:'14px 0',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom:'1px solid var(--rule)',
              alignItems:'flex-start',
            }}>
              <div style={{
                fontFamily:'var(--mono)', fontSize:12,
                color: tone === 'before' ? 'var(--ink-4)' : 'var(--ink-2)',
                fontWeight:500, paddingTop:1,
              }}>{r.time}</div>
              <div style={{ position:'relative', height:'100%' }}>
                <span style={{
                  position:'absolute', top:7, left:5, width:6, height:6, borderRadius:'50%',
                  background: tone === 'before' ? 'var(--ink-5)' : 'var(--gold)',
                }} />
                {i !== rows.length - 1 && (
                  <span style={{
                    position:'absolute', top:17, left:7, bottom:-14, width:1,
                    background: tone === 'before' ? 'var(--ink-5)' : 'var(--gold-dim)',
                    opacity:.6,
                  }} />
                )}
              </div>
              <div style={{
                fontSize:14,
                lineHeight:1.45,
                color: tone === 'before' ? 'var(--ink-3)' : 'var(--ink-2)',
                textWrap:'pretty',
              }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'100px 0', background:'var(--ivory)' }}>
      <LandingContainer>
        <div style={{ textAlign:'center', marginBottom:56, maxWidth:780, margin:'0 auto 56px' }}>
          <SectionKicker align="center">A Thursday</SectionKicker>
          <Display size={56} align="center" style={{ marginBottom:18 }}>
            You didn't get into teaching to manage <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>spreadsheets</em>.
          </Display>
          <div style={{
            fontSize:17, lineHeight:1.55, color:'var(--ink-3)',
            maxWidth:620, margin:'0 auto',
          }}>
            Most guitar teachers we talked to spend eight hours a week on admin
            they don't get paid for. Here's what a normal day looks like.
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          {column(before, 'before')}
          {column(after, 'after')}
        </div>
      </LandingContainer>
    </div>
  );
};

// ─── SECTION 2: Feature showcases ──────────────────────────────
// Feature 1: Student profile — real-ish mock UI built from primitives.
const Feature1Screenshot = () => {
  const s = students[0];
  const cardBase = {
    background:'var(--card)',
    border:'1px solid var(--rule)',
    borderRadius: 10,
  };
  return (
    <BrowserFrame url={`app.strummy.app/students/${s.id}`} height={480}>
      <div style={{ width:'100%', height:'100%', display:'flex', background:'var(--ivory)', fontSize:12, lineHeight:1.4, overflow:'hidden' }}>
        {/* skinny sidebar hint */}
        <div style={{ width:48, flex:'0 0 48px', background:'var(--paper)', borderRight:'1px solid var(--rule)', padding:'12px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{ width:24, height:24, borderRadius:6, background:'linear-gradient(135deg, var(--gold), var(--gold-2))' }} />
          {[I.home, I.lesson, I.students, I.song, I.stats, I.calendar].map((d, i) => (
            <div key={i} style={{ color: i === 2 ? 'var(--ink)' : 'var(--ink-4)' }}>
              <Icon d={d} size={14} />
            </div>
          ))}
        </div>
        <div style={{ flex:1, padding:'20px 24px', overflow:'hidden' }}>
          {/* breadcrumb */}
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--ink-4)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:10 }}>
            Students · Intermediate
          </div>
          {/* header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
            <Avatar s={s} size={52} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:26, letterSpacing:'-0.02em', fontWeight:400 }}>{s.name}</div>
              <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:3, color:'var(--ink-3)', fontSize:12 }}>
                <HealthDot health={s.health} /> Excellent
                <span>·</span>
                <span>2.3 years with you</span>
                <span>·</span>
                <span>Next: Today · 4:00p</span>
              </div>
            </div>
            <button style={{ padding:'6px 12px', border:'1px solid var(--rule)', background:'var(--card)', borderRadius:6, fontSize:11 }}>Message</button>
            <button style={{ padding:'6px 12px', background:'var(--ink)', color:'var(--paper)', border:'none', borderRadius:6, fontSize:11 }}>+ Lesson</button>
          </div>

          {/* stat grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
            {[
              { l:'Songs', v:'14', s:'5 mastered' },
              { l:'Practice', v:'11', s:'day streak' },
              { l:'Lessons', v:'48', s:'all time' },
              { l:'Skill', v:'62', s:'% proficient' },
            ].map((st, i) => (
              <div key={i} style={{ ...cardBase, padding:'10px 12px' }}>
                <div style={{ color:'var(--ink-4)', fontSize:9, textTransform:'uppercase', letterSpacing:'.1em' }}>{st.l}</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:22, fontWeight:400, letterSpacing:'-0.03em', lineHeight:1, marginTop:2 }}>{st.v}</div>
                <div style={{ fontSize:9, color:'var(--ink-4)', marginTop:2 }}>{st.s}</div>
              </div>
            ))}
          </div>

          {/* body: two columns */}
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:10 }}>
            <div style={{ ...cardBase, padding:'12px 14px' }}>
              <div style={{ color:'var(--ink-4)', fontSize:9, textTransform:'uppercase', letterSpacing:'.14em', marginBottom:8, fontWeight:500 }}>Repertoire</div>
              {[
                { title:'Blackbird', author:'The Beatles', st:'started', k:'G' },
                { title:'Landslide', author:'Fleetwood Mac', st:'remembered', k:'C' },
                { title:'Classical Gas', author:'Mason Williams', st:'to_learn', k:'Am' },
                { title:'Dust in the Wind', author:'Kansas', st:'mastered', k:'C' },
              ].map((sg, i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'24px 1fr auto', gap:10, padding:'7px 0',
                  borderTop: i===0 ? '1px solid var(--rule)' : 'none',
                  borderBottom:'1px solid var(--rule)',
                  alignItems:'center',
                }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--gold-2)' }}>{sg.k}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontStyle:'italic', fontFamily:'var(--serif)', fontSize:12 }}>{sg.title}</div>
                    <div style={{ fontSize:9, color:'var(--ink-4)' }}>{sg.author}</div>
                  </div>
                  <StatusPill status={sg.st} compact />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ ...cardBase, padding:'12px 14px' }}>
                <div style={{ color:'var(--ink-4)', fontSize:9, textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6, fontWeight:500 }}>Practice · 14 days</div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:40 }}>
                  {[18,24,12,30,22,36,28,40,34,26,32,38,44,40].map((v, i) => (
                    <div key={i} style={{ flex:1, height: `${v/44*100}%`, background: i >= 12 ? 'var(--gold)' : 'var(--ink-5)', borderRadius:1.5 }} />
                  ))}
                </div>
              </div>
              <div style={{ ...cardBase, padding:'12px 14px' }}>
                <div style={{ color:'var(--ink-4)', fontSize:9, textTransform:'uppercase', letterSpacing:'.14em', marginBottom:6, fontWeight:500 }}>AI lesson notes · last session</div>
                <div style={{ fontSize:11, color:'var(--ink-2)', lineHeight:1.5 }}>
                  <em style={{ fontFamily:'var(--serif)', fontSize:12 }}>"Alternating bass pattern is solid at 60 BPM. Right-hand independence is the next hurdle — suggest fingerpicking drill for 10 min/day."</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

const FEATURES = [
  {
    n: '01',
    kicker: 'Students',
    title: 'Every student, their whole journey.',
    body: 'Profiles, lesson history, repertoire, skill progression, practice streaks, parent contacts — all on one page. The thing you kept meaning to build in Notion.',
    bullets: ['AI-drafted progress reports', 'Parent-ready PDF summaries', 'Skill-tracked songs & scales'],
    render: <Feature1Screenshot />,
  },
  {
    n: '02',
    kicker: 'Lessons',
    title: 'Schedule it. Run it. Move on.',
    body: 'Google Calendar sync means no double-booked 4 o\'clocks. Live lesson view on your iPad. When you close the session, Strummy writes the notes for you.',
    bullets: ['Two-way Google Calendar sync', 'In-lesson live session mode', 'AI-generated lesson summaries'],
    render: <Placeholder label="lessons.png" note="screenshot · drop in later" height={480} />,
  },
  {
    n: '03',
    kicker: 'Library',
    title: 'A thousand songs, tabs already found.',
    body: '1,000+ songs with chords, tabs, and Spotify-enriched metadata. Difficulty ratings. One click to add to a student\'s repertoire.',
    bullets: ['Auto-tagged difficulty', 'Spotify previews attached', 'Shared across your whole studio'],
    render: <Placeholder label="songs.png" note="screenshot · drop in later" height={480} />,
  },
  {
    n: '04',
    kicker: 'Fretboard',
    title: 'A fretboard that plays back.',
    body: 'Scales, chords, and CAGED positions — mapped, coloured, audible. Quiz mode turns theory into muscle memory. Runs in any browser.',
    bullets: ['Scales · CAGED · arpeggios', 'Click a note, hear a note', 'Training quizzes for students'],
    render: <Placeholder label="fretboard screenshot" note="live component available" height={480} />,
  },
];

const FeatureRow = ({ f, flip }) => (
  <div style={{
    padding:'72px 0',
    borderTop:'1px solid var(--rule)',
  }}>
    <div style={{
      display:'grid',
      gridTemplateColumns: flip ? '1.15fr 1fr' : '1fr 1.15fr',
      gap:72,
      alignItems:'center',
    }}>
      {/* Copy */}
      <div style={{ order: flip ? 2 : 1 }}>
        <div style={{
          fontFamily:'var(--mono)', fontSize:52, color:'var(--gold-dim)',
          letterSpacing:'-0.02em', lineHeight:1, marginBottom:12,
        }}>{f.n}</div>
        <Eyebrow style={{ marginBottom:14, color:'var(--gold-2)' }}>{f.kicker}</Eyebrow>
        <Display size={44} style={{ marginBottom:16, maxWidth:460 }}>
          {f.title}
        </Display>
        <div style={{
          fontSize:16, lineHeight:1.6, color:'var(--ink-3)',
          maxWidth:460, marginBottom:22, textWrap:'pretty',
        }}>
          {f.body}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {f.bullets.map((b, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'var(--ink-2)' }}>
              <span style={{
                width:18, height:18, borderRadius:'50%',
                background:'var(--gold-tint)',
                color:'var(--gold-2)',
                display:'grid', placeItems:'center',
                flex:'0 0 18px',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </span>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div style={{ order: flip ? 1 : 2, position:'relative' }}>
        {f.render}
      </div>
    </div>
  </div>
);

const FeatureShowcases = () => (
  <div style={{ padding:'60px 0 120px', background:'var(--paper)' }}>
    <LandingContainer>
      <div style={{ textAlign:'center', padding:'40px 0 20px', maxWidth:780, margin:'0 auto' }}>
        <SectionKicker align="center">The product</SectionKicker>
        <Display size={56} align="center" style={{ marginBottom:18 }}>
          Four corners of a <em style={{ color:'var(--gold-2)' }}>teaching practice</em>.
        </Display>
      </div>
      {FEATURES.map((f, i) => (
        <FeatureRow key={f.n} f={f} flip={i % 2 === 1} />
      ))}
    </LandingContainer>
  </div>
);

// ─── SECTION 3: Integrations bar (text wordmarks) ──────────────
const IntegrationsBar = () => {
  const ints = [
    { name:'Google Calendar', sub:'Lesson sync' },
    { name:'Spotify',         sub:'Song metadata' },
    { name:'Gmail',           sub:'Student contact' },
    { name:'Google Drive',    sub:'Sheet music' },
  ];
  return (
    <div style={{ padding:'56px 0', background:'var(--ivory)', borderTop:'1px solid var(--rule)', borderBottom:'1px solid var(--rule)' }}>
      <LandingContainer>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 3fr', gap:48, alignItems:'center' }}>
          <div>
            <Eyebrow style={{ marginBottom:10 }}>Works with</Eyebrow>
            <div style={{ fontFamily:'var(--serif)', fontSize:24, letterSpacing:'-0.02em', lineHeight:1.15, color:'var(--ink)' }}>
              The tools you already live in.
            </div>
          </div>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24,
          }}>
            {ints.map(i => (
              <div key={i.name} style={{
                padding:'18px 20px',
                border:'1px solid var(--rule)',
                borderRadius:10,
                background:'var(--card)',
                display:'flex', flexDirection:'column', gap:4,
              }}>
                <div style={{
                  fontSize:15, fontWeight:500, color:'var(--ink)',
                  letterSpacing:'-0.01em',
                }}>{i.name}</div>
                <div style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)', letterSpacing:'.08em', textTransform:'uppercase' }}>
                  {i.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </LandingContainer>
    </div>
  );
};

// ─── SECTION 4: Metrics strip ──────────────────────────────────
const MetricsStrip = () => {
  const stats = [
    { v:'1,040', u:'lessons tracked this month',      fn: 'Across live studios' },
    { v:'1,200+', u:'songs in the library',            fn: 'Tabs, chords, Spotify enriched' },
    { v:'27', u:'teachers in public beta',              fn: 'In 3 countries' },
    { v:'8hrs', u:'of admin saved per teacher, weekly', fn: 'Self-reported, early users' },
  ];
  return (
    <div style={{ padding:'96px 0', background:'var(--ivory)' }}>
      <LandingContainer>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <SectionKicker align="center">Honest numbers</SectionKicker>
          <Display size={48} align="center">
            Small studio, <em style={{ color:'var(--gold-2)' }}>real traction</em>.
          </Display>
        </div>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0,
          border:'1px solid var(--rule)', borderRadius:14,
          background:'var(--card)',
          overflow:'hidden',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding:'36px 32px',
              borderLeft: i === 0 ? 'none' : '1px solid var(--rule)',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                fontFamily:'var(--serif)', fontSize:64, fontWeight:400,
                letterSpacing:'-0.04em', lineHeight:1, color:'var(--ink)',
              }}>{s.v}</div>
              <div style={{ color:'var(--ink-2)', fontSize:14, marginTop:10, lineHeight:1.4 }}>{s.u}</div>
              <div style={{
                color:'var(--ink-4)', fontSize:11, marginTop:6,
                fontFamily:'var(--mono)', letterSpacing:'.08em', textTransform:'uppercase',
              }}>{s.fn}</div>
              {/* subtle staff lines bottom */}
              <div style={{ position:'absolute', bottom:-4, left:24, right:24, height:20, opacity:.2 }}>
                <StaffLines width="100%" height={20} color="var(--ink-4)" strokeWidth={0.5} />
              </div>
            </div>
          ))}
        </div>
      </LandingContainer>
    </div>
  );
};

// ─── SECTION 5: Founder story ──────────────────────────────────
const FounderStory = () => {
  return (
    <div style={{ padding:'96px 0', background:'var(--paper)', borderTop:'1px solid var(--rule)', borderBottom:'1px solid var(--rule)' }}>
      <LandingContainer>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:80, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <div style={{
              width:'100%', aspectRatio:'4 / 5',
              border:'1px solid var(--rule)',
              background:`repeating-linear-gradient(135deg,
                var(--rule-2) 0px, var(--rule-2) 1px,
                transparent 1px, transparent 9px)`,
              backgroundColor:'var(--card)',
              borderRadius:12,
              display:'grid', placeItems:'center',
              position:'relative',
              overflow:'hidden',
            }}>
              <div style={{
                padding:'8px 12px',
                border:'1px solid var(--rule)',
                background:'var(--card)',
                borderRadius:6,
                fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-3)',
                textAlign:'center',
              }}>
                <div style={{ color:'var(--gold-2)', fontSize:9, letterSpacing:'.12em', textTransform:'uppercase' }}>Portrait</div>
                <div>founder.jpg</div>
              </div>
              {/* staff lines running through */}
              <div style={{ position:'absolute', top:'50%', left:0, right:0, transform:'translateY(-50%)', opacity:.15 }}>
                <StaffLines width="100%" height={100} color="var(--ink)" strokeWidth={0.7} />
              </div>
            </div>
            {/* caption */}
            <div style={{ marginTop:14, fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)', letterSpacing:'.08em', textTransform:'uppercase' }}>
              Brooklyn, NY · Est. 2024
            </div>
          </div>

          <div>
            <SectionKicker>Who made this</SectionKicker>
            <Display size={44} style={{ marginBottom:24 }}>
              Built by a guitar teacher who was <em style={{ color:'var(--gold-2)' }}>tired of his own spreadsheets</em>.
            </Display>
            <div style={{
              fontSize:17, lineHeight:1.7, color:'var(--ink-2)',
              fontFamily:'var(--serif)', fontStyle:'italic',
              marginBottom:22,
              textWrap:'pretty',
            }}>
              "I taught guitar for nine years in Brooklyn — twenty-odd students, mostly kids. Every Sunday I'd sit down with Google Sheets and try to remember what each of them worked on. I built Strummy because I didn't want to do that anymore. I'm still teaching. I still use it every day."
            </div>
            <div style={{ fontSize:14, color:'var(--ink-3)', marginBottom:22 }}>
              <span style={{ color:'var(--ink-2)', fontWeight:500 }}>Placeholder copy</span> — drop in a real founder quote, name, and a photo.
            </div>
            <BtnGhost>
              Read the full story
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </BtnGhost>
          </div>
        </div>
      </LandingContainer>
    </div>
  );
};

// ─── SECTION 6: Beta card ──────────────────────────────────────
const BetaCard = () => {
  return (
    <div style={{ padding:'80px 0 40px', background:'var(--ivory)' }}>
      <LandingContainer>
        <div style={{
          maxWidth: 720, margin:'0 auto',
          border:'1px solid var(--rule)',
          borderRadius: 16,
          background:'var(--card)',
          padding:'40px 44px',
          position:'relative',
          overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:-20, right:-20, width:160, height:160,
            background:'radial-gradient(circle, var(--gold-tint) 0%, transparent 70%)',
            opacity:.8, pointerEvents:'none',
          }} />
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <span style={{
                padding:'3px 10px', borderRadius:999,
                background:'var(--gold-tint)', color:'var(--gold-2)',
                fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', fontWeight:500,
              }}>Public beta</span>
              <span style={{ color:'var(--ink-4)', fontSize:12, fontFamily:'var(--mono)' }}>v0.8 · Apr 2026</span>
            </div>
            <Display size={34} style={{ marginBottom:14 }}>
              Free while we're in beta. All features included.
            </Display>
            <div style={{ fontSize:15, color:'var(--ink-3)', lineHeight:1.55, marginBottom:22, maxWidth:540, textWrap:'pretty' }}>
              No cards on file, no feature gates, no surprise upsells. When we launch paid tiers, beta teachers keep access to everything they're using at a permanent discount.
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <BtnPrimary>Start free</BtnPrimary>
              <BtnGhost>See what's shipped</BtnGhost>
            </div>
          </div>
        </div>
      </LandingContainer>
    </div>
  );
};

// ─── SECTION 7: Final CTA band (gold gradient) ─────────────────
const FinalCTA = () => {
  return (
    <div style={{
      padding:'110px 0',
      background:`linear-gradient(135deg,
        var(--gold-tint) 0%,
        color-mix(in oklab, var(--gold-dim) 35%, var(--paper)) 60%,
        var(--gold-dim) 100%)`,
      borderTop:'1px solid color-mix(in oklab, var(--gold-2) 35%, transparent)',
      borderBottom:'1px solid color-mix(in oklab, var(--gold-2) 35%, transparent)',
      position:'relative',
      overflow:'hidden',
    }}>
      {/* decorative fretboard + staff */}
      <div style={{ position:'absolute', inset:0, opacity:.12, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'50%', left:0, right:0, transform:'translateY(-50%)' }}>
          <Fretboard frets={24} width="100%" height={110} color="var(--ink)" />
        </div>
      </div>

      <div style={{ position:'relative' }}>
        <LandingContainer>
          <div style={{ textAlign:'center', maxWidth:820, margin:'0 auto' }}>
            <div style={{
              fontFamily:'var(--mono)', fontSize:11, letterSpacing:'.22em', textTransform:'uppercase',
              color:'var(--ink-2)', marginBottom:24,
            }}>
              — Ready when you are —
            </div>
            <Display size={76} align="center" style={{ marginBottom:24, color:'var(--ink)' }}>
              Teach more.<br/>
              <em style={{ color:'var(--ink-2)' }}>Admin less.</em>
            </Display>
            <div style={{
              fontSize:18, lineHeight:1.55, color:'var(--ink-2)',
              maxWidth:560, margin:'0 auto 36px', textWrap:'pretty',
            }}>
              Start free. No credit card. Bring one student or twenty — Strummy scales to however you teach.
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <BtnPrimary size="lg">
                Get started — free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </BtnPrimary>
              <BtnGhost size="lg" style={{ borderColor:'color-mix(in oklab, var(--ink) 25%, transparent)', color:'var(--ink-2)' }}>
                Try the demo
              </BtnGhost>
            </div>
          </div>
        </LandingContainer>
      </div>
    </div>
  );
};

Object.assign(window, {
  DayInTheLife,
  FeatureShowcases,
  IntegrationsBar,
  MetricsStrip,
  FounderStory,
  BetaCard,
  FinalCTA,
});
