---
name: mcp-builder
description: Guide for creating MCP (Model Context Protocol) servers to extend Claude's capabilities with external services. Use when building custom integrations for Guitar CRM like Spotify enrichment, calendar sync, or payment processing.
---

# MCP Server Development Guide

## Overview

Create MCP servers to extend Claude's capabilities with external services. Guitar CRM already uses MCPs for Supabase, GitHub, and Sentry - this guide helps build custom integrations.

## When to Build an MCP

Consider building an MCP for:
- **Spotify Integration** - Enhanced song metadata, playlists
- **Calendar Sync** - Google/Outlook calendar integration
- **Payment Processing** - Stripe/PayPal for lesson payments
- **Communication** - SMS/Email notifications
- **Music Theory APIs** - Chord/scale lookups

## Quick Start (TypeScript)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'guitar-crm-spotify',
  version: '1.0.0',
});

// Define a tool
server.tool(
  'search_song',
  'Search for a song on Spotify to get metadata',
  {
    query: z.string().describe('Song title and artist to search for'),
    limit: z.number().optional().default(5).describe('Max results'),
  },
  async ({ query, limit }) => {
    // Implementation
    const results = await spotifyApi.search(query, limit);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Project Structure

```
mcp-guitar-spotify/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts        # Server entry point
│   ├── tools/          # Tool implementations
│   │   ├── search.ts
│   │   └── playlist.ts
│   └── utils/
│       ├── spotify-client.ts
│       └── error-handling.ts
└── 2026-03-16-2025-11-02-README.md
```

## Tool Design Patterns

### Input Validation with Zod

```typescript
const searchSongSchema = {
  title: z.string().min(1).describe('Song title'),
  artist: z.string().optional().describe('Artist name'),
  limit: z.number().min(1).max(50).default(10),
};

server.tool('search_song', 'Search songs', searchSongSchema, async (params) => {
  // params are validated and typed
});
```

### Error Handling

```typescript
server.tool('get_song_details', 'Get song details', schema, async ({ songId }) => {
  try {
    const song = await api.getSong(songId);
    return {
      content: [{ type: 'text', text: JSON.stringify(song) }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching song: ${error.message}. Try searching for the song first.`,
      }],
      isError: true,
    };
  }
});
```

### Tool Annotations

```typescript
server.tool(
  'delete_playlist',
  'Delete a playlist',
  { playlistId: z.string() },
  async ({ playlistId }) => { /* ... */ },
  {
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  }
);
```

## Example: Spotify MCP for Guitar CRM

```typescript
// tools/spotify.ts
export const spotifyTools = {
  search_song: {
    description: 'Search Spotify for song to add to student repertoire',
    schema: {
      query: z.string(),
      type: z.enum(['track', 'album', 'artist']).default('track'),
    },
    handler: async ({ query, type }) => {
      const results = await spotify.search(query, [type]);
      return formatSearchResults(results);
    },
  },

  get_song_features: {
    description: 'Get audio features (tempo, key, difficulty indicators)',
    schema: {
      trackId: z.string(),
    },
    handler: async ({ trackId }) => {
      const features = await spotify.getAudioFeatures(trackId);
      return {
        tempo: features.tempo,
        key: features.key,
        timeSignature: features.time_signature,
        energy: features.energy,
        // Map to difficulty estimate
        estimatedDifficulty: estimateDifficulty(features),
      };
    },
  },

  create_practice_playlist: {
    description: 'Create Spotify playlist from student songs',
    schema: {
      studentId: z.string(),
      playlistName: z.string(),
    },
    handler: async ({ studentId, playlistName }) => {
      const songs = await getStudentSongs(studentId);
      const trackUris = songs.map(s => s.spotifyUri).filter(Boolean);
      const playlist = await spotify.createPlaylist(playlistName, trackUris);
      return { playlistUrl: playlist.external_urls.spotify };
    },
  },
};
```

## Configuration

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "guitar-spotify": {
      "command": "node",
      "args": ["./mcp-servers/spotify/dist/index.js"],
      "env": {
        "SPOTIFY_CLIENT_ID": "${SPOTIFY_CLIENT_ID}",
        "SPOTIFY_CLIENT_SECRET": "${SPOTIFY_CLIENT_SECRET}"
      }
    }
  }
}
```

## Testing

```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector node ./dist/index.js

# Verify syntax
npx tsc --noEmit
```

## Best Practices

1. **Clear tool names** - Use `verb_noun` format: `search_song`, `create_playlist`
2. **Helpful descriptions** - Include what the tool does AND when to use it
3. **Actionable errors** - Tell the user what to try next
4. **Pagination** - Support limit/offset for list operations
5. **Caching** - Cache frequently accessed data
6. **Rate limiting** - Respect API limits, implement backoff

## Resources

- MCP Specification: https://modelcontextprotocol.io
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Python SDK: https://github.com/modelcontextprotocol/python-sdk
