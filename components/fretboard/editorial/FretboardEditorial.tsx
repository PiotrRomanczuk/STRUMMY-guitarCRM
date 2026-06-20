'use client';

import {
  formatNote,
  SCALE_DEFINITIONS,
  CHORD_DEFINITIONS,
  getChordDisplayName,
} from '@/lib/music-theory';

import { FretboardBoard } from './FretboardEditorial.Board';
import { FretboardControls } from './FretboardEditorial.Controls';
import { FretboardInfoPanel } from './FretboardEditorial.InfoPanel';
import { useFretboardExplorer } from './useFretboardExplorer';

export const FretboardEditorial = () => {
  const fb = useFretboardExplorer();

  const subtitle =
    fb.mode === 'scale'
      ? SCALE_DEFINITIONS[fb.scaleKey]?.name
      : fb.mode === 'chord'
        ? `${CHORD_DEFINITIONS[fb.chordKey]?.name} · ${getChordDisplayName(fb.key, fb.chordKey)}`
        : 'Chromatic';

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        minHeight: '100%',
        padding: '32px 32px 64px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <Header title={`${formatNote(fb.key, fb.useFlats)} `} subtitle={subtitle} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr) minmax(220px, 260px)',
            gap: 24,
            alignItems: 'start',
          }}
          className="fb-layout"
        >
          <FretboardControls
            fbKey={fb.key}
            setKey={fb.setKey}
            mode={fb.mode}
            setMode={fb.setMode}
            scaleKey={fb.scaleKey}
            setScaleKey={fb.setScaleKey}
            chordKey={fb.chordKey}
            setChordKey={fb.setChordKey}
            useFlats={fb.useFlats}
            setUseFlats={fb.setUseFlats}
            showIntervals={fb.showIntervals}
            setShowIntervals={fb.setShowIntervals}
            hideNonScale={fb.hideNonScale}
            setHideNonScale={fb.setHideNonScale}
            highlightRoot={fb.highlightRoot}
            setHighlightRoot={fb.setHighlightRoot}
          />

          <div>
            <FretboardBoard
              board={fb.board}
              mode={fb.mode}
              useFlats={fb.useFlats}
              showIntervals={fb.showIntervals}
              hideNonScale={fb.hideNonScale}
              highlightRoot={fb.highlightRoot}
              onSelect={fb.selectCell}
            />
            <TappedCaption clicked={fb.clicked} useFlats={fb.useFlats} />
          </div>

          <FretboardInfoPanel
            fbKey={fb.key}
            mode={fb.mode}
            scaleKey={fb.scaleKey}
            chordKey={fb.chordKey}
            activeNotes={fb.activeNotes}
            useFlats={fb.useFlats}
          />
        </div>
      </div>

      <style>{`@media (max-width: 900px) { .fb-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
};

const TappedCaption = ({
  clicked,
  useFlats,
}: {
  clicked: ReturnType<typeof useFretboardExplorer>['clicked'];
  useFlats: boolean;
}) => (
  <div
    data-testid="fb-tapped"
    style={{
      marginTop: 12,
      fontFamily: 'var(--mono)',
      fontSize: 12,
      color: clicked ? 'var(--gold-2)' : 'var(--ink-4)',
    }}
  >
    {clicked
      ? `${formatNote(clicked.note, useFlats)} · string ${clicked.row + 1} · fret ${clicked.fret}`
      : 'Tap a note to identify it.'}
  </div>
);

const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div style={{ marginBottom: 22 }}>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.16em',
      }}
    >
      Theory
    </div>
    <h1
      data-testid="fb-title"
      style={{
        margin: '4px 0 8px',
        fontFamily: 'var(--serif)',
        fontWeight: 400,
        fontSize: 44,
        letterSpacing: '-0.02em',
        fontStyle: 'italic',
      }}
    >
      {title}
      <span style={{ color: 'var(--gold-2)' }}>{subtitle}</span>
    </h1>
    <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
      Pick a key and a scale or chord — its tones light up across all six strings.
    </p>
  </div>
);
