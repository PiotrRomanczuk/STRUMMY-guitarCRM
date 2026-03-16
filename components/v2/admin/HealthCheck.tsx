'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import { MobilePageShell } from '@/components/v2/primitives';
import { Button } from '@/components/ui/button';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import type { HealthResponse } from '@/types/health';
import { ServiceRow } from './HealthCheck.ServiceRow';
import { CronSection } from './HealthCheck.CronSection';

/**
 * v2 HealthCheck -- mobile-friendly service status list.
 * Fetches from /api/health and displays expandable service rows.
 */
export function HealthCheckV2() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const services = health ? Object.values(health.services) : [];

  return (
    <MobilePageShell
      title="Health Check"
      subtitle={
        health
          ? `Last checked ${new Date(health.checkedAt).toLocaleTimeString()}`
          : undefined
      }
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={fetchHealth}
          disabled={loading}
          aria-label="Refresh health check"
        >
          <RefreshCcw
            className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
          />
        </Button>
      }
    >
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading && !health && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {services.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {services.map((service) => (
            <motion.div key={service.name} variants={listItem}>
              <ServiceRow service={service} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {health && <CronSection crons={health.crons} />}
    </MobilePageShell>
  );
}
