export type Subject = 
  | 'Indigenous Languages' 
  | 'Mathematics' 
  | 'Social Science' 
  | 'Agriculture, Science and Technology' 
  | 'Physical Education' 
  | 'English Language';

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
  level: Record<Subject, number>;
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
