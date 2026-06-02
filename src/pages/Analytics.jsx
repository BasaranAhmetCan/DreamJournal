import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDreamContext } from '../context/DreamContext';
import { BarChart2, TrendingUp, Hash, Star, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Analytics = () => {
  const { dreams } = useDreamContext();

  const stats = useMemo(() => {
    const total = dreams.length;
    const favorites = dreams.filter(d => d.isFavorite).length;

    // Etiket Frekansları
    const keywordCounts = {};
    dreams.forEach(d => {
      d.keywords?.forEach(k => {
        keywordCounts[k] = (keywordCounts[k] || 0) + 1;
      });
    });
    
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Ruh Hali Verisi Oluştur (Sentiment bazlı)
    // Tarihe göre grupla
    const dateMap = {};
    dreams.forEach(d => {
      // Sadece Günü ve Ayı al (örn: "10 Mayıs")
      const shortDate = d.date.split(' ').slice(0, 2).join(' ');
      
      let score = 3;
      if (d.moodScore !== undefined) {
        score = d.moodScore;
      } else {
        if (d.sentiment?.toLowerCase() === 'positive' || d.sentiment?.toLowerCase() === 'pozitif') score = 5;
        if (d.sentiment?.toLowerCase() === 'negative' || d.sentiment?.toLowerCase() === 'negatif') score = 1;
      }

      if (!dateMap[shortDate]) {
        dateMap[shortDate] = { count: 0, totalScore: 0 };
      }
      dateMap[shortDate].count += 1;
      dateMap[shortDate].totalScore += score;
    });

    const moodData = Object.entries(dateMap).map(([date, data]) => ({
      date,
      score: data.totalScore / data.count
    }));

    return { total, favorites, topKeywords, moodData };
  }, [dreams]);

  // Özel Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      let moodStr = "Nötr";
      if (score > 3) moodStr = "Pozitif";
      if (score < 3) moodStr = "Negatif";

      return (
        <div className="bg-dream-mid/90 border border-white/10 p-3 rounded-xl backdrop-blur-md">
          <p className="text-white/50 text-xs mb-1">{label}</p>
          <p className="text-dream-accent font-medium text-sm">Puan: {score.toFixed(1)}</p>
          <p className="text-white/80 text-xs">{moodStr}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen w-full bg-dream-dark text-white p-6 pt-12 pb-32">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto flex flex-col gap-8"
      >
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-widest uppercase text-white/90">Analiz</h1>
          <BarChart2 className="text-dream-accent" />
        </header>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center gap-2">
            <Brain size={24} className="text-white/40 mb-2" />
            <span className="text-3xl font-light text-white">{stats.total}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Kayıtlı Rüya</span>
          </div>
          <div className="bg-gradient-to-br from-dream-accent/20 to-transparent border border-dream-accent/10 p-5 rounded-3xl flex flex-col items-center justify-center gap-2 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 text-dream-accent/20">
              <Star size={80} />
            </div>
            <Star size={24} className="text-dream-accent mb-2 relative z-10" />
            <span className="text-3xl font-light text-white relative z-10">{stats.favorites}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/60 relative z-10">Favoriler</span>
          </div>
        </div>

        {/* Ruh Hali Grafiği */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-dream-accent/10 rounded-xl">
              <TrendingUp size={18} className="text-dream-accent" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white/80">Ruh Hali Eğilimi</h2>
              <p className="text-[10px] text-white/40">Zaman içindeki rüya enerjisi</p>
            </div>
          </div>
          
          <div className="h-48 w-full -ml-4">
            {stats.moodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.moodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 5]} ticks={[1, 3, 5]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                Yeterli veri yok.
              </div>
            )}
          </div>
        </div>

        {/* Sık Kullanılan Etiketler */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/5 rounded-xl">
              <Hash size={18} className="text-white/60" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white/80">Bilinçaltı Temaları</h2>
              <p className="text-[10px] text-white/40">En çok tekrar eden semboller</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {stats.topKeywords.length > 0 ? (
              stats.topKeywords.map(([keyword, count], index) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={keyword} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/70 uppercase tracking-wider">{keyword}</span>
                      <span className="text-dream-accent font-medium">{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-white/30 text-xs py-4">Etiket bulunamadı.</div>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Analytics;
