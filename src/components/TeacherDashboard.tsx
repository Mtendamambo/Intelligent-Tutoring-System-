/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Clock, TrendingUp, Search, Download, Loader2, X, Award, History, BookOpen, Target, ArrowUpDown, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface StudentSummary {
  id: number;
  name: string;
  grade: number;
  level: Record<string, number>;
  totalPoints: number;
  streak: number;
  createdAt: string;
}

interface PerformanceLog {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  correct: number;
  total: number;
  timestamp: string;
}

interface AchievementSummary {
  id: number;
  student_id: number;
  student_name: string;
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

interface TeacherDashboardProps {
  onLogout: () => void;
}

export default function TeacherDashboard({ onLogout }: TeacherDashboardProps) {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [achievements, setAchievements] = useState<AchievementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [achievementFilter, setAchievementFilter] = useState('All');
  const [filterGrade, setFilterGrade] = useState<number | 'All'>('All');
  const [sortKey, setSortKey] = useState<'name' | 'totalPoints' | 'streak'>('totalPoints');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [searchTermLogs, setSearchTermLogs] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectStudent = (id: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: number[]) => {
    if (selectedStudentIds.length === ids.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(ids);
    }
  };

  const handleBulkAward = (points: number) => {
    // In a real app, this would be an API call
    alert(`Awarding ${points} XP to ${selectedStudentIds.length} students: ${selectedStudentIds.join(', ')}`);
    setSelectedStudentIds([]);
  };

  const handleBulkAssign = (subject: string) => {
    // In a real app, this would be an API call
    alert(`Assigning ${subject} module to ${selectedStudentIds.length} students`);
    setSelectedStudentIds([]);
  };

  const fetchData = async () => {
    try {
      const [studentData, logData, achievementData] = await Promise.all([
        api.getTeacherStudents(),
        api.getTeacherLogs(),
        api.getTeacherAchievements()
      ]);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setLogs(Array.isArray(logData) ? logData : []);
      setAchievements(Array.isArray(achievementData) ? achievementData : []);
    } catch (err) {
      console.error("Failed to fetch teacher data", err);
      setStudents([]);
      setLogs([]);
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = filterGrade === 'All' || s.grade === filterGrade;
      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortKey === 'name') {
        result = a.name.localeCompare(b.name);
      } else {
        result = a[sortKey] - b[sortKey];
      }
      return sortOrder === 'asc' ? result : -result;
    });

