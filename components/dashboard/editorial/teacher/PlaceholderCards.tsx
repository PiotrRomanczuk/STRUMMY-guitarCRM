import { Card, CardHeader, ComingSoonBody } from '../primitives';

export const NeedsAttentionCardPlaceholder = () => (
  <Card>
    <CardHeader eyebrow="Watch closely" title="Needs attention" />
    <ComingSoonBody note="Students with low practice or stale progress will surface here. Real query lands in a follow-up." />
  </Card>
);

export const WeekDensityCardPlaceholder = () => (
  <Card>
    <CardHeader eyebrow="The week ahead" title="Week density" />
    <ComingSoonBody note="A 7-day view of your booked teaching hours by day, with overload flags. Coming next." />
  </Card>
);

export const UtilizationCardPlaceholder = () => (
  <Card>
    <CardHeader eyebrow="Studio time" title="Utilization" />
    <ComingSoonBody note="Booked vs available slots this week. Coming next." />
  </Card>
);

export const StudentRosterCardPlaceholder = () => (
  <Card>
    <CardHeader eyebrow="Your students" title="Roster" />
    <ComingSoonBody note="Active students with health, last lesson, and current song will list here." />
  </Card>
);

export const SongLibraryCardPlaceholder = () => (
  <Card>
    <CardHeader eyebrow="Library" title="Songs" />
    <ComingSoonBody note="Library stats, recently added, and most-assigned songs. Coming next." />
  </Card>
);
