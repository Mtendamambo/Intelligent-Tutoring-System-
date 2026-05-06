import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2, History as HistoryIcon } from 'lucide-react';
import { Question, Subject, StudentProfile } from '../types';
import { api } from '../lib/api';

interface LearningSessionProps {
  subject: Subject;
  profile: StudentProfile;
  onSessionComplete: (results: { correct: number; total: number }) => void;
  onExit: () => void;
}

export default function LearningSession({ subject, profile, onSessionComplete, onExit }: LearningSessionProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState(1);
  const [score, setScore] = useState(0);
  const maxQuestions = 5;

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const fetchNextQuestion = async () => {
    setIsLoading(true);
    const q = await api.generateQuestion(subject, profile.grade, profile.level[subject]);
    setQuestion(q);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setFeedback(null);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!question || !selectedAnswer) return;
    
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setIsSubmitted(true);
    if (correct) setScore(s => s + 1);
    
    const fb = await api.getFeedback(question, selectedAnswer, correct);
    setFeedback(fb);
  };

  const handleNext = () => {
    if (count >= maxQuestions) {
      onSessionComplete({ correct: score + (isCorrect ? 1 : 0), total: maxQuestions });
    } else {
      setCount(c => c + 1);
      fetchNextQuestion();
    }
  };

  if (isLoading && !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">AI is preparing your next challenge...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{subject} Quest</span>
          <h2 className="text-sm font-bold text-slate-800">Challenge {count} of {maxQuestions}</h2>
        </div>
        <button onClick={onExit} className="text-xs font-bold text-slate-400 hover:text-slate-600">Quit</button>
      </div>

      <div className="bg-slate-200 h-2 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${(count / maxQuestions) * 100}%` }} className="h-full bg-blue-500" />
      </div>

      <AnimatePresence mode="wait">
        {question && (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8"
          >
            <div className="space-y-4">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">
                {question.topic}
              </span>
              <p className="text-2xl font-bold text-slate-800 leading-snug">
                {question.text}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option) => (
                <button
                  key={option}
                  disabled={isSubmitted}
                  onClick={() => setSelectedAnswer(option)}
                  className={`
                    p-6 rounded-2xl text-left font-bold transition-all border-2
                    ${selectedAnswer === option 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-slate-50 bg-slate-50 text-slate-600 hover:border-slate-200'}
                    ${isSubmitted && option === question.correctAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : ''}
                    ${isSubmitted && selectedAnswer === option && option !== question.correctAnswer ? 'border-rose-500 bg-rose-50 text-rose-700' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {isSubmitted && option === question.correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {isSubmitted && selectedAnswer === option && option !== question.correctAnswer && <XCircle className="w-5 h-5 text-rose-500" />}
                  </div>
                </button>
              ))}
            </div>

            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl flex items-start space-x-4 ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
              >
                <div className="mt-1">
                  {isCorrect ? <Sparkles className="w-5 h-5" /> : <HistoryIcon className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm leading-relaxed">{feedback}</p>
                </div>
              </motion.div>
            )}

            {!isSubmitted ? (
              <button
                disabled={!selectedAnswer}
                onClick={handleSubmit}
                className="w-full bg-slate-800 text-white p-6 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors shadow-lg"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center space-x-2"
              >
                <span>{count === maxQuestions ? 'Finish' : 'Next Challenge'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
