import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Image as ImageIcon, User, MessageSquare, Download, CheckCircle, Fingerprint, Cpu, Lock, Mic, MicOff, Sparkles, Wand2, Key, Upload, RefreshCw, Type, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { User as UserType } from '../types';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const SendPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [payloadType, setPayloadType] = useState<'text' | 'voice'>('text');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [protocolLogs, setProtocolLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // New Features State
  const [imageSource, setImageSource] = useState<'upload' | 'ai' | 'random'>('upload');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImageBase64, setAiImageBase64] = useState('');
  const [aiImagePreview, setAiImagePreview] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('stego_token');
        const response = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users');
      }
    };
    fetchUsers();

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    setError('');
    
    try {
      // Initialize Gemini AI in frontend as per best practices
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: aiPrompt }],
        },
      });

      let base64 = '';
      const candidates = response.candidates || [];
      if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            base64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64) {
        throw new Error('No image was returned by the AI engine.');
      }

      setAiImageBase64(base64);
      setAiImagePreview(`data:image/png;base64,${base64}`);
    } catch (err: any) {
      console.error('AI Image Error:', err);
      const errorMsg = err.message || '';
      
      // Check for quota or rate limit errors
      if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('limit') || errorMsg.includes('429')) {
        // Automatic Fallback to Random Image
        console.warn('AI Quota hit. Falling back to Random Image...');
        setError('AI Quota Exceeded. Automatically falling back to Random Asset...');
        
        // Wait 1.5s so user can read the fallback message
        await new Promise(resolve => setTimeout(resolve, 1500));
        await handleGenerateRandomImage();
      } else {
        setError(errorMsg || 'AI Synthesis failed. Please try "Random" instead.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRandomImage = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('stego_token');
      const response = await axios.get('/api/assets/random', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const base64 = response.data.base64;
      
      setAiImageBase64(base64);
      setAiImagePreview(`data:image/png;base64,${base64}`);
    } catch (err: any) {
      setError('Failed to fetch random asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMessage = payloadType === 'text' ? message : voiceTranscript;

    if ((imageSource === 'upload' && !image) || (imageSource !== 'upload' && !aiImageBase64) || !receiverId || !finalMessage) {
      setError('Please fill all fields and ensure an image is selected/generated');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl('');
    setProtocolLogs([]);
    setShowLogs(true);

    const logs = [
      '[SYSTEM] STARTING SECURITY LOCK...',
      '[SYSTEM] HIDING YOUR MESSAGE...',
      '[SYSTEM] PREPARING BACKGROUND IMAGE...',
      '[SYSTEM] WRITING SECRET CODE...',
      '[SYSTEM] SAVING TO ACTIVITY LOG...',
      '[SYSTEM] ALL DONE. IMAGE IS READY.'
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setProtocolLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 800);

    const formData = new FormData();
    if (imageSource === 'upload' && image) {
      formData.append('image', image);
    } else {
      formData.append('aiImageBase64', aiImageBase64);
    }
    formData.append('receiverId', receiverId);
    formData.append('message', finalMessage);

    try {
      const token = localStorage.getItem('stego_token');
      const response = await axios.post('/api/stego/send', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setDownloadUrl(response.data.downloadUrl);
      setMessage('');
      setVoiceTranscript('');
      setImage(null);
      setAiImageBase64('');
      setAiImagePreview('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('stego_token');
      const response = await axios.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = downloadUrl.split('/').pop() || 'stego_image.png';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download the image. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Active</span>
          </div>
          <h1 className="text-6xl font-bold text-white tracking-tighter text-glow font-serif italic">
            Create <br />
            <span className="text-primary not-italic">Message</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-surface px-6 py-3 rounded-2xl border border-white/5 shadow-2xl card-3d">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform duration-500">
            <Fingerprint size={16} />
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Status</div>
            <div className="text-xs font-bold text-white">ONLINE</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-8">
          {/* Cover Asset Selection */}
          <section className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl card-3d relative overflow-hidden group">
            <div className="absolute inset-0 z-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
              <img 
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200" 
                alt="Decorative" 
                className="w-full h-full object-cover grayscale brightness-50"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Image</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Choose a background image</p>
                </div>
              </div>

            <div className="grid grid-cols-3 gap-3 mb-8 p-1.5 bg-white/2 rounded-2xl border border-white/5">
              {[
                { id: 'upload', icon: <Upload size={14} />, label: 'Upload' },
                { id: 'random', icon: <RefreshCw size={14} />, label: 'Random' },
                { id: 'ai', icon: <Sparkles size={14} />, label: 'AI' }
              ].map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setImageSource(source.id as any)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    imageSource === source.id ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {source.icon}
                  <span>{source.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {imageSource === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div 
                    className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] transition-all duration-700 flex flex-col items-center justify-center min-h-[300px] overflow-hidden ${
                      image ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-white/10 bg-white/2'
                    }`}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImage(file);
                      }}
                      accept="image/*"
                    />
                    
                    {image ? (
                      <div className="text-center p-10">
                        <CheckCircle className="text-primary mx-auto mb-3" size={48} strokeWidth={1.5} />
                        <span className="text-base text-white font-bold block truncate max-w-md">{image.name}</span>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Asset Loaded</p>
                      </div>
                    ) : (
                      <div className="text-center p-10">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 mb-4 mx-auto group-hover:scale-110 transition-transform duration-500">
                          <Upload size={24} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Click to browse</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Max 10MB</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {imageSource === 'random' && (
                <motion.div
                  key="random"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="relative rounded-[2rem] overflow-hidden bg-white/2 border border-white/5 min-h-[300px] flex items-center justify-center group">
                    <div className="absolute inset-0 z-10 pointer-events-none border-[20px] border-transparent group-hover:border-primary/5 transition-all duration-700" />
                    <div className="absolute top-4 left-4 z-20 text-[8px] font-mono text-primary/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Asset_Storage</div>
                    {aiImagePreview ? (
                      <img src={aiImagePreview} alt="Random" className="w-full h-[300px] object-cover" />
                    ) : (
                      <div className="text-center text-zinc-500">
                        <RefreshCw size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Ready to fetch</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRandomImage}
                    disabled={loading}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Fetch Random Asset</span>
                  </button>
                </motion.div>
              )}

              {imageSource === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="relative rounded-[2rem] overflow-hidden bg-white/2 border border-white/5 min-h-[300px] flex items-center justify-center group">
                    <div className="absolute inset-0 z-10 pointer-events-none border-[20px] border-transparent group-hover:border-primary/5 transition-all duration-700" />
                    <div className="absolute top-4 left-4 z-20 text-[8px] font-mono text-primary/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Synthesis_Active</div>
                    {aiImagePreview ? (
                      <img src={aiImagePreview} alt="AI Generated" className="w-full h-[300px] object-cover" />
                    ) : (
                      <div className="text-center text-zinc-500">
                        <Sparkles size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Synthesis Engine Ready</p>
                      </div>
                    )}
                    {loading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Synthesizing...</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Synthesis Prompt</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe the asset..."
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAIImage}
                        disabled={loading || !aiPrompt}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary text-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                      >
                        <Sparkles size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

          {/* Payload Configuration */}
          <section className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl card-3d relative overflow-hidden group">
            <div className="absolute inset-0 z-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 font-mono text-[200px] font-bold text-primary select-none flex items-center justify-center -rotate-12">
              CODE
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Secret Text</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">The message to hide</p>
                </div>
              </div>

            <div className="grid grid-cols-2 gap-3 mb-8 p-1.5 bg-white/2 rounded-2xl border border-white/5">
              {[
                { id: 'text', icon: <Type size={14} />, label: 'Text' },
                { id: 'voice', icon: <Mic size={14} />, label: 'Voice' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPayloadType(type.id as any)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    payloadType === type.id ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {payloadType === 'text' ? (
                <motion.div
                  key="text-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter secret message..."
                    className="w-full bg-white/5 border border-white/5 rounded-[2rem] p-8 text-white focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700 min-h-[200px] resize-none text-sm leading-relaxed"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="voice-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white/2 border border-white/5 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-6 min-h-[200px]">
                    <motion.button
                      type="button"
                      onClick={toggleRecording}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' 
                          : 'bg-primary text-black shadow-lg shadow-primary/20'
                      }`}
                    >
                      {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                    </motion.button>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white mb-1">
                        {isRecording ? 'Listening...' : 'Ready to record'}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        {isRecording ? 'Speak clearly' : 'Click to start voice capture'}
                      </p>
                    </div>
                  </div>
                  {voiceTranscript && (
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                      <div className="text-[9px] font-bold text-primary uppercase tracking-widest mb-2">Transcript</div>
                      <p className="text-xs text-slate-300 italic leading-relaxed">"{voiceTranscript}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
        </div>

        {/* Right Column: Processing & Results */}
        <div className="lg:col-span-5 space-y-8 sticky top-28">
          <section className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl card-3d relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:bg-primary/10 transition-colors duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Step 3</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Hide message now</p>
                </div>
              </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Send To</label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer text-sm"
                  required
                >
                  <option value="" className="bg-surface">Select Person</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-surface">{u.username}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full py-6 bg-black border border-primary/50 text-primary font-bold rounded-2xl shadow-lg shadow-primary/10 hover:bg-primary/10 hover:border-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-xs group"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span className="text-primary">Making Secret Image...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-primary">Hide & Send Now</span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {showLogs && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-2 overflow-hidden"
                  >
                    {protocolLogs.map((log, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="terminal-text text-primary/60 flex items-start gap-2"
                      >
                        <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        <span>{log}</span>
                      </motion.div>
                    ))}
                    {loading && protocolLogs.length < 6 && (
                      <div className="w-1 h-3 bg-primary/40 animate-pulse inline-block ml-1" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-500 font-medium leading-relaxed">{error}</p>
                </div>
              )}
            </div>
          </div>
        </section>

          {/* Result Card */}
          <AnimatePresence>
            {downloadUrl && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-surface border border-primary/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden relative"
                >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -mr-16 -mt-16" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Protocol Success</h3>
                      <p className="text-[10px] text-primary uppercase tracking-widest font-bold">Stego Asset Generated</p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-[2rem] overflow-hidden bg-black/60 border border-white/10 mb-8 aspect-video flex items-center justify-center group">
                  <img 
                    src={downloadUrl} 
                    alt="Generated Stego" 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <p className="text-[10px] text-white/60 font-mono">HASH: {downloadUrl.split('/').pop()?.substring(0, 16)}...</p>
                  </div>
                  <div className="absolute top-4 right-4 px-4 py-1.5 bg-primary text-black text-[9px] font-bold uppercase tracking-widest rounded-full shadow-2xl">
                    Verified_Asset
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                  <button
                    onClick={handleDownload}
                    className="w-full py-5 bg-black border border-primary/50 text-primary font-bold rounded-2xl shadow-xl shadow-primary/10 hover:bg-primary/10 hover:border-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    <Download size={18} />
                    <span className="text-primary">Download Stego Image</span>
                  </button>
                  
                  <div className="text-center">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                      Asset stored in secure ledger
                    </p>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SendPage;