  const toggleSort = (key: 'name' | 'totalPoints' | 'streak') => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'name' ? 'asc' : 'desc'); // Name A-Z by default, values High-Low by default
    }
  };

  const getAvgLevel = (subject: string): string => {
    if (students.length === 0) return "0";
    return (students.reduce((acc, s) => acc + (s.level[subject] || 1), 0) / students.length).toFixed(1);
  };

  const stats = {
    totalStudents: students.length,
    avgPoints: students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.totalPoints, 0) / students.length) : 0,
    activeToday: new Set(logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).map(l => l.student_id)).size,
    avgMathematics: getAvgLevel('Mathematics'),
    avgEnglish: getAvgLevel('English Language'),
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Grade', 'Total Points (XP)', 'Streak (Days)', 'Join Date'];
    const rows = filteredStudents.map(s => [
      `"${s.name}"`, // Quote names for safety
      s.grade,
      s.totalPoints,
      s.streak,
      new Date(s.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `learner_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = [
    { name: 'Grade 3', count: students.filter(s => s.grade === 3).length },
    { name: 'Grade 4', count: students.filter(s => s.grade === 4).length },
    { name: 'Grade 5', count: students.filter(s => s.grade === 5).length },
    { name: 'Grade 6', count: students.filter(s => s.grade === 6).length },
    { name: 'Grade 7', count: students.filter(s => s.grade === 7).length },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Process Trend Data - Enhanced to show different subjects
  const getTrendData = () => {
    const dailyData: Record<string, Record<string, { total: number, sum: number }>> = {};
    const dates: Set<string> = new Set();
    const subjects: Set<string> = new Set();

    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dates.add(date);
      subjects.add(log.subject);

      if (!dailyData[date]) dailyData[date] = {};
      if (!dailyData[date][log.subject]) dailyData[date][log.subject] = { total: 0, sum: 0 };
      
      dailyData[date][log.subject].sum += (log.correct / log.total) * 100;
      dailyData[date][log.subject].total += 1;
    });
    
    // Sort dates and take last 7
    const sortedDates = Array.from(dates)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7);

    return sortedDates.map(date => {
      const entry: any = { date };
      let daySum = 0;
      let dayTotal = 0;

      Array.from(subjects).forEach(sub => {
        if (dailyData[date][sub]) {
          const avg = Math.round(dailyData[date][sub].sum / dailyData[date][sub].total);
          entry[sub] = avg;
          daySum += dailyData[date][sub].sum;
          dayTotal += dailyData[date][sub].total;
        }
      });

      entry.average = dayTotal > 0 ? Math.round(daySum / dayTotal) : 0;
      return entry;
    });
  };

  // Process Average Score per Subject
  const getSubjectScores = () => {
    const subjectStats: Record<string, { total: number, sum: number }> = {};
    logs.forEach(log => {
      if (!subjectStats[log.subject]) subjectStats[log.subject] = { total: 0, sum: 0 };
      subjectStats[log.subject].sum += (log.correct / log.total) * 100;
      subjectStats[log.subject].total += 1;
    });

    return Object.entries(subjectStats).map(([name, data]) => ({
      name: name.replace('Agriculture, Science and Technology', 'Agri & Science'), // Shorten
      fullName: name,
      score: Math.round(data.sum / data.total)
    })).sort((a, b) => b.score - a.score);
  };

  // Process Subject Proficiency (Radar)
  const getSubjectProficiency = (studentLevels?: Record<string, number>) => {
    const subjects = [
      'Indigenous Languages', 
      'Mathematics', 
      'Social Science', 
      'Agriculture, Science and Technology', 
      'Physical Education', 
      'English Language'
    ];
    return subjects.map(subject => ({
      subject: subject.split(' ').slice(0, 2).join(' '), // Shorten names
      fullSubject: subject,
      value: studentLevels ? (studentLevels[subject] || 1) : parseFloat(getAvgLevel(subject))
    }));
  };

  // Process Difficulty Map
  const getDifficultyData = () => {
    const subjectStats: Record<string, { total: number, sum: number }> = {};
    logs.forEach(log => {
      if (!subjectStats[log.subject]) subjectStats[log.subject] = { total: 0, sum: 0 };
      subjectStats[log.subject].sum += (log.correct / log.total);
      subjectStats[log.subject].total += 1;
    });

    return Object.entries(subjectStats)
      .map(([subject, data]) => ({
        subject,
        difficulty: 100 - Math.round((data.sum / data.total) * 100)
      }))
      .sort((a, b) => b.difficulty - a.difficulty);
  };

  const trendData = getTrendData();
  const proficiencyData = getSubjectProficiency();
  const difficultyData = getDifficultyData();
  const subjectScoresData = getSubjectScores();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium">Crunching class data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1920px] mx-auto p-4 md:p-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-zim-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-zim-green/20">
            <BarChart3 className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teacher Console</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-zim-green">Monitoring learner progress and performance</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportCSV}
            className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center mb-1 group shadow-sm"
          >
            <Download size={16} className="mr-2 group-hover:scale-110 transition-transform" />
            <span>Export Reports</span>
          </button>
          <button 
            onClick={onLogout}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center space-x-2 shadow-xl shadow-slate-900/10"
          >
            <span>Logout</span>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Users size={20} /></div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+2 this week</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pupils</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.totalStudents}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-50 p-2 rounded-xl text-purple-600"><TrendingUp size={20} /></div>
            <span className="text-xs font-bold text-slate-400">Average Class Level</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Class Progress</p>
          <div className="flex items-center space-x-4">
             <div>
               <p className="text-[10px] text-slate-400 uppercase font-black">Mathematics</p>
               <p className="text-lg font-bold text-slate-800">{stats.avgMathematics}</p>
             </div>
             <div>
               <p className="text-[10px] text-slate-400 uppercase font-black">English</p>
               <p className="text-lg font-bold text-slate-800">{stats.avgEnglish}</p>
             </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><TrendingUp size={20} /></div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Avg Points</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.avgPoints} XP</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-50 p-2 rounded-xl text-green-600"><Clock size={20} /></div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Active Today</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.activeToday} learners</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Class Performance Trend</h2>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase text-slate-400">Average</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorAvg)" 
                  name="Class Average"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Score per Subject */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800">Average Score / Subject</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectScoresData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 600}} width={80} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Avg Score %">
                  {subjectScoresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Strength Radar */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Subject Proficiency</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={proficiencyData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fill: '#64748b', fontWeight: 600}} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                <Radar
                  name="Proficiency"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.5}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Insights & Distribution */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Clock size={20} className="text-red-500" />
              <h2 className="text-lg font-bold text-slate-800">Difficulty Map</h2>
            </div>
          </div>
          <div className="space-y-6">
            {difficultyData.length > 0 && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-1">Teacher Priority</p>
                <p className="text-sm font-bold text-slate-800">
                  Learners are finding <span className="text-red-600">{difficultyData[0].subject}</span> the most challenging with a {difficultyData[0].difficulty}% struggle rate.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {difficultyData.map((item, idx) => (
                <div key={item.subject}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-600 truncate mr-2">{item.subject}</span>
                    <span className="text-[10px] font-black text-slate-400">{item.difficulty}% Struggle</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        item.difficulty > 60 ? 'bg-red-500' : item.difficulty > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${item.difficulty}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {difficultyData.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-10">No struggle data yet.</p>
            )}
          </div>
        </div>

        {/* Grade Distribution Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Grade Distribution</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student List Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800">Learner Roster</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search students by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all"
                  />
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                  className="bg-slate-50 border-2 border-transparent hover:border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer transition-all appearance-none"
                >
                  <option value="All">All Grades</option>
                  {[3, 4, 5, 6, 7].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sort By:</span>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button 
                  onClick={() => toggleSort('totalPoints')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center space-x-1.5 ${
                    sortKey === 'totalPoints' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>XP Points</span>
                  {sortKey === 'totalPoints' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </button>
                <button 
                  onClick={() => toggleSort('streak')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center space-x-1.5 ${
                    sortKey === 'streak' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>Streak</span>
                  {sortKey === 'streak' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </button>
                <button 
                  onClick={() => toggleSort('name')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center space-x-1.5 ${
                    sortKey === 'name' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>Name</span>
                  {sortKey === 'name' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto relative">
            {selectedStudentIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-6 border border-slate-700"
              >
                <div className="flex items-center space-x-2 border-r border-slate-700 pr-6 mr-2">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-black">{selectedStudentIds.length}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="group relative">
                    <button className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                      <BookOpen size={16} />
                      <span>Assign Module</span>
                    </button>
                    <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block w-48 bg-slate-800 rounded-xl p-2 shadow-xl">
                      {['Mathematics', 'Science', 'English', 'Agriculture'].map(s => (
                        <button 
                          key={s}
                          onClick={() => handleBulkAssign(s)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 text-[10px] font-bold uppercase"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="group relative">
                    <button className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest hover:text-amber-400 transition-colors">
                      <Award size={16} />
                      <span>Award XP</span>
                    </button>
                    <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block w-32 bg-slate-800 rounded-xl p-2 shadow-xl">
                      {[10, 25, 50].map(points => (
                        <button 
                          key={points}
                          onClick={() => handleBulkAward(points)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 text-[10px] font-bold uppercase"
                        >
                          +{points} XP
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedStudentIds([])}
                    className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 w-10">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={() => handleSelectAll(filteredStudents.map(s => s.id))}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </th>
                  <th className="px-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name & Subject Levels</span>
                      {sortKey === 'name' ? (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Levels (Avg)</th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600"
                    onClick={() => toggleSort('totalPoints')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Total Points</span>
                      {sortKey === 'totalPoints' ? (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600"
                    onClick={() => toggleSort('streak')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Streak</span>
                      {sortKey === 'streak' ? (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ArrowUpDown size={10} className="text-slate-300" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((s) => (
                  <tr 
                    key={s.id} 
                    className={`hover:bg-slate-50/30 transition-colors cursor-pointer group ${selectedStudentIds.includes(s.id) ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); handleSelectStudent(s.id); }}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => {}} // Handled by container row click pattern
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="px-1 py-4 text-center" onClick={() => setSelectedStudent(s)}>
                      <div className="flex items-center justify-center">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                          {s.grade}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={() => setSelectedStudent(s)}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-400 uppercase border-2 border-white shadow-sm shrink-0 group-hover:border-blue-100 transition-colors">
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate leading-tight mb-1 group-hover:text-blue-600 transition-colors">{s.name}</p>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1.5" title={`Mathematics: Lvl ${s.level['Mathematics'] || 1}`}>
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">M</span>
                              <div className="flex space-x-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      i < Math.ceil((s.level['Mathematics'] || 1) / 2) ? 'bg-emerald-500' : 'bg-slate-100'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5" title={`English: Lvl ${s.level['English Language'] || 1}`}>
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">E</span>
                              <div className="flex space-x-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      i < Math.ceil((s.level['English Language'] || 1) / 2) ? 'bg-blue-500' : 'bg-slate-100'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">Eng Lvl {s.level['English Language'] || 1}</span>
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">Math Lvl {s.level['Mathematics'] || 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 tracking-tight">{s.totalPoints} XP</td>
                    <td className="px-6 py-4 font-black text-orange-500 flex items-center space-x-1">
                      <span>{s.streak}</span>
                      <span className="text-[10px] uppercase">Days</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Award size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800">Student Achievements</h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter:</span>
              <select 
                value={achievementFilter}
                onChange={(e) => setAchievementFilter(e.target.value)}
                className="bg-slate-50 border-2 border-transparent hover:border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Achievements</option>
                {Array.from(new Set(achievements.map(a => a.title))).map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto">
            {achievements
              .filter(a => achievementFilter === 'All' || a.title === achievementFilter)
              .map((achievement) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={achievement.id} 
                className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start space-x-4 hover:border-amber-200 transition-colors"
              >
                <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 shrink-0">
                  {achievement.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{achievement.title}</h3>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-1">{achievement.student_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(achievement.unlockedAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
            {achievements.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400">
                <Award size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">No achievements unlocked yet by any student.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Performance Logs */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Recent Learning Sessions</h2>
            </div>
            <button 
              onClick={() => setShowFullHistory(true)}
              className="text-xs font-black uppercase text-blue-600 tracking-widest hover:text-blue-700 transition-colors flex items-center space-x-1"
            >
              <span>View All History</span>
              <TrendingUp size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Result</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Performance</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.slice(0, 10).map((log) => {
                  const percentage = Math.round((log.correct / log.total) * 100);
                  const color = percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';
                  const bgColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{log.student_name}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          log.subject === 'Literacy' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {log.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{log.correct} / {log.total} Correct</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`${bgColor} h-full`} style={{ width: `${percentage}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${color}`}>{percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden shadow-blue-900/20 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="relative p-8 pb-32 bg-blue-600 text-white">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-3xl font-black border-4 border-white/20">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-1">{selectedStudent.name}</h2>
                    <div className="flex items-center space-x-3">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Grade {selectedStudent.grade}</span>
                      <span className="flex items-center space-x-1.5 text-xs font-bold">
                        <Clock size={14} className="text-blue-200" />
                        <span>Joined {new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards Overlay */}
              <div className="px-8 -mt-24 grid grid-cols-3 gap-6 relative z-10">
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
                  <div className="bg-amber-50 w-10 h-10 rounded-2xl flex items-center justify-center text-amber-500 mb-4"><Award size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total XP</p>
                  <p className="text-2xl font-black text-slate-800">{selectedStudent.totalPoints}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
                  <div className="bg-orange-50 w-10 h-10 rounded-2xl flex items-center justify-center text-orange-500 mb-4"><TrendingUp size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current Streak</p>
                  <p className="text-2xl font-black text-slate-800">{selectedStudent.streak} Days</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100">
                  <div className="bg-blue-50 w-10 h-10 rounded-2xl flex items-center justify-center text-blue-500 mb-4"><Target size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Sessions</p>
                  <p className="text-2xl font-black text-slate-800">{logs.filter(l => l.student_id === selectedStudent.id).length}</p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Proficiency Radar */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center space-x-2">
                        <BookOpen size={20} className="text-blue-500" />
                        <h3 className="text-lg font-bold text-slate-800">Proficiency Profile</h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Current Lvl</span>
                      </div>
                    </div>
                    <div className="h-64 relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getSubjectProficiency(selectedStudent.level)}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} 
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 10]} 
                            axisLine={false} 
                            tick={false} 
                          />
                          <Radar
                            name={selectedStudent.name}
                            dataKey="value"
                            stroke="#2563eb"
                            fill="#3b82f6"
                            fillOpacity={0.4}
                            strokeWidth={3}
                          />
                          <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: any) => [`Level ${value}`, 'Proficiency']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                       {getSubjectProficiency(selectedStudent.level).map(s => (
                         <div key={s.fullSubject} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-xl">
                            <span className="text-[9px] font-bold text-slate-500 truncate mr-2">{s.subject}</span>
                            <span className="text-[10px] font-black text-blue-600">Lvl {s.value}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <History size={20} className="text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-800">Session Breakdown</h3>
                    </div>
                    <div className="space-y-4">
                      {logs
                        .filter(l => l.student_id === selectedStudent.id)
                        .slice(0, 5)
                        .map(log => {
                          const percentage = Math.round((log.correct / log.total) * 100);
                          return (
                            <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className={`w-2 h-10 rounded-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <div>
                                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{log.subject}</p>
                                  <p className="text-sm font-bold text-slate-700">{percentage}% Accuracy • {log.correct}/{log.total} Correct</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                          );
                        })}
                      {logs.filter(l => l.student_id === selectedStudent.id).length === 0 && (
                        <div className="text-center py-10 opacity-50">
                          <History size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-bold text-slate-400">No session history yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                 <button 
                  onClick={() => setSelectedStudent(null)}
                  className="w-full py-4 rounded-2xl bg-slate-200 text-slate-600 font-black uppercase tracking-widest hover:bg-slate-300 transition-colors"
                 >
                   Return to Dashboard
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full History Modal */}
      <AnimatePresence>
        {showFullHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullHistory(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Full Learning History</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Browsing all performance logs</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filter by student or subject..."
                      value={searchTermLogs}
                      onChange={e => setSearchTermLogs(e.target.value)}
                      className="w-64 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => setShowFullHistory(false)}
                    className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Result</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Performance</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs
                      .filter(l => 
                        l.student_name.toLowerCase().includes(searchTermLogs.toLowerCase()) || 
                        l.subject.toLowerCase().includes(searchTermLogs.toLowerCase())
                      )
                      .map((log) => {
                        const percentage = Math.round((log.correct / log.total) * 100);
                        const color = percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';
                        const bgColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{log.student_name}</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {log.subject}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600">{log.correct} / {log.total} Correct</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`${bgColor} h-full`} style={{ width: `${percentage}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${color}`}>{percentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                <span>Showing {logs.length} records</span>
                <button 
                  onClick={() => setShowFullHistory(false)}
                  className="px-6 py-2 rounded-xl bg-slate-800 text-white font-black uppercase tracking-widest hover:bg-slate-900 transition-colors"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
