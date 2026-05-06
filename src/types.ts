export type Subject = 'Literacy' | 'Numeracy';

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number; // 1-10
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface StudentProfile {
  id?: number;
  name: string;
  grade: number;
  level: {
    Literacy: number;
    Numeracy: number;
  };
  streak: number;
  totalPoints: number;
}

export interface PerformanceLog {
  timestamp: Date;
  subject: Subject;
  questionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}
