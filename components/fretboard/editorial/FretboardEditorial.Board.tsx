import { formatNote, type NoteName } from '@/lib/music-theory';

import {
  cellLabel,
  DISPLAY_STRINGS,
  DOUBLE_MARKER,
  FRET_COUNT,
  FRET_MARKERS,
  type AnnotatedCell,
  type FretMode,
} from './fretboard.helpers';
import { card } from './fretboard.styles';

interface BoardProps {
  board: AnnotatedCell[][];
  mode: FretMode;
  useFlats: boolean;
  showIntervals: boolean;
  hideNonScale: boolean;
  highlightRoot: boolean;
  onSelect: (row: number, fret: number, note: NoteName) => void;
}

export const FretboardBoard = ({
  board,
  mode,
  useFlats,
  showIntervals,
  hideNonScale,
  highlightRoot,
  onSelect,
}: BoardProps) => (
  <div data-testid="fb-board" style={{ ...card, padding: '24px 28px', overflowX: 'auto' }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `48px repeat(${FRET_COUNT}, minmax(56px, 1fr))`,
        alignItems: 'center',
      }}
    >
      <div />
      {Array.from({ length: FRET_COUNT }).map((_, i) => (
        <div
          key={`fret-num-${i}`}
          style={{
            textAlign: 'center',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ink-4)',
            paddingBottom: 8,
          }}
        >
          {i + 1}
        </div>
      ))}
      {DISPLAY_STRINGS.map((str, row) => (
        <Row
          key={`str-${row}`}
          str={str}
          row={row}
          cells={board[row]}
          mode={mode}
          useFlats={useFlats}
          showIntervals={showIntervals}
          hideNonScale={hideNonScale}
          highlightRoot={highlightRoot}
          onSelect={onSelect}
        />
      ))}
    </div>
  </div>
);

interface RowProps extends Omit<BoardProps, 'board'> {
  str: NoteName;
  row: number;
  cells: AnnotatedCell[];
}

const Row = ({
  str,
  row,
  cells,
  mode,
  useFlats,
  showIntervals,
  hideNonScale,
  highlightRoot,
  onSelect,
}: RowProps) => (
  <>
    <div
      style={{
        textAlign: 'right',
        paddingRight: 14,
        fontFamily: 'var(--serif)',
        fontSize: 18,
        color: 'var(--ink-3)',
        fontStyle: 'italic',
      }}
    >
      {formatNote(str, useFlats)}
    </div>
    {cells.map((cell, i) => {
      const fret = i + 1;
      const isRootCell = cell.isRoot && cell.active && highlightRoot;
      const hidden = hideNonScale && mode !== 'off' && !cell.active;
      const isMarker = FRET_MARKERS.has(fret) || fret === DOUBLE_MARKER;
      const background = isRootCell
        ? 'var(--gold)'
        : cell.active
          ? 'var(--gold-tint)'
          : isMarker
            ? 'rgba(200,149,35,.06)'
            : 'transparent';
      const color = isRootCell
        ? '#fff'
        : cell.active
          ? 'var(--gold-2)'
          : cell.note.includes('#')
            ? 'var(--ink-4)'
            : 'var(--ink-2)';
      return (
        <button
          key={`cell-${row}-${i}`}
          type="button"
          data-testid={`fb-cell-${row}-${fret}`}
          data-note={cell.note}
          data-active={cell.active}
          data-root={cell.isRoot}
          data-interval={cell.interval}
          data-hidden={hidden}
          onClick={() => onSelect(row, fret, cell.note)}
          style={{
            position: 'relative',
            height: 44,
            display: 'grid',
            placeItems: 'center',
            background,
            border: 'none',
            borderRight: '1px solid var(--rule)',
            borderBottom: row < DISPLAY_STRINGS.length - 1 ? '1px solid var(--rule)' : 'none',
            borderLeft: i === 0 ? '2px solid var(--ink-2)' : 'none',
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            fontWeight: cell.active ? 600 : 500,
            color,
            opacity: hidden ? 0 : 1,
          }}
        >
          {cellLabel(cell, showIntervals, useFlats)}
        </button>
      );
    })}
  </>
);
