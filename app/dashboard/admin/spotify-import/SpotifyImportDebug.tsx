'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Music, Send } from 'lucide-react';

interface PipelineStep {
  name: string;
  status: 'success' | 'error' | 'skipped';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-green-500', badge: 'default' as const, label: 'OK' },
  error: { icon: XCircle, color: 'text-red-500', badge: 'destructive' as const, label: 'Error' },
  skipped: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    badge: 'secondary' as const,
    label: 'Skipped',
  },
};

function renderCoverPreview(step: PipelineStep) {
  const out = step.output;
  if (!out || typeof out !== 'object' || !('coverUrl' in out) || !out.coverUrl) return null;
  return (
    <div className="flex items-center gap-3">
      <img src={String(out.coverUrl)} alt="Album cover" className="h-16 w-16 rounded-md shadow" />
      <div>
        <p className="font-medium">{String(out.title)}</p>
        <p className="text-muted-foreground text-sm">{String(out.artist)}</p>
        <p className="text-muted-foreground text-xs">{String(out.album)}</p>
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: PipelineStep; index: number }) {
  const config = statusConfig[step.status];
  const Icon = config.icon;

  return (
    <Card className={step.status === 'error' ? 'border-red-300 dark:border-red-800' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className="text-muted-foreground text-sm">Step {index + 1}:</span>
            {step.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">{step.durationMs}ms</span>
            <Badge variant={config.badge}>{config.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {step.input && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">Input</p>
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              {JSON.stringify(step.input, null, 2)}
            </pre>
          </div>
        )}
        {step.output && (
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">Output</p>
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          </div>
        )}
        {step.error && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-red-500">Error</p>
            <pre className="overflow-x-auto rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {step.error}
            </pre>
          </div>
        )}
        {/* Show cover image if present */}
        {renderCoverPreview(step)}
      </CardContent>
    </Card>
  );
}

export function SpotifyImportDebug() {
  const [url, setUrl] = useState('');
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPipeline() {
    if (!url.trim()) return;
    setLoading(true);
    setSteps([]);
    setError(null);

    try {
      const res = await fetch(`/api/song/from-spotify/debug?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (data.steps) {
        setSteps(data.steps);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function createSong() {
    if (!url.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/song/from-spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotify_url: url.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setError(null);
        // Re-run debug to show the DB step as "already exists"
        await runPipeline();
      } else {
        setError(data.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  const allSuccess = steps.length > 0 && steps.every((s) => s.status !== 'error');
  const dbWouldCreate = steps.find((s) => s.name === 'Database Check (dry run)')?.output;
  const wouldReturn =
    dbWouldCreate && 'wouldReturn' in dbWouldCreate ? dbWouldCreate.wouldReturn : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Music className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Spotify Import Debug</h1>
      </div>
      <p className="text-muted-foreground">
        Paste a Spotify URL to see the full conversion pipeline — URL parsing, metadata fetch, key
        mapping, and draft creation. Read-only: nothing is saved until you click Create.
      </p>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="https://open.spotify.com/track/3bsKfOWe6pWwnv00KYVXrY?si=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runPipeline()}
          className="flex-1"
        />
        <Button onClick={runPipeline} disabled={loading || !url.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Debug'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="py-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Steps */}
      {steps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Pipeline ({steps.filter((s) => s.status === 'success').length}/{steps.length} passed)
            </h2>
            <span className="text-muted-foreground text-sm">
              Total: {steps.reduce((sum, s) => sum + s.durationMs, 0)}ms
            </span>
          </div>

          {steps.map((step, i) => (
            <StepCard key={step.name} step={step} index={i} />
          ))}

          {/* Create button — only if pipeline succeeded and song doesn't exist */}
          {allSuccess && wouldReturn === 201 && (
            <Button onClick={createSong} disabled={loading} className="w-full" size="lg">
              <Send className="mr-2 h-4 w-4" />
              Create Draft Song in Strummy
            </Button>
          )}

          {wouldReturn === 409 && (
            <Card className="border-yellow-300 dark:border-yellow-800">
              <CardContent className="py-4 text-center">
                <p className="text-yellow-700 dark:text-yellow-300">
                  This song already exists in Strummy.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
