import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Loader2, History as HistoryIcon, Settings, BookOpen } from 'lucide-react';
import { Question, Subject, StudentProfile } from '../types';
import { generateQuestion, getFeedback, generateTopicSummary } from '../lib/gemini';
import { api } from '../lib/api';

interface LearningSessionProps {
  subject: Subject;
  profile: StudentProfile;
  onSessionComplete: (results: { correct: number; total: number }) => void;
  onExit: () => void;
}

export default function LearningSession({ subject, profile, onSessionComplete, onExit }: LearningSessionProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicSummary, setTopicSummary] = useState<string | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(1);
  const [score, setScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionMaxQuestions, setSessionMaxQuestions] = useState(5);
  const [sessionDifficulty, setSessionDifficulty] = useState(profile.level[subject] || 1);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = {
        ...profile,
        level: {
          ...profile.level,
          [subject]: sessionDifficulty
        }
      };
      await api.updateProgress(updatedProfile);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const subjectTopics: Record<Subject, string[]> = {
    'Indigenous Languages': ['Shona/Ndebele Phrases', 'Traditional Proverbs (Tsumo)', 'Local Riddles (Zvirahwe)', 'Grammar & Spoken Word'],
    'Mathematics': ['ZiG Currency & Market Math', 'Farming Fractions', 'Geometry in Patterns', 'Numbers & Operations'],
    'Social Science': ['Great Zimbabwe & Heritage', 'Zimbabwean History', 'Citizenship & Rights', 'Geography of our Provinces'],
    'Agriculture, Science and Technology': ['Local Soil Types', 'Indigenous Plants & Crops', 'Animal Husbandry', 'Modern Tools & Tech'],
    'Physical Education': ['Traditional Games (Nhodo)', 'Health & Nutrition', 'Sportsmanship', 'Athletics & Rules'],
    'English Language': ['Grammar & Punctuation', 'Reading Comprehension', 'Story Writing Tips', 'Vocabulary Building']
  };

  const startSession = async (topic: string) => {
    setSelectedTopic(topic);
    setIsLoading(true);
    // Study phase first
    try {
      const summary = await generateTopicSummary(subject, profile.grade, topic);
      setTopicSummary(summary);
      setIsStudyMode(true);
    } catch (err) {
      console.error("Failed to generate summary", err);
      // Skip study mode if it fails
      await startQuiz(topic);
    }
    setIsLoading(false);
  };

  const startQuiz = async (topic?: string) => {
    const t = topic || selectedTopic || 'General';
    setIsStudyMode(false);
    setIsLoading(true);
    await fetchNextQuestion(t);
  };

  const fetchNextQuestion = async (topic?: string) => {
    const t = topic || selectedTopic || 'General';
    setIsLoading(true);
    const q = await generateQuestion(subject, profile.grade, sessionDifficulty, t);
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
    
    const fb = await getFeedback(question, selectedAnswer, correct);
    setFeedback(fb);
  };

  const handleNext = () => {
    if (count >= sessionMaxQuestions) {
      onSessionComplete({ correct: score + (isCorrect ? 1 : 0), total: sessionMaxQuestions });
    } else {
      setCount(c => c + 1);
      fetchNextQuestion();
    }
  };

  if (!selectedTopic) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-8 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1 text-center space-y-4 py-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 mb-4">
              <Sparkles size={40} />
            </div>
            <h2 className="text-3xl font-heading font-extrabold text-slate-800">Choose a Focus</h2>
            <p className="text-slate-500 italic">What part of {subject} would you like to master today?</p>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
            title="Session Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Session Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Questions</label>
                      <span className="text-lg font-bold text-blue-600">{sessionMaxQuestions}</span>
                    </div>
                    <input 
                      type="range" 
                      min="3" 
                      max="15" 
                      step="1"
                      value={sessionMaxQuestions}
                      onChange={(e) => setSessionMaxQuestions(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>3 Questions</span>
                      <span>15 Questions</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Difficulty</label>
                      <span className="text-lg font-bold text-emerald-600">Level {sessionDifficulty}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      step="1"
                      value={sessionDifficulty}
                      onChange={(e) => setSessionDifficulty(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full bg-slate-800 text-white p-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjectTopics[subject].map((topic) => (
            <button
              key={topic}
              onClick={() => startSession(topic)}
              className="bg-white border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 p-6 rounded-3xl text-left transition-all group"
            >
              <h3 className="font-bold text-slate-700 group-hover:text-blue-700">{topic}</h3>
              <p className="text-xs text-slate-400 mt-1">Start specialized quiz</p>
            </button>
          ))}
          <button
            onClick={() => startSession('General')}
            className="sm:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-slate-400 p-6 rounded-3xl text-center transition-all"
          >
            <h3 className="font-bold text-slate-400">Random Mix</h3>
            <p className="text-[10px] uppercase font-black tracking-widest mt-1">A bit of everything from the grade {profile.grade} syllabus</p>
          </button>
        </div>
        
        <div className="text-center mt-8">
          <button onClick={onExit} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline">Go Back home</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">
          {isStudyMode ? 'AI is summarizing this topic for you...' : 'AI is preparing your next challenge...'}
        </p>
      </div>
    );
  }

  if (isStudyMode && topicSummary) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-blue-50 space-y-8"
        >
          <div className="flex items-center space-x-4 mb-2">
            <div className="bg-blue-600 p-3 rounded-2xl text-white">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{subject}</p>
              <h2 className="text-xl font-bold text-slate-800">{selectedTopic} Overview</h2>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-100 rounded-full" />
            <p className="text-xl font-medium text-slate-700 leading-relaxed pl-6 italic">
              "{topicSummary}"
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">What to expect:</h3>
            <ul className="space-y-3">
              {[
                `Grade ${profile.grade} curriculum standard`,
                `${sessionMaxQuestions} interactive questions`,
                `Real-time Zimbabwean context feedback`
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm font-bold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={() => startQuiz()}
            className="w-full bg-blue-600 text-white p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center space-x-3 group"
          >
            <span>Start Practice Quiz</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{subject} Quest</span>
          <h2 className="text-sm font-bold text-slate-800">Challenge {count} of {sessionMaxQuestions}</h2>
        </div>
        <button onClick={onExit} className="text-xs font-bold text-slate-400 hover:text-slate-600">Quit</button>
      </div>

      <div className="bg-slate-200 h-2 rounded-full overflow-hidden">
        <motion.div animate={{ width: `${(count / sessionMaxQuestions) * 100}%` }} className="h-full bg-blue-500" />
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
                <span>{count === sessionMaxQuestions ? 'Finish' : 'Next Challenge'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
