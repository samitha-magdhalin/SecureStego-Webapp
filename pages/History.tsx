import React, { useState } from 'react';
import axios from 'axios';
import { Download, Image as ImageIcon, Lock, Unlock, AlertTriangle, CheckCircle, Fingerprint, Cpu, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ReceivePage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [protocolLogs, setProtocolLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !password) {
      setError('Please provide both image and password');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setProtocolLogs([]);
    setShowLogs(true);

    const logs = [
      '[SYSTEM] CHECKING IMAGE...',
      '[SYSTEM] LOOKING FOR HIDDEN DATA...',
      '[SYSTEM] FINDING SECRET BITS...',
      '[SYSTEM] UNLOCKING THE MESSAGE...',
      '[SYSTEM] OPENING SECURITY LOCK...',
      '[SYSTEM] SUCCESS! DATA FOUND.'
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
    formData.append('image', image);
    formData.append('password', password);

    try {
      const token = localStorage.getItem('stego_token');
      const response = await axios.post('/api/stego/receive', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Decryption failed. Ensure the image and password are correct.');
    } finally {
      setLoading(false);
    }
  };

  const speakMessage = () => {
    if (!message) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
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
            Open <br />
            <span className="text-primary not-italic">Message</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-surface px-6 py-3 rounded-2xl border border-white/5 shadow-2xl card-3d">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Unlock size={16} />
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Mode</div>
            <div className="text-xs font-bold text-white">OPENING</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface/40 backdrop-blur-xl border border-white/5 p-10 rounded-[3rem] shadow-2xl card-3d relative overflow-hidden group">
            <div className="absolute inset-0 z-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
              <img 
                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200" 
                alt="Decorative" 
                className="w-full h-full object-cover grayscale brightness-50"
                referrerPolicy="no-referrer"
              />
            </div>
            <form onSubmit={handleReceive} className="space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Secret Image</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="hidden"
                    id="receive-upload"
                    required
                  />
                  <label
                    htmlFor="receive-upload"
                    className="flex flex-col items-center justify-center w-full h-64 bg-white/2 border-2 border-dashed border-white/5 rounded-[2.5rem] cursor-pointer group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-700 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {image ? (
                      <div className="text-center p-8">
                        <CheckCircle className="text-primary mx-auto mb-3" size={48} strokeWidth={1.5} />
                        <span className="text-base text-white font-bold block truncate max-w-md">{image.name}</span>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Asset Loaded</p>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 mb-4 mx-auto group-hover:scale-110 transition-transform duration-500">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Pick your secret image</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Click to browse</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Key</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700 text-sm"
                    placeholder="Enter decryption key..."
                    required
                  />
                  <Lock className="absolute right-6 top-5 text-zinc-500 group-hover:text-primary transition-colors duration-500" size={18} />
                </div>
              </div>

              {error && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-500 font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-black border border-primary/50 text-primary font-bold rounded-2xl shadow-xl shadow-primary/10 hover:bg-primary/20 hover:border-primary hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-[0.2em] text-xs group"
              >
                {loading ? (
                  <>
                    <Cpu size={18} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={18} />
                    <span>Read Secret Message</span>
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
            </form>
          </section>

          {message && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-primary/20 p-10 rounded-[3rem] shadow-2xl card-3d relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Your Message</h3>
                </div>
                <button
                  onClick={speakMessage}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full border border-white/5 text-slate-400 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300"
                >
                  <Volume2 size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Listen</span>
                </button>
              </div>
              <div className="bg-white/2 p-8 rounded-[2rem] border border-white/5 text-slate-300 font-medium leading-relaxed text-lg shadow-inner">
                {message}
              </div>
            </motion.section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-28">
          <section className="bg-surface border border-white/5 p-8 rounded-[2rem] shadow-2xl card-3d">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Cpu size={14} className="text-primary" />
              Steps
            </h3>
            <ul className="space-y-6">
              {[
                { title: 'Check', desc: 'Verifying image code.' },
                { title: 'Search', desc: 'Looking for hidden bits.' },
                { title: 'Unlock', desc: 'Opening the data lock.' },
                { title: 'Show', desc: 'Preparing your message.' }
              ].map((step, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="w-1 h-1 bg-primary rounded-full mt-1.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-0.5">{step.title}</div>
                    <div className="text-[11px] text-zinc-500 leading-relaxed">{step.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-surface border border-white/5 p-8 rounded-[2rem] shadow-2xl card-3d">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-3">Security</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              Smart systems monitor all activity to keep your messages safe and private.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReceivePage;


