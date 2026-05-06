/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Clock, TrendingUp, Search, Download, Loader2 } from 'lucide-react';
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
  Legend
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

export default function TeacherDashboard() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | 'All'>('All');
  const [sortKey, setSortKey] = useState<'name' | 'totalPoints' | 'streak'>('totalPoints');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentData, logData] = await Promise.all([
        api.getTeacherStudents(),
        api.getTeacherLogs()
      ]);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err) {
      console.error("Failed to fetch teacher data", err);
      setStudents([]);
      setLogs([]);
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
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return b[sortKey] - a[sortKey];
    });

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

  const chartData = [
    { name: 'Grade 3', count: students.filter(s => s.grade === 3).length },
    { name: 'Grade 4', count: students.filter(s => s.grade === 4).length },
    { name: 'Grade 5', count: students.filter(s => s.grade === 5).length },
    { name: 'Grade 6', count: students.filter(s => s.grade === 6).length },
    { name: 'Grade 7', count: students.filter(s => s.grade === 7).length },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Process Trend Data
  const getTrendData = () => {
    const dailyAverage: Record<string, { total: number, sum: number }> = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!dailyAverage[date]) dailyAverage[date] = { total: 0, sum: 0 };
      dailyAverage[date].sum += (log.correct / log.total) * 100;
      dailyAverage[date].total += 1;
    });
    
    return Object.entries(dailyAverage)
      .map(([date, data]) => ({
        date,
        average: Math.round(data.sum / data.total)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  };

  // Process Subject Proficiency (Radar)
  const getSubjectProficiency = () => {
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
      value: parseFloat(getAvgLevel(subject))
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium">Crunching class data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-800 tracking-tight">Teacher Dashboard</h1>
          <p className="text-slate-500 italic">Monitoring learner progress and class performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="bg-white border-2 border-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={18} />
            <span>Export CSV</span>
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
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Class Performance Trend</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} unit="%" />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                  name="Avg Score"
                />
              </LineChart>
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
          <div className="flex items-center space-x-2 mb-6">
            <Clock size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-slate-800">Difficulty Map</h2>
          </div>
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
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Find student..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-slate-50 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-40"
                  />
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                  className="bg-slate-50 border-none px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 outline-none cursor-pointer"
                >
                  <option value="All">All Grades</option>
                  {[3, 4, 5, 6, 7].map(g => <option key={g} value={g}>Gr {g}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sort By:</span>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button 
                  onClick={() => setSortKey('totalPoints')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                    sortKey === 'totalPoints' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  XP Points
                </button>
                <button 
                  onClick={() => setSortKey('streak')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                    sortKey === 'streak' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Streak
                </button>
                <button 
                  onClick={() => setSortKey('name')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                    sortKey === 'name' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Name
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Levels (Avg)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Points</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Streak</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 text-center">Gr {s.grade}</td>
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

        {/* Recent Performance Logs */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center space-x-2">
            <Clock size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">Recent Learning Sessions</h2>
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
                {logs.map((log) => {
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
    </div>
  );
}
