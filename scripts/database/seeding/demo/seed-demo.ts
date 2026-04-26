import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local explicitly
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

const REMOTE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!REMOTE_URL) {
  console.error(
    '❌ NEXT_PUBLIC_SUPABASE_URL is not set.\n' +
    '   Add it to .env.local and re-run.'
  );
  process.exit(1);
}

if (/127\.0\.0\.1|localhost/.test(REMOTE_URL)) {
  console.error(
    '❌ NEXT_PUBLIC_SUPABASE_URL points to localhost — aborting.\n' +
    '   This script targets the remote Supabase project only.'
  );
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  process.exit(1);
}

const supabase = createClient(REMOTE_URL, SERVICE_ROLE_KEY);

// ─── Demo Data ────────────────────────────────────────────────────────────────

// Demo-only password — intentionally committed, these accounts are non-production
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD ?? 'Demo2024!';

const DEMO_USERS = [
  { email: 'sarah@strummy.app', fullName: 'Sarah Mitchell', isTeacher: true,  isStudent: false },
  { email: 'emma@strummy.app',  fullName: 'Emma Johnson',   isTeacher: false, isStudent: true  },
  { email: 'carlos@strummy.app',fullName: 'Carlos Reyes',   isTeacher: false, isStudent: true  },
  { email: 'lily@strummy.app',  fullName: 'Lily Park',      isTeacher: false, isStudent: true  },
  { email: 'james@strummy.app', fullName: "James O'Brien",  isTeacher: false, isStudent: true  },
] as const;

