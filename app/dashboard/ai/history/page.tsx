import { AIGenerationHistory } from '@/components/ai/AIGenerationHistory';

export const metadata = {
  title: 'AI Generation History',
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Generation History</h1>
        <p className="text-sm text-muted-foreground">
          Every AI output — lesson notes, post-lesson summaries, assignments, email drafts, song
          notes, insights and chat — with the model and provider used. Star or delete entries.
        </p>
      </div>
      <AIGenerationHistory />
    </div>
  );
}
