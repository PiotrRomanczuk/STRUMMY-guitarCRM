/**
 * @jest-environment node
 *
 * Unit test for the Ollama provider's completeStream (true NDJSON streaming).
 * Runs in the Node env for native ReadableStream/Response/fetch globals.
 * Mocks fetch with a streamed body and asserts incremental deltas + termination.
 */
import { createOllamaProvider } from './ollama';

function ndjsonStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < lines.length) {
        controller.enqueue(encoder.encode(lines[i] + '\n'));
        i += 1;
      } else {
        controller.close();
      }
    },
  });
}

describe('Ollama completeStream', () => {
  afterEach(() => jest.restoreAllMocks());

  it('yields incremental content deltas then a done chunk', async () => {
    const body = ndjsonStream([
      JSON.stringify({ message: { content: 'Hello' }, done: false }),
      JSON.stringify({ message: { content: ' world' }, done: false }),
      JSON.stringify({ message: { content: '' }, done: true }),
    ]);
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(body, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } })
      );

    const provider = createOllamaProvider({ baseUrl: 'http://localhost:11434' });
    const chunks: { content: string; done?: boolean }[] = [];
    for await (const chunk of provider.completeStream!({
      model: 'gemma3:12b',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      chunks.push(chunk);
    }

    const deltas = chunks.filter((c) => c.content).map((c) => c.content);
    expect(deltas).toEqual(['Hello', ' world']);
    expect(chunks.at(-1)?.done).toBe(true);
  });

  it('handles content split across read boundaries (partial JSON lines)', async () => {
    // A single NDJSON line delivered in two reads must not be parsed until complete.
    const encoder = new TextEncoder();
    const full = JSON.stringify({ message: { content: 'streamed' }, done: false });
    const half = Math.floor(full.length / 2);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(full.slice(0, half)));
        controller.enqueue(encoder.encode(full.slice(half) + '\n'));
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
        controller.close();
      },
    });
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(stream, { status: 200 }));

    const provider = createOllamaProvider();
    const out: string[] = [];
    for await (const chunk of provider.completeStream!({
      model: 'gemma3:12b',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      if (chunk.content) out.push(chunk.content);
    }
    expect(out).toEqual(['streamed']);
  });

  it('yields an error chunk when the API responds non-OK', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('not found', { status: 404, statusText: 'Not Found' }));
    const provider = createOllamaProvider();
    const chunks: { content: string; done?: boolean }[] = [];
    for await (const chunk of provider.completeStream!({
      model: 'missing',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toMatch(/Error: Ollama API Error/);
    expect(chunks[0].done).toBe(true);
  });
});