const DEMO_SONGS = [
  {
    title: 'Wonderwall',
    author: 'Oasis',
    level: 'beginner',
    key: 'G',
    tempo: 87,
    capo_fret: 2,
    chords: 'Em7 G Dsus4 A7sus4',
    strumming_pattern: 'D DU UDU',
    category: 'Britpop',
    release_year: 1995,
    youtube_url: 'https://www.youtube.com/watch?v=bx1Bh8ZvH84',
    spotify_link_url: 'https://open.spotify.com/track/3id0eGSBqkGEBiblqgNqoB',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-27596',
    lyrics_with_chords: `[Em7]Today is [G]gonna be the day
That they're [Dsus4]gonna throw it back to [A7sus4]you
[Em7]By now you [G]should've somehow
Rea[Dsus4]lized what you gotta [A7sus4]do
[Em7]I don't believe that [G]anybody
[Dsus4]Feels the way I [A7sus4]do
About you [Em7]now[G] [Dsus4] [A7sus4]

[Em7]Backbeat, the [G]word is on the street
That the [Dsus4]fire in your heart is [A7sus4]out
[Em7]I'm sure you've [G]heard it all before
But you [Dsus4]never really had a [A7sus4]doubt

[C]And all the [D]roads we have to [Em7]walk are winding
[C]And all the [D]lights that lead us [Em7]there are blinding
[C]There are many [D]things that I would
[G]Like to [D]say to [Em7]you
But I don't know [A7sus4]how

Because [Em7]maybe[G] [Dsus4]
You're [A7sus4]gonna be the one that [Em7]saves me[G] [Dsus4]
And [A7sus4]after [Em7]all[G] [Dsus4]
You're my [A7sus4]wonder[Em7]wall[G] [Dsus4] [A7sus4]`,
  },
  {
    title: 'Wish You Were Here',
    author: 'Pink Floyd',
    level: 'intermediate',
    key: 'G',
    tempo: 60,
    capo_fret: 0,
    chords: 'Em7 G A7sus4 C D',
    strumming_pattern: 'Fingerpicking',
    category: 'Classic Rock',
    release_year: 1975,
    youtube_url: 'https://www.youtube.com/watch?v=hjpF8ukSrvk',
    spotify_link_url: 'https://open.spotify.com/track/7xGfFoTpQ2E7fRF5lN10tr',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/pink-floyd/wish-you-were-here-chords-44555',
    lyrics_with_chords: `[Em7]  [G]  [Em7]  [G]
[Em7]  [A7sus4]  [Em7]  [A7sus4]
[G]  [Em7]  [G]  [Em7]

[C]So, so you think you can [D]tell
Heaven from [Am]hell, blue skies from [G]pain
Can you tell a green [D]field from a cold steel [C]rail?
A smile from a [Am]veil? Do you think you can [G]tell?

[C]Did they get you to [D]trade your heroes for [Am]ghosts?
Hot ashes for [G]trees? Hot air for a cool [D]breeze?
Cold comfort for [C]change? Did you ex[Am]change
A walk-on part in the [G]war for a lead role in a cage?

[Em7]How I wish, [A7sus4]how I wish you were [G]here
We're just [C]two lost souls swimming in a [D]fish bowl
[Am]Year after [G]year
[D]Running over the [C]same old ground
What have we [Am]found? The same old [G]fears
Wish you were [Em7]here [A7sus4] [G]`,
  },
  {
    title: 'Hotel California',
    author: 'Eagles',
    level: 'advanced',
    key: 'Bm',
    tempo: 75,
    capo_fret: 0,
    chords: 'Bm F# A E G D Em',
    strumming_pattern: 'Arpeggios',
    category: 'Classic Rock',
    release_year: 1977,
    youtube_url: 'https://www.youtube.com/watch?v=09839DpTctU',
    spotify_link_url: 'https://open.spotify.com/track/40riOy7x9W7GXjyGp4pjAv',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/eagles/hotel-california-chords-46190',
    lyrics_with_chords: `[Bm]On a dark desert highway, [F#]cool wind in my hair
[A]Warm smell of colitas, [E]rising up through the air
[G]Up ahead in the distance, [D]I saw a shimmering light
[Em]My head grew heavy and my sight grew dim,
[F#]I had to stop for the night

[Bm]There she stood in the doorway; [F#]I heard the mission bell
[A]And I was thinking to myself, [E]this could be heaven or this could be hell
[G]Then she lit up a candle, [D]and she showed me the way
[Em]There were voices down the corridor,
[F#]I thought I heard them say

[G]Welcome to the [D]Hotel Cali[F#]fornia
Such a [Bm]lovely place, such a lovely [G]face
[D]Plenty of room at the [Em]Hotel Cali[F#]fornia
Any [Em]time of year, you can [F#]find it here`,
  },
  {
    title: 'Blackbird',
    author: 'The Beatles',
    level: 'intermediate',
    key: 'G',
    tempo: 96,
    capo_fret: 0,
    chords: 'G Am G/B C D',
    strumming_pattern: 'Fingerpicking',
    category: 'Folk Rock',
    release_year: 1968,
    youtube_url: 'https://www.youtube.com/watch?v=Man4Xw8Xypo',
    spotify_link_url: 'https://open.spotify.com/track/5jgFfDIR6FR0gvlA56Nakr',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/the-beatles/blackbird-chords-17251',
    lyrics_with_chords: `[G]Blackbird [Am]singing in the [G/B]dead of night
[C]Take these broken [A7]wings and learn to [D]fly [B7] [Em]
[G]All your [C]life
[A7]You were only [D]waiting for this [G]moment to arise

[G]Blackbird [Am]singing in the [G/B]dead of night
[C]Take these sunken [A7]eyes and learn to [D]see [B7] [Em]
[G]All your [C]life
[A7]You were only [D]waiting for this [G]moment to be free

[F]Black[C]bird, [Bb6]fly [A7]
[F]Black[C]bird, [Bb6]fly [A7]
[D]Into the [Db]light of the [D]dark black [G]night`,
  },
  {
    title: 'Brown Eyed Girl',
    author: 'Van Morrison',
    level: 'beginner',
    key: 'G',
    tempo: 150,
    capo_fret: 0,
    chords: 'G C D Em',
    strumming_pattern: 'D DU UDU',
    category: 'Rock',
    release_year: 1967,
    youtube_url: 'https://www.youtube.com/watch?v=UfmkgQRmmeE',
    spotify_link_url: 'https://open.spotify.com/track/3yrSvpt2l1xhsV9Em2VIcr',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/van-morrison/brown-eyed-girl-chords-766962',
    lyrics_with_chords: `[G]Hey, where did [C]we go, [G]days when the [D]rains came?
[G]Down in the [C]hollow, [G]playin' a [D]new game
[G]Laughing and a-[C]running, hey hey,
[G]Skipping and a-[D]jumping
[G]In the misty [C]morning fog, [G]with our [D]hearts a-thumpin'
And [C]you, [D]my brown-eyed [G]girl [Em]
[C]You, my [D]brown-eyed girl [G]

[G]Whatever [C]happened [G]to Tuesday and [D]so slow?
[G]Going down the [C]old mine with a [G]transistor [D]radio
[G]Standing in the [C]sunlight laughing,
[G]Hiding behind a [D]rainbow's wall
[G]Slipping and [C]sliding [G]all along the [D]waterfall
With [C]you, [D]my brown-eyed [G]girl [Em]
[C]You, my [D]brown-eyed girl

[D]Do you remember when we used to [G]sing
Sha la la [C]la la la la [G]la la la la te [D]da
Sha la la [G]la la la la [C]la la la la te [G]da, la te [D]da`,
  },
  {
    title: 'Nothing Else Matters',
    author: 'Metallica',
    level: 'intermediate',
    key: 'Em',
    tempo: 69,
    capo_fret: 0,
    chords: 'Em Am C D G B7',
    strumming_pattern: 'Fingerpicking',
    category: 'Metal Ballad',
    release_year: 1991,
    youtube_url: 'https://www.youtube.com/watch?v=tAGnKpE4NCI',
    spotify_link_url: 'https://open.spotify.com/track/0nLiqZ6A27jJri2VCalIUs',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/metallica/nothing-else-matters-chords-8547',
    lyrics_with_chords: `[Em]So close no matter [D]how far
[C]Couldn't be much more [Em]from the heart
[Em]Forever trusting [D]who we are
[C]And nothing else [G]ma[B7]tters

[Em]Never opened [D]myself this way
[C]Life is ours, we live it [Em]our way
[Em]All these words I [D]don't just say
[C]And nothing else [G]ma[B7]tters

[Em]Trust I seek and [D]I find in you
[C]Every day for us [Em]something new
[Em]Open mind for a [D]different view
[C]And nothing else [G]ma[B7]tters

[Am]Never cared for what they [C]do
[Am]Never cared for what they [D]know
[Em]But I know`,
  },
  {
    title: 'Stairway to Heaven',
    author: 'Led Zeppelin',
    level: 'advanced',
    key: 'Am',
    tempo: 82,
    capo_fret: 0,
    chords: 'Am E+ C D Fmaj7 G',
    strumming_pattern: 'Fingerpicking',
    category: 'Classic Rock',
    release_year: 1971,
    youtube_url: 'https://www.youtube.com/watch?v=QkF3oxziUI4',
    spotify_link_url: 'https://open.spotify.com/track/5CQ30WqJwcep0pYcV4AMNc',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/led-zeppelin/stairway-to-heaven-chords-9562',
    lyrics_with_chords: `[Am]There's a [E+]lady who's [C]sure
All that [D]glitters is [Fmaj7]gold
And she's [Am]buying a [E+]stairway to [C]hea[D]ven

[Am]When she [E+]gets there she [C]knows
If the [D]stores are all [Fmaj7]closed
With a [Am]word she can [E+]get what she [C]came [D]for

[C]Ooh [D]ooh [Fmaj7]ooh [Am]ooh
And she's [C]buying a [G]stairway to [Am]heaven

[C]There's a [D]sign on the [Fmaj7]wall
But she [Am]wants to be [C]sure
'Cause you [D]know sometimes [Fmaj7]words have two [Am]meanings
[C]In a [D]tree by the [Fmaj7]brook
There's a [Am]songbird who [C]sings
Sometimes [D]all of our [Fmaj7]thoughts are [Am]misgiven`,
  },
];

