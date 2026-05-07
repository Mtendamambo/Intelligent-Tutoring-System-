/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Book, Upload, Trash2, Loader2, Plus, X, Search, Filter, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import { summarizeDocument } from '../lib/gemini';
import { Subject } from '../types';

interface Resource {
  id: number;
  title: string;
  content: string;
  subject: Subject;
  grade: number;
  summary: string | null;
  uploaded_at: string;
}

export default function ResourceHub() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<Subject | 'All'>('All');
  const [filterGrade, setFilterGrade] = useState<number | 'All'>('All');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newResource, setNewResource] = useState({
    title: '',
    content: '',
    subject: 'English Language' as Subject,
    grade: 3
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterSubject, filterGrade]);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const data = await api.getResources({ q: searchTerm });
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch resources", err);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async (res: Resource) => {
    setIsSummarizing(res.id);
    try {
      // Get full content first
      const fullRes = await api.getResource(res.id);
      const summary = await summarizeDocument(fullRes.title, fullRes.content);
      await api.updateResourceSummary(res.id, summary);
      
      // Update local state
      setResources(prev => prev.map(r => r.id === res.id ? { ...r, summary } : r));
      setExpandedId(res.id);
    } catch (err) {
      console.error("Summarization failed", err);
      alert("AI Summarization failed. Please try again.");
    } finally {
      setIsSummarizing(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('title', newResource.title);
      formData.append('subject', newResource.subject);
      formData.append('grade', newResource.grade.toString());
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (newResource.content) {
        formData.append('content', newResource.content);
      } else {
        alert("Please provide content or upload a file");
        setIsExtracting(false);
        return;
      }

      await api.addResource(formData);
      fetchResources();
      setIsAdding(false);
      setNewResource({ title: '', content: '', subject: 'English Language', grade: 3 });
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to add resource", err);
      alert("Error uploading resource. Check file type and size.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newResource.title) {
        setNewResource({ ...newResource, title: file.name.split('.')[0] });
      }
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
    const matchesSubject = filterSubject === 'All' || res.subject === filterSubject;
    const matchesGrade = filterGrade === 'All' || res.grade === filterGrade;
    return matchesSubject && matchesGrade;
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
          className="flex items-center space-x-2 bg-zim-green text-white px-4 py-2 rounded-xl font-bold hover:brightness-110 transition-colors shadow-lg shadow-zim-green/20"
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
            <div key={res.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transform transition-all hover:shadow-md">
              <div className="p-5 flex items-start justify-between group">
                <div className="flex items-start space-x-4">
                  <div className="bg-zim-green/10 p-3 rounded-xl text-zim-green">
                    <Book size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{res.title}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                        Grade {res.grade}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-zim-gold/20 px-2 py-0.5 rounded text-zim-gold contrast-125 brightness-75">
                        {res.subject}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleSummarize(res)}
                    disabled={isSummarizing === res.id}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${res.summary ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-500'}`}
                  >
                    {isSummarizing === res.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>{res.summary ? 'Update Summary' : 'AI Summarize'}</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="px-5 pb-4">
                <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-slate-100 pl-4 py-1">
                  "{res.content.substring(0, 150)}..."
                </p>
                
                {res.summary && (
                  <button 
                    onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
                    className="mt-3 flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 outline-none"
                  >
                    <span>{expandedId === res.id ? 'Hide AI Digest' : 'View AI Digest'}</span>
                    {expandedId === res.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {/* Expanded Summary */}
              {expandedId === res.id && res.summary && (
                <div className="bg-blue-50/50 border-t border-blue-100/50 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles size={18} className="text-blue-500" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-blue-600">AI-Powered Resource Digest</h4>
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-3">
                    {res.summary.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Option 1: Upload Document (PDF, DOCX, TXT)</label>
                <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${selectedFile ? 'border-zim-green bg-zim-green/5' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200'}`}>
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedFile ? 'bg-zim-green text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${selectedFile ? 'text-zim-green' : 'text-slate-600'}`}>
                        {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Supports PDF, DOCX up to 10MB</p>
                    </div>
                  </div>
                  {selectedFile && (
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-red-500 transition-colors z-20"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {!selectedFile && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Option 2: Paste Content / Text</label>
                  <textarea 
                    required={!selectedFile}
                    value={newResource.content}
                    onChange={e => setNewResource({...newResource, content: e.target.value})}
                    rows={4}
                    placeholder="Paste the text from the book here if you don't have a file..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              )}

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  disabled={isExtracting}
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isExtracting}
                  className="flex-1 bg-zim-green text-white px-6 py-4 rounded-xl font-bold hover:brightness-110 transition-colors shadow-lg shadow-zim-green/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>{selectedFile ? 'Extracting Text...' : 'Uploading...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Upload Resource</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
