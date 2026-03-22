import { Sparkles } from 'lucide-react';

export function SkillsManager() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Skills Manager</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Track and manage student skill progression
      </p>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">Coming soon</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Skills management functionality is under development.
        </p>
      </div>
    </div>
  );
}
