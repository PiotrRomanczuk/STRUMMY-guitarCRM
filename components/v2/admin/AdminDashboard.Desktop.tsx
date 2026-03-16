'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import type { HealthResponse } from '@/types/health';
import type { AdminDashboardProps } from './AdminDashboard';
import { STATUS_COLOR, ADMIN_LINKS } from './admin.constants';

/**
 * Desktop admin dashboard with wider grid layout.
 */
export default function AdminDashboardDesktop({ isAdmin }: AdminDashboardProps) {
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
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchHealth();
    else setLoading(false);
  }, [isAdmin, fetchHealth]);

  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System overview and admin tools
          </p>
        </div>
        <Button variant="outline" onClick={fetchHealth} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {health && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-4"
        >
          {Object.values(health.services).map((service) => (
            <motion.div
              key={service.name}
              variants={listItem}
              className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[service.status]}`} />
                <span className="text-sm font-medium text-foreground">{service.name}</span>
              </div>
              {service.latencyMs !== undefined && (
                <p className="text-xs text-muted-foreground">Latency: {service.latencyMs}ms</p>
              )}
              {service.message && (
                <p className="text-xs text-muted-foreground truncate mt-1">{service.message}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground">{link.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
