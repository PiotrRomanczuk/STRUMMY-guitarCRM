// FretboardExplorer — the full /dashboard/fretboard page.
// Desktop 3-column layout inside the existing sidebar + topbar shell.

const { useState: useFE, useMemo: useFEMemo, useEffect: useFEEffect, useRef: useFERef } = React;

// ─── tiny helpers ───
const feCard = {
  background: 'var(--card)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
};
const feLabel = {
  color:'var(--ink-4)', fontSize:10, textTransform:'uppercase',
  letterSpacing:'.14em', fontWeight:500,
};
const feHead = {
  fontFamily:'var(--serif)', fontSize:18, fontWeight:500,
  letterSpacing:'-0.01em', marginTop:2,
};

// Segmented control
const FESeg = ({ value, onChange, options, size='md' }) => (
  <div style={{
    display:'inline-flex',
    background:'var(--rule-2)',
    borderRadius: 999, padding: 2, gap: 2,
  }}>
    {options.map(o => (
      <button key={o.value}
        onClick={() => onChange(o.value)}
        style={{
          border:'none',
          background: value === o.value ? 'var(--card)' : 'transparent',
          color: value === o.value ? 'var(--ink)' : 'var(--ink-3)',
          padding: size==='sm' ? '3px 9px' : '5px 12px',
          borderRadius: 999,
          fontSize: size==='sm' ? 11 : 12,
          fontWeight: value === o.value ? 500 : 400,
          cursor:'pointer',
          boxShadow: value === o.value ? 'var(--shadow-sm)' : 'none',
          fontFamily:'var(--sans)',
        }}>
        {o.label}
      </button>
    ))}
  </div>
);

// Key selector: 12-note grid + flat/sharp toggle
const KeySelector = ({ selectedKey, onChange, useFlats, onFlatsToggle }) => {
  const notes = useFlats ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  const canonical = useFlats ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={feLabel}>Key</div>
        <FESeg size="sm" value={useFlats ? 'b' : '#'} onChange={(v)=>onFlatsToggle(v==='b')}
               options={[{value:'#', label:'♯'}, {value:'b', label:'♭'}]} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:4 }}>
        {CHROMATIC_SHARP.map((sharp, i) => {
          const disp = useFlats ? CHROMATIC_FLAT[i] : sharp;
          const active = selectedKey === sharp;
          const isAccidental = sharp.length > 1;
          return (
            <button key={sharp} onClick={() => onChange(sharp)}
              style={{
                padding:'10px 0',
                border: active ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                background: active ? 'var(--gold)' : (isAccidental ? 'var(--rule-2)' : 'var(--card)'),
                color: active ? '#fff' : 'var(--ink)',
                fontFamily:'var(--serif)',
                fontSize: 16, fontWeight: 500,
                letterSpacing:'-0.01em',
                borderRadius: 8,
                cursor:'pointer',
                boxShadow: active ? '0 1px 4px rgba(177,127,18,.35)' : 'none',
                transition:'all .15s',
              }}>
              {disp}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Scale selector (with 4 quick-access buttons + dropdown)
const ScaleSelector = ({ value, onChange }) => {
  const quick = ['major','natural_minor','pentatonic_minor','blues'];
  const all = Object.keys(SCALE_DEFINITIONS);
  return (
    <div>
      <div style={{ ...feLabel, marginBottom: 8 }}>Scale</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:6 }}>
        {quick.map(k => {
          const active = value === k;
          return (
            <button key={k} onClick={() => onChange(k)}
              style={{
                padding:'7px 10px', textAlign:'left',
                border: active ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                background: active ? 'var(--gold-tint)' : 'var(--card)',
                color: active ? 'var(--gold-2)' : 'var(--ink-2)',
                borderRadius: 8, fontSize: 12, fontWeight: 500, cursor:'pointer',
              }}>
              {SCALE_DEFINITIONS[k].label}
            </button>
          );
        })}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', padding:'7px 10px',
          border:'1px solid var(--rule)', borderRadius:8,
          background:'var(--card)', color:'var(--ink-2)',
          fontSize: 12, fontFamily:'var(--sans)', cursor:'pointer',
        }}>
        {all.map(k => <option key={k} value={k}>{SCALE_DEFINITIONS[k].label}</option>)}
      </select>
    </div>
  );
};

