/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { StudentProfile, Subject, Achievement } from './types';
import { Auth } from './components/Auth';
import StudentHome from './components/StudentHome';
import LearningSession from './components/LearningSession';
import SessionResult from './components/SessionResult';
import ResourceHub from './components/ResourceHub';
import TeacherDashboard from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { api } from './lib/api';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'session' | 'result' | 'resources'>('home');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [lastSessionResult, setLastSessionResult] = useState<{ correct: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('zim_its_user');
    const savedProfile = localStorage.getItem('zim_its_profile');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        setProfile(p);
        loadAchievements(p.id);
      }
    }
    setIsLoading(false);
  }, []);

  const loadAchievements = async (id: number) => {
    try {
      const achs = await api.getAchievements(id);
      setAchievements(achs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (userData: any, studentProfile: any) => {
    setUser(userData);
    setProfile(studentProfile);
    localStorage.setItem('zim_its_user', JSON.stringify(userData));
    if (studentProfile) {
      localStorage.setItem('zim_its_profile', JSON.stringify(studentProfile));
      loadAchievements(studentProfile.id);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setAchievements([]);
    localStorage.removeItem('zim_its_user');
    localStorage.removeItem('zim_its_profile');
    setActiveTab('home');
  };

  const checkAchievements = async (updatedProfile: StudentProfile) => {
    if (!updatedProfile.id) return;
    const newAchievements: Achievement[] = [...achievements];
    let changed = false;

    if (updatedProfile.totalPoints > 0 && !newAchievements.find(a => a.id === 'first_step')) {
      const ach: Achievement = { id: 'first_step', title: 'First Step', description: 'Completed your first tutoring session!', icon: '🌱' };
      newAchievements.push(ach);
      await api.saveAchievement(updatedProfile.id, ach);
      changed = true;
    }

    if (updatedProfile.totalPoints >= 100 && !newAchievements.find(a => a.id === 'century')) {
      const ach: Achievement = { id: 'century', title: 'Points Century', description: 'Earned over 100 points!', icon: '💯' };
      newAchievements.push(ach);
      await api.saveAchievement(updatedProfile.id, ach);
      changed = true;
    }

    if (changed) setAchievements(newAchievements);
  };

  const startSession = (subject: Subject) => {
    setCurrentSubject(subject);
    setActiveTab('session');
  };

  const completeSession = async (results: { correct: number; total: number }) => {
    if (!profile || !currentSubject || !profile.id) return;

    const pointsEarned = results.correct * 20;
    const isLevelUp = results.correct === results.total;
    
    const updatedProfile = {
      ...profile,
      totalPoints: profile.totalPoints + pointsEarned,
      level: {
        ...profile.level,
        [currentSubject]: isLevelUp ? Math.min(10, profile.level[currentSubject] + 1) : profile.level[currentSubject]
      }
    };

    setProfile(updatedProfile);
    localStorage.setItem('zim_its_profile', JSON.stringify(updatedProfile));
    await api.updateProgress(updatedProfile);
    await api.logPerformance(profile.id, currentSubject, results.correct, results.total);
    await checkAchievements(updatedProfile);
    
    setLastSessionResult(results);
    setActiveTab('result');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // ADMIN VIEW
  if (user.role === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // TEACHER VIEW
  if (user.role === 'teacher') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 max-w-[1920px] mx-auto w-full">
          <TeacherDashboard onLogout={handleLogout} />
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-zim-gold/20">
      <main className="flex-1 max-w-[1920px] mx-auto w-full py-4 md:py-8">
        {!profile && user.role === 'student' ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[60vh]">
            <div className="w-24 h-24 bg-zim-gradient rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-zim-gold/20 border-4 border-white">
              <GraduationCap size={48} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile Not Found</h1>
              <p className="text-slate-500 max-w-sm mt-2 font-medium">We couldn't synchronize your learner data. Please try registering again or contact a teacher.</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-8 py-4 bg-zim-red text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-zim-red/20"
            >
              Sign Out & Retry
            </button>
          </div>
        ) : activeTab === 'home' && profile && (
          <StudentHome 
            profile={profile} 
            achievements={achievements}
            onStartSession={startSession} 
            onLogout={handleLogout}
            onOpenResources={() => setActiveTab('resources')}
          />
        )}
        
        {activeTab === 'session' && currentSubject && profile && (
          <LearningSession 
            subject={currentSubject}
            profile={profile}
            onSessionComplete={completeSession}
            onExit={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'result' && currentSubject && lastSessionResult && (
          <SessionResult 
            subject={currentSubject}
            correct={lastSessionResult.correct}
            total={lastSessionResult.total}
            onClose={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'resources' && (
          <div className="px-4">
            <button 
              onClick={() => setActiveTab('home')}
              className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 flex items-center space-x-2"
            >
              <span>← Back to Home</span>
            </button>
            <ResourceHub />
          </div>
        )}
      </main>
      
      <footer className="py-8 bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Zim ITS © 2026 — Intelligent Tutoring for Zimbabwe Primary Education
          </p>
        </div>
      </footer>
    </div>
  );
}
