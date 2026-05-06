import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, GraduationCap, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string, grade: number) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = React.useState('');
  const [grade, setGrade] = React.useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onComplete(name, grade);
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[80vh] space-y-12">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl rotate-12"
        >
          <GraduationCap className="w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">ZimPrimary <span className="text-blue-600 underline decoration-4 underline-offset-8">ITS</span></h1>
        <p className="text-slate-500 font-medium">Zimbabwe's Smart AI Tutor for Primary Learners</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Your Name</label>
          <input 
            required
            type="text" 
            placeholder="e.g. Farai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-xl font-bold focus:border-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Your Grade</label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 4, 5, 6, 7].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`p-4 rounded-2xl font-black transition-all border-2 ${grade === g ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-800 text-white p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center space-x-2 shadow-xl group"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}
