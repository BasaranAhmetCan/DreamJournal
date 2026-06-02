import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDreamContext } from '../context/DreamContext';
import { Calendar as CalendarIcon, ChevronRight, Star, Trash2, ChevronLeft } from 'lucide-react';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const Journal = () => {
  const navigate = useNavigate();
  const { dreams, toggleFavorite, deleteDream } = useDreamContext();
  
  // Takvim Durumu
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Mayıs 2026 varsayılan (mock data'ya uyumlu)
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  const currentMonthIdx = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Takvim hesaplamaları
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1).getDay(); // 0: Pazar, 1: Pzt
  
  // Pazartesi'den başlamak için kaydırma
  const shift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Ay değiştirme
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonthIdx - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonthIdx + 1, 1));

  // O gün için rüya var mı kontrolü
  const hasDreamOnDate = (day) => {
    const dateStr = `${day} ${MONTHS[currentMonthIdx]} ${currentYear}`;
    return dreams.some(d => d.date === dateStr);
  };

  const toggleSelectDate = (day) => {
    const dateStr = `${day} ${MONTHS[currentMonthIdx]} ${currentYear}`;
    if (selectedDateStr === dateStr) {
      setSelectedDateStr(null); // Seçimi kaldır
    } else {
      setSelectedDateStr(dateStr);
    }
  };

  // Listeyi filtrele
  const filteredDreams = useMemo(() => {
    if (!selectedDateStr) return dreams;
    return dreams.filter(d => d.date === selectedDateStr);
  }, [dreams, selectedDateStr]);

  return (
    <div className="min-h-screen w-full bg-dream-dark text-white p-6 pt-12 pb-32">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto flex flex-col gap-8"
      >
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-widest uppercase text-white/90">Günlük</h1>
          <CalendarIcon className="text-dream-accent" />
        </header>

        {/* Dinamik Takvim */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="p-1 hover:text-dream-accent text-white/50 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium tracking-wider text-white/80">
              {MONTHS[currentMonthIdx]} {currentYear}
            </span>
            <button onClick={nextMonth} className="p-1 hover:text-dream-accent text-white/50 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-y-3 text-center text-xs font-light text-white/30 mb-2">
            <div>Pt</div><div>Sa</div><div>Ça</div><div>Pe</div><div>Cu</div><div>Ct</div><div>Pz</div>
          </div>
          
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
            {/* Boş hücreler */}
            {[...Array(shift)].map((_, i) => (
              <div key={`empty-${i}`} className="py-2 opacity-10"></div>
            ))}
            
            {/* Günler */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const hasDream = hasDreamOnDate(day);
              const dateStr = `${day} ${MONTHS[currentMonthIdx]} ${currentYear}`;
              const isSelected = selectedDateStr === dateStr;

              return (
                <div 
                  key={day} 
                  onClick={() => hasDream ? toggleSelectDate(day) : null}
                  className={`
                    relative py-2 mx-1 rounded-lg transition-all 
                    ${hasDream ? 'cursor-pointer text-white/90' : 'text-white/30 cursor-default'}
                    ${isSelected ? 'bg-dream-accent text-pure-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.4)]' : ''}
                    ${hasDream && !isSelected ? 'hover:bg-white/10' : ''}
                  `}
                >
                  {day}
                  {hasDream && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-dream-accent rounded-full shadow-[0_0_5px_rgba(139,92,246,1)]"></span>
                  )}
                </div>
              );
            })}
          </div>
          
          {selectedDateStr && (
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-white/50">
              <span>Seçili: <strong className="text-dream-accent font-medium">{selectedDateStr}</strong></span>
              <button onClick={() => setSelectedDateStr(null)} className="text-white/30 hover:text-white/80 underline decoration-white/20">Filtreyi Temizle</button>
            </div>
          )}
        </div>

        {/* Rüyalar Listesi */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xs uppercase tracking-widest text-white/40">
              {selectedDateStr ? 'FİLTRELENEN KAYITLAR' : 'TÜM KAYITLAR'}
            </h2>
            <span className="text-[10px] text-white/30">{filteredDreams.length} Adet</span>
          </div>
          
          <AnimatePresence>
            {filteredDreams.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-10 text-white/30 text-sm font-light"
              >
                Bu tarihe ait bir rüya kaydı bulunmuyor.
              </motion.div>
            ) : (
              filteredDreams.map((dream, i) => (
                <motion.div
                  key={dream.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/dream/${dream.id}`)}
                  className="group relative flex items-center justify-between p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-dream-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col gap-2 flex-1 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white/80">{dream.date}</span>
                    </div>
                    <p className="text-sm font-light text-white/50 line-clamp-1">{dream.text}</p>
                    <div className="flex gap-2 mt-1">
                      {dream.keywords?.slice(0,2).map(k => (
                        <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-dream-accent/10 text-dream-accent border border-dream-accent/20">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(dream.id); }}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Star size={16} className={dream.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-white/30"} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteDream(dream.id); }}
                      className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-400 text-white/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Journal;
