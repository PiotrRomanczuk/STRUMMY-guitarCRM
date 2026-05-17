// FretboardSVG — renders the fretboard with note markers, CAGED zones, styles.
// Three styles: studio (warm wood), engraved (editorial cream), mono (minimal).

const { useState: useFbState, useMemo: useFbMemo } = React;

// Style tokens per variant
const FB_STYLES = {
  studio: {
    boardFill: 'linear-gradient(180deg, #f0e4cd 0%, #e6d6b8 50%, #d9c49e 100%)',
    boardStroke: 'var(--rule)',
    fretWire: '#bfae95',
    fretWireShadow: '#a39277',
    stringColor: '#6b5a43',
    nutFill: '#f8f3e8',
    nutStroke: '#a39277',
    inlayFill: '#b19a78',
    textDim: '#9d8f7a',
    cagedBg: 'rgba(200,149,35,0.10)',
    cagedStroke: 'rgba(177,127,18,0.35)',
  },
  engraved: {
    boardFill: 'var(--paper)',
    boardStroke: 'var(--rule)',
    fretWire: 'var(--ink-4)',
    fretWireShadow: 'var(--ink-5)',
    stringColor: 'var(--ink-3)',
    nutFill: 'var(--card)',
    nutStroke: 'var(--ink-2)',
    inlayFill: 'var(--ink-5)',
    textDim: 'var(--ink-4)',
    cagedBg: 'var(--gold-tint)',
    cagedStroke: 'var(--gold-dim)',
  },
  mono: {
    boardFill: 'var(--card)',
    boardStroke: 'var(--rule)',
    fretWire: 'var(--ink-5)',
    fretWireShadow: 'var(--ink-5)',
    stringColor: 'var(--ink-4)',
    nutFill: 'var(--ink-2)',
    nutStroke: 'var(--ink-2)',
    inlayFill: 'var(--ink-5)',
    textDim: 'var(--ink-4)',
    cagedBg: 'var(--rule-2)',
    cagedStroke: 'var(--rule)',
  },
};

