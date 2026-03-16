'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MobilePageShell } from '@/components/v2/primitives';
import { Button } from '@/components/ui/button';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import type { HealthResponse } from '@/types/health';
import type { AdminDashboardProps } from './AdminDashboard';
import { STATUS_COLOR, STATUS_LABEL, ADMIN_LINKS } from './admin.constants';

/**
 * Mobile admin dashboard with health overview and quick links.
 */
export function AdminDashboardMobile({ isAdmin }: AdminDashboardProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealth(data);
      }
    } catch {
      // silently fail -- cards will show loading state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchHealth();
    else setLoading(false);
  }, [isAdmin, fetchHealth]);

  const serviceCount = health ? Object.values(health.services).length : 0;
  const healthyCount = health
    ? Object.values(health.services).filter((s) => s.status === 'healthy').length
    : 0;

  return (
    <MobilePageShell
      title="Admin Tools"
      showBack={false}
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px]"
          onClick={fetchHealth}
          disabled={loading}
          aria-label="Refresh health status"
        >
          <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      {/* Overall status banner */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${health ? STATUS_COLOR[health.overall] : 'bg-muted'}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {health ? STATUS_LABEL[health.overall] : 'Loading status...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {health
                ? `${healthyCount}/${serviceCount} services healthy`
                : 'Checking services...'}
            </p>
          </div>
        </div>
      </div>

      {/* Service status cards */}
      {health && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {Object.values(health.services).map((service) => (
            <motion.div
              key={service.name}
              variants={listItem}
              className="bg-card rounded-xl border border-border p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-2 w-2 rounded-full ${STATUS_COLOR[service.status]}`} />
                <span className="text-xs font-medium text-foreground truncate">
                  {service.name}
                </span>
              </div>
              {service.latencyMs !== undefined && (
                <p className="text-xs text-muted-foreground">{service.latencyMs}ms</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Admin Tools</h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <motion.div key={link.href + link.label} variants={listItem}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 min-h-[44px] active:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </MobilePageShell>
  );
}
