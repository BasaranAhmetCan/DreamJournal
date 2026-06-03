import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Send, User, LogOut, Settings, Sun, Moon, Bell, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDreamContext } from '../context/DreamContext';
import { getZodiacSign } from '../utils/zodiac';
import { formatAlarmTime } from '../utils/timeFormat';

const PLACEHOLDERS = [
  "Dün gece ne gördün?...",
  "Az önceki uykunda zihninde neler canlandı?...",
  "Rüyanda en çok hangi duygu hakimdi?...",
  "Gündüz uykusunda karşına kimler çıktı?...",
  "Hatırlayabildiğin en tuhaf detay neydi?..."
];

const DREAM_TAGS = ["Kabus", "Bilinçli (Lucid)", "Tekrarlayan", "Uyku Felci", "Huzurlu", "Karmaşık", "Kehanet", "Sıradan", "Nostaljik", "Gerçeküstü"];

const Home = () => {
  const [dreamText, setDreamText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    addDream, 
    userProfile, 
    setUserProfile, 
    firebaseUser,
    theme, 
    toggleTheme, 
    timeFormat, 
    setTimeFormat, 
    reminderSettings, 
    setReminderSettings 
  } = useDreamContext();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatBirthDate = (dobStr) => {
    if (!dobStr) return 'Seçilmedi';
    const parts = dobStr.split('-');
    if (parts.length !== 3) return dobStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${day} ${months[monthIdx]} ${year}`;
  };

  const getDateValues = (dobStr) => {
    const defaultDate = new Date();
    if (!dobStr) {
      return { 
        day: 1, 
        month: 1, 
        year: defaultDate.getFullYear() - 25 
      };
    }
    const parts = dobStr.split('-');
    if (parts.length !== 3) {
      return { 
        day: 1, 
        month: 1, 
        year: defaultDate.getFullYear() - 25 
      };
    }
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10)
    };
  };

  const saveBirthDate = (d, m, y) => {
    const formattedDob = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const newZodiac = getZodiacSign(parseInt(d), parseInt(m));
    setUserProfile(prev => ({ 
      ...prev, 
      dob: formattedDob, 
      zodiac: newZodiac 
    }));
  };

  const dateValues = getDateValues(userProfile?.dob);

  const getPickerValues = (timeStr, format) => {
    if (!timeStr) return { hour: 8, minute: 0, ampm: 'AM' };
    const [hStr, mStr] = timeStr.split(':');
    const h24 = parseInt(hStr, 10);
    const minute = parseInt(mStr, 10);
    
    if (format === '24h') {
      return { hour: h24, minute, ampm: 'AM' };
    } else {
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return { hour: hour12, minute, ampm };
    }
  };

  const savePickerTime = (h, m, ampm, format) => {
    let h24 = parseInt(h, 10);
    const minuteStr = String(m).padStart(2, '0');
    
    if (format === '24h') {
      const hourStr = String(h24).padStart(2, '0');
      setReminderSettings(prev => ({ ...prev, time: `${hourStr}:${minuteStr}` }));
    } else {
      if (ampm === 'AM') {
        if (h24 === 12) h24 = 0;
      } else {
        if (h24 !== 12) h24 = h24 + 12;
      }
      const hourStr = String(h24).padStart(2, '0');
      setReminderSettings(prev => ({ ...prev, time: `${hourStr}:${minuteStr}` }));
    }
  };

  const pickerValues = getPickerValues(reminderSettings.time, timeFormat);
  
  // SpeechRecognition referansı
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Sayfa yüklendiğinde rastgele bir placeholder seç
    const randomIdx = Math.floor(Math.random() * PLACEHOLDERS.length);
    setPlaceholder(PLACEHOLDERS[randomIdx]);

    // Web Speech API Kurulumu
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        // Mevcut metni koruyup üzerine ekleme mantığı daha stabil olabilir ama basitlik adına 
        // sürekli dinlenen metni geçici olarak ekliyoruz.
        // Düzgün bir ekleme için interim sonuçları handle etmek gerekir.
        // Şimdilik basitçe son final sonucu ekleyelim:
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setDreamText(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      if (location.state?.recordImmediately) {
        recognition.start();
        setIsListening(true);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, navigate]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Tarayıcınız ses tanıma özelliğini desteklemiyor.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleLogout = () => {
    setUserProfile(null);
    navigate('/onboarding');
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!dreamText.trim()) return;
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    setIsAnalyzing(true);
    
    try {
      if (!firebaseUser) {
        alert("Oturumunuzun süresi dolmuş veya geçersiz. Lütfen sayfayı yenileyip baştan giriş yapın.");
        localStorage.removeItem('dreamJournalUser');
        window.location.reload();
        return;
      }
      const token = await firebaseUser.getIdToken(true);

      const API_URL = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : '';
      const response = await fetch(`${API_URL}/api/analyze-dream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: dreamText,
          zodiac: userProfile?.zodiac || 'Bilinmiyor'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend'den gelen hata detayı:", errorText);
        alert(`Sunucu Hatası (${response.status}): ${errorText}`);
        throw new Error('API Hatası');
      }
      
      const data = await response.json();
      
      const newDreamId = await addDream({
        text: dreamText,
        // Eğer kullanıcı etiket seçtiyse onları ekle, yoksa yapay zekanın bulduğu anahtar kelimeleri ekle
        keywords: selectedTags.length > 0 ? selectedTags : data.keywords,
        interpretations: {
          classic: data.classic_meaning,
          freud: data.freud_meaning,
          jung: data.jung_meaning,
          islamic: data.islamic_meaning,
          astrological: data.astrological_meaning
        },
        sentiment: data.sentiment,
        moodScore: data.mood_score,
        imagePrompt: data.image_prompt,
        imageUrl: null
      });
      
      navigate(`/dream/${newDreamId}`);
    } catch (error) {
      console.error('Analiz hatası:', error);
      alert('Hata detayı: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-dream-dark via-dream-mid to-dream-light text-white p-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8rem)' }}
    >
      
      {/* Profil Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center gap-3 pt-6 pb-2 relative"
      >
        <div className="flex justify-center items-center w-full relative h-10 px-12">
          <h1 className="text-base font-light text-white/50 tracking-[0.2em] uppercase text-center">
            Rüya Günlüğü
          </h1>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 transition-all duration-300 animate-pulse-slow"
            title="Ayarlar"
          >
            <Settings size={16} />
          </button>
        </div>
        
        {userProfile && (
          <div className="flex items-center gap-2 bg-white/5 pl-4 pr-2 py-2.5 rounded-full border border-white/10 group max-w-[90%]">
            <User size={14} className="text-dream-accent flex-shrink-0" />
            <span className="text-sm font-medium text-white/80 whitespace-normal break-words text-center" style={{ wordBreak: 'break-word' }}>
              {userProfile.name}
            </span>
            <span className="text-xs text-white/50 tracking-widest px-2 border-l border-white/20 ml-1 flex-shrink-0">
              {userProfile.zodiac ? userProfile.zodiac.toLocaleUpperCase('tr-TR') : ''}
            </span>
            <button 
              onClick={handleLogout}
              className="ml-1 p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-400 text-white/40 transition-colors flex-shrink-0"
              title="Çıkış Yap"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center gap-4 mt-2 flex-1"
      >
        
        <div className="relative flex flex-col items-center justify-center w-full mt-2">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 min-h-[150px] justify-center mt-10"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 rounded-full border-t-2 border-r-2 border-dream-accent flex items-center justify-center"
                >
                  <Sparkles className="text-dream-accent" size={28} />
                </motion.div>
                <p className="text-dream-accent/80 font-light tracking-widest text-sm animate-pulse">
                  YAPAY ZEKA YORUMLUYOR...
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="input-area"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full relative flex flex-col gap-4"
              >
                <div className="flex items-center justify-between w-full px-2">
                  <p className="text-sm text-white/40 font-light">
                    {isListening ? "Dinleniyor..." : "Rüyanızı yazın veya sesli anlatın."}
                  </p>
                  <button 
                    onClick={toggleListening}
                    className={`p-3 rounded-full transition-all duration-300 ${
                      isListening 
                      ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' 
                      : 'bg-dream-accent/20 text-dream-accent hover:bg-dream-accent/40'
                    }`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
                
                <div className="relative group w-full">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-dream-accent/0 via-dream-accent/0 to-dream-accent/0 rounded-3xl blur opacity-0 group-focus-within:opacity-20 group-focus-within:via-dream-accent/40 transition-all duration-700 pointer-events-none" />
                  <textarea
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    disabled={isAnalyzing}
                    placeholder={placeholder}
                    className="
                      relative w-full h-56 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 
                      text-white/90 placeholder-white/20 outline-none resize-none backdrop-blur-xl 
                      transition-all duration-500 focus:border-dream-accent/50 focus:bg-white/[0.04] 
                      shadow-inner font-light text-lg leading-relaxed
                      scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent
                    "
                  />
                  
                  <AnimatePresence>
                    {dreamText.trim().length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] text-pure-white"
                      >
                        <Send size={20} className="ml-1" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2 px-1">
                  {DREAM_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300 ${
                        selectedTags.includes(tag)
                        ? 'bg-dream-accent text-white border border-dream-accent'
                        : 'bg-white/[0.03] text-white/50 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-dream-mid border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col gap-6 text-white"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-dream-accent/20 rounded-full blur-3xl pointer-events-none" />
              
              <header className="flex justify-between items-center relative z-10">
                <h2 className="text-lg font-light tracking-wider uppercase text-white/90">Ayarlar</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 transition-colors"
                >
                  <X size={14} />
                </button>
              </header>
              
              <div className="relative z-10 flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
                
                {/* Name & Birthday Info */}
                <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-xs uppercase tracking-widest text-white/40 font-medium">Profil Bilgileri</h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/50 font-light">Adınız</label>
                    <input 
                      type="text"
                      value={userProfile?.name || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-dream-dark/50 dark:bg-black/20 border border-dream-light dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-dream-accent transition-colors text-sm text-white/90"
                      placeholder="Adınız"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-white/50 font-light">Doğum Gününüz</label>
                      <button 
                        type="button"
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                        className="bg-dream-accent/15 border border-dream-accent/30 text-dream-accent rounded-xl px-4 py-2 text-sm font-semibold hover:bg-dream-accent/25 transition-all duration-300 shadow-sm"
                      >
                        {formatBirthDate(userProfile?.dob)}
                      </button>
                    </div>

                    {isDatePickerOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 bg-dream-light/30 dark:bg-black/20 border border-dream-light/50 dark:border-white/5 p-3 rounded-2xl justify-center items-center mt-1"
                      >
                        {/* Day Select */}
                        <select 
                          value={dateValues.day} 
                          onChange={(e) => saveBirthDate(e.target.value, dateValues.month, dateValues.year)}
                          className="bg-dream-dark/50 dark:bg-dream-mid border border-dream-light dark:border-white/10 rounded-xl px-2 py-1.5 text-xs outline-none text-white/90 focus:border-dream-accent cursor-pointer"
                          style={{ colorScheme: theme }}
                        >
                          {[...Array(31).keys()].map(d => (
                            <option 
                              key={d + 1} 
                              value={d + 1}
                              style={{ backgroundColor: theme === 'light' ? '#E4D9EE' : '#0E0D1F', color: theme === 'light' ? '#160826' : '#ffffff' }}
                            >
                              {String(d + 1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>

                        {/* Month Select */}
                        <select 
                          value={dateValues.month} 
                          onChange={(e) => saveBirthDate(dateValues.day, e.target.value, dateValues.year)}
                          className="bg-dream-dark/50 dark:bg-dream-mid border border-dream-light dark:border-white/10 rounded-xl px-2 py-1.5 text-xs outline-none text-white/90 focus:border-dream-accent cursor-pointer"
                          style={{ colorScheme: theme }}
                        >
                          {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((m, idx) => (
                            <option 
                              key={idx + 1} 
                              value={idx + 1}
                              style={{ backgroundColor: theme === 'light' ? '#E4D9EE' : '#0E0D1F', color: theme === 'light' ? '#160826' : '#ffffff' }}
                            >
                              {m}
                            </option>
                          ))}
                        </select>

                        {/* Year Select */}
                        <select 
                          value={dateValues.year} 
                          onChange={(e) => saveBirthDate(dateValues.day, dateValues.month, e.target.value)}
                          className="bg-dream-dark/50 dark:bg-dream-mid border border-dream-light dark:border-white/10 rounded-xl px-2 py-1.5 text-xs outline-none text-white/90 focus:border-dream-accent cursor-pointer"
                          style={{ colorScheme: theme }}
                        >
                          {[...Array(100).keys()].map(i => {
                            const y = new Date().getFullYear() - i;
                            return (
                              <option 
                                key={y} 
                                value={y}
                                style={{ backgroundColor: theme === 'light' ? '#E4D9EE' : '#0E0D1F', color: theme === 'light' ? '#160826' : '#ffffff' }}
                              >
                                {y}
                              </option>
                            );
                          })}
                        </select>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Preferences: Theme & Time Format */}
                <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-xs uppercase tracking-widest text-white/40 font-medium">Uygulama Tercihleri</h3>
                  
                  {/* Theme Row */}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-white/80">Tema</span>
                      <span className="text-[10px] text-white/40">Görünüm stilini değiştirin</span>
                    </div>
                    <button 
                      type="button"
                      onClick={toggleTheme}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dream-accent/20 border border-dream-accent/30 hover:bg-dream-accent/30 text-dream-accent text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                      <span>{theme === 'dark' ? 'Koyu' : 'Açık'}</span>
                    </button>
                  </div>

                  {/* Time Format Row */}
                  <div className="flex justify-between items-center py-1 border-t border-white/5 pt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-white/80">Zaman Sistemi</span>
                      <span className="text-[10px] text-white/40">Alarm gösterim formatı</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setTimeFormat(prev => prev === '24h' ? '12h' : '24h')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-dream-accent/20 border border-dream-accent/30 hover:bg-dream-accent/30 text-dream-accent text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      <span>{timeFormat === '24h' ? '24 Saat' : '12 Saat'}</span>
                    </button>
                  </div>
                </div>

                {/* Daily Reminder Settings */}
                <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-0.5 font-sans">
                      <h3 className="text-xs uppercase tracking-widest text-white/40 font-medium">Rüya Hatırlatıcı</h3>
                      <span className="text-[10px] text-white/40">Her sabah rüyanızı hatırlatır</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={reminderSettings.active}
                      onChange={(e) => setReminderSettings(prev => ({ ...prev, active: e.target.checked }))}
                      className="w-4 h-4 accent-dream-accent cursor-pointer"
                    />
                  </div>
                  
                  {reminderSettings.active && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-white/50 font-light flex items-center gap-1.5">
                          <Bell size={12} className="text-dream-accent" />
                          Bildirim Saati
                        </label>
                        <button 
                          type="button"
                          onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                          className="bg-dream-accent/15 border border-dream-accent/30 text-dream-accent rounded-xl px-4 py-2 text-sm font-semibold hover:bg-dream-accent/25 transition-all duration-300 shadow-sm"
                        >
                          {formatAlarmTime(reminderSettings.time, timeFormat)}
                        </button>
                      </div>

                      {isTimePickerOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-2 bg-dream-light/30 dark:bg-black/20 border border-dream-light/50 dark:border-white/5 p-3 rounded-2xl justify-center items-center mt-1"
                        >
                          {/* Hour Select */}
                          <select 
                            value={pickerValues.hour} 
                            onChange={(e) => savePickerTime(e.target.value, pickerValues.minute, pickerValues.ampm, timeFormat)}
                            className="bg-dream-dark/50 dark:bg-dream-mid border border-dream-light dark:border-white/10 rounded-xl px-3 py-1.5 text-sm outline-none text-white/90 focus:border-dream-accent cursor-pointer"
                            style={{ colorScheme: theme }}
                          >
                            {(timeFormat === '24h' ? [...Array(24).keys()] : [...Array(12).keys()].map(i => i + 1)).map(h => (
                              <option 
                                key={h} 
                                value={h}
                                style={{ backgroundColor: theme === 'light' ? '#E4D9EE' : '#0E0D1F', color: theme === 'light' ? '#160826' : '#ffffff' }}
                              >
                                {String(h).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          
                          <span className="text-white/50 font-medium">:</span>
                          
                          {/* Minute Select */}
                          <select 
                            value={pickerValues.minute} 
                            onChange={(e) => savePickerTime(pickerValues.hour, e.target.value, pickerValues.ampm, timeFormat)}
                            className="bg-dream-dark/50 dark:bg-dream-mid border border-dream-light dark:border-white/10 rounded-xl px-3 py-1.5 text-sm outline-none text-white/90 focus:border-dream-accent cursor-pointer"
                            style={{ colorScheme: theme }}
                          >
                            {[...Array(60).keys()].map(m => (
                              <option 
                                key={m} 
                                value={m}
                                style={{ backgroundColor: theme === 'light' ? '#E4D9EE' : '#0E0D1F', color: theme === 'light' ? '#160826' : '#ffffff' }}
                              >
                                {String(m).padStart(2, '0')}
                              </option>
                            ))}
                          </select>

                          {/* AM/PM Switcher */}
                          {timeFormat === '12h' && (
                            <button
                              type="button"
                              onClick={() => savePickerTime(pickerValues.hour, pickerValues.minute, pickerValues.ampm === 'AM' ? 'PM' : 'AM', timeFormat)}
                              className="px-3 py-1.5 rounded-xl bg-dream-accent/25 border border-dream-accent/35 text-dream-accent text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-dream-accent/35"
                            >
                              {pickerValues.ampm}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
