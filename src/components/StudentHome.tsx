import React from 'react';
import { motion } from 'motion/react';
import { 
  History as HistoryIcon, 
  BookOpen, 
  Calculator, 
  Trophy, 
  Star, 
  Award, 
  Globe, 
  Sprout, 
  Dumbbell, 
  Languages, 
  PenTool 
} from 'lucide-react';
import { StudentProfile, Subject, Achievement } from '../types';

interface StudentHomeProps {
  profile: StudentProfile;
  achievements: Achievement[];
  onStartSession: (subject: Subject) => void;
  onLogout: () => void;
  onOpenResources: () => void;
}

export default function StudentHome({ profile, achievements, onStartSession, onLogout, onOpenResources }: StudentHomeProps) {
  return (
    <div className="max-w-[1400px] mx-auto p-4 space-y-8">
      {/* Header / Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0"
      >
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-zim-gradient rounded-[24px] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-zim-gold/30">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mhoro, {profile.name}!</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="px-3 py-1 bg-zim-green/10 text-zim-green rounded-full text-[10px] font-black uppercase tracking-widest">Grade {profile.grade}</span>
              <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">ZimPrimary Catalyst</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex space-x-4">
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
              <span className="block text-xl font-black text-slate-800">{profile.totalPoints}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Points</span>
            </div>
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
              <div className="flex items-center justify-center text-orange-500 space-x-1">
                <Star className="w-4 h-4 fill-current" />
                <span className="block text-xl font-black text-slate-800 tracking-tighter">{profile.streak}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Day Streak</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={onOpenResources}
              className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 flex items-center"
            >
              <BookOpen size={16} className="mr-2" />
              Resources
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SubjectCard 
          subject="Indigenous Languages" 
          description="Explore the beauty of Shona, Ndebele, and local proverbs."
          icon={<Languages className="w-8 h-8" />}
          color="bg-orange-500"
          level={profile.level['Indigenous Languages'] || 1}
          onClick={() => onStartSession('Indigenous Languages')}
        />
        <SubjectCard 
          subject="Mathematics" 
          description="Master math using ZiG currency, market math, and farming patterns."
          icon={<Calculator className="w-8 h-8" />}
          color="bg-emerald-500"
          level={profile.level['Mathematics'] || 1}
          onClick={() => onStartSession('Mathematics')}
        />
        <SubjectCard 
          subject="Social Science" 
          description="Learn about our heritage, history, and vibrant Zimbabwean culture."
          icon={<Globe className="w-8 h-8" />}
          color="bg-blue-500"
          level={profile.level['Social Science'] || 1}
          onClick={() => onStartSession('Social Science')}
        />
        <SubjectCard 
          subject="Agriculture, Science and Technology" 
          description="Discover sustainable farming, local plants, and technology."
          icon={<Sprout className="w-8 h-8" />}
          color="bg-green-600"
          level={profile.level['Agriculture, Science and Technology'] || 1}
          onClick={() => onStartSession('Agriculture, Science and Technology')}
        />
        <SubjectCard 
          subject="Physical Education" 
          description="Stay active with health, sportsmanship, and traditional games."
          icon={<Dumbbell className="w-8 h-8" />}
          color="bg-red-500"
          level={profile.level['Physical Education'] || 1}
          onClick={() => onStartSession('Physical Education')}
        />
        <SubjectCard 
          subject="English Language" 
          description="Sharpen English skills through reading and creative writing."
          icon={<PenTool className="w-8 h-8" />}
          color="bg-purple-500"
          level={profile.level['English Language'] || 1}
          onClick={() => onStartSession('English Language')}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProgressBar label="Indigenous Languages" value={(profile.level['Indigenous Languages'] || 1) * 10} color="bg-orange-500" />
            <ProgressBar label="Mathematics" value={(profile.level['Mathematics'] || 1) * 10} color="bg-emerald-500" />
            <ProgressBar label="Social Science" value={(profile.level['Social Science'] || 1) * 10} color="bg-blue-500" />
            <ProgressBar label="Agric & Science" value={(profile.level['Agriculture, Science and Technology'] || 1) * 10} color="bg-green-600" />
            <ProgressBar label="Physical Ed" value={(profile.level['Physical Education'] || 1) * 10} color="bg-red-500" />
            <ProgressBar label="English Language" value={(profile.level['English Language'] || 1) * 10} color="bg-purple-500" />
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
