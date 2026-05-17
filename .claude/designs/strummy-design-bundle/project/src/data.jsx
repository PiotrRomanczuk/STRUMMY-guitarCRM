// Shared realistic data for both directions.
// Teacher: Sarah Chen, Thursday Apr 23 2026.

const today = { day: 'Thursday', date: 'April 23', year: 2026, weekNum: 17 };

const students = [
  { id:'s1', name:'Emma Johnson',  level:'Intermediate', years:2.3, avatar:'EJ', color:'#c89523', health:'excellent', nextLesson:'Today · 4:00p', lastLesson:'Apr 16', progress:62, streak:11, songs:14, mastered:5, note:'Working on fingerpicking "Blackbird" — right-hand independence improving.' },
  { id:'s2', name:'Carlos Reyes',  level:'Beginner',     years:0.6, avatar:'CR', color:'#b84a3a', health:'at_risk',  nextLesson:'Today · 5:00p', lastLesson:'Apr 9',  progress:28, streak:0,  songs:6,  mastered:1, note:'Missed last two sessions. Bring back basics — open chords + strumming.' },
  { id:'s3', name:'Lily Park',     level:'Beginner',     years:1.1, avatar:'LP', color:'#3a7d3a', health:'good',      nextLesson:'Today · 6:30p', lastLesson:'Apr 17', progress:45, streak:5,  songs:9,  mastered:2, note:'Ready to introduce barre chords. Start with F major shape.' },
  { id:'s4', name:'James O\u2019Brien', level:'Beginner', years:0.4, avatar:'JO', color:'#3a5a7d', health:'needs_attention', nextLesson:'Fri Apr 24', lastLesson:'Apr 15', progress:18, streak:2, songs:4, mastered:0, note:'Practice log shows 45 min total last week. Nudge on habit.' },
  { id:'s5', name:'Maya Patel',    level:'Advanced',     years:4.8, avatar:'MP', color:'#6d4fa0', health:'excellent', nextLesson:'Sat Apr 25', lastLesson:'Apr 18', progress:88, streak:24, songs:32, mastered:19, note:'Prepping "Classical Gas". Needs metronome work at 140 BPM.' },
  { id:'s6', name:'Theo Nakamura', level:'Intermediate', years:1.9, avatar:'TN', color:'#c17a3a', health:'good',      nextLesson:'Mon Apr 28', lastLesson:'Apr 14', progress:54, streak:8,  songs:11, mastered:4, note:'Wants to learn "Wish You Were Here" solo. Bring tab + backing track.' },
];

// Today's agenda (chronological)
const agenda = [
  {
    id:'l1', time:'4:00p', duration:'45m', endTime:'4:45p',
    student: students[0],
    status:'upcoming', // upcoming | now | done
    songs:[
      { title:'Blackbird',  author:'The Beatles', status:'started', key:'G' },
      { title:'Landslide',  author:'Fleetwood Mac', status:'remembered', key:'C' },
    ],
    lastSummary:'Covered alternating bass pattern. Homework: 10 min/day fingerpicking drill.',
  },
  {
    id:'l2', time:'5:00p', duration:'30m', endTime:'5:30p',
    student: students[1],
    status:'upcoming',
    songs:[
      { title:'Wonderwall', author:'Oasis', status:'to_learn', key:'Em' },
    ],
    lastSummary:'Re-introduce D\u2013Cadd9\u2013G progression. Check capo position.',
  },
  {
    id:'l3', time:'6:30p', duration:'45m', endTime:'7:15p',
    student: students[2],
    status:'upcoming',
    songs:[
      { title:'House of the Rising Sun', author:'Trad.', status:'started', key:'Am' },
      { title:'F major barre drill',     author:'Technique',       status:'to_learn', key:'F' },
    ],
    lastSummary:'Am\u2013C\u2013D\u2013F arpeggio pattern solid at 60 BPM. Push to 80.',
  },
];

// Needs attention
const needsAttention = [
  { student: students[1], reason:'No practice logged in 11 days',   severity:'at_risk' },
  { student: students[3], reason:'Assignment overdue 3 days',         severity:'needs_attention' },
  { student: students[3], reason:'Missed last scheduled lesson',      severity:'needs_attention' },
];

// Activity feed
const activity = [
  { id:'a1', time:'22m ago',  who: students[4], verb:'mastered',  obj:'"Classical Gas" — intro section', type:'mastered' },
  { id:'a2', time:'1h ago',   who: students[0], verb:'logged',    obj:'35 min practice',                type:'practice' },
  { id:'a3', time:'2h ago',   who: students[2], verb:'submitted', obj:'Assignment: "Am arpeggio"',      type:'assignment' },
  { id:'a4', time:'4h ago',   who: students[5], verb:'added',     obj:'"Wish You Were Here" to repertoire', type:'repertoire' },
  { id:'a5', time:'Yesterday',who: students[4], verb:'logged',    obj:'1h 20m practice',                type:'practice' },
  { id:'a6', time:'Yesterday',who: students[0], verb:'completed', obj:'Lesson #42',                     type:'lesson' },
];

// Stats
const stats = [
  { key:'students',    label:'Active students', value:6,   trend:'+1',   unit:'this month' },
  { key:'lessons',     label:'Lessons this week', value:12, trend:'+3', unit:'vs last week' },
  { key:'library',     label:'Songs in library', value:128, trend:'+4', unit:'this month' },
  { key:'pending',     label:'Pending assignments', value:7, trend:'-2', unit:'vs last week' },
];

// Song of the week
const songOfWeek = {
  title:'Hotel California',
  author:'Eagles',
  year:1976,
  key:'Bm',
  capo:7,
  tempo:75,
  level:'Intermediate',
  chords:['Bm','F#','A','E','G','D','Em','F#7'],
  assignedTo: 4,
};

// Week calendar — lesson density
const weekDays = [
  { d:'M', n:20, lessons:2, isToday:false },
  { d:'T', n:21, lessons:3, isToday:false },
  { d:'W', n:22, lessons:1, isToday:false },
  { d:'T', n:23, lessons:3, isToday:true  },
  { d:'F', n:24, lessons:2, isToday:false },
  { d:'S', n:25, lessons:1, isToday:false },
  { d:'S', n:26, lessons:0, isToday:false },
];

Object.assign(window, {
  TODAY: today, STUDENTS: students, AGENDA: agenda,
  NEEDS_ATTN: needsAttention, ACTIVITY: activity, STATS: stats,
  SONG_OF_WEEK: songOfWeek, WEEK_DAYS: weekDays,
});
