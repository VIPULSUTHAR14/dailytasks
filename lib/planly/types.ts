export type TrackType = "DSA" | "Core CS" | "Mock Contest" | "Buffer & Consolidation" | "Spaced Repetition" | "Custom";

export type ConfidenceLevel = "clean" | "hint" | "struggled" | null;

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export interface ProblemMetadata {
  title: string;
  difficulty: ProblemDifficulty;
  leetcodeUrl?: string;
  intuitionHint?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  topicId?: string;
  description?: string;
}

export interface PlanTask {
  id: string;
  track: TrackType;
  title: string;
  subject: string;
  details: string[];
  timeMins: number;
  timeSpentSecs?: number;
  confidence: ConfidenceLevel;
  completed: boolean;
  isBacklogEligible: boolean;
  isPinned?: boolean;
  isCustom?: boolean;
  notes?: string;
  problemUrl?: string;
  difficulty?: ProblemDifficulty;
  intuitionHint?: string;
  attemptsCount?: number;
  originDay?: number;
  topicId?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

export interface PlanDay {
  dayNumber: number;
  dayOfWeek: number; // 1 = Mon, 7 = Sun
  calendarDate?: string; // ISO date YYYY-MM-DD
  isBufferDay: boolean;
  isSaturday: boolean;
  isRestDay?: boolean;
  allocatedMins: number;
  tasks: PlanTask[];
}

export interface PlanWeek {
  weekNumber: number;
  weekFocus: string;
  isMockInterviewWeek?: boolean;
  days: PlanDay[];
}

export type CoreScheduleMode = "weekends" | "daily" | "alternate";

export type TargetCompanyKey = "general" | "amazon" | "microsoft" | "google" | "startups";

export interface CompanyPreset {
  name: string;
  dsaWeight: number;
  treesGraphsBoost: boolean;
  lldBoost: boolean;
  dpBoost?: boolean;
  notes: string;
}

export interface UserDiagnostic {
  arrays: number;      // 1 to 5
  trees: number;       // 1 to 5
  graphs: number;      // 1 to 5
  dp: number;          // 1 to 5
  systemDesign: number;// 1 to 5
}

export interface SprintSettings {
  weeks: number;
  dailyHours: number;
  coreScheduleMode: CoreScheduleMode;
  selectedCores: string[]; // ["os", "dbms", "cn", "lld"]
  targetCompany: TargetCompanyKey;
  language: string;
  includeMockContests: boolean;
  targetInterviewDate?: string; // YYYY-MM-DD
  diagnostic?: UserDiagnostic;
  reserveMockWeeks?: boolean;
  startDate?: string; // YYYY-MM-DD
}

export interface PlanMetadata {
  generatedAt: string;
  targetCompany: string;
  language: string;
  totalWeeks: number;
  totalDays: number;
  dailyHours: number;
  coreScheduleMode: CoreScheduleMode;
  selectedCores: string[];
  targetInterviewDate?: string;
  startDate?: string;
}

export interface SprintPlan {
  metadata: PlanMetadata;
  weeks: PlanWeek[];
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface PlanlyState {
  version: number;
  settings: SprintSettings;
  plan: SprintPlan | null;
  streaks: StreakStats;
  currentDayNumber: number;
  updatedAt: string;
}
