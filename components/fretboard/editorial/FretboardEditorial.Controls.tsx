import {
  CHROMATIC_NOTES,
  SCALE_DEFINITIONS,
  CHORD_DEFINITIONS,
  formatNote,
  getChordDisplayName,
  type NoteName,
} from '@/lib/music-theory';

import { type FretMode } from './fretboard.helpers';
import { Group, Toggle } from './FretboardEditorial.Primitives';
import { chipButton, selectStyle } from './fretboard.styles';

interface ControlsProps {
  fbKey: NoteName;
  setKey: (n: NoteName) => void;
  mode: FretMode;
  setMode: (m: FretMode) => void;
  scaleKey: string;
  setScaleKey: (k: string) => void;
  chordKey: string;
  setChordKey: (k: string) => void;
  useFlats: boolean;
  setUseFlats: (v: boolean) => void;
  showIntervals: boolean;
  setShowIntervals: (v: boolean) => void;
  hideNonScale: boolean;
  setHideNonScale: (v: boolean) => void;
  highlightRoot: boolean;
  setHighlightRoot: (v: boolean) => void;
}

const MODES: { value: FretMode; label: string }[] = [
  { value: 'scale', label: 'Scale' },
  { value: 'chord', label: 'Chord' },
  { value: 'off', label: 'Off' },
];

export const FretboardControls = (p: ControlsProps) => (
  <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <Group label="Mode">
      <div style={{ display: 'flex', gap: 6 }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            data-testid={`fb-mode-${m.value}`}
            data-active={p.mode === m.value}
            onClick={() => p.setMode(m.value)}
            style={{ ...chipButton(p.mode === m.value), flex: 1 }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </Group>

    <KeyGrid fbKey={p.fbKey} setKey={p.setKey} useFlats={p.useFlats} setUseFlats={p.setUseFlats} />

    {p.mode === 'scale' && (
      <Group label="Scale">
        <select
          data-testid="fb-scale-select"
          value={p.scaleKey}
          onChange={(e) => p.setScaleKey(e.target.value)}
          style={selectStyle}
        >
          {Object.entries(SCALE_DEFINITIONS).map(([key, def]) => (
            <option key={key} value={key}>
              {def.name}
            </option>
          ))}
        </select>
      </Group>
    )}

    {p.mode === 'chord' && (
      <Group label="Chord">
        <select
          data-testid="fb-chord-select"
          value={p.chordKey}
          onChange={(e) => p.setChordKey(e.target.value)}
          style={selectStyle}
        >
          {Object.entries(CHORD_DEFINITIONS).map(([key, def]) => (
            <option key={key} value={key}>
              {def.name} · {getChordDisplayName(p.fbKey, key)}
            </option>
          ))}
        </select>
      </Group>
    )}

    <Group label="Display">
      <Toggle
        id="intervals"
        label="Show intervals"
        value={p.showIntervals}
        onChange={p.setShowIntervals}
      />
      <Toggle
        id="hide-nonscale"
        label="Hide non-scale notes"
        value={p.hideNonScale}
        onChange={p.setHideNonScale}
      />
      <Toggle
        id="highlight-root"
        label="Highlight root"
        value={p.highlightRoot}
        onChange={p.setHighlightRoot}
      />
    </Group>
  </aside>
);

interface KeyGridProps {
  fbKey: NoteName;
  setKey: (n: NoteName) => void;
  useFlats: boolean;
  setUseFlats: (v: boolean) => void;
}

const KeyGrid = ({ fbKey, setKey, useFlats, setUseFlats }: KeyGridProps) => (
  <Group
    label="Key"
    aside={
      <div style={{ display: 'flex', gap: 4 }}>
        {(['sharp', 'flat'] as const).map((kind) => {
          const active = kind === 'flat' ? useFlats : !useFlats;
          return (
            <button
              key={kind}
              type="button"
              data-testid={`fb-accidental-${kind}`}
              data-active={active}
              onClick={() => setUseFlats(kind === 'flat')}
              style={{ ...chipButton(active), padding: '2px 9px', borderRadius: 999 }}
            >
              {kind === 'flat' ? '♭' : '♯'}
            </button>
          );
        })}
      </div>
    }
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
      {CHROMATIC_NOTES.map((note) => (
        <button
          key={note}
          type="button"
          data-testid={`fb-key-${note}`}
          data-active={fbKey === note}
          onClick={() => setKey(note)}
          style={{ ...chipButton(fbKey === note), fontFamily: 'var(--serif)', fontSize: 15 }}
        >
          {formatNote(note, useFlats)}
        </button>
      ))}
    </div>
  </Group>
);
