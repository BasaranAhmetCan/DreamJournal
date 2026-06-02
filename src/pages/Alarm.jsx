import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDreamContext } from '../context/DreamContext';
import { Bell, BellOff, Plus, Trash2, Play, Volume2, ChevronDown, ChevronUp, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALARM_SOUNDS, previewAlarmSound, stopAlarmSound } from '../utils/alarmSounds';
import { formatAlarmTime } from '../utils/timeFormat';

const SoundSelector = ({ selectedSound, onSelect, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState(null);

  const selected = ALARM_SOUNDS.find(s => s.id === selectedSound) || ALARM_SOUNDS[0];

  const handlePreview = (e, soundId) => {
    e.stopPropagation();
    if (previewingId === soundId) {
      stopAlarmSound();
      setPreviewingId(null);
    } else {
      setPreviewingId(soundId);
      previewAlarmSound(soundId);
      setTimeout(() => setPreviewingId(null), 3500);
    }
  };

  const handleSelect = (soundId) => {
    onSelect(soundId);
    setIsOpen(false);
    stopAlarmSound();
    setPreviewingId(null);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-xs bg-dream-accent/10 text-dream-accent px-2.5 py-1.5 rounded-full hover:bg-dream-accent/20 transition-colors"
        >
          <Music size={12} />
          <span>{selected.emoji}</span>
          {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-56 bg-dream-mid border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            >
              {ALARM_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSelect(sound.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    sound.id === selectedSound
                      ? 'bg-dream-accent/20 text-dream-accent'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{sound.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sound.name}</p>
                  </div>
                  <button
                    onClick={(e) => handlePreview(e, sound.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      previewingId === sound.id
                        ? 'bg-dream-accent text-white animate-pulse'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    <Volume2 size={12} />
                  </button>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-white/40">Alarm Sesi</p>
      <div className="grid grid-cols-2 gap-2">
        {ALARM_SOUNDS.map((sound) => (
          <motion.div
            key={sound.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(sound.id)}
            role="button"
            tabIndex={0}
            className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
              sound.id === selectedSound
                ? 'bg-dream-accent/15 border-dream-accent/40 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
            }`}
          >
            <span className="text-xl">{sound.emoji}</span>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-sm font-medium truncate ${sound.id === selectedSound ? 'text-dream-accent' : 'text-white/80'}`}>
                {sound.name}
              </p>
              <p className="text-[10px] text-white/30 truncate">{sound.description}</p>
            </div>
            <button
              onClick={(e) => handlePreview(e, sound.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                previewingId === sound.id
                  ? 'bg-dream-accent text-white scale-110 shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                  : 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/60'
              }`}
            >
              {previewingId === sound.id ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                  <Volume2 size={14} />
                </motion.div>
              ) : (
                <Play size={12} />
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Alarm = () => {
  const { alarms, addAlarm, toggleAlarm, removeAlarm, updateAlarmSound, theme, timeFormat } = useDreamContext();
  const [newTime, setNewTime] = useState('07:00');
  const [selectedSound, setSelectedSound] = useState('gentle');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const navigate = useNavigate();

  const getPickerValues = (timeStr, format) => {
    if (!timeStr) return { hour: 7, minute: 0, ampm: 'AM' };
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
      setNewTime(`${hourStr}:${minuteStr}`);
    } else {
      if (ampm === 'AM') {
        if (h24 === 12) h24 = 0;
      } else {
        if (h24 !== 12) h24 = h24 + 12;
      }
      const hourStr = String(h24).padStart(2, '0');
      setNewTime(`${hourStr}:${minuteStr}`);
    }
  };

  const pickerValues = getPickerValues(newTime, timeFormat);

  const handleAddAlarm = () => {
    addAlarm(newTime, selectedSound);
    setIsTimePickerOpen(false);
  };

  const triggerMockAlarm = () => {
    navigate('/alarm-ringing', { state: { sound: selectedSound } });
  };

  return (
    <div className="min-h-screen w-full bg-dream-dark text-white p-6 pt-12 pb-32">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto flex flex-col gap-8"
      >
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-widest uppercase text-white/90">Alarmlar</h1>
          <button onClick={triggerMockAlarm} className="text-xs flex items-center gap-1 bg-dream-accent/20 text-dream-accent px-3 py-1.5 rounded-full hover:bg-dream-accent/40 transition">
            <Play size={12} /> Test Et
          </button>
        </header>

        {/* Yeni Alarm Ekleme */}
        <div className="flex flex-col gap-5 p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-dream-accent/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-4 w-full">
            <button 
              type="button"
              onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
              className="flex-1 bg-dream-accent/15 border border-dream-accent/30 text-dream-accent rounded-xl py-3 text-lg font-semibold hover:bg-dream-accent/25 transition-all duration-300 shadow-sm"
            >
              {formatAlarmTime(newTime, timeFormat)}
            </button>
            
            <button 
              onClick={handleAddAlarm}
              className="w-14 h-14 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-pure-white shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>

          {isTimePickerOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 flex gap-2 bg-dream-light/30 dark:bg-black/20 border border-dream-light/50 dark:border-white/5 p-3 rounded-2xl justify-center items-center"
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
          
          {/* Ses Seçici */}
          <div className="relative z-10">
            <SoundSelector selectedSound={selectedSound} onSelect={setSelectedSound} />
          </div>
        </div>

        {/* Alarm Listesi */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-2">Kayıtlı Alarmlar</h2>
          <AnimatePresence>
            {alarms.length === 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-light text-white/30 text-center py-4">
                Henüz alarm kurulmadı.
              </motion.p>
            )}
            {alarms.map((alarm) => (
              <motion.div
                key={alarm.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                  alarm.active 
                    ? 'bg-dream-accent/10 border-dream-accent/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                    : 'bg-white/[0.01] border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleAlarm(alarm.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${alarm.active ? 'bg-dream-accent text-pure-white' : 'bg-white/10 text-white/50'}`}
                  >
                    {alarm.active ? <Bell size={18} /> : <BellOff size={18} />}
                  </button>
                  <div className="flex flex-col">
                    <span className={`text-3xl font-light ${alarm.active ? 'text-white' : 'text-white/50'}`}>
                      {formatAlarmTime(alarm.time, timeFormat)}
                    </span>
                    <span className="text-[10px] text-white/30 mt-0.5">
                      {(ALARM_SOUNDS.find(s => s.id === alarm.sound) || ALARM_SOUNDS[0]).emoji}{' '}
                      {(ALARM_SOUNDS.find(s => s.id === alarm.sound) || ALARM_SOUNDS[0]).name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <SoundSelector 
                    selectedSound={alarm.sound || 'gentle'} 
                    onSelect={(sound) => updateAlarmSound(alarm.id, sound)}
                    compact 
                  />
                  <button 
                    onClick={() => removeAlarm(alarm.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
};

export default Alarm;