// ─── Expanded lesson history ──────────────────────────────────────────────────
// More completed lessons → higher student progress % (lessonsCompleted / 20)

const STUDENT_LESSONS: Record<string, { notes: string }[]> = {
  'emma@strummy.app': [
    { notes: 'Great first session — G, C, D open chords introduced. Focus on clean chord shapes before transitions.' },
    { notes: 'Chord transitions improving. Introduced Wonderwall strumming — down-down-up-up-down-up.' },
    { notes: 'Wonderwall strumming pattern locked in. Timing is solid; start syncing with a metronome next session.' },
    { notes: 'Brown Eyed Girl verse progression — G, C, G, D. Tempo needs work; keep it slow and steady.' },
    { notes: 'Blackbird fingerpicking intro attempted — keep left-hand thumb anchored. 15 mins daily on the opening bars.' },
    { notes: 'Brown Eyed Girl progression feels natural now. Ready to add vocals next week; keep the groove loose.' },
    { notes: 'Blackbird full arrangement coming together. Focus on the bass-note walk from G to A to Bm.' },
    { notes: 'Wish You Were Here intro — the acoustic intro is 90% there. Nail the bend on the 2nd string.' },
    { notes: 'Performance practice: Wonderwall + Brown Eyed Girl back-to-back. Transitions between songs need smoothing.' },
    { notes: 'Wish You Were Here full song — bridge section needs repetition. Great dynamics throughout.' },
    { notes: 'Fingerpicking technique workshop — alternating bass patterns, Travis picking intro. Beautiful tone.' },
    { notes: 'Repertoire review + setting new goals. Emma is ready for intermediate material — Nothing Else Matters next.' },
  ],
  'carlos@strummy.app': [
    { notes: 'Barre chords introduced — F and Bm shapes. Wrist position corrected; squeeze from the thumb, not the forearm.' },
    { notes: 'Hotel California intro riff — first 8 bars clean at 40 BPM. Bumping to 60 BPM next week.' },
    { notes: 'Hotel California intro riff sounding great. Work on dynamics: let the quiet notes breathe.' },
    { notes: 'Nothing Else Matters picking pattern at 60 BPM is clean. Bump to 75 BPM and revisit string separation.' },
    { notes: 'Hotel California full arrangement — verse + chorus connected. Solo section outlined for reference.' },
    { notes: 'Stairway to Heaven intro — classical fingerpicking section. Focus on the descending bass line.' },
    { notes: 'Lead guitar basics — minor pentatonic in Am position. Hammer-ons and pull-offs introduced.' },
    { notes: 'Solo improvisation intro — pentatonic over a 12-bar blues backing. Great feel, work on phrasing.' },
  ],
  'lily@strummy.app': [
    { notes: 'G, C, D chord triangle mastered with smooth transitions. Excellent posture from day one.' },
    { notes: 'Capo introduced for Wish You Were Here — key transposition concept understood. Practice the full intro daily.' },
    { notes: 'Brown Eyed Girl timing locked in with backing track. Ready to perform — add your own strumming flair.' },
    { notes: 'Wonderwall — learning the full song structure. Verse-prechorus-chorus transitions practiced.' },
    { notes: 'Performance ready — Brown Eyed Girl with confidence. Started exploring Blackbird fingerpicking.' },
    { notes: 'Fingerpicking foundations — alternating thumb technique. Blackbird opening 4 bars at slow tempo.' },
  ],
  'james@strummy.app': [
    { notes: 'Guitar anatomy, posture, and first chord shapes (G, D, Em) covered. Take it slow — muscle memory takes time.' },
    { notes: 'Open chord progressions improving. G to D transitions getting smoother. Introduced Em → Am movement.' },
    { notes: 'Wonderwall verse rhythm is almost there; count out loud while strumming. Down-up pattern needs consistency.' },
    { notes: 'Strumming patterns workshop — 3 patterns learned. Muting technique introduced for rhythmic precision.' },
  ],
};