// Main fretboard renderer
const FretboardSVG = ({
  annotated,           // 6 × 16 array from annotateFretboard()
  root,                // note name
  useFlats = false,
  showIntervals = false,
  hideNonScale = false,
  highlightRoot = true,
  style = 'engraved',
  cagedShape = null,   // one of 'C','A','G','E','D','all', null
  cagedShapes = [],    // from getActiveCAGEDShapes
  showStringLabels = true,
  onNoteClick,         // (stringIdx, fret, note) => void
  playingCell = null,  // [stringIdx, fret] of currently playing note (during play scale)
  width = 960,
  height = 240,
}) => {
  const s = FB_STYLES[style] || FB_STYLES.engraved;
  const frets = 15;
  const strings = 6;

  // Layout
  const labelW = showStringLabels ? 24 : 0;
  const padL = 14 + labelW;
  const padR = 14;
  const padT = 26;
  const padB = 22;
  const boardW = width - padL - padR;
  const boardH = height - padT - padB;
  const fretW = boardW / (frets + 1); // +1 for open-string column
  const openX = padL;                  // x where open string column starts
  const stringY = (idx) => padT + boardH * idx / (strings - 1);
  const fretX = (f) => padL + (f + 0.5) * fretW; // center x of fret cell (f=0..15)
  const fretWireX = (f) => padL + f * fretW;      // left edge of fret f

  // CAGED active zone to draw
  const activeCaged = cagedShape && cagedShape !== 'none' && cagedShape !== 'all'
    ? cagedShapes.find(c => c.shape === cagedShape)
    : null;

  // string labels low-to-high (display order: top = high e, bottom = low E)
  // annotated[0] is low E, so display row 5 at top, row 0 at bottom.
  const displayRow = (visualRow) => strings - 1 - visualRow; // 0 visual = high e = annotated[5]
  const stringLabels = ['E','B','G','D','A','E']; // high to low (visual top→bottom)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
         style={{ display:'block', userSelect:'none' }}>
      <defs>
        {style === 'studio' && (
          <linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ede0c6" />
            <stop offset="50%" stopColor="#e2d0b0" />
            <stop offset="100%" stopColor="#c8b088" />
          </linearGradient>
        )}
        {/* subtle inner shadow for wood */}
        <filter id="fb-inner" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>

      {/* Fret-number strip (top) */}
      {[1,3,5,7,9,12,15].map(f => (
        <text key={`fn${f}`}
          x={fretX(f)} y={padT - 10}
          textAnchor="middle"
          fontFamily="var(--mono)" fontSize="10"
          fill="var(--ink-4)" letterSpacing="0.1em">
          {f}
        </text>
      ))}

      {/* String labels (left) */}
      {showStringLabels && Array.from({length:strings}).map((_, i) => {
        const visualRow = i; // top to bottom
        return (
          <text key={`sl${i}`}
            x={padL - 14} y={stringY(i) + 3.5}
            textAnchor="middle"
            fontFamily="var(--mono)" fontSize="10"
            fill="var(--ink-4)">
            {stringLabels[i]}
          </text>
        );
      })}

      {/* Board background */}
      <rect x={padL - 2} y={padT - 2} width={boardW + 4} height={boardH + 4}
            fill={style === 'studio' ? 'url(#wood-grad)' : s.boardFill}
            stroke={s.boardStroke} strokeWidth="1" rx="3" />

      {/* CAGED zone */}
      {activeCaged && (
        <g>
          <rect
            x={fretWireX(activeCaged.startFret)}
            y={padT - 4}
            width={fretW * (activeCaged.endFret - activeCaged.startFret + 1)}
            height={boardH + 8}
            fill={s.cagedBg}
            stroke={s.cagedStroke}
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <text
            x={fretWireX(activeCaged.startFret) + fretW * (activeCaged.endFret - activeCaged.startFret + 1)/2}
            y={padT + boardH + 16}
            textAnchor="middle"
            fontFamily="var(--mono)" fontSize="9"
            letterSpacing="0.16em"
            fill="var(--gold-2)">
            {activeCaged.shape}-SHAPE
          </text>
        </g>
      )}

      {/* Inlay dots */}
      {[3,5,7,9,15].map(f => (
        <circle key={`i${f}`} cx={fretX(f)} cy={padT + boardH/2} r="4"
                fill={s.inlayFill} opacity="0.5" />
      ))}
      {/* Double dot at 12 */}
      <circle cx={fretX(12)} cy={padT + boardH*0.3} r="4" fill={s.inlayFill} opacity="0.5" />
      <circle cx={fretX(12)} cy={padT + boardH*0.7} r="4" fill={s.inlayFill} opacity="0.5" />

      {/* Fret wires (vertical). f=0 is nut position, f=1..15 are wires */}
      {Array.from({length: frets + 1}).map((_, f) => {
        if (f === 0) return null; // nut drawn separately
        return (
          <g key={`fw${f}`}>
            <line x1={fretWireX(f)} y1={padT - 1} x2={fretWireX(f)} y2={padT + boardH + 1}
                  stroke={s.fretWireShadow} strokeWidth="1" opacity="0.5" />
            <line x1={fretWireX(f) - 1} y1={padT - 1} x2={fretWireX(f) - 1} y2={padT + boardH + 1}
                  stroke={s.fretWire} strokeWidth="2" strokeLinecap="butt" />
          </g>
        );
      })}

      {/* Nut (thick bar between open column and fret 1) */}
      <rect x={fretWireX(1) - 5} y={padT - 2} width="5" height={boardH + 4}
            fill={s.nutFill} stroke={s.nutStroke} strokeWidth="0.8" />

      {/* Strings */}
      {Array.from({length: strings}).map((_, visualRow) => {
        // thickness: low E (bottom) thickest
        const thicknesses = [0.8, 1.0, 1.3, 1.6, 2.0, 2.4]; // visual top→bottom
        return (
          <line key={`st${visualRow}`}
            x1={padL - 6} y1={stringY(visualRow)}
            x2={padL + boardW} y2={stringY(visualRow)}
            stroke={s.stringColor} strokeWidth={thicknesses[visualRow]}
            opacity="0.9" />
        );
      })}

      {/* Note markers */}
      {annotated.map((row, stringIdx) => {
        const visualRow = displayRow(stringIdx); // 0 visual = high e
        return row.map((cell, f) => {
          if (hideNonScale && !cell.isActive) return null;
          if (!cell.isActive && !highlightRoot) return null;
          if (!cell.isActive) return (
            // dim dot for non-scale
            <circle key={`d${stringIdx}-${f}`}
              cx={fretX(f)} cy={stringY(visualRow)}
              r="2" fill={s.textDim} opacity="0.25"
              style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
              onClick={() => onNoteClick && onNoteClick(stringIdx, f, cell.note)}
            />
          );

          const isPlaying = playingCell && playingCell[0] === stringIdx && playingCell[1] === f;
          const isRoot = cell.isRoot && highlightRoot;
          const r = isRoot ? 14 : 12;
          const fillColor = isRoot ? 'var(--gold)' : 'var(--card)';
          const strokeColor = isRoot ? 'var(--gold-2)' : 'var(--ink-2)';
          const textColor = isRoot ? '#fff' : 'var(--ink)';
          const label = showIntervals ? cell.interval : (useFlats
            ? CHROMATIC_FLAT[NOTE_INDEX[cell.note]]
            : cell.note);

          return (
            <g key={`n${stringIdx}-${f}`}
               style={{ cursor: onNoteClick ? 'pointer' : 'default', transition:'opacity .2s' }}
               onClick={() => onNoteClick && onNoteClick(stringIdx, f, cell.note)}
            >
              {isPlaying && (
                <circle cx={fretX(f)} cy={stringY(visualRow)}
                        r={r + 8} fill="var(--gold)" opacity="0.25">
                  <animate attributeName="r" from={r} to={r+12} dur="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.45" to="0" dur="0.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={fretX(f)} cy={stringY(visualRow)}
                      r={r}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isRoot ? 1 : 1.25}
                      style={{ filter: isRoot ? 'drop-shadow(0 1px 2px rgba(177,127,18,.35))' : 'none' }} />
              <text x={fretX(f)} y={stringY(visualRow) + (isRoot ? 4 : 3.8)}
                    textAnchor="middle"
                    fontFamily={label.length > 1 && showIntervals ? 'var(--mono)' : 'var(--serif)'}
                    fontSize={isRoot ? 12 : 11}
                    fontWeight={isRoot ? 600 : 500}
                    fill={textColor}
                    letterSpacing={showIntervals ? '0.02em' : '0'}>
                {label}
              </text>
            </g>
          );
        });
      })}
    </svg>
  );
};

