import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function ok(payload: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}

export function fail(message: string, details?: unknown): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, ...(details ? { details } : {}) }, null, 2),
      },
    ],
  };
}