// lesson_songs per completed lesson index (song title + status)
type LessonSongSpec = { title: string; status: string; notes?: string };
const LESSON_SONGS_BY_STUDENT: Record<string, LessonSongSpec[][]> = {
  'emma@strummy.app': [
    [{ title: 'Wonderwall', status: 'to_learn' }, { title: 'Brown Eyed Girl', status: 'to_learn' }],
    [{ title: 'Wonderwall', status: 'started', notes: 'Focus on strumming pattern' }],
    [{ title: 'Wonderwall', status: 'started', notes: 'Verse strumming pattern — keep tempo steady' }, { title: 'Brown Eyed Girl', status: 'to_learn' }],
    [{ title: 'Brown Eyed Girl', status: 'started' }, { title: 'Wonderwall', status: 'remembered' }],
    [{ title: 'Blackbird', status: 'to_learn', notes: 'Focus on first 4 bars only' }, { title: 'Wonderwall', status: 'remembered' }],
    [{ title: 'Brown Eyed Girl', status: 'with_author' }, { title: 'Blackbird', status: 'started' }],
    [{ title: 'Blackbird', status: 'remembered' }, { title: 'Wonderwall', status: 'mastered' }],
    [{ title: 'Wish You Were Here', status: 'to_learn' }, { title: 'Blackbird', status: 'remembered' }],
    [{ title: 'Wonderwall', status: 'mastered' }, { title: 'Brown Eyed Girl', status: 'mastered' }],
    [{ title: 'Wish You Were Here', status: 'started' }, { title: 'Blackbird', status: 'mastered' }],
    [{ title: 'Wish You Were Here', status: 'remembered' }],
    [{ title: 'Wish You Were Here', status: 'remembered' }, { title: 'Nothing Else Matters', status: 'to_learn' }],
  ],
  'carlos@strummy.app': [
    [{ title: 'Hotel California', status: 'to_learn' }, { title: 'Nothing Else Matters', status: 'to_learn' }],
    [{ title: 'Hotel California', status: 'started', notes: 'First 8 bars at 40 BPM' }],
    [{ title: 'Hotel California', status: 'started', notes: 'Nail the dynamics in the intro riff' }, { title: 'Nothing Else Matters', status: 'started' }],
    [{ title: 'Nothing Else Matters', status: 'remembered' }, { title: 'Hotel California', status: 'remembered' }],
    [{ title: 'Hotel California', status: 'with_author' }, { title: 'Stairway to Heaven', status: 'to_learn' }],
    [{ title: 'Stairway to Heaven', status: 'started', notes: 'Classical fingerpicking section' }],
    [{ title: 'Stairway to Heaven', status: 'started' }, { title: 'Nothing Else Matters', status: 'mastered' }],
    [{ title: 'Stairway to Heaven', status: 'remembered' }],
  ],
  'lily@strummy.app': [
    [{ title: 'Brown Eyed Girl', status: 'to_learn' }, { title: 'Wish You Were Here', status: 'to_learn' }],
    [{ title: 'Brown Eyed Girl', status: 'started' }, { title: 'Wish You Were Here', status: 'started', notes: 'Capo 2 — practice the full intro' }],
    [{ title: 'Brown Eyed Girl', status: 'with_author', notes: 'Performance-ready!' }, { title: 'Wish You Were Here', status: 'remembered' }],
    [{ title: 'Wonderwall', status: 'to_learn' }, { title: 'Brown Eyed Girl', status: 'mastered' }],
    [{ title: 'Wonderwall', status: 'started' }, { title: 'Blackbird', status: 'to_learn' }],
    [{ title: 'Blackbird', status: 'started' }, { title: 'Wonderwall', status: 'remembered' }],
  ],
  'james@strummy.app': [
    [{ title: 'Wonderwall', status: 'to_learn' }],
    [{ title: 'Wonderwall', status: 'to_learn' }, { title: 'Brown Eyed Girl', status: 'to_learn' }],
    [{ title: 'Wonderwall', status: 'started' }, { title: 'Brown Eyed Girl', status: 'to_learn' }],
    [{ title: 'Wonderwall', status: 'started', notes: 'Keep counting out loud' }],
  ],
};