// Mini CAGED position fretboard (static, for info panel)
const MiniCAGED = ({ shape, startFret, endFret, annotated, root }) => {
  const w = 210, h = 72;
  const padL = 10, padR = 8, padT = 14, padB = 10;
  const frets = Math.max(4, endFret - startFret + 1);
  const boardW = w - padL - padR, boardH = h - padT - padB;
  const fretW = boardW / frets;
  const strings = 6;
  const stringY = (i) => padT + boardH * i / (strings - 1);
  const fretX = (f) => padL + (f + 0.5) * fretW;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <rect x={padL} y={padT} width={boardW} height={boardH}
            fill="var(--paper)" stroke="var(--rule)" strokeWidth="0.8" />
      {/* frets */}
      {Array.from({length:frets+1}).map((_, i) => (
        <line key={i} x1={padL + i*fretW} y1={padT} x2={padL + i*fretW} y2={padT+boardH}
              stroke="var(--ink-5)" strokeWidth={i === 0 ? 1.6 : 0.7} />
      ))}
      {/* strings */}
      {Array.from({length:strings}).map((_, i) => (
        <line key={i} x1={padL} y1={stringY(i)} x2={padL+boardW} y2={stringY(i)}
              stroke="var(--ink-4)" strokeWidth="0.5" opacity="0.6" />
      ))}
      {/* fret number */}
      <text x={padL + 2} y={padT - 4} fontFamily="var(--mono)" fontSize="8" fill="var(--ink-4)">
        {startFret}fr
      </text>
      {/* shape label */}
      <text x={padL + boardW} y={padT - 4} textAnchor="end"
            fontFamily="var(--serif)" fontSize="11" fontWeight="600" fill="var(--gold-2)">
        {shape}
      </text>
      {/* note dots within range */}
      {annotated && annotated.map((row, stringIdx) => {
        const visualRow = 5 - stringIdx;
        return row.slice(startFret, endFret + 1).map((cell, idx) => {
          if (!cell.isActive) return null;
          const f = idx;
          const isRoot = cell.isRoot;
          return (
            <circle key={`${stringIdx}-${f}`}
              cx={fretX(f)} cy={stringY(visualRow)}
              r={isRoot ? 4.5 : 3}
              fill={isRoot ? 'var(--gold)' : 'var(--ink-2)'}
              stroke={isRoot ? 'var(--gold-2)' : 'none'}
              strokeWidth="0.8"
            />
          );
        });
      })}
    </svg>
  );
};

Object.assign(window, { FretboardSVG, MiniCAGED, FB_STYLES });
