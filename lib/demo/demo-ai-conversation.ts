import type { ChatMessage } from '@/components/v2/ai/ai-chat.types';

export const DEMO_AI_MESSAGES: ChatMessage[] = [
  {
    role: 'system',
    content:
      "Hi! I'm your Strummy AI assistant. Ask me about practice plans, music theory, lesson planning, or student management.",
    timestamp: new Date(),
  },
  {
    role: 'user',
    content: 'How is Emma Johnson progressing?',
    timestamp: new Date(),
  },
  {
    role: 'assistant',
    content: `**Emma Johnson — Progress Summary**

Emma has completed **4 lessons** and is making excellent progress for a beginner:

**Strengths:**
- Clean G, C, D open chord shapes
- Wonderwall strumming pattern is solid (D DU UDU)
- Quick learner — she moved from chord intro to fingerpicking in 4 sessions

**Current Focus:**
- Blackbird fingerpicking intro — she needs to keep her left-hand thumb anchored
- Brown Eyed Girl timing needs work with a backing track

**Recommended Next Steps:**
1. 15 minutes daily on Blackbird opening bars
2. Record a video of Brown Eyed Girl for the next lesson
3. Consider introducing Nothing Else Matters intro picking pattern

Overall confidence: **60%** — she's on track for intermediate repertoire within 2-3 months.`,
    timestamp: new Date(),
  },
  {
    role: 'user',
    content: 'What should I focus on with Carlos next lesson?',
    timestamp: new Date(),
  },
  {
    role: 'assistant',
    content: `**Carlos Reyes — Next Lesson Recommendation**

Carlos has completed **3 lessons** and is at an intermediate level. Here's what I'd suggest:

**Last Session Recap:**
- Nothing Else Matters picking pattern clean at 60 BPM
- Hotel California intro riff memorized — first 8 bars at 40 BPM

**Next Lesson Plan:**
1. **Warm-up (5 min):** Am pentatonic scale, all 5 positions
2. **Hotel California (15 min):** Bump tempo to 60 BPM, work on dynamics in the arpeggiated sections
3. **Nothing Else Matters (15 min):** Push to 75 BPM, focus on string separation
4. **New Material (10 min):** Introduce Stairway to Heaven chord shapes — Am, E+, C progression

**Assignment for the week:**
- Hotel California at 60 BPM, record and self-evaluate
- Stairway chord shapes — slow practice, no tempo target yet`,
    timestamp: new Date(),
  },
];

export const DEMO_AI_CONVERSATIONS = [
  { id: 'demo-1', title: 'Emma Johnson progress review', preview: 'How is Emma Johnson progressing?', updatedAt: new Date() },
  { id: 'demo-2', title: 'Carlos lesson planning', preview: 'What should I focus on with Carlos?', updatedAt: new Date() },
];
