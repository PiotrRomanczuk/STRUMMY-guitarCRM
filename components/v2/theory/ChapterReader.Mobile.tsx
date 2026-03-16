'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fadeIn } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { Button } from '@/components/ui/button';
import type { ChapterNav } from './theory.types';

interface ChapterReaderMobileProps {
  courseId: string;
  courseTitle: string;
  lesson: {
    id: string;
    title: string;
    content: string;
    updated_at: string;
  };
  prevChapter: ChapterNav | null;
  nextChapter: ChapterNav | null;
}

export function ChapterReaderMobile({
  courseId,
  courseTitle,
  lesson,
  prevChapter,
  nextChapter,
}: ChapterReaderMobileProps) {
  return (
    <MobilePageShell
      title={lesson.title}
      subtitle={courseTitle}
      showBack
    >
      <motion.article
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Last updated */}
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(lesson.updated_at).toLocaleDateString()}
        </p>

        {/* Markdown content - mobile optimized reading */}
        <div
          className="prose dark:prose-invert prose-sm
                     prose-headings:font-semibold prose-headings:text-foreground
                     prose-a:text-primary prose-a:no-underline
                     prose-p:leading-relaxed prose-p:text-sm
                     prose-li:text-sm prose-li:leading-relaxed
                     prose-img:rounded-xl
                     max-w-none"
        >
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>

        {/* Chapter navigation */}
        <div className="flex gap-3 pt-6 border-t border-border">
          {prevChapter ? (
            <Link
              href={`/dashboard/theory/${courseId}/${prevChapter.id}`}
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full min-h-[44px] gap-2 justify-start"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs">{prevChapter.title}</span>
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextChapter ? (
            <Link
              href={`/dashboard/theory/${courseId}/${nextChapter.id}`}
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full min-h-[44px] gap-2 justify-end"
              >
                <span className="truncate text-xs">{nextChapter.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </motion.article>
    </MobilePageShell>
  );
}
