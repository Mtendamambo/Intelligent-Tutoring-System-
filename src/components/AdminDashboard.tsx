import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Trash2, Key, Search, RefreshCw, LogOut, ChevronRight, UserCircle } from 'lucide-react';
import { api } from '../lib/api';

interface AdminUser {
  id: number;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'student' | 'teacher' | 'admin'>('All');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.admin.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleUpdateRole = async (id: number, newRole: string) => {
    try {
      await api.admin.updateRole(id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole as any } : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-zim-gold/20">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-zim-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-zim-gold/20">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-tight">Admin Terminal</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-zim-red">System Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchUsers}
              className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center space-x-2"
            >
              <span>Logout</span>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'text-zim-green', bg: 'bg-zim-green/10' },
            { label: 'Educators', value: users.filter(u => u.role === 'teacher').length, icon: UserCircle, color: 'text-zim-gold', bg: 'bg-zim-gold/10' },
            { label: 'Security Level', value: 'High', icon: Shield, color: 'text-zim-red', bg: 'bg-zim-red/10' }
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center space-x-6">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User Table Card */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-zim-gold/10 focus:border-zim-gold outline-none transition-all font-medium text-sm"
              />
            </div>
            
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {['All', 'student', 'teacher', 'admin'].map(r => (
                <button 
                  key={r}
                  onClick={() => setSelectedRole(r as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedRole === r ? 'bg-white text-zim-red shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Account</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Access Level</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase text-xs">
                          {u.username.charAt(0)}
                        </div>
                        <span className="font-black text-slate-900 text-sm tracking-tight">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-zim-gold/20 outline-none cursor-pointer bg-opacity-10 ${
                          u.role === 'admin' ? 'bg-zim-red text-zim-red' : 
                          u.role === 'teacher' ? 'bg-zim-gold text-zim-gold contrast-125 brightness-75' : 
                          'bg-zim-green text-zim-green'
                        }`}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
