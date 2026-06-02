import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Mic, Calendar, BarChart2, AlarmClock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-dream-dark text-white font-sans selection:bg-dream-accent/30 selection:text-white">
      <main className="flex-1 w-full pb-24 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-dream-accent/30">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 w-full h-20 bg-dream-mid/80 backdrop-blur-lg border-t border-white/5 flex justify-center items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center w-full max-w-md px-6">
          
          <NavLink to="/journal" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-dream-accent scale-110' : 'text-white/40 hover:text-white/70'}`}>
            <Calendar size={22} strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-widest font-light">Günlük</span>
          </NavLink>

          <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-dream-accent scale-110' : 'text-white/40 hover:text-white/70'}`}>
            <BarChart2 size={22} strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-widest font-light">Analiz</span>
          </NavLink>

          <NavLink to="/" className={({ isActive }) => `relative flex flex-col items-center justify-center transition-all duration-300 -mt-8 ${isActive ? 'scale-110' : 'hover:scale-105'}`}>
            {({ isActive }) => (
              <>
                <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 ${isActive ? 'bg-dream-accent/50 opacity-100' : 'bg-white/10 opacity-0'}`} />
                <div className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-500 ${isActive ? 'bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-pure-white shadow-[0_0_30px_rgba(139,92,246,0.4)]' : 'bg-dream-light border border-white/10 text-white/50'}`}>
                  <Mic size={24} strokeWidth={isActive ? 2 : 1.5} />
                </div>
              </>
            )}
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-dream-accent scale-110' : 'text-white/40 hover:text-white/70'}`}>
            <Sparkles size={22} strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-widest font-light">İçgörü</span>
          </NavLink>

          <NavLink to="/alarm" className={({ isActive }) => `flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-dream-accent scale-110' : 'text-white/40 hover:text-white/70'}`}>
            <AlarmClock size={22} strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-widest font-light">Alarm</span>
          </NavLink>
          
        </div>
      </nav>
    </div>
  );
};

export default Layout;
