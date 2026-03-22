export const difficultyColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/20',
  intermediate: 'bg-primary/10 text-primary border-primary/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const statusColors: Record<string, string> = {
  to_learn: 'bg-muted text-muted-foreground border-border',
  learning: 'bg-primary/10 text-primary border-primary/20',
  practicing: 'bg-warning/10 text-warning border-warning/20',
  improving: 'bg-warning/10 text-warning border-warning/20',
  mastered: 'bg-success/10 text-success border-success/20',
  // Legacy statuses
  started: 'bg-primary/10 text-primary border-primary/20',
  remembered: 'bg-warning/10 text-warning border-warning/20',
  with_author: 'bg-primary/10 text-primary border-primary/20',
};

export const statusLabels: Record<string, string> = {
  to_learn: 'To Learn',
  learning: 'Learning',
  practicing: 'Practicing',
  improving: 'Improving',
  mastered: 'Mastered',
  // Legacy statuses
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
};

export const statusLabelsWithEmoji: Record<string, string> = {
  to_learn: '📝 To Learn',
  learning: '🎵 Learning',
  practicing: '🎸 Practicing',
  improving: '📈 Improving',
  mastered: '🏆 Mastered',
  // Legacy statuses
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
};

export const statusDescriptions: Record<string, string> = {
  to_learn: "This song has been added to your list. You haven't started working on it yet.",
  learning: 'You\'re actively learning the chords, strumming pattern, and song structure.',
  practicing: 'You can play the song at ~75% speed. Building fluency through regular practice.',
  improving: 'You can play along with the original recording at full speed. Refining your timing, dynamics, and feel.',
  mastered: 'You can play this song confidently from memory with solid technique.',
};

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}
