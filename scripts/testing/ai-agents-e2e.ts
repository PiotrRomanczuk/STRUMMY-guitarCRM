#!/usr/bin/env tsx
/**
 * E2E AI Agent Harness — drives EVERY registered AI agent through the real
 * provider pipeline against the LOCAL LLM (Ollama), using the SAME streaming
 * path the app uses in production (provider.completeStream()).
 *
 * It bypasses the DB-bound rate limiter + context fetcher by assembling the
 * prompt the way registry/execution.executeAgent() does (empty execution
 * context), so no Supabase connection is required. This isolates the AI path:
 * prompt assembly -> OLLAMA model mapping -> streamed local inference.
 *
 * Usage:
 *   npx tsx scripts/testing/ai-agents-e2e.ts [baseUrl] [model] [agentId]
 *   npx tsx scripts/testing/ai-agents-e2e.ts http://192.168.1.10:11434 gemma3:1b
 *   npx tsx scripts/testing/ai-agents-e2e.ts http://192.168.1.10:11434 gemma3:1b chat-assistant
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.argv[2] || 'http://192.168.1.10:11434';
const MODEL = process.argv[3] || process.env.OLLAMA_DEFAULT_MODEL || 'gemma3:1b';
const ONLY = process.argv[4];

// Force the LOCAL LLM, overriding .env.local, BEFORE importing the AI layer.
process.env.AI_PROVIDER = 'ollama';
process.env.OLLAMA_BASE_URL = BASE_URL;
process.env.OLLAMA_DEFAULT_MODEL = MODEL;
if (!process.env.AI_REQUEST_TIMEOUT) process.env.AI_REQUEST_TIMEOUT = '180000';

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

const SAMPLE: Record<string, unknown> = {
  title: 'wonderwal', artist: 'oasiss', album: 'morning glory', year: '1995', genre: 'rock',
  prompt: 'Give me one short tip for teaching barre chords to a beginner.',
  conversation_history: [],
  studentName: 'Emma', student_name: 'Emma', studentLevel: 'beginner', level: 'beginner',
  focusArea: 'fingerpicking', focus: 'fingerpicking', topic: 'C major scale', lesson_topic: 'C major scale',
  songTitle: 'Wonderwall', chords: 'Em7, G, Dsus4, A7sus4', tempo: '87', capo: '2',
  difficulty: 'beginner', tone: 'friendly', emailType: 'lesson_reminder', purpose: 'lesson reminder',
  notes: 'student struggled with chord transitions but nailed the strumming pattern',
  rawNotes: 'kid did good on strumming, bad on chord changes, practice F chord',
  lessonSummary: 'Worked on Wonderwall intro and transitions.',
  timePeriod: 'last 30 days', period: 'last 30 days',
  techniques: 'down-up strumming', songsCovered: 'Wonderwall', songs_covered: 'Wonderwall',
  metrics: JSON.stringify({ newStudents: 4, retention: '92%', revenue: 1200, popularSong: 'Wonderwall' }),
};
const sampleFor = (f: string): unknown => (f in SAMPLE ? SAMPLE[f] : `sample ${f}`);

async function main() {
  console.log(`\n${C.bold}${C.cyan}AI AGENT E2E — LOCAL LLM (streaming)${C.reset}`);
  console.log(`${C.dim}base=${BASE_URL}  model=${MODEL}  timeout=${process.env.AI_REQUEST_TIMEOUT}ms${C.reset}\n`);

  // 0) Connectivity + model presence
  try {
    const r = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const tags = (await r.json()) as { models?: { name: string }[] };
    const names = (tags.models || []).map((m) => m.name);
    console.log(`${C.green}✓${C.reset} Ollama reachable — models: ${names.join(', ')}`);
    if (!names.includes(MODEL)) {
      console.log(`${C.red}✗ model "${MODEL}" not installed — aborting${C.reset}`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`${C.red}✗ Cannot reach Ollama at ${BASE_URL}: ${String(e)}${C.reset}`);
    process.exit(1);
  }

  // 1) Confirm factory selects Ollama
  const { getAIProvider } = await import('@/lib/ai/provider-factory');
  const { mapToOllamaModel } = await import('@/lib/ai/model-mappings');
  const provider = await getAIProvider();
  console.log(`${C.green}✓${C.reset} provider-factory selected: ${C.bold}${provider.name}${C.reset}`);
  if (provider.name !== 'Ollama') {
    console.log(`${C.red}Factory did not select Ollama — check env${C.reset}`);
    process.exit(1);
  }
  if (!provider.completeStream) {
    console.log(`${C.red}Provider has no completeStream()${C.reset}`);
    process.exit(1);
  }

  // 2) Load the 10 agent specs DIRECTLY from their pure category modules
  //    (the registry barrel pulls in @/lib/supabase/server which is server-only).
  type AgentSpec = import('@/lib/ai/registry/types').AgentSpecification;
  const { emailDraftAgent } = await import('@/lib/ai/agents/communication');
  const { lessonNotesAgent, assignmentGeneratorAgent, postLessonSummaryAgent } = await import('@/lib/ai/agents/content');
  const { progressInsightsAgent, adminInsightsAgent } = await import('@/lib/ai/agents/analytics');
  const { songNormalizationAgent } = await import('@/lib/ai/agents/song-normalization');
  const { chatAssistantAgent } = await import('@/lib/ai/agents/chat');
  const { songNotesAgent } = await import('@/lib/ai/agents/song-notes');
  const { songNotesEnhancerAgent } = await import('@/lib/ai/agents/song-notes-enhancer');

  const all = [
    emailDraftAgent, lessonNotesAgent, assignmentGeneratorAgent, postLessonSummaryAgent,
    progressInsightsAgent, adminInsightsAgent, songNormalizationAgent, chatAssistantAgent,
    songNotesAgent, songNotesEnhancerAgent,
  ].filter(Boolean) as AgentSpec[];
  all.sort((a, b) => a.id.localeCompare(b.id));

  const agents = ONLY ? all.filter((a) => a.id === ONLY) : all;
  if (ONLY && agents.length === 0) {
    console.log(`${C.red}No agent "${ONLY}". Available: ${all.map((a) => a.id).join(', ')}${C.reset}`);
    process.exit(1);
  }
  console.log(`Running ${C.bold}${agents.length}${C.reset} of ${all.length} agents.\n`);

  // Mirror registry/execution.executeAgent() prompt assembly (empty context),
  // then stream like the app does.
  const runAgent = async (agent: AgentSpec, input: Record<string, unknown>) => {
    const model = mapToOllamaModel(agent.model || 'openrouter/auto:free');
    const userParts: string[] = [];
    for (const f of agent.inputValidation.allowedFields) {
      const v = input[f];
      if (v !== undefined && v !== null && v !== '')
        userParts.push(`${f}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
    }
    let content = '';
    for await (const chunk of provider.completeStream!({
      model,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: userParts.join('\n') || 'No specific input provided.' },
      ],
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    })) {
      if (chunk.content) content += chunk.content;
      if (chunk.done) break;
    }
    return content;
  };

  const results: Array<{ id: string; ok: boolean; ms: number; chars: number; note: string }> = [];
  for (const agent of agents) {
    const input: Record<string, unknown> = {};
    for (const f of agent.inputValidation.allowedFields) input[f] = sampleFor(f);
    const t0 = Date.now();
    try {
      const content = await runAgent(agent, input);
      const ms = Date.now() - t0;
      const ok = content.trim().length > 0 && !content.startsWith('Error:');
      const preview = content.replace(/\s+/g, ' ').slice(0, 80);
      results.push({ id: agent.id, ok, ms, chars: content.length, note: ok ? '' : content.slice(0, 80) });
      const mark = ok ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
      console.log(`${mark} ${agent.id.padEnd(28)} ${C.dim}${(ms / 1000).toFixed(1)}s, ${content.length} chars${C.reset}  ${C.dim}${preview}${C.reset}`);
    } catch (err) {
      const ms = Date.now() - t0;
      results.push({ id: agent.id, ok: false, ms, chars: 0, note: String(err).slice(0, 90) });
      console.log(`${C.red}✗${C.reset} ${agent.id.padEnd(28)} ${C.red}${String(err).slice(0, 80)}${C.reset}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${C.bold}${C.cyan}SUMMARY${C.reset}\n${'='.repeat(60)}`);
  for (const r of results) {
    const mark = r.ok ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
    console.log(`  ${mark}  ${r.id.padEnd(28)} ${(r.ms / 1000).toFixed(1)}s  ${r.note}`);
  }
  console.log(`${'='.repeat(60)}`);
  console.log(`${passed === results.length ? C.green : C.yellow}${passed}/${results.length} agents produced output via the local LLM${C.reset}\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
