export interface SongEngagement {
  songId: string;
  title: string;
  author: string | null;
  level: string | null;
  key: string | null;
  category: string | null;
  totalStudents: number;
  masteredCount: number;
  activeLearners: number;
  lessonAppearances: number;
  healthScore: number;
}

export interface MasteryFunnel {
  toLearn: number;
  started: number;
  remembered: number;
  withAuthor: number;
  mastered: number;
}

export interface LevelBalance {
  level: string;
  totalSongs: number;
  songsInUse: number;
  uniqueStudents: number;
}

export interface KeyLevelCell {
  level: string;
  key: string;
  songCount: number;
  studentsLearning: number;
}

export interface TeachingSummary {
  totalSongs: number;
  songsInUse: number;
  percentInUse: number;
  totalStudentsLearning: number;
  overallMasteryRate: number;
}

export interface SongStatsTeaching {
  popularity: SongEngagement[];
  deadSongs: SongEngagement[];
  masteryFunnel: MasteryFunnel;
  levelBalance: LevelBalance[];
  keyLevelHeatmap: KeyLevelCell[];
  summary: TeachingSummary;
}