// Assignments per student — statuses match DB enum: not_started | in_progress | completed | overdue | pending | submitted
type AssignmentSpec = { title: string; description: string; status: string; dueDaysFromNow: number };
const ASSIGNMENTS_BY_STUDENT: Record<string, AssignmentSpec[]> = {
  'emma@strummy.app': [
    { title: 'Wonderwall chord transitions', description: 'Practice G → Cadd9 → Dsus4 transitions for 20 minutes daily. Use a metronome at 60 BPM.', status: 'completed', dueDaysFromNow: -7 },
    { title: 'Blackbird intro fingerpicking', description: 'Learn the opening 8 bars of Blackbird. Keep the thumb on the bass string at all times.', status: 'in_progress', dueDaysFromNow: 3 },
    { title: 'Brown Eyed Girl video recording', description: 'Record a 1-minute clip of your Brown Eyed Girl strumming and share it in the next lesson.', status: 'not_started', dueDaysFromNow: 7 },
    { title: 'Nothing Else Matters intro', description: 'Learn the iconic picking intro at 50 BPM. Focus on letting each note ring clearly.', status: 'not_started', dueDaysFromNow: 10 },
  ],
  'carlos@strummy.app': [
    { title: 'Hotel California intro riff', description: 'Practice the iconic intro slowly at 50 BPM, focusing on clean note separation and dynamics.', status: 'completed', dueDaysFromNow: -5 },
    { title: 'Nothing Else Matters at 75 BPM', description: 'Bump the picking pattern tempo from 60 to 75 BPM. Record yourself and listen back for timing accuracy.', status: 'completed', dueDaysFromNow: -1 },
    { title: 'Stairway to Heaven chord research', description: 'Look up the chord shapes for Stairway to Heaven and practice each one slowly before the next session.', status: 'in_progress', dueDaysFromNow: 5 },
    { title: 'Pentatonic scale daily drill', description: 'Run through the Am pentatonic in all 5 positions — 5 minutes each position with a metronome.', status: 'not_started', dueDaysFromNow: 8 },
  ],
  'lily@strummy.app': [
    { title: 'Wish You Were Here full intro', description: 'Practice the complete intro with capo on fret 2. Aim for smooth note transitions throughout.', status: 'completed', dueDaysFromNow: -3 },
    { title: 'Brown Eyed Girl with backing track', description: 'Play through the full song with a YouTube backing track at least 3 times before the next lesson.', status: 'completed', dueDaysFromNow: -1 },
    { title: 'Blackbird opening bars', description: 'Learn the first 4 bars of Blackbird fingerpicking. Keep thumb anchored on the low E string.', status: 'in_progress', dueDaysFromNow: 4 },
  ],
  'james@strummy.app': [
    { title: 'Daily chord switching practice', description: 'Switch between G, D, and Em for 10 minutes every day. Time yourself — aim for 1 switch per second.', status: 'completed', dueDaysFromNow: -4 },
    { title: 'Wonderwall verse strumming', description: 'Learn the down-up strumming pattern for the Wonderwall verse. Count "1-and-2-and-3-and-4-and" out loud.', status: 'in_progress', dueDaysFromNow: 6 },
    { title: 'Chord diagram worksheet', description: 'Fill in the chord diagrams for G, C, D, Em, and Am from memory. Check against your chord chart after.', status: 'not_started', dueDaysFromNow: 9 },
  ],
};

