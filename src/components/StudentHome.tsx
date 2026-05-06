import React from 'react';
import { motion } from 'motion/react';
import { History as HistoryIcon, BookOpen, Calculator, Trophy, Star, Award } from 'lucide-react';
import { StudentProfile, Subject, Achievement } from '../types';

interface StudentHomeProps {
  profile: StudentProfile;
  achievements: Achievement[];
  onStartSession: (subject: Subject) => void;
}

export default function StudentHome({ profile, achievements, onStartSession }: StudentHomeProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Header / Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
      >
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-3xl font-bold border-4 border-white shadow-inner">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mhoro, {profile.name}!</h1>
            <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px]">Grade {profile.grade} • ZimPrimary Catalyst</p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
            <span className="block text-xl font-black text-slate-800">{profile.totalPoints}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Points</span>
          </div>
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
            <div className="flex items-center justify-center text-orange-500 space-x-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="block text-xl font-black text-slate-800">{profile.streak}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Day Streak</span>
          </div>
        </div>
      </motion.div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubjectCard 
          subject="Literacy" 
          description="Build reading skills with stories like 'The Hare and the Baboon' and local word games."
          icon={<BookOpen className="w-8 h-8" />}
          color="bg-blue-500"
          level={profile.level.Literacy}
          onClick={() => onStartSession('Literacy')}
        />
        <SubjectCard 
          subject="Numeracy" 
          description="Master math using Zimbabwean context: currency (ZiG), market math, and farming patterns."
          icon={<Calculator className="w-8 h-8" />}
          color="bg-emerald-500"
          level={profile.level.Numeracy}
          onClick={() => onStartSession('Numeracy')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Section */}
        <section className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-800">Your Progress</h2>
            </div>
            <button className="text-xs font-bold text-blue-500 hover:underline flex items-center">
               <HistoryIcon className="w-3 h-3 mr-1" /> View Full History
            </button>
          </div>
          
          <div className="space-y-6">
            <ProgressBar label="Literacy Level" value={profile.level.Literacy * 10} color="bg-blue-500" />
            <ProgressBar label="Numeracy Level" value={profile.level.Numeracy * 10} color="bg-emerald-500" />
          </div>
        </section>

        {/* Achievements Section */}
        <section className="bg-slate-800 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold">Awards</h2>
          </div>
          
          <div className="space-y-4">
            {achievements.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium italic">Complete your first lesson to earn an award!</p>
            ) : (
              achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-4 bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{achievement.title}</p>
                    <p className="text-[10px] text-slate-400">{achievement.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SubjectCard({ subject, description, icon, color, onClick, level }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, rotate: -0.5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left space-y-6 group relative overflow-hidden"
    >
      <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800">{subject}</h3>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="pt-4 flex items-center justify-between">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Level {level}</span>
        <div className="bg-slate-100 px-4 py-2 rounded-full text-xs font-bold text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
          Start Learning
        </div>
      </div>
    </motion.button>
  );
}

function ProgressBar({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-400 px-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