// Chord selector
const ChordSelector = ({ value, onChange }) => {
  const chords = Object.keys(CHORD_DEFINITIONS);
  return (
    <div>
      <div style={{ ...feLabel, marginBottom: 8 }}>Chord</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
        {chords.map(k => {
          const active = value === k;
          return (
            <button key={k} onClick={() => onChange(k)}
              style={{
                padding:'7px 4px',
                border: active ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                background: active ? 'var(--gold-tint)' : 'var(--card)',
                color: active ? 'var(--gold-2)' : 'var(--ink-2)',
                borderRadius: 6, fontSize: 11, fontWeight: 500, cursor:'pointer',
                fontFamily: 'var(--mono)',
              }}>
              {CHORD_DEFINITIONS[k].symbol || 'maj'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// CAGED selector
const CAGEDSelector = ({ value, onChange }) => (
  <div>
    <div style={{ ...feLabel, marginBottom: 8 }}>CAGED Position</div>
    <div style={{ display:'flex', gap:3 }}>
      {['none','C','A','G','E','D','all'].map(s => {
        const active = value === s;
        const isShape = s.length === 1;
        return (
          <button key={s} onClick={() => onChange(s)}
            style={{
              flex: 1, padding: '9px 0',
              border: active ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
              background: active ? 'var(--gold)' : 'var(--card)',
              color: active ? '#fff' : 'var(--ink-2)',
              borderRadius: 6,
              fontFamily: isShape ? 'var(--serif)' : 'var(--sans)',
              fontSize: isShape ? 15 : 10,
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: isShape ? 0 : '.08em',
              textTransform: isShape ? 'none' : 'uppercase',
            }}>
            {s === 'none' ? 'Off' : s === 'all' ? 'All' : s}
          </button>
        );
      })}
    </div>
  </div>
);

// Toggle row
const FEToggle = ({ label, value, onChange, hint }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'8px 0', borderBottom:'1px solid var(--rule)',
  }}>
    <div>
      <div style={{ fontSize: 13, color:'var(--ink-2)' }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color:'var(--ink-4)', marginTop: 1 }}>{hint}</div>}
    </div>
    <button onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 999,
        border: 'none', padding: 0, cursor: 'pointer',
        background: value ? 'var(--gold)' : 'var(--ink-5)',
        position:'relative', transition:'background .15s',
      }}>
      <span style={{
        position:'absolute', top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius:'50%',
        background:'#fff', transition:'left .15s',
        boxShadow:'0 1px 2px rgba(0,0,0,.2)',
      }} />
    </button>
  </div>
);

// ─── Main component ───
const FretboardExplorer = ({
  initialKey = 'A',
  initialScale = 'pentatonic_minor',
  initialCaged = 'none',
  fretboardStyle = 'engraved',
}) => {
  // State
  const [key, setKey] = useFE(initialKey);
  const [mode, setMode] = useFE('scale');         // 'scale' | 'chord' | 'none'
  const [scaleKey, setScaleKey] = useFE(initialScale);
  const [chordKey, setChordKey] = useFE('minor');
  const [useFlats, setUseFlats] = useFE(false);
  const [showIntervals, setShowIntervals] = useFE(false);
  const [hideNonScale, setHideNonScale] = useFE(false);
  const [highlightRoot, setHighlightRoot] = useFE(true);
  const [cagedShape, setCagedShape] = useFE(initialCaged);
  const [bpm, setBpm] = useFE(120);
  const [volume, setVolume] = useFE(70);
  const [audioOn, setAudioOn] = useFE(true);
  const [playing, setPlaying] = useFE(false);
  const [playingCell, setPlayingCell] = useFE(null); // [stringIdx, fret]
  const [clickedCell, setClickedCell] = useFE(null);
  const clickTimer = useFERef();

  // Derived
  const activeNotes = useFEMemo(() => {
    if (mode === 'none') return [];
    if (mode === 'scale') return getScaleNotes(key, scaleKey);
    return getChordNotes(key, chordKey);
  }, [mode, key, scaleKey, chordKey]);

  const annotated = useFEMemo(
    () => annotateFretboard(key, activeNotes),
    [key, activeNotes]
  );

  const fretboard = useFEMemo(() => buildFretboard(), []);
  const cagedShapes = useFEMemo(
    () => getActiveCAGEDShapes(key, fretboard),
    [key, fretboard]
  );

  const currentDef = mode === 'scale' ? SCALE_DEFINITIONS[scaleKey]
                    : mode === 'chord' ? CHORD_DEFINITIONS[chordKey]
                    : null;
  const intervalLabels = useFEMemo(() => {
    if (mode === 'scale') return getScaleIntervals(scaleKey);
    if (mode === 'chord') return CHORD_DEFINITIONS[chordKey].intervals
      .map(iv => INTERVAL_NAMES[((iv % 12) + 12) % 12]);
    return [];
  }, [mode, scaleKey, chordKey]);

  // Note click handler (simulated — no real audio)
  const handleNoteClick = (stringIdx, fret, note) => {
    setClickedCell([stringIdx, fret]);
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setClickedCell(null), 300);
  };

  // Play scale simulation
  const playTimer = useFERef();
  const handlePlay = () => {
    if (playing) {
      setPlaying(false);
      setPlayingCell(null);
      clearTimeout(playTimer.current);
      return;
    }
    setPlaying(true);
    // Walk the scale ascending on a single string region for demo
    const notes = activeNotes;
    if (!notes.length) { setPlaying(false); return; }
    const stepMs = 60000 / bpm;
    // Pick positions along string idx 3 (G) as a simple demo
    const positions = [];
    for (let f = 0; f <= TOTAL_FRETS; f++) {
      if (notes.includes(noteAt(NOTE_INDEX[fretboard[3][f]]))) {
        positions.push([3, f]);
      }
      if (positions.length >= 8) break;
    }
    let i = 0;
    const tick = () => {
      if (i >= positions.length) {
        setPlaying(false);
        setPlayingCell(null);
        return;
      }
      setPlayingCell(positions[i]);
      i++;
      playTimer.current = setTimeout(tick, stepMs);
    };
    tick();
  };

  // URL sync (demo only — writes to hash)
  useFEEffect(() => {
    const params = new URLSearchParams();
    params.set('key', key);
    params.set('mode', mode);
    if (mode === 'scale') params.set('scale', scaleKey);
    if (mode === 'chord') params.set('chord', chordKey);
    if (cagedShape !== 'none') params.set('caged', cagedShape);
    // Just display — don't actually mutate window.location in an iframe.
  }, [key, mode, scaleKey, chordKey, cagedShape]);

  // Song integration chip demo
  const songChip = { title:'Wonderwall', type:'Song' };

  // Board size — responsive
  const boardRef = useFERef();
  const [boardW, setBoardW] = useFE(960);
  useFEEffect(() => {
    const update = () => {
      if (boardRef.current) {
        setBoardW(Math.max(720, boardRef.current.offsetWidth - 32));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const scaleNotes = mode === 'scale' ? activeNotes
                   : mode === 'chord' ? activeNotes
                   : [];

  return (
    <div className="app-viewport" style={{
      width:1440, height:1024, display:'flex',
      background:'var(--ivory)', color:'var(--ink)',
      fontSize:13, lineHeight:1.4,
      overflow:'hidden',
      borderRadius:'var(--radius-lg)',
    }}>
      <SidebarNav active="fretboard" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <TopBar variant="A" />

        <div style={{ flex:1, overflow:'hidden', display:'grid',
          gridTemplateColumns:'280px 1fr 260px', gap:0,
          background:'var(--ivory)',
        }}>

          {/* ─── LEFT: Controls ─── */}
          <aside style={{
            borderRight:'1px solid var(--rule)',
            background:'var(--paper)',
            padding:'20px 18px',
            overflowY:'auto',
            display:'flex', flexDirection:'column', gap: 18,
          }}>
            <div>
              <div style={{ color:'var(--ink-4)', fontSize:10, textTransform:'uppercase', letterSpacing:'.16em', fontFamily:'var(--mono)' }}>
                Studio tool
              </div>
              <h2 style={{
                fontFamily:'var(--serif)', fontWeight:500, fontSize:24,
                letterSpacing:'-0.02em', lineHeight:1.05, margin:'4px 0 2px',
              }}>
                Fretboard
              </h2>
              <div style={{ fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                STANDARD · E-A-D-G-B-e
              </div>
            </div>

            {/* Mode toggle */}
            <div>
              <div style={{ ...feLabel, marginBottom: 8 }}>Mode</div>
              <FESeg value={mode} onChange={setMode}
                options={[
                  {value:'scale', label:'Scale'},
                  {value:'chord', label:'Chord'},
                  {value:'none',  label:'Off'},
                ]} />
            </div>

            <KeySelector selectedKey={key} onChange={setKey}
                         useFlats={useFlats} onFlatsToggle={setUseFlats} />

            {mode === 'scale' && <ScaleSelector value={scaleKey} onChange={setScaleKey} />}
            {mode === 'chord' && <ChordSelector value={chordKey} onChange={setChordKey} />}

            <CAGEDSelector value={cagedShape} onChange={setCagedShape} />

            {/* Display toggles */}
            <div>
              <div style={{ ...feLabel, marginBottom: 4 }}>Display</div>
              <FEToggle label="Show intervals" hint="R, b3, 5 instead of note names"
                        value={showIntervals} onChange={setShowIntervals} />
              <FEToggle label="Hide non-scale notes"
                        value={hideNonScale} onChange={setHideNonScale} />
              <FEToggle label="Highlight root"
                        value={highlightRoot} onChange={setHighlightRoot} />
            </div>

            {/* Audio controls */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={feLabel}>Playback</div>
                <span style={{ fontSize: 10, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                  {audioOn ? 'AUDIO ON' : 'MUTED'}
                </span>
              </div>
              <button onClick={handlePlay}
                style={{
                  width:'100%', padding:'10px 12px',
                  background: playing ? 'var(--gold-tint)' : 'var(--ink)',
                  color: playing ? 'var(--gold-2)' : 'var(--paper)',
                  border: playing ? '1px solid var(--gold-dim)' : 'none',
                  borderRadius: 8, cursor:'pointer',
                  fontSize: 13, fontWeight: 500,
                  display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
                }}>
                <Icon d={playing ? I.pause : I.play} size={12}
                      stroke={playing ? 'var(--gold-2)' : 'var(--paper)'}
                      fill={playing ? 'var(--gold-2)' : 'var(--paper)'} />
                {playing ? 'Stop' : 'Play scale'}
              </button>
              <div style={{ marginTop: 10, display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                    <span>BPM</span>
                    <span style={{ color:'var(--ink)' }}>{bpm}</span>
                  </div>
                  <input type="range" min="60" max="200" value={bpm}
                    onChange={e => setBpm(+e.target.value)}
                    style={{ width:'100%', accentColor:'var(--gold)' }} />
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                    <span>Vol</span>
                    <span style={{ color:'var(--ink)' }}>{volume}</span>
                  </div>
                  <input type="range" min="0" max="100" value={volume}
                    onChange={e => setVolume(+e.target.value)}
                    style={{ width:'100%', accentColor:'var(--gold)' }} />
                </div>
                <button onClick={()=>setAudioOn(!audioOn)}
                  style={{
                    padding:'6px 10px', border:'1px solid var(--rule)',
                    background:'var(--card)', color:'var(--ink-3)',
                    borderRadius: 6, fontSize: 11, cursor:'pointer',
                  }}>
                  {audioOn ? 'Mute audio' : 'Unmute'}
                </button>
              </div>
            </div>

            {/* Training chip (placeholder) */}
            <button style={{
              padding:'10px 12px',
              border:'1px dashed var(--gold-dim)',
              background:'var(--gold-tint)',
              borderRadius: 8,
              display:'flex', alignItems:'center', gap: 8,
              color:'var(--gold-2)', fontSize: 12, fontWeight: 500,
              cursor:'pointer',
            }}>
              <Icon d={I.spark} size={12} stroke="var(--gold-2)" />
              Quiz me on this scale
            </button>
          </aside>

          {/* ─── CENTER: Board ─── */}
          <main ref={boardRef} style={{ padding:'24px 28px', overflowY:'auto', minWidth: 0 }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap: 10, color:'var(--ink-4)', fontSize:11, textTransform:'uppercase', letterSpacing:'.14em', fontFamily:'var(--mono)', marginBottom: 4 }}>
                  <span>Fretboard Explorer</span>
                  <span style={{
                    padding:'2px 8px', borderRadius: 999,
                    background: 'var(--gold-tint)',
                    color:'var(--gold-2)', letterSpacing:'.08em',
                    display:'inline-flex', alignItems:'center', gap: 4,
                  }}>
                    <Icon d={I.song} size={10} stroke="var(--gold-2)" />
                    Showing chords for: {songChip.title}
                  </span>
                </div>
                <h1 style={{
                  fontFamily:'var(--serif)', fontWeight:400,
                  fontSize: 40, letterSpacing:'-0.02em',
                  margin: 0, lineHeight: 1,
                }}>
                  {formatNote(key, useFlats)}{' '}
                  <em style={{ fontStyle:'italic', color:'var(--gold-2)' }}>
                    {mode === 'scale' ? SCALE_DEFINITIONS[scaleKey].label
                     : mode === 'chord' ? CHORD_DEFINITIONS[chordKey].label
                     : 'Chromatic'}
                  </em>
                </h1>
                <div style={{ color:'var(--ink-3)', fontSize: 13, marginTop: 6, fontFamily:'var(--mono)' }}>
                  {currentDef && (mode === 'scale'
                    ? <>{activeNotes.length} notes · {SCALE_DEFINITIONS[scaleKey].formula}</>
                    : <>{activeNotes.length} tones · {CHORD_DEFINITIONS[chordKey].label}</>)}
                </div>
              </div>

              {/* Fretboard style tweak */}
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <div style={{ fontSize: 10, color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'.14em', fontFamily:'var(--mono)' }}>
                  Style
                </div>
                <FESeg value={fretboardStyle} onChange={()=>{}}
                  options={[
                    {value:'studio', label:'Studio'},
                    {value:'engraved', label:'Engraved'},
                    {value:'mono', label:'Mono'},
                  ]} />
              </div>
            </div>

            {/* The board */}
            <div style={{
              ...feCard,
              padding: 16,
              marginBottom: 18,
            }}>
              <FretboardSVG
                annotated={annotated}
                root={key}
                useFlats={useFlats}
                showIntervals={showIntervals}
                hideNonScale={hideNonScale}
                highlightRoot={highlightRoot}
                style={fretboardStyle}
                cagedShape={cagedShape}
                cagedShapes={cagedShapes}
                onNoteClick={handleNoteClick}
                playingCell={playingCell}
                width={boardW}
                height={240}
              />
              {/* Under-board caption */}
              <div style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--rule)',
                fontSize: 11, color:'var(--ink-4)', fontFamily:'var(--mono)',
              }}>
                <span>15 FRETS · 6 STRINGS</span>
                <span>
                  {clickedCell
                    ? <span style={{ color:'var(--gold-2)' }}>
                        TAPPED · {annotated[clickedCell[0]][clickedCell[1]].note} ·
                        string {6 - clickedCell[0]} · fret {clickedCell[1]}
                      </span>
                    : 'TAP A NOTE TO HEAR IT'}
                </span>
              </div>
            </div>

            {/* Secondary row: diatonic chord strip + URL */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>

              {/* Diatonic chords (if scale) */}
              <div style={{ ...feCard, padding: '16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
                  <div>
                    <div style={feLabel}>Diatonic chords</div>
                    <div style={feHead}>Triads in {formatNote(key, useFlats)}</div>
                  </div>
                </div>
                {mode === 'scale' ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4 }}>
                    {getDiatonicChords(key, scaleKey).map((c, i) => (
                      <div key={i} style={{
                        padding:'8px 4px',
                        borderRadius: 6,
                        background:'var(--rule-2)',
                        textAlign:'center',
                      }}>
                        <div style={{ fontFamily:'var(--mono)', fontSize: 9, color:'var(--ink-4)', letterSpacing:'.08em' }}>
                          {c.roman}
                        </div>
                        <div style={{ fontFamily:'var(--serif)', fontSize: 16, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
                          {formatNote(c.root, useFlats)}
                          <span style={{ fontFamily:'var(--mono)', fontSize: 10, color:'var(--ink-4)', marginLeft: 1 }}>
                            {c.quality}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color:'var(--ink-4)', fontSize: 12, padding: '8px 0' }}>
                    Switch to <span style={{ color:'var(--ink)' }}>Scale</span> mode to see diatonic chords.
                  </div>
                )}
              </div>

              {/* URL preview */}
              <div style={{ ...feCard, padding: '16px 18px' }}>
                <div style={feLabel}>Shareable link</div>
                <div style={{
                  marginTop: 10, padding:'10px 12px',
                  background:'var(--rule-2)', borderRadius: 6,
                  fontFamily:'var(--mono)', fontSize: 11, color:'var(--ink-2)',
                  overflow: 'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                  /dashboard/fretboard?key={encodeURIComponent(formatNote(key,useFlats))}
                  {mode !== 'none' && `&${mode}=${mode==='scale'?scaleKey:chordKey}`}
                  {cagedShape !== 'none' && `&caged=${cagedShape}`}
                </div>
                <div style={{ display:'flex', gap: 6, marginTop: 10 }}>
                  <button style={{
                    padding:'6px 12px', border:'1px solid var(--rule)',
                    background:'var(--card)', color:'var(--ink-2)',
                    borderRadius: 6, fontSize: 11, cursor:'pointer',
                  }}>Copy link</button>
                  <button style={{
                    padding:'6px 12px', border:'1px solid var(--rule)',
                    background:'var(--card)', color:'var(--ink-2)',
                    borderRadius: 6, fontSize: 11, cursor:'pointer',
                  }}>Save preset</button>
                </div>
              </div>
            </div>
          </main>

          {/* ─── RIGHT: Info panel ─── */}
          <aside style={{
            borderLeft:'1px solid var(--rule)',
            background:'var(--paper)',
            padding:'20px 18px',
            overflowY:'auto',
            display:'flex', flexDirection:'column', gap: 20,
          }}>
            {/* Scale notes */}
            <div>
              <div style={feLabel}>
                {mode === 'chord' ? 'Chord tones' : 'Scale notes'}
              </div>
              <div style={{
                marginTop: 10,
                display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 4,
              }}>
                {scaleNotes.map((n, i) => {
                  const isRoot = i === 0;
                  return (
                    <div key={i} style={{
                      padding:'10px 4px',
                      background: isRoot ? 'var(--gold)' : 'var(--card)',
                      border: isRoot ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                      borderRadius: 6,
                      textAlign:'center',
                      boxShadow: isRoot ? '0 1px 4px rgba(177,127,18,.25)' : 'none',
                    }}>
                      <div style={{
                        fontFamily:'var(--mono)',
                        fontSize: 9,
                        color: isRoot ? 'rgba(255,255,255,.75)' : 'var(--ink-4)',
                        letterSpacing:'.08em',
                      }}>
                        {intervalLabels[i] || ''}
                      </div>
                      <div style={{
                        fontFamily:'var(--serif)', fontSize: 20, fontWeight: 500,
                        color: isRoot ? '#fff' : 'var(--ink)',
                        letterSpacing:'-0.01em', marginTop: 2, lineHeight: 1,
                      }}>
                        {formatNote(n, useFlats)}
                      </div>
                    </div>
                  );
                })}
                {!scaleNotes.length && (
                  <div style={{ gridColumn: '1 / -1', padding: 16, color:'var(--ink-4)', fontSize: 12, textAlign:'center' }}>
                    No notes selected.
                  </div>
                )}
              </div>
            </div>

            {/* Formula */}
            {mode === 'scale' && (
              <div>
                <div style={feLabel}>Formula</div>
                <div style={{
                  marginTop: 8, padding:'10px 12px',
                  background:'var(--card)', border:'1px solid var(--rule)', borderRadius: 8,
                  fontFamily:'var(--mono)', fontSize: 13, letterSpacing:'.08em',
                  color:'var(--ink)', textAlign:'center',
                }}>
                  {SCALE_DEFINITIONS[scaleKey].formula}
                </div>
                <div style={{ fontSize: 11, color:'var(--ink-4)', marginTop: 4, lineHeight: 1.4 }}>
                  <em style={{ fontFamily:'var(--serif)', fontStyle:'italic' }}>W</em> whole step ·{' '}
                  <em style={{ fontFamily:'var(--serif)', fontStyle:'italic' }}>H</em> half step
                </div>
              </div>
            )}

            {/* Intervals row */}
            <div>
              <div style={feLabel}>Intervals</div>
              <div style={{ display:'flex', gap: 4, flexWrap:'wrap', marginTop: 8 }}>
                {intervalLabels.map((iv, i) => (
                  <span key={i} style={{
                    padding:'3px 8px', borderRadius: 999,
                    background: i === 0 ? 'var(--gold-tint)' : 'var(--rule-2)',
                    color: i === 0 ? 'var(--gold-2)' : 'var(--ink-3)',
                    fontFamily:'var(--mono)', fontSize: 10, fontWeight: 500,
                    letterSpacing:'.06em',
                  }}>
                    {iv}
                  </span>
                ))}
              </div>
            </div>

            {/* CAGED positions */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
                <div style={feLabel}>CAGED positions</div>
                <span style={{ fontSize: 10, color:'var(--ink-4)', fontFamily:'var(--mono)' }}>
                  {cagedShapes.length} shapes
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                {cagedShapes.map(cs => (
                  <div key={cs.shape}
                    onClick={()=>setCagedShape(cs.shape === cagedShape ? 'none' : cs.shape)}
                    style={{
                      border: cagedShape === cs.shape ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                      background: cagedShape === cs.shape ? 'var(--gold-tint)' : 'var(--card)',
                      borderRadius: 8, padding: 4,
                      cursor: 'pointer',
                    }}>
                    <MiniCAGED shape={cs.shape} startFret={cs.startFret} endFret={cs.endFret}
                               annotated={annotated} root={key} />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// Mobile version — stacked, horizontal-scroll fretboard, bottom sheet hint
const FretboardExplorerMobile = ({ fretboardStyle = 'engraved' }) => {
  const [key, setKey] = useFE('A');
  const [scaleKey, setScaleKey] = useFE('pentatonic_minor');
  const [useFlats, setUseFlats] = useFE(false);
  const [showIntervals, setShowIntervals] = useFE(false);
  const [cagedShape, setCagedShape] = useFE('none');
  const [sheetOpen, setSheetOpen] = useFE(false);

  const activeNotes = useFEMemo(() => getScaleNotes(key, scaleKey), [key, scaleKey]);
  const annotated   = useFEMemo(() => annotateFretboard(key, activeNotes), [key, activeNotes]);
  const fretboard   = useFEMemo(() => buildFretboard(), []);
  const cagedShapes = useFEMemo(() => getActiveCAGEDShapes(key, fretboard), [key, fretboard]);

  return (
    <div className="app-viewport" style={{
      width: 390, height: 844,
      background: 'var(--ivory)', color: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
      fontSize: 13, overflow: 'hidden',
      borderRadius: 24, border: '1px solid var(--rule)',
      position: 'relative',
    }}>
      {/* Status bar */}
      <div style={{
        height: 32, padding:'0 18px', display:'flex', alignItems:'center',
        justifyContent:'space-between', fontSize: 11, fontFamily:'var(--mono)',
        color:'var(--ink-2)',
      }}>
        <span>9:41</span>
        <span>● ● ●</span>
      </div>

      {/* Header */}
      <div style={{
        padding:'10px 18px', borderBottom:'1px solid var(--rule)',
        background:'var(--paper)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ color:'var(--ink-4)', fontSize:10, textTransform:'uppercase', letterSpacing:'.14em', fontFamily:'var(--mono)' }}>
            Fretboard
          </div>
          <div style={{ fontFamily:'var(--serif)', fontSize: 22, fontWeight: 500, letterSpacing:'-0.02em', lineHeight: 1 }}>
            {formatNote(key, useFlats)} <em style={{ color:'var(--gold-2)' }}>{SCALE_DEFINITIONS[scaleKey].label}</em>
          </div>
        </div>
        <button onClick={()=>setSheetOpen(true)}
          style={{
            padding:'6px 10px', borderRadius: 6,
            border:'1px solid var(--rule)', background:'var(--card)',
            fontSize: 12, color:'var(--ink-2)', cursor:'pointer',
            display:'flex', alignItems:'center', gap:4,
          }}>
          <Icon d={I.filter} size={12} /> Controls
        </button>
      </div>

      {/* Landscape hint banner */}
      <div style={{
        margin:'10px 14px 6px', padding:'8px 12px',
        background:'var(--gold-tint)', border:'1px dashed var(--gold-dim)',
        borderRadius: 6,
        color:'var(--gold-2)', fontSize: 11,
        display:'flex', alignItems:'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M8 21l2-3M14 3l2 3" />
        </svg>
        Rotate device for a better view of the neck.
      </div>

      {/* Scrollable fretboard */}
      <div style={{ padding:'8px 12px 16px', overflow:'hidden' }}>
        <div style={{
          background: 'var(--card)', border:'1px solid var(--rule)', borderRadius: 10,
          padding: 10, overflowX: 'auto',
        }}>
          <FretboardSVG
            annotated={annotated} root={key} useFlats={useFlats}
            showIntervals={showIntervals} hideNonScale={false} highlightRoot={true}
            style={fretboardStyle}
            cagedShape={cagedShape} cagedShapes={cagedShapes}
            width={900} height={200} showStringLabels={true}
          />
        </div>
      </div>

      {/* Scale note chips */}
      <div style={{ padding:'0 14px 12px' }}>
        <div style={{ ...feLabel, marginBottom: 6 }}>Notes</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 4 }}>
          {activeNotes.map((n, i) => (
            <div key={i} style={{
              padding:'8px 0',
              background: i === 0 ? 'var(--gold)' : 'var(--card)',
              border: i === 0 ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
              color: i === 0 ? '#fff' : 'var(--ink)',
              borderRadius: 6, textAlign:'center',
              fontFamily:'var(--serif)', fontSize: 16, fontWeight: 500,
            }}>{formatNote(n, useFlats)}</div>
          ))}
        </div>
      </div>

      {/* Key row (quick access) */}
      <div style={{ padding:'0 14px 12px' }}>
        <div style={{ ...feLabel, marginBottom: 6 }}>Key</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap: 4 }}>
          {CHROMATIC_SHARP.slice(0, 12).map((k) => (
            <button key={k} onClick={()=>setKey(k)}
              style={{
                padding:'8px 0',
                border: key === k ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                background: key === k ? 'var(--gold-tint)' : 'var(--card)',
                color: key === k ? 'var(--gold-2)' : 'var(--ink-2)',
                borderRadius: 6, fontFamily:'var(--serif)', fontSize: 14, fontWeight: 500, cursor:'pointer',
              }}>{formatNote(k, useFlats)}</button>
          ))}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        marginTop:'auto',
        borderTop:'1px solid var(--rule)', background:'var(--paper)',
        display:'flex', justifyContent:'space-around',
        padding: '8px 0 16px',
      }}>
        {[
          {k:'home', label:'Home'},
          {k:'lesson', label:'Lessons'},
          {k:'fretboard', label:'Fretboard', active: true},
          {k:'user', label:'Me'},
        ].map(t => (
          <div key={t.label} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
            color: t.active ? 'var(--gold-2)' : 'var(--ink-4)', fontSize: 10,
          }}>
            <Icon d={I[t.k]} size={18} stroke={t.active ? 'var(--gold-2)' : 'var(--ink-4)'} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
};

window.FretboardExplorer = FretboardExplorer;
window.FretboardExplorerMobile = FretboardExplorerMobile;
