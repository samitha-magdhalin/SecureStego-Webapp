import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Fingerprint, AlertTriangle, Send, Download, Activity, Database, Clock, Zap, Globe, Lock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DashboardData } from '../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(98.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => {
        const change = (Math.random() - 0.5) * 0.2;
        return Math.min(100, Math.max(95, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('stego_token');
        const response = await axios.get('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
      <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Syncing...</div>
    </div>
  );
  
  if (!data) return <div className="text-red-500 p-8 text-center font-bold">Error loading data</div>;

  const chartData = [
    { name: '00:00', sent: 12, received: 8, alerts: 1 },
    { name: '04:00', sent: 18, received: 14, alerts: 0 },
    { name: '08:00', sent: 45, received: 32, alerts: 2 },
    { name: '12:00', sent: 30, received: 28, alerts: 1 },
    { name: '16:00', sent: 65, received: 50, alerts: 3 },
    { name: '20:00', sent: 40, received: 35, alerts: 1 },
    { name: '23:59', sent: 20, received: 18, alerts: 0 },
  ];

  return (
    <div className="space-y-12 relative">
      {/* Hero Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-72 rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl group"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1920" 
            alt="Dashboard Banner" 
            className="w-full h-full object-cover opacity-30 grayscale brightness-50 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-12 h-full flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(99,102,241,1)] animate-pulse" />
             <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">System Status: Operational</span>
          </div>
          <h1 className="text-7xl font-bold text-white tracking-tighter text-glow font-serif italic">
            Central <br />
            <span className="text-primary not-italic font-sans uppercase text-3xl tracking-[0.5em] block mt-4">Hub</span>
          </h1>
        </div>
        
        <div className="absolute top-10 right-10 flex gap-4 z-10">
          <div className="bg-black/60 backdrop-blur-2xl px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl">
            <Activity size={20} className="text-primary animate-pulse" />
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Core Integrity</div>
              <div className="text-sm font-bold text-white font-mono">{health.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Created', value: data.stats.totalSent, icon: <Send size={28} />, color: 'text-primary', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', sub: 'Messages Encrypted' },
          { label: 'Opened', value: data.stats.totalReceived, icon: <Download size={28} />, color: 'text-blue-400', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800', sub: 'Decrypted Logs' },
          { label: 'Alerts', value: data.stats.alertCount, icon: <AlertTriangle size={28} />, color: 'text-rose-500', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800', sub: 'Security Threats' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative h-64 bg-surface p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden card-3d"
          >
            <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-all duration-700">
               <img src={stat.img} alt={stat.label} className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500 border border-white/10 shadow-inner backdrop-blur-md`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mb-2">{stat.label}</div>
                <div className="text-6xl font-bold text-white tracking-tighter leading-none mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.sub}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-3 bg-surface/40 backdrop-blur-xl border border-white/5 p-10 rounded-[3rem] shadow-2xl card-3d">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight font-serif italic">Platform <span className="not-italic text-primary">Usage</span></h3>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Messages over time</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-zinc-500 border border-white/5">24H</div>
              <div className="px-3 py-1 bg-primary text-black rounded-full text-[9px] font-bold shadow-lg shadow-primary/20">LIVE</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#ffffff03" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#52525b" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '16px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#6366F1" fillOpacity={1} fill="url(#colorSent)" strokeWidth={4} />
                <Area type="monotone" dataKey="received" stroke="#ffffff" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorReceived)" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts List */}
        <div className="lg:col-span-2 bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl flex flex-col card-3d">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Alerts</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Threat Detection</p>
            </div>
          </div>
          <div className="space-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {data.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 opacity-40">
                <Fingerprint size={40} strokeWidth={1.5} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Clear</p>
              </div>
            ) : (
              data.alerts.map((alert, i) => (
                <motion.div 
                  key={alert.id} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 bg-white/2 border border-white/5 rounded-2xl hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">{alert.type}</div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                      alert.severity === 'high' ? 'bg-red-500 text-white' : 'bg-primary/20 text-primary'
                    }`}>
                      {alert.severity}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed mb-3">{alert.message}</div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-medium">
                    <Clock size={10} />
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Blockchain Logs */}
      <div className="bg-surface border border-white/5 p-12 rounded-[3.5rem] shadow-2xl card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/5">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tighter uppercase">Recent Logs</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">History of actions</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Verified</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr>
                <th className="px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">#</th>
                <th className="px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                <th className="px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hash</th>
                <th className="px-6 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.blocks?.map((block) => {
                let blockData: any = {};
                try {
                  blockData = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;
                } catch (e) {
                  console.error('Failed to parse block data', e);
                }
                return (
                  <tr key={block.id} className="group cursor-default">
                    <td className="px-6 py-6 bg-white/2 rounded-l-3xl border-y border-l border-white/5 group-hover:bg-white/5 transition-colors">
                      <span className="text-xs font-bold text-primary">#{block.block_index}</span>
                    </td>
                    <td className="px-6 py-6 bg-white/2 border-y border-white/5 group-hover:bg-white/5 transition-colors">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        blockData.action === 'SEND' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'
                      }`}>
                        {blockData.action}
                      </span>
                    </td>
                    <td className="px-6 py-6 bg-white/2 border-y border-white/5 group-hover:bg-white/5 transition-colors">
                      <div className="text-xs font-bold text-white mb-1">
                        {blockData.sender ? blockData.sender : blockData.user}
                      </div>
                      {blockData.receiver && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <ChevronRight size={10} /> {blockData.receiver}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6 bg-white/2 border-y border-white/5 group-hover:bg-white/5 transition-colors">
                      <div className="text-[10px] font-mono text-slate-400 truncate w-40 group-hover:text-slate-300 transition-colors" title={block.hash}>
                        {block.hash}
                      </div>
                    </td>
                    <td className="px-6 py-6 bg-white/2 rounded-r-3xl border-y border-r border-white/5 group-hover:bg-white/5 transition-colors">
                      <div className="text-xs text-slate-400 font-medium">
                        {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(block.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

