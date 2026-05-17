// Landing page — full composition (desktop + mobile artboards).

const LandingPageDesktop = () => (
  <div style={{
    width:'100%',
    background:'var(--ivory)',
    color:'var(--ink)',
    fontFamily:'var(--sans)',
    fontFeatureSettings:'"ss01","cv11"',
    WebkitFontSmoothing:'antialiased',
    overflow:'hidden',
  }}>
    <LandingNav />
    <LandingHero />
    <DayInTheLife />
    <FeatureShowcases />
    <IntegrationsBar />
    <MetricsStrip />
    <FounderStory />
    <BetaCard />
    <FinalCTA />
    <LandingFooter />
  </div>
);

// ─── Mobile (390 wide) ─────────────────────────────────────────
const LandingPageMobile = () => {
  const cardBase = {
    background:'var(--card)',
    border:'1px solid var(--rule)',
    borderRadius: 12,
  };
  return (
    <div style={{
      width:390,
      background:'var(--ivory)',
      color:'var(--ink)',
      fontFamily:'var(--sans)',
      fontSize:13,
      lineHeight:1.4,
      overflow:'hidden',
    }}>
      {/* Nav */}
      <LandingNav compact width={390} />

      {/* Hero */}
      <div style={{ padding:'32px 22px 40px', position:'relative', overflow:'hidden' }}>
        <div style={{
          position:'absolute', inset:'20px -40px auto auto', width:260, height:200,
          background:'radial-gradient(circle, var(--gold-tint), transparent 70%)',
          pointerEvents:'none',
        }} />
        <div style={{ position:'relative' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'4px 10px 4px 4px',
            border:'1px solid var(--rule)',
            borderRadius:999,
            background:'var(--card)',
            marginBottom:20,
          }}>
            <span style={{
              padding:'2px 8px', borderRadius:999,
              background:'var(--gold-tint)', color:'var(--gold-2)',
              fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase',
            }}>Public beta</span>
            <span style={{ fontSize:11, color:'var(--ink-3)' }}>Free for teachers</span>
          </div>

          <h1 style={{
            margin:0,
            fontFamily:'var(--serif)',
            fontWeight:400, fontSize:48, lineHeight:1.02, letterSpacing:'-0.028em',
            marginBottom:16,
            textWrap:'balance',
          }}>
            The studio your students <em style={{ color:'var(--gold-2)' }}>deserve</em>.
          </h1>

          <div style={{
            fontSize:15, lineHeight:1.55, color:'var(--ink-3)',
            marginBottom:24, textWrap:'pretty',
          }}>
            A calm, crafted workspace for guitar teachers. Lessons, students, songs, progress — organised the way a working musician thinks.
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            <BtnPrimary size="md" style={{ justifyContent:'center', width:'100%' }}>
              Start free →
            </BtnPrimary>
            <BtnGhost size="md" style={{ justifyContent:'center', width:'100%' }}>
              Watch the 2-min tour
            </BtnGhost>
          </div>

          {/* Hero screenshot */}
          <div style={{ marginTop:12, position:'relative' }}>
            <BrowserFrame url="strummy.app" height={360}>
              <HeroDashboard />
            </BrowserFrame>
          </div>
        </div>
      </div>

      {/* Problem section — condensed */}
      <div style={{ padding:'48px 22px', background:'var(--paper)', borderTop:'1px solid var(--rule)', borderBottom:'1px solid var(--rule)' }}>
        <SectionKicker>A Thursday</SectionKicker>
        <h2 style={{
          margin:'6px 0 18px', fontFamily:'var(--serif)', fontWeight:400,
          fontSize:30, letterSpacing:'-0.02em', lineHeight:1.08,
          textWrap:'balance',
        }}>
          You didn't get into teaching to manage <em style={{ color:'var(--gold-2)' }}>spreadsheets</em>.
        </h2>
        <div style={{ fontSize:14, color:'var(--ink-3)', lineHeight:1.55, marginBottom:24 }}>
          Most guitar teachers we spoke to spend eight hours a week on admin they don't get paid for.
        </div>

        {/* condensed timeline */}
        <div style={{ ...cardBase, padding:'18px 18px' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--danger)', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:10 }}>Before</div>
          {[
            { t:'7:45a', x:'Dig through WhatsApp to remember what Emma worked on.' },
            { t:'2:10p', x:'Can\'t find the tab for "Blackbird" you promised Carlos.' },
            { t:'9:30p', x:'Copy tonight\'s assignments into a spreadsheet. Again.' },
          ].map((r, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'48px 1fr', gap:10,
              padding:'8px 0',
              borderTop: i===0 ? '1px solid var(--rule)' : 'none',
              borderBottom:'1px solid var(--rule)',
            }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-4)' }}>{r.t}</div>
              <div style={{ fontSize:12, color:'var(--ink-3)' }}>{r.x}</div>
            </div>
          ))}
        </div>
        <div style={{ ...cardBase, padding:'18px 18px', marginTop:12 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--success)', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:10 }}>After</div>
          {[
            { t:'7:45a', x:'Open Strummy. See everyone. Notes, songs, what broke.' },
            { t:'2:10p', x:'"Blackbird" is in the shared library, tabs attached.' },
            { t:'9:30p', x:'Done. Admin happened automatically during the day.' },
          ].map((r, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'48px 1fr', gap:10,
              padding:'8px 0',
              borderTop: i===0 ? '1px solid var(--rule)' : 'none',
              borderBottom:'1px solid var(--rule)',
            }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--ink-2)', fontWeight:500 }}>{r.t}</div>
              <div style={{ fontSize:12, color:'var(--ink-2)' }}>{r.x}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features condensed */}
      <div style={{ padding:'48px 22px' }}>
        <SectionKicker>The product</SectionKicker>
        <h2 style={{
          margin:'6px 0 24px', fontFamily:'var(--serif)', fontWeight:400,
          fontSize:30, letterSpacing:'-0.02em', lineHeight:1.08,
          textWrap:'balance',
        }}>
          Four corners of a <em style={{ color:'var(--gold-2)' }}>teaching practice</em>.
        </h2>
        {[
          { n:'01', k:'Students', t:'Every student, their whole journey.', b:'Profiles, lesson history, repertoire, skill progression.' },
          { n:'02', k:'Lessons', t:'Schedule it. Run it. Move on.', b:'Google Calendar sync. AI-generated lesson notes.' },
          { n:'03', k:'Library', t:'A thousand songs, tabs already found.', b:'Chords, tabs, Spotify metadata, difficulty ratings.' },
          { n:'04', k:'Fretboard', t:'A fretboard that plays back.', b:'Scales, CAGED, quizzes. Runs in the browser.' },
        ].map((f, i) => (
          <div key={f.n} style={{
            padding:'22px 0',
            borderTop: i===0 ? '1px solid var(--rule)' : 'none',
            borderBottom:'1px solid var(--rule)',
          }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:24, color:'var(--gold-dim)', lineHeight:1, marginBottom:8 }}>{f.n}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--gold-2)', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:6 }}>{f.k}</div>
            <div style={{ fontFamily:'var(--serif)', fontSize:22, letterSpacing:'-0.02em', lineHeight:1.15, marginBottom:8 }}>{f.t}</div>
            <div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.55 }}>{f.b}</div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ padding:'48px 22px', background:'var(--paper)', borderTop:'1px solid var(--rule)', borderBottom:'1px solid var(--rule)' }}>
        <SectionKicker>Honest numbers</SectionKicker>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16 }}>
          {[
            { v:'1,040', u:'lessons / month' },
            { v:'1,200+', u:'songs' },
            { v:'27', u:'teachers in beta' },
            { v:'8hr', u:'saved weekly' },
          ].map((s, i) => (
            <div key={i} style={{ ...cardBase, padding:'16px' }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:32, fontWeight:400, letterSpacing:'-0.04em', lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:6 }}>{s.u}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{
        padding:'64px 22px',
        background:`linear-gradient(135deg, var(--gold-tint) 0%, var(--gold-dim) 100%)`,
        textAlign:'center',
      }}>
        <h2 style={{
          margin:0, fontFamily:'var(--serif)', fontWeight:400,
          fontSize:40, lineHeight:1.02, letterSpacing:'-0.028em',
          marginBottom:14,
        }}>
          Teach more.<br/>
          <em style={{ color:'var(--ink-2)' }}>Admin less.</em>
        </h2>
        <div style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.55, marginBottom:22, maxWidth:300, margin:'0 auto 22px' }}>
          Start free. No credit card. However you teach.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <BtnPrimary size="md" style={{ justifyContent:'center', width:'100%' }}>Get started — free</BtnPrimary>
          <BtnGhost size="md" style={{ justifyContent:'center', width:'100%', borderColor:'color-mix(in oklab, var(--ink) 25%, transparent)' }}>Try the demo</BtnGhost>
        </div>
      </div>

      <LandingFooter compact />
    </div>
  );
};

Object.assign(window, { LandingPageDesktop, LandingPageMobile });
