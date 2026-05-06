/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { StudentProfile, Subject, Achievement } from './types';
import Onboarding from './components/Onboarding';
import StudentHome from './components/StudentHome';
import LearningSession from './components/LearningSession';
import SessionResult from './components/SessionResult';
import ResourceHub from './components/ResourceHub';
import TeacherDashboard from './components/TeacherDashboard';
import { api } from './lib/api';

export default function App() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'session' | 'result' | 'resources' | 'dashboard'>('home');
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [lastSessionResult, setLastSessionResult] = useState<{ correct: number; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message?: string }>({ connected: false });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/db-status');
      const status = await res.json();
      setDbStatus(status);
      
      const savedName = localStorage.getItem('zim_its_name');
      const savedGrade = localStorage.getItem('zim_its_grade');
      if (savedName && savedGrade && status.connected) {
        loadProfile(savedName, parseInt(savedGrade));
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setDbStatus({ connected: false, message: "Server not responding" });
      setIsLoading(false);
    }
  };

  const INITIAL_LEVELS: Record<Subject, number> = {
    'Indigenous Languages': 1,
    'Mathematics': 1,
    'Social Science': 1,
    'Agriculture, Science and Technology': 1,
    'Physical Education': 1,
    'English Language': 1
  };

  const loadProfile = async (name: string, grade: number) => {
    try {
      setIsLoading(true);
      // Fallback if DB is not connected
      if (!dbStatus.connected) {
        setProfile({
          name,
          grade,
          level: { ...INITIAL_LEVELS },
          streak: 1,
          totalPoints: 0
        });
        return;
      }

      const data = await api.getProfile(name, grade);
      setProfile(data);
      if (data.id) {
        const achs = await api.getAchievements(data.id);
        setAchievements(achs);
      }
      localStorage.setItem('zim_its_name', name);
      localStorage.setItem('zim_its_grade', grade.toString());
    } catch (err) {
      console.error("Failed to load profile", err);
      // Even if API fails, let them play in Demo Mode
      setProfile({ name, grade, level: { ...INITIAL_LEVELS }, streak: 1, totalPoints: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboarding = (name: string, grade: number) => {
    loadProfile(name, grade);
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
    await api.updateProgress(updatedProfile);
    await api.logPerformance(profile.id, currentSubject, results.correct, results.total);
    await checkAchievements(updatedProfile);
    
    setLastSessionResult(results);
    setActiveTab('result');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="font-bold text-slate-800 text-xl tracking-tight mb-2">Connecting to ZimPrimary ITS</h2>
        <p className="text-slate-500 text-sm max-w-xs">Connecting to your local database...</p>
      </div>
    );
  }

  // Display a warning if not connected but allow continuation in Demo Mode
  const connectionWarning = !dbStatus.connected && (
    <div className="bg-amber-50 border-b border-amber-100 p-2 text-[10px] text-amber-700 font-bold flex items-center justify-center space-x-2">
      <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[8px]">OFFLINE MODE</span>
      <span>Database disconnected. Using local browser storage.</span>
    </div>
  );

  if (!profile) {
    return <div className="min-h-screen bg-slate-50"><Onboarding onComplete={handleOnboarding} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {connectionWarning}
      <main className="container mx-auto py-8">
        {activeTab === 'home' && (
          <StudentHome 
            profile={profile} 
            achievements={achievements}
            onStartSession={startSession} 
          />
        )}
        
        {activeTab === 'session' && currentSubject && (
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
          <ResourceHub />
        )}

        {activeTab === 'dashboard' && (
          <TeacherDashboard />
        )}
      </main>
      
      {/* Navigation for Teacher/Admin */}
      {activeTab !== 'session' && (
        <div className="fixed top-4 right-4 flex space-x-2 bg-white/80 backdrop-blur-md p-1 rounded-full border border-slate-100 shadow-sm z-50">
           <button 
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'home' 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'resources' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Resources
          </button>
        </div>
      )}
      
      {/* Footer Branding */}
      <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 flex justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
        ITS Zimbabwe • Primary Education Catalyst
      </footer>
    </div>
  );
}
