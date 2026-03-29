'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EnrichResult {
  type: string;
  processed?: number;
  updated?: number;
  songsUpdated?: number;
  authorsProcessed?: number;
  failed: number;
  errors: string[];
}

export function SongStatsEnrichment() {
  const [tempoResult, setTempoResult] = useState<EnrichResult | null>(null);
  const [categoryResult, setCategoryResult] = useState<EnrichResult | null>(null);
  const [isRunningTempo, setIsRunningTempo] = useState(false);
  const [isRunningCategory, setIsRunningCategory] = useState(false);

  const runEnrichment = async (type: 'tempo' | 'category') => {
    const setRunning = type === 'tempo' ? setIsRunningTempo : setIsRunningCategory;
    const setResult = type === 'tempo' ? setTempoResult : setCategoryResult;

    setRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/spotify-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, batchSize: 50 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Request failed');
      }

      const data: EnrichResult = await res.json();
      setResult(data);

      const count = data.updated ?? data.songsUpdated ?? 0;
      if (count > 0) {
        toast.success(`Updated ${count} songs with ${type} data`);
      } else {
        toast.info(`No songs needed ${type} enrichment`);
      }
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spotify Enrichment</CardTitle>
        <CardDescription>
          Fill missing metadata from Spotify. Processes 50 songs per batch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EnrichAction
            title="Enrich Tempo"
            description="Fetch BPM from Spotify Audio Features for songs missing tempo"
            icon={Music}
            isRunning={isRunningTempo}
            result={tempoResult}
            onRun={() => runEnrichment('tempo')}
          />
          <EnrichAction
            title="Enrich Category"
            description="Derive genre/category from Spotify artist data for uncategorized songs"
            icon={FolderOpen}
            isRunning={isRunningCategory}
            result={categoryResult}
            onRun={() => runEnrichment('category')}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function EnrichAction({
  title,
  description,
  icon: Icon,
  isRunning,
  result,
  onRun,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isRunning: boolean;
  result: EnrichResult | null;
  onRun: () => void;
}) {
  const count = result?.updated ?? result?.songsUpdated ?? 0;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>

      <Button onClick={onRun} disabled={isRunning} size="sm" className="w-full">
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Run Batch'
        )}
      </Button>

      {result && (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            {count > 0 ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>
              {count} updated
              {result.failed > 0 && `, ${result.failed} failed`}
            </span>
            <Badge variant="outline" className="text-xs ml-auto">
              {result.processed ?? result.authorsProcessed ?? 0} processed
            </Badge>
          </div>
          {result.errors.length > 0 && (
            <div className="text-destructive bg-destructive/10 rounded p-2 max-h-20 overflow-y-auto">
              {result.errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