// ─── This-week lesson schedule ────────────────────────────────────────────────
// Spread across the current week so dashboard shows real activity

interface WeekLesson {
  dow: number; // 0=Sun, 1=Mon, ..., 6=Sat
  hour: number;
  email: string;
  notes: string;
}

const THIS_WEEK_SCHEDULE: WeekLesson[] = [
  { dow: 0, hour: 10, email: 'emma@strummy.app',   notes: 'Review Wish You Were Here progress + set weekly goals' },
  { dow: 0, hour: 14, email: 'carlos@strummy.app',  notes: 'Solo improvisation continued — phrasing and dynamics' },
  { dow: 1, hour: 10, email: 'lily@strummy.app',    notes: 'Blackbird fingerpicking — bars 1-8 at slow tempo' },
  { dow: 1, hour: 15, email: 'james@strummy.app',   notes: 'Chord transitions speed drill + metronome work' },
  { dow: 2, hour: 11, email: 'emma@strummy.app',    notes: 'Nothing Else Matters intro — picking pattern at 50 BPM' },
  { dow: 3, hour: 10, email: 'carlos@strummy.app',  notes: 'Pentatonic scale patterns — all 5 positions' },
  { dow: 3, hour: 14, email: 'lily@strummy.app',    notes: 'Wonderwall performance prep with backing track' },
  { dow: 4, hour: 10, email: 'james@strummy.app',   notes: 'Strumming pattern workshop — down-up and muting' },
  { dow: 4, hour: 15, email: 'emma@strummy.app',    notes: 'Repertoire run-through: 3-song setlist practice' },
  { dow: 5, hour: 11, email: 'carlos@strummy.app',  notes: 'Hotel California full arrangement — verse + solo' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function getWeekScheduleLessons(
  userIds: Record<string, string>,
  teacherId: string,
): { teacher_id: string; student_id: string; status: string; scheduled_at: string; notes: string; lesson_teacher_number: number }[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentHour = now.getHours();

  // Start of current week (Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  return THIS_WEEK_SCHEDULE.map((l) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + l.dow);
    date.setHours(l.hour, 0, 0, 0);

    const isPast = l.dow < dayOfWeek || (l.dow === dayOfWeek && l.hour <= currentHour);

    return {
      teacher_id: teacherId,
      student_id: userIds[l.email],
      status: isPast ? 'COMPLETED' : 'SCHEDULED',
      scheduled_at: date.toISOString(),
      notes: l.notes,
      lesson_teacher_number: 0, // trigger auto-sets this
    };
  });
}

