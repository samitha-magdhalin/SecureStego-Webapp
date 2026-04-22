import React, { useState } from 'react';
import axios from 'axios';
import { Fingerprint, Lock, UserPlus, LogIn, ChevronRight, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  onLogin: (token: string, user: any) => void;
}

const Home: React.FC<HomeProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, { username, password });
      
      if (isLogin) {
        onLogin(response.data.token, response.data.user);
      } else {
        setIsLogin(true);
        // Using a more subtle notification would be better than alert
        setError('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black text-white font-sans overflow-hidden">
      {/* Left Side: Cinematic Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-white/5 bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-30 grayscale"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-circuit-board-interface-close-up-1-518-preview.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-40" />
        </div>
        <div className="atmosphere opacity-20 z-0" />
        <div className="absolute inset-0 cyber-grid opacity-10 z-0" />
        
        {/* Logo & Brand */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] rotate-12 transition-transform hover:rotate-0 duration-500">
            <Fingerprint className="text-black" size={24} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-2xl tracking-tighter font-serif italic text-white flex items-center">Secure<span className="not-italic text-primary font-sans uppercase text-sm tracking-[0.2em] ml-2">Stego</span></span>
        </motion.div>

        {/* Hero Text */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-8 h-[1px] bg-primary/40" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Advanced Cryptography</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-7xl xl:text-8xl font-bold tracking-tighter leading-[0.85] mb-10 text-white"
          >
            SEND <br />
            <span className="text-primary italic font-serif text-8xl xl:text-9xl text-glow block mt-2">Private</span> <br />
            MESSAGES.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4 }}
            className="max-w-md text-sm text-zinc-400 leading-relaxed font-medium tracking-tight"
          >
            Hide secret text inside any image. Only the person you choose can read it.
          </motion.p>
        </div>

        {/* Footer Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex gap-12"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Encryption</div>
            <div className="text-xl font-mono font-bold">RSA-2048</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Protocol</div>
            <div className="text-xl font-mono font-bold">LSB_v2.4</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Status</div>
            <div className="text-xl font-mono font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
              ACTIVE
            </div>
          </div>
        </motion.div>

        {/* Decorative Element */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      </div>

      {/* Right Side: Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 relative">
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Fingerprint className="text-black" size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tighter font-serif italic">Secure<span className="not-italic text-primary">Stego</span></span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-3">
              {isLogin ? 'Welcome Back' : 'Create Identity'}
            </h2>
            <p className="text-zinc-500 font-medium">
              {isLogin ? 'Sign in to access your secure communications.' : 'Join the network and start sending encrypted data.'}
            </p>
          </div>

          <div className="flex gap-1 mb-10 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isLogin ? 'bg-primary text-black shadow-lg shadow-primary/30' : 'text-zinc-500 hover:text-white'}`}
            >
              Access
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${!isLogin ? 'bg-primary text-black shadow-lg shadow-primary/30' : 'text-zinc-500 hover:text-white'}`}
            >
              Enroll
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-primary transition-colors">
                  <Cpu size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder:text-zinc-800 font-mono text-sm"
                  placeholder="OPERATOR_X"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder:text-zinc-800 font-mono text-sm tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest text-center ${error.includes('successful') ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-[0.2em] text-xs group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Checking...</span>
                </div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              SecureStego Protocol v1.0.42
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;

