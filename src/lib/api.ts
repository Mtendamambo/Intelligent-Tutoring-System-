import { StudentProfile, Achievement, Subject } from "../types";

const API_BASE = "/api";

export const api = {
  getProfile: async (name: string, grade: number, userId: number): Promise<StudentProfile> => {
    const res = await fetch(`${API_BASE}/student/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, grade, userId }),
    });
    return await res.json();
  },

  updateProgress: async (profile: StudentProfile) => {
    if (!profile.id) return;
    await fetch(`${API_BASE}/student/${profile.id}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: profile.level,
        totalPoints: profile.totalPoints,
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

  getResources: async (params?: { q?: string }) => {
    const url = new URL(window.location.origin + `${API_BASE}/resources`);
    if (params?.q) url.searchParams.append('q', params.q);
    const res = await fetch(url.toString());
    return await res.json();
  },
  getResource: async (id: number) => {
    const res = await fetch(`${API_BASE}/resources/${id}`);
    return await res.json();
  },
  updateResourceSummary: async (id: number, summary: string) => {
    const res = await fetch(`${API_BASE}/resources/${id}/summary`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });
    return await res.json();
  },

  addResource: async (resource: any) => {
    const isFormData = resource instanceof FormData;
    const options: RequestInit = {
      method: "POST",
      body: isFormData ? resource : JSON.stringify(resource),
    };
    
    if (!isFormData) {
      options.headers = { "Content-Type": "application/json" };
    }

    const res = await fetch(`${API_BASE}/resources`, options);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${res.status}`);
    }
    return await res.json();
  },

  deleteResource: async (id: number) => {
    await fetch(`${API_BASE}/resources/${id}`, {
      method: "DELETE"
    });
  },

  awardBonusPoints: async (studentId: number, points: number, reason?: string) => {
    const res = await fetch(`${API_BASE}/student/${studentId}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points, reason }),
    });
    return await res.json();
  },

  getAiContext: async (subject: string, grade: number): Promise<string> => {
    const res = await fetch(`${API_BASE}/ai/context/${subject}/${grade}`);
    return await res.text();
  },

  getTeacherStudents: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/teacher/students`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getTeacherLogs: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/teacher/logs`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  
  getTeacherAchievements: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/teacher/achievements`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((a: any) => ({
        ...a,
        unlockedAt: new Date(a.unlocked_at)
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  register: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    return result;
  },

  admin: {
    getUsers: async () => {
      const res = await fetch(`${API_BASE}/admin/users`);
      return await res.json();
    },
    deleteUser: async (id: number) => {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE" });
      return await res.json();
    },
    updateRole: async (id: number, role: string) => {
      const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      return await res.json();
    },
    resetPassword: async (id: number, password: string) => {
      const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      return await res.json();
    },
    updateStatus: async (id: number, disabled: boolean) => {
      const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled })
      });
      return await res.json();
    },
    getLoginHistory: async (id: number) => {
      const res = await fetch(`${API_BASE}/admin/users/${id}/login-history`);
      return await res.json();
    }
  },

  getDbStatus: async () => {
    try {
      const res = await fetch(`${API_BASE}/db-status`);
      return await res.json();
    } catch (e) {
      return { connected: false };
    }
  }
};
