import { Icon } from '@/components/design-preview/lib/icons';

import { btnGhost, LI } from './helpers';
import type { SongDetailData } from './types';

const WAVEFORM_BAR_COUNT = 64;
const WAVEFORM_DONE_COUNT = 18;

const waveformBars = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => ({
  key: i,
  height: 8 + Math.abs(Math.sin(i * 0.5) + Math.cos(i * 0.13)) * 14,
  done: i < WAVEFORM_DONE_COUNT,
}));

export const SongAudio = ({ s }: { s: SongDetailData }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 12,
      padding: '14px 18px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      gap: 18,
      alignItems: 'center',
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--ink)',
        color: 'var(--paper)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Icon d={LI.live} size={16} stroke="var(--paper)" fill="var(--paper)" />
    </div>
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 36 }}>
      {waveformBars.map((bar) => (
        <div
          key={bar.key}
          style={{
            width: 3,
            height: `${bar.height}px`,
            background: bar.done ? 'var(--gold-2)' : 'var(--ink-5)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
      <span style={{ color: 'var(--ink)' }}>1:48</span> / {s.duration}
    </div>
    <div style={{ display: 'flex', gap: 4 }}>
      <span style={{ ...btnGhost, padding: '6px 10px' }}>0.75×</span>
      <span
        style={{
          ...btnGhost,
          padding: '6px 10px',
          borderColor: 'var(--gold-2)',
          color: 'var(--gold-2)',
        }}
      >
        1×
      </span>
      <span style={{ ...btnGhost, padding: '6px 10px' }}>Loop A↔B</span>
    </div>
  </div>
);
