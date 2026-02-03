
export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export type SupportedLanguage = 'TypeScript' | 'Python' | 'Java' | 'C++' | 'Go';

export interface CodingTopic {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  category: 'Linear' | 'Non-Linear' | 'Dynamic' | 'Memory Management' | 'Concurrency';
}

export interface TopicExample {
  topicId: string;
  language: SupportedLanguage;
  naiveCode: string;
  optimizedCode: string;
  explanation: string;
  complexityAnalysis: string;
}

export interface SolutionFeedback {
  score: number;
  comments: string;
  improvements: string;
  isCorrect: boolean;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  code: string;
  score: number;
  refactoredCode: string;
  issues: {
    issue: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    suggestion: string;
    complexityImpact: string;
    patternsViolated: string[];
  }[];
}

export interface UserStats {
  topicsMastered: number;
  refactorsCompleted: number;
  currentStreak: number;
  level: number;
  xp: number;
  analysisHistory: AnalysisResult[];
}

export type ViewState = 'dashboard' | 'lab' | 'tour' | 'stats' | 'analyzer';
