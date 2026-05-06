import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Star, ArrowRight } from 'lucide-react';
import { Subject } from '../types';

interface SessionResultProps {
  subject: Subject;
  correct: number;
  total: number;
  onClose: () => void;
}

export default function SessionResult({ subject, correct, total, onClose }: SessionResultProps) {
  const percentage = (correct / total) * 100;
  const points = correct * 20;

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-xl border-8 border-white"
      >
        <Trophy className="w-16 h-16" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-800">AMAZING!</h1>
        <p className="text-slate-500 font-medium">You completed your {subject} lesson!</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <StatCard 
          icon={<Star className="text-orange-500" />} 
          label="Score" 
          value={`${correct}/${total}`} 
          subtext={`${percentage}% Correct`}
        />
        <StatCard 
          icon={<Sparkles className="text-blue-500" />} 
          label="Points" 
          value={`+${points}`} 
          subtext="XP Gained"
        />
      </div>

      <button
        onClick={onClose}
        className="w-full bg-slate-800 text-white p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center space-x-2"
      >
        <span>Back to Home</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-1">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-bold text-slate-400">{subtext}</p>
    </div>
  );
}
