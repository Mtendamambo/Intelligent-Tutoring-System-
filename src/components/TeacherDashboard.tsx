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
  Cell
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentData, logData] = await Promise.all([
        api.getTeacherStudents(),
        api.getTeacherLogs()
      ]);
      setStudents(studentData);
      setLogs(logData);
    } catch (err) {
      console.error("Failed to fetch teacher data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvgLevel = (subject: string) => {
    if (students.length === 0) return 0;
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search pupils..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
            />
          </div>
          <button className="bg-white border-2 border-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 hover:bg-slate-50 transition-colors">
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
        {/* Class Distribution Chart */}
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
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800">Student Progress</h2>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase tracking-widest leading-none">
              Ranked by XP
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Levels (Avg)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Points</th>
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
