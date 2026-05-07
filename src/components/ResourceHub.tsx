/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Book, Upload, Trash2, Loader2, Plus, X, Search, Filter, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
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

type ProcessingStage = 'uploading' | 'extracting' | 'analyzing' | 'saving' | 'summarizing' | 'complete' | 'idle';

export default function ResourceHub() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSummarizing, setIsSummarizing] = useState<number | null>(null);
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<Subject | 'All'>('All');
  const [filterGrade, setFilterGrade] = useState<number | 'All'>('All');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
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
    setProcessingStage('uploading');
    setProcessingProgress(15);
    
    try {
      const formData = new FormData();
      formData.append('title', newResource.title);
      formData.append('subject', newResource.subject);
      formData.append('grade', newResource.grade.toString());
      
      let finalContent = newResource.content;

      if (selectedFile) {
        formData.append('file', selectedFile);
        setProcessingStage('extracting');
        setProcessingProgress(35);
      } else if (newResource.content) {
        formData.append('content', newResource.content);
        setProcessingStage('analyzing');
        setProcessingProgress(35);
      } else {
        alert("Please provide content or upload a file");
        setIsExtracting(false);
        setProcessingStage('idle');
        return;
      }

      setProcessingStage('saving');
      setProcessingProgress(60);
      const result = await api.addResource(formData);
      
      if (autoSummarize && result.id) {
        setProcessingStage('summarizing');
        setProcessingProgress(80);
        
        // We need to get the fresh resource to summarize it
        const allRes = await api.getResources();
        const fresh = allRes.find((r: any) => r.id === result.id);
        
        if (fresh) {
          const summary = await summarizeDocument(fresh.content, fresh.subject, fresh.grade);
          await api.updateResourceSummary(result.id, summary);
        }
      }

      setProcessingStage('complete');
      setProcessingProgress(100);
      
      setTimeout(() => {
        fetchResources();
        setIsAdding(false);
        setNewResource({ title: '', content: '', subject: 'English Language', grade: 3 });
        setSelectedFile(null);
        setProcessingStage('idle');
        setProcessingProgress(0);
      }, 800);
    } catch (err: any) {
      console.error("Failed to add resource", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Error uploading resource: ${errorMessage}`);
      setProcessingStage('idle');
      setProcessingProgress(0);
    } finally {
      setIsExtracting(false);
    }
  };

  const findInternetResources = async () => {
    setIsSearchingWeb(true);
    try {
      // Simulate/Request Gemini to find curriculum-aligned resources
      const prompt = `Find 3 high-quality educational resources (websites, PDFs, or videos) for the Zimbabwean Grade ${newResource.grade} curriculum focusing on ${newResource.subject}. 
      Return them as a JSON list with 'title', 'url', and 'description'.`;
      
      const response = await summarizeDocument(prompt, newResource.subject, newResource.grade);
      // In a real app, we'd parse this and show suggestions
      // For now, let's paste the suggestions into the content box
      setNewResource({
        ...newResource,
        content: `Suggested Professional Resources Found:\n\n${response}\n\nYou can visit these sites or copy relevant sections here.`
      });
    } catch (err) {
      console.error("Web search failed", err);
    } finally {
      setIsSearchingWeb(false);
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-slate-100 pl-4 py-1 flex-1">
                    "{res.content.substring(0, 150)}..."
                  </p>
                  
                  {res.summary && (
                    <div className="ml-4 flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest text-zim-gold bg-zim-gold/10 px-2 py-1 rounded">
                      <Sparkles size={10} />
                      <span>Has Digest</span>
                    </div>
                  )}
                </div>
                
                {res.summary && (
                  <button 
                    onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
                    className="mt-3 flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 outline-none group/toggle px-2 py-1 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <span>{expandedId === res.id ? 'Hide AI Digest' : 'View AI Digest'}</span>
                    <motion.div
                      animate={{ rotate: expandedId === res.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={12} />
                    </motion.div>
                  </button>
                )}
              </div>

              {/* Expanded Summary */}
              <AnimatePresence>
                {expandedId === res.id && res.summary && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="bg-blue-50/50 border-t border-blue-100/50 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">AI-Powered Resource Digest</h4>
                            <p className="text-[10px] text-blue-400 font-medium">Synthesized from the uploaded content</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedId(null)}
                          className="text-blue-300 hover:text-blue-500 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="markdown-body prose prose-sm max-w-none text-slate-700">
                        <ReactMarkdown>
                          {res.summary}
                        </ReactMarkdown>
                      </div>

                      <div className="mt-6 flex items-center justify-end">
                        <div className="text-[9px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded">
                          BETA: Verify AI insights against source text
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!newResource.title) {
                        setNewResource({ ...newResource, title: file.name.split('.')[0] });
                      }
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : selectedFile ? 'border-zim-green bg-zim-green/5' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200'}`}
                >
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDragging ? 'bg-blue-500 text-white animate-pulse' : selectedFile ? 'bg-zim-green text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold transition-colors ${isDragging ? 'text-blue-600' : selectedFile ? 'text-zim-green' : 'text-slate-600'}`}>
                        {isDragging ? 'Drop file now' : selectedFile ? selectedFile.name : 'Click or drag file to upload'}
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Option 2: Paste Content / AI Search</label>
                  <button 
                    type="button" 
                    onClick={findInternetResources}
                    disabled={isSearchingWeb}
                    className="flex items-center space-x-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {isSearchingWeb ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    <span>AI Help Me Find</span>
                  </button>
                </div>
                <textarea 
                  required={!selectedFile}
                  value={newResource.content}
                  onChange={e => setNewResource({...newResource, content: e.target.value})}
                  rows={4}
                  placeholder={isSearchingWeb ? "AI is finding resources..." : "Paste lesson plans, articles, or let AI find some for you..."}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              {/* Progress Indicator */}
              <AnimatePresence>
                {isExtracting && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {processingStage === 'summarizing' ? 'AI Summarization' : 'Document Processing'}
                        </span>
                        <span className="text-[9px] font-black text-zim-green">{processingProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-zim-green"
                          initial={{ width: 0 }}
                          animate={{ width: `${processingProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <Loader2 size={12} className="animate-spin text-zim-green" />
                        <span className="text-[10px] font-bold text-slate-500 capitalize">
                          {processingStage}... {processingStage === 'summarizing' ? 'Extracting core insights' : ''}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 flex items-center space-x-3">
                <button 
                  type="button"
                  disabled={isExtracting}
                  onClick={() => {
                    setAutoSummarize(!autoSummarize);
                  }}
                  className={`flex items-center space-x-2 px-4 py-4 rounded-xl border-2 transition-all ${autoSummarize ? 'border-zim-gold bg-zim-gold/5 text-zim-gold' : 'border-slate-100 text-slate-400'}`}
                >
                  <Sparkles size={18} className={autoSummarize ? 'animate-pulse' : ''} />
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest leading-none">Auto-Digest</p>
                    <p className="text-[10px] font-bold">{autoSummarize ? 'ON' : 'OFF'}</p>
                  </div>
                </button>

                <button 
                  type="button"
                  disabled={isExtracting}
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isExtracting}
                  className="flex-1 bg-zim-green text-white px-6 py-4 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-zim-green/20 flex items-center justify-center space-x-2 disabled:opacity-80 relative overflow-hidden"
                >
                  <AnimatePresence mode="wait">
                    {isExtracting ? (
                      <motion.div 
                        key={processingStage}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center space-x-3"
                      >
                        <Loader2 size={20} className="animate-spin" />
                        <span className="capitalize">{processingStage}...</span>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="idle"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center space-x-2"
                      >
                        <Upload size={20} />
                        <span>Upload Resource</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
