'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Music, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ButtonAuditPage() {
  const [activeTab, setActiveTab] = useState('users');
  const tabs = ['users', 'lessons', 'songs'];

  const menuItems = [
    { id: 'users', label: 'Users', icon: Users, path: '#' },
    { id: 'lessons', label: 'Lessons', icon: BookOpen, path: '#' },
    { id: 'songs', label: 'Songs', icon: Music, path: '#' },
  ];

  return (
    <div className="p-8 space-y-12 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold mb-2">Clickable Text Buttons Audit</h1>
        <p className="text-muted-foreground">Showcasing every possible way to implement "Users", "Lessons", and "Songs" as clickable text.</p>
      </div>

      {/* 1. Next.js Link */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">1. Next.js &lt;Link&gt;</h2>
        <p className="text-sm text-muted-foreground">Standard text links for navigation, best for SEO.</p>
        <div className="flex gap-6 p-4 bg-muted/30 rounded-lg border">
          <Link href="#" className="text-primary hover:underline font-medium">Users</Link>
          <Link href="#" className="text-primary hover:underline font-medium">Lessons</Link>
          <Link href="#" className="text-primary hover:underline font-medium">Songs</Link>
        </div>
      </section>

      {/* 2. Button variant="link" */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">2. Button variant="link"</h2>
        <p className="text-sm text-muted-foreground">For actions that look like links but behave like buttons. Includes focus rings for accessibility.</p>
        <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border">
          <Button variant="link">Users</Button>
          <Button variant="link">Lessons</Button>
          <Button variant="link">Songs</Button>
        </div>
      </section>

      {/* 3. Button variant="ghost" */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">3. Button variant="ghost"</h2>
        <p className="text-sm text-muted-foreground">Plain text that gains a subtle background on hover.</p>
        <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border">
          <Button variant="ghost">Users</Button>
          <Button variant="ghost">Lessons</Button>
          <Button variant="ghost">Songs</Button>
        </div>
      </section>

      {/* 4. Standard HTML button */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">4. Standard HTML &lt;button&gt;</h2>
        <p className="text-sm text-muted-foreground">Raw buttons with custom Tailwind utility classes.</p>
        <div className="flex gap-6 p-4 bg-muted/30 rounded-lg border">
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            Users
          </button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            Lessons
          </button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            Songs
          </button>
        </div>
      </section>

      {/* 5. Segmented Controls / Tabs */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">5. Segmented Controls / Tabs</h2>
        <p className="text-sm text-muted-foreground">For filtering views on the same page.</p>
        <div className="p-4 bg-muted/30 rounded-lg border">
          <div className="flex space-x-2 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium capitalize transition-colors focus:outline-none",
                  activeTab === tab 
                    ? "border-b-2 border-primary text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground px-4">
            Currently active view: <span className="font-bold text-foreground capitalize">{activeTab}</span>
          </div>
        </div>
      </section>

      {/* 6. Sidebar Navigation Items */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">6. Sidebar Navigation Items</h2>
        <p className="text-sm text-muted-foreground">Common pattern for dashboard sidebars.</p>
        <div className="w-64 p-4 bg-card rounded-lg border shadow-sm">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <Link 
                key={item.id} 
                href={item.path}
                className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md px-3 py-2.5 transition-colors group"
              >
                <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      
      {/* 7. Breadcrumbs */}
      <section className="space-y-4 border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold">7. Breadcrumbs</h2>
        <p className="text-sm text-muted-foreground">For hierarchical navigation paths.</p>
        <div className="flex items-center p-4 bg-muted/30 rounded-lg border text-sm">
          <nav className="flex items-center space-x-2">
            <Link href="#" className="text-muted-foreground hover:text-foreground hover:underline transition-colors">Users</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link href="#" className="text-muted-foreground hover:text-foreground hover:underline transition-colors">Lessons</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Songs</span>
          </nav>
        </div>
      </section>
    </div>
  );
}
