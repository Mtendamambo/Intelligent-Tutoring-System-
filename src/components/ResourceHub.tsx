/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Book, Upload, Trash2, Loader2, Plus, X, Search, Filter } from 'lucide-react';
import { api } from '../lib/api';
import { Subject } from '../types';

interface Resource {
  id: number;
  title: string;
  content: string;
  subject: Subject;
  grade: number;
  uploaded_at: string;
}

export default function ResourceHub() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<Subject | 'All'>('All');
  const [filterGrade, setFilterGrade] = useState<number | 'All'>('All');
  const [newResource, setNewResource] = useState({
    title: '',
    content: '',
    subject: 'English Language' as Subject,
    grade: 3
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const data = await api.getResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch resources", err);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addResource(newResource);
      fetchResources();
      setIsAdding(false);
      setNewResource({ title: '', content: '', subject: 'English Language', grade: 3 });
    } catch (err) {
      console.error("Failed to add resource", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.deleteResource(id);
      fetchResources();
    } catch (err) {
      console.error("Failed to delete resource", err);
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          res.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'All' || res.subject === filterSubject;
    const matchesGrade = filterGrade === 'All' || res.grade === filterGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-800 tracking-tight">Resource Hub</h1>
          <p className="text-slate-500">Upload books or teaching materials to help the AI tutor.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>Add Material</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value as any)}
              className="w-full bg-white border-2 border-slate-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-all shadow-sm appearance-none text-sm font-medium"
            >
              <option value="All">All Subjects</option>
              <option value="Indigenous Languages">Indigenous Languages</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Social Science">Social Science</option>
              <option value="Agriculture, Science and Technology">Agric & Tech</option>
              <option value="Physical Education">Physical Ed</option>
              <option value="English Language">English Language</option>
            </select>
          </div>
        </div>
        <div>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all shadow-sm text-sm font-medium"
          >
            <option value="All">All Grades</option>
            {[3, 4, 5, 6, 7].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResources.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <Book size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No materials found matching your search.</p>
            </div>
          )}
          {filteredResources.map((res) => (
            <div key={res.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between group transform transition-all hover:scale-[1.01] hover:shadow-md">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Book size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{res.title}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                      Grade {res.grade}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded text-blue-600">
                      {res.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                      {new Date(res.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2 max-w-xl italic">
                    "{res.content.substring(0, 150)}..."
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(res.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-heading font-extrabold text-slate-800">Add Learning Material</h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    value={newResource.title}
                    onChange={e => setNewResource({...newResource, title: e.target.value})}
                    placeholder="e.g. Primary English Chapter 1"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Grade</label>
                    <select 
                      value={newResource.grade}
                      onChange={e => setNewResource({...newResource, grade: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {[3, 4, 5, 6, 7].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                    <select 
                      value={newResource.subject}
                      onChange={e => setNewResource({...newResource, subject: e.target.value as Subject})}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Indigenous Languages">Indigenous Languages</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Social Science">Social Science</option>
                      <option value="Agriculture, Science and Technology">Agriculture, Science and Technology</option>
                      <option value="Physical Education">Physical Education</option>
                      <option value="English Language">English Language</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Content / Text Extracted from Book</label>
                <textarea 
                  required
                  value={newResource.content}
                  onChange={e => setNewResource({...newResource, content: e.target.value})}
                  rows={8}
                  placeholder="Paste the text from the book here. The AI will use this as context for questions..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center space-x-2"
                >
                  <Upload size={20} />
                  <span>Upload Resource</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
