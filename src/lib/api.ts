import { StudentProfile, Achievement, Subject } from "../types";

const API_BASE = "/api";

export const api = {
  getProfile: async (name: string, grade: number): Promise<StudentProfile> => {
    const res = await fetch(`${API_BASE}/student/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, grade }),
    });
    const data = await res.json();
    return {
      ...data,
      level: { Literacy: data.literacy_level, Numeracy: data.numeracy_level },
      totalPoints: data.total_points
    };
  },

  updateProgress: async (profile: StudentProfile) => {
    if (!profile.id) return;
    await fetch(`${API_BASE}/student/${profile.id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        literacy_level: profile.level.Literacy,
        numeracy_level: profile.level.Numeracy,
        total_points: profile.totalPoints,
        streak: profile.streak
      }),
    });
  },

  getAchievements: async (studentId: number): Promise<Achievement[]> => {
    const res = await fetch(`${API_BASE}/student/${studentId}/achievements`);
    const data = await res.json();
    return data.map((a: any) => ({
        ...a,
        unlockedAt: new Date(a.unlocked_at)
    }));
  },

  saveAchievement: async (studentId: number, achievement: Achievement) => {
    await fetch(`${API_BASE}/student/${studentId}/achievements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        achievement_id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon
      }),
    });
  },

  logPerformance: async (studentId: number, subject: Subject, correct: number, total: number) => {
    await fetch(`${API_BASE}/student/${studentId}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, correct, total }),
    });
  },

  generateQuestion: async (subject: Subject, grade: number, level: number): Promise<Question> => {
    const res = await fetch(`${API_BASE}/ai/generate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, grade, level }),
    });
    return await res.json();
  },

  getFeedback: async (question: Question, studentAnswer: string, isCorrect: boolean): Promise<string> => {
    const res = await fetch(`${API_BASE}/ai/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: question.text,
        student_answer: studentAnswer,
        correct_answer: question.correctAnswer,
        is_correct: isCorrect
      }),
    });
    const data = await res.json();
    return data.feedback;
  }
};
