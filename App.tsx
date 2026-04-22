
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Fingerprint, LayoutDashboard, Send, Download, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './pages/Dashboard';
import SendPage from './pages/Scanner';
import ReceivePage from './pages/History';
import Home from './pages/Home';

const MouseGlow = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="mouse-glow" 
      style={{ left: mousePos.x, top: mousePos.y }}
    />
  );
};

const SidebarContent = ({ user, onLogout, closeMenu }: { user: any; onLogout: () => void; closeMenu?: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={18} />, label: 'Home' },
    { path: '/send', icon: <Send size={18} />, label: 'Create' },
    { path: '/receive', icon: <Download size={18} />, label: 'Open' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/10 rotate-12 transition-transform hover:rotate-0 duration-500">
            <Fingerprint className="text-black" size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tighter text-white font-serif italic">Secure<span className="not-italic text-primary font-sans uppercase text-sm tracking-[0.2em] ml-1">Stego</span></span>
        </div>
        {closeMenu && (
          <button onClick={closeMenu} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="px-6 mb-8">
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-3 group hover:border-primary/20 transition-all duration-500 crt-flicker">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            {user.username[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.username}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">User_Active</div>
          </div>
        </div>
      </div>

      <nav className="flex-grow px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={closeMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              isActive(item.path)
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`transition-transform duration-300 ${isActive(item.path) ? '' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="text-sm tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6">
        <button
          onClick={() => {
            onLogout();
            if (closeMenu) closeMenu();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-slate-500 hover:text-red-500 transition-all duration-300 font-bold text-[10px] uppercase tracking-widest"
        >
          <LogOut size={14} />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-black border-r border-white/5 h-screen sticky top-0 z-50">
      <SidebarContent user={user} onLogout={onLogout} />
    </aside>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('stego_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('stego_token', token);
    localStorage.setItem('stego_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('stego_token');
    localStorage.removeItem('stego_user');
    setUser(null);
  };

  if (!user) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden">
        <div className="atmosphere" />
        <MouseGlow />
        <Home onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-black text-zinc-200 font-sans selection:bg-primary/30 selection:text-white overflow-hidden relative">
        <div className="atmosphere" />
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-[0.03] grayscale transition-opacity duration-1000"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-digital-data-interface-background-32616-preview.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="scanline pointer-events-none" />
        <MouseGlow />
        <Sidebar user={user} onLogout={handleLogout} />
        
        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-72 h-full bg-black border-r border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                <SidebarContent user={user} onLogout={handleLogout} closeMenu={() => setIsMenuOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-grow flex flex-col min-w-0 z-10">
          <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-40 px-6 lg:px-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Secure</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">V1.0</span>
              </div>
            </div>
          </header>

          <main className="p-6 lg:p-10 flex-grow overflow-x-hidden custom-scrollbar perspective-2000">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/send" element={<PageWrapper><SendPage /></PageWrapper>} />
                <Route path="/receive" element={<PageWrapper><ReceivePage /></PageWrapper>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;


