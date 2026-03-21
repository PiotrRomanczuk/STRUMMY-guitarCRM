import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListMusic, Music, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { SongSection } from '../types';

const SECTION_COLORS: Record<string, string> = {
  intro: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  verse: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'pre-chorus': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  chorus: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  bridge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  solo: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  interlude: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
  outro: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
};

function sectionLabel(section: SongSection): string {
  const type = section.section_type.charAt(0).toUpperCase() + section.section_type.slice(1);
  const needsNumber = ['verse', 'chorus', 'bridge', 'solo'].includes(section.section_type);
  return needsNumber && section.section_number > 0
    ? `${type} ${section.section_number}`
    : type;
}

interface Props {
  songId: string;
}

export default async function SongSections({ songId }: Props) {
  const supabase = await createClient();
  const { data: sections, error } = await supabase
    .from('song_sections')
    .select('id, song_id, section_type, section_number, order_position, chords, lyrics, tab_notation, notes, created_at')
    .eq('song_id', songId)
    .order('order_position', { ascending: true });

  if (error || !sections || sections.length === 0) return null;

  return (
    <Card className="bg-card border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-primary/10 rounded-full">
            <ListMusic className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Song Sections</h3>
          <Badge variant="secondary" className="ml-auto">
            {sections.length} sections
          </Badge>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionBlock({ section }: { section: SongSection }) {
  const colorClass = SECTION_COLORS[section.section_type] ?? SECTION_COLORS.verse;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30">
        <Badge variant="outline" className={colorClass}>
          {sectionLabel(section)}
        </Badge>

        {section.chords.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Music className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {section.chords.map((chord) => (
              <Badge
                key={chord}
                variant="secondary"
                className="text-xs font-[family-name:--font-music] px-1.5 py-0"
              >
                {chord}
              </Badge>
            ))}
          </div>
        )}

        {section.notes && (
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Info className="w-3 h-3" />
            <span className="hidden sm:inline">{section.notes}</span>
          </span>
        )}
      </div>

      {/* Section content */}
      {(section.lyrics || section.tab_notation) && (
        <div className="px-4 py-3 space-y-3">
          {section.lyrics && (
            <pre className="font-[family-name:--font-music] text-sm whitespace-pre-wrap leading-relaxed">
              {section.lyrics}
            </pre>
          )}

          {section.tab_notation && (
            <pre className="font-[family-name:--font-music] text-xs text-muted-foreground bg-muted/40 rounded-md p-3 overflow-x-auto whitespace-pre leading-snug">
              {section.tab_notation}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