async function getOrCreateUser(email: string, fullName: string): Promise<string> {
  const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      avatar_url: `https://i.pravatar.cc/150?u=${email}`,
      isDemo: true,
    },
  });

  if (!createErr) return createData.user.id;

  if (!/already (exists|been registered)/i.test(createErr.message)) {
    console.error(`  ❌ Failed to create ${email}:`, createErr.message);
    process.exit(1);
  }

  // User already exists — fetch their ID
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.error('  ❌ Failed to list users:', listErr.message);
    process.exit(1);
  }
  const existing = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error(`  ❌ User ${email} not found after creation attempt`);
    process.exit(1);
  }
  return existing.id;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎸 Demo Seed — Strummy Showcase\n' + '='.repeat(40));
  console.log(`🌐 Remote URL: ${REMOTE_URL}\n`);

  // ── Step 1: Create / get users + upsert profiles ──────────────────────────
  console.log('👤 Step 1: Users & profiles');
  const userIds: Record<string, string> = {};

  for (const user of DEMO_USERS) {
    const id = await getOrCreateUser(user.email, user.fullName);
    userIds[user.email] = id;

    const { error } = await supabase.from('profiles').upsert(
      {
        id,
        email: user.email,
        full_name: user.fullName,
        avatar_url: `https://i.pravatar.cc/150?u=${user.email}`,
        is_teacher: user.isTeacher,
        is_student: user.isStudent,
        is_admin: false,
        is_development: true,
      },
      { onConflict: 'id' }
    );
    if (error) { console.error(`  ❌ Profile upsert failed for ${user.email}:`, error.message); process.exit(1); }
    console.log(`  ✅ ${user.fullName} <${user.email}>`);
  }

  const teacherId = userIds['sarah@strummy.app'];
  const studentEmails = DEMO_USERS.filter((u) => u.isStudent).map((u) => u.email);
  const studentIds = studentEmails.map((e) => userIds[e]);

  // ── Step 2: Upsert songs (insert missing + update existing with rich data) ─
  console.log('\n🎵 Step 2: Songs');
  const songTitles = DEMO_SONGS.map((s) => s.title);
  const { data: existingSongs, error: fetchSongsErr } = await supabase
    .from('songs')
    .select('id, title')
    .in('title', songTitles);

  if (fetchSongsErr) { console.error('  ❌ Song fetch failed:', fetchSongsErr.message); process.exit(1); }

  const existingByTitle: Record<string, string> = {};
  for (const s of existingSongs ?? []) existingByTitle[s.title] = s.id;

  const songMap: Record<string, string> = {};
  let updatedCount = 0;
  let insertedCount = 0;

  for (const song of DEMO_SONGS) {
    const existingId = existingByTitle[song.title];
    if (existingId) {
      // Update existing song with all enriched fields
      const { error: updateErr } = await supabase
        .from('songs')
        .update({
          author: song.author,
          level: song.level,
          key: song.key,
          tempo: song.tempo,
          capo_fret: song.capo_fret,
          chords: song.chords,
          strumming_pattern: song.strumming_pattern,
          category: song.category,
          release_year: song.release_year,
          youtube_url: song.youtube_url,
          spotify_link_url: song.spotify_link_url,
          ultimate_guitar_link: song.ultimate_guitar_link,
          lyrics_with_chords: song.lyrics_with_chords,
        })
        .eq('id', existingId);
      if (updateErr) { console.error(`  ❌ Song update failed for "${song.title}":`, updateErr.message); process.exit(1); }
      songMap[song.title] = existingId;
      updatedCount++;
    } else {
      // Insert new song with all fields
      const { data: newSong, error: insertErr } = await supabase
        .from('songs')
        .insert(song)
        .select('id, title')
        .single();
      if (insertErr) { console.error(`  ❌ Song insert failed for "${song.title}":`, insertErr.message); process.exit(1); }
      songMap[song.title] = newSong.id;
      insertedCount++;
    }
  }

  const totalSongs = Object.keys(songMap).length;
  console.log(`  ✅ ${totalSongs} songs ready (${insertedCount} new, ${updatedCount} updated)`);

  // ── Step 3: Clean up existing demo data ───────────────────────────────────
  console.log('\n🧹 Step 3: Clearing existing demo data');
  await supabase.from('assignments').delete().in('student_id', studentIds);
  await supabase.from('lessons').delete().in('student_id', studentIds);
  console.log('  ✅ Previous demo lessons & assignments removed');

  // ── Step 4: Insert historical lessons ───────────────────────────────────────
  console.log('\n📅 Step 4: Historical lessons');
  let totalLessons = 0;
  const lessonIdsByStudent: Record<string, string[]> = {};

  for (const email of studentEmails) {
    const studentId = userIds[email];
    const completedNotes = STUDENT_LESSONS[email];
    const lessonsToInsert = [];

    // Completed lessons spread over the past weeks
    for (let i = 0; i < completedNotes.length; i++) {
      const weeksAgo = completedNotes.length - i;
      lessonsToInsert.push({
        teacher_id: teacherId,
        student_id: studentId,
        lesson_teacher_number: i + 1,
        status: 'COMPLETED',
        scheduled_at: daysFromNow(-(weeksAgo * 7)),
        notes: completedNotes[i].notes,
      });
    }

    const { data: inserted, error: lessonErr } = await supabase
      .from('lessons')
      .insert(lessonsToInsert)
      .select('id, status');

    if (lessonErr) { console.error(`  ❌ Lessons insert failed for ${email}:`, lessonErr.message); process.exit(1); }
    const completedIds = (inserted ?? []).filter((l) => l.status === 'COMPLETED').map((l) => l.id);
    lessonIdsByStudent[email] = completedIds;
    totalLessons += inserted?.length ?? 0;
    console.log(`  ✅ ${email}: ${completedNotes.length} completed`);
  }

  // ── Step 4b: Insert this-week schedule ──────────────────────────────────────
  console.log('\n📆 Step 4b: This week\'s schedule');
  const weekLessons = getWeekScheduleLessons(userIds, teacherId);
  const { data: weekInserted, error: weekErr } = await supabase
    .from('lessons')
    .insert(weekLessons)
    .select('id, status');

  if (weekErr) { console.error('  ❌ This-week lessons insert failed:', weekErr.message); process.exit(1); }
  const weekCount = weekInserted?.length ?? 0;
  const completedThisWeek = (weekInserted ?? []).filter((l) => l.status === 'COMPLETED').length;
  const scheduledThisWeek = weekCount - completedThisWeek;
  totalLessons += weekCount;
  console.log(`  ✅ ${weekCount} lessons this week (${completedThisWeek} completed, ${scheduledThisWeek} scheduled)`);

  // ── Step 5: Insert lesson_songs ───────────────────────────────────────────
  console.log('\n🎼 Step 5: Lesson songs');
  const lessonSongsToInsert: object[] = [];

  for (const email of studentEmails) {
    const completedLessonIds = lessonIdsByStudent[email];
    const songsPerLesson = LESSON_SONGS_BY_STUDENT[email];

    for (let i = 0; i < completedLessonIds.length; i++) {
      const lessonId = completedLessonIds[i];
      const specs = songsPerLesson[i] ?? [];
      for (const spec of specs) {
        const songId = songMap[spec.title];
        if (!songId) continue;
        lessonSongsToInsert.push({
          lesson_id: lessonId,
          song_id: songId,
          status: spec.status,
          notes: spec.notes ?? null,
        });
      }
    }
  }

  const { data: insertedLS, error: lsErr } = await supabase
    .from('lesson_songs')
    .insert(lessonSongsToInsert)
    .select('id');

  if (lsErr) { console.error('  ❌ lesson_songs insert failed:', lsErr.message); process.exit(1); }
  const totalLessonSongs = insertedLS?.length ?? 0;
  console.log(`  ✅ ${totalLessonSongs} lesson_songs inserted`);

  // ── Step 6: Insert assignments ────────────────────────────────────────────
  console.log('\n📝 Step 6: Assignments');
  const assignmentsToInsert: object[] = [];

  for (const email of studentEmails) {
    const studentId = userIds[email];
    for (const a of ASSIGNMENTS_BY_STUDENT[email]) {
      assignmentsToInsert.push({
        teacher_id: teacherId,
        student_id: studentId,
        title: a.title,
        description: a.description,
        status: a.status,
        due_date: daysFromNow(a.dueDaysFromNow),
      });
    }
  }

  const { data: insertedA, error: aErr } = await supabase
    .from('assignments')
    .insert(assignmentsToInsert)
    .select('id');

  if (aErr) { console.error('  ❌ assignments insert failed:', aErr.message); process.exit(1); }
  const totalAssignments = insertedA?.length ?? 0;
  console.log(`  ✅ ${totalAssignments} assignments inserted`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const pendingCount = Object.values(ASSIGNMENTS_BY_STUDENT)
    .flat()
    .filter((a) => ['not_started', 'in_progress', 'pending'].includes(a.status)).length;

  console.log('\n' + '='.repeat(40));
  console.log('✅ Demo seed complete!');
  console.log(`   👤 Users:            ${DEMO_USERS.length} (1 teacher, 4 students)`);
  console.log(`   🎵 Songs:            ${totalSongs}`);
  console.log(`   📅 Historical:       ${totalLessons - weekCount} lessons`);
  console.log(`   📆 This week:        ${weekCount} lessons (${completedThisWeek} done, ${scheduledThisWeek} upcoming)`);
  console.log(`   🎼 Lesson songs:     ${totalLessonSongs}`);
  console.log(`   📝 Assignments:      ${totalAssignments} (${pendingCount} pending)`);
  console.log('\n📊 Expected dashboard stats:');
  console.log(`   Active Students:     4`);
  console.log(`   This Week:           ${weekCount}`);
  console.log(`   Pending:             ${pendingCount}`);
  console.log(`   Student progress:    Emma 60% | Carlos 40% | Lily 30% | James 20%`);
  console.log('\n🔑 Login credentials (password: Demo2024!)');
  for (const u of DEMO_USERS) {
    console.log(`   ${u.isTeacher ? 'Teacher' : 'Student'}: ${u.email}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
