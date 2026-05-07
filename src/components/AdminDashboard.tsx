import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Trash2, Key, Search, RefreshCw, LogOut, ChevronRight, UserCircle, Lock, History, ShieldOff, ShieldAlert, CheckCircle2, XCircle, X, Terminal, Globe, Monitor } from 'lucide-react';
import { api } from '../lib/api';
import { AnimatePresence } from 'motion/react';

interface AdminUser {
  id: number;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  disabled: boolean | number;
  created_at: string;
}

interface LoginHistory {
  id: number;
  user_id: number;
  login_at: string;
  ip_address: string;
  user_agent: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'student' | 'teacher' | 'admin'>('All');
  
  // Modals state
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleToggleStatus = async (user: AdminUser) => {
    const newStatus = !user.disabled;
    const action = newStatus ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    
    try {
      await api.admin.updateStatus(user.id, newStatus);
      setUsers(users.map(u => u.id === user.id ? { ...u, disabled: newStatus } : u));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword) return;
    
    setIsUpdating(true);
    try {
      await api.admin.resetPassword(resettingUser.id, newPassword);
      setResettingUser(null);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (err) {
      alert('Failed to reset password');
    } finally {
      setIsUpdating(false);
    }
  };

  const showHistory = async (user: AdminUser) => {
    setHistoryUser(user);
    setLoadingHistory(true);
    try {
      const data = await api.admin.getLoginHistory(user.id);
      setLoginHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
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
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => showHistory(u)}
                          className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="View Login History"
                        >
                          <History size={18} />
                        </button>
                        <button 
                          onClick={() => setResettingUser(u)}
                          className="p-2 text-slate-300 hover:text-zim-gold hover:bg-zim-gold/10 rounded-xl transition-all"
                          title="Reset Password"
                        >
                          <Lock size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(u)}
                          className={`p-2 rounded-xl transition-all ${
                            u.disabled 
                              ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' 
                              : 'text-slate-300 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={u.disabled ? "Enable Account" : "Disable Account"}
                        >
                          {u.disabled ? <ShieldAlert size={18} /> : <ShieldOff size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete Account"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Login History Modal */}
      <AnimatePresence>
        {historyUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Login Audit</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{historyUser.username}</p>
                  </div>
                </div>
                <button onClick={() => setHistoryUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {loginHistory.length > 0 ? (
                  <div className="space-y-4">
                    {loginHistory.map((h) => (
                      <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <Monitor size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 tracking-tight">
                              {new Date(h.login_at).toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Globe size={10} />
                              <span>{h.ip_address}</span>
                            </div>
                          </div>
                        </div>
                        <div className="max-w-[200px] text-right">
                          <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">
                            {h.user_agent.split(')')[0]?.split('(')[1] || 'Unknown Device'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Shield size={32} />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No recent login activity record</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resettingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResettingUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-zim-gold p-8 text-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Secure Reset</h2>
                    <p className="text-xs text-white/80 font-bold uppercase tracking-widest">{resettingUser.username}</p>
                  </div>
                </div>
                <button onClick={() => setResettingUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">New System Password</label>
                  <input 
                    type="password"
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:ring-4 focus:ring-zim-gold/10 focus:border-zim-gold outline-none transition-all font-bold text-sm"
                    placeholder="Enter new credentials..."
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <ShieldAlert className="text-amber-600 shrink-0" size={18} />
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                    Resetting password will immediately override existing credentials. Ensure the user is notified.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  {isUpdating ? <RefreshCw size={18} className="animate-spin" /> : <span>Update Credentials</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
