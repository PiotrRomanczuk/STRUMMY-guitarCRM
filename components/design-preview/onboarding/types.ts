export type OnboardStep = {
  title: string;
  sub?: string;
};

export type OnboardRole = 'Teacher' | 'Student';

export type LevelKey = 'beginner' | 'novice' | 'intermediate' | 'advanced';

export type LevelOption = {
  k: LevelKey;
  title: string;
  sub: string;
};

export type GoalOption = {
  k: string;
  label: string;
};

export type TeachTag = {
  label: string;
  on: boolean;
};
