import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDreamContext } from '../context/DreamContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { getZodiacSign } from '../utils/zodiac';



// Özel açılır menü bileşeni (Tarayıcının gri menüsünü engellemek için)
const CustomSelect = ({ value, onChange, options, placeholder, flexClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value == value);

  return (
    <div className={`relative ${flexClass}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-dream-accent text-white/80 text-sm flex items-center justify-between transition-colors"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 w-full mt-2 bg-dream-mid border border-white/10 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl scrollbar-thin scrollbar-thumb-white/10"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dream-accent/20 transition-colors ${value == opt.value ? 'bg-dream-accent/40 text-white' : 'text-white/70'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Onboarding = () => {
  const { setUserProfile } = useDreamContext();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && day && month && year) {
      const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const sign = getZodiacSign(parseInt(day), parseInt(month));
      setUserProfile({ name, dob: formattedDate, zodiac: sign });
      navigate('/');
    } else {
      alert("Lütfen tüm alanları doldurun.");
    }
  };

  const dayOptions = [...Array(31)].map((_, i) => ({ value: i + 1, label: `${i + 1}` }));
  const monthOptions = [
    { value: 1, label: "Ocak" }, { value: 2, label: "Şubat" }, { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" }, { value: 5, label: "Mayıs" }, { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" }, { value: 8, label: "Ağustos" }, { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" }, { value: 11, label: "Kasım" }, { value: 12, label: "Aralık" }
  ];
  const yearOptions = [...Array(100)].map((_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: `${y}` };
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-dream-dark via-dream-mid to-dream-light text-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl"
      >
        <h1 className="text-2xl font-light mb-2 text-dream-accent">Hoş Geldiniz.</h1>
        <p className="text-white/50 text-sm font-light mb-8">Rüyalarınızın derinliklerine inmeden önce sizi biraz tanıyalım.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-white/40">Adınız</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-dream-accent transition-colors text-white text-sm"
              placeholder="Size nasıl hitap edelim?"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-white/40">Doğum Tarihiniz</label>
            <div className="flex gap-2 relative">
              <CustomSelect 
                value={day} 
                onChange={setDay} 
                options={dayOptions} 
                placeholder="Gün" 
                flexClass="flex-1" 
              />
              <CustomSelect 
                value={month} 
                onChange={setMonth} 
                options={monthOptions} 
                placeholder="Ay" 
                flexClass="flex-[2]" 
              />
              <CustomSelect 
                value={year} 
                onChange={setYear} 
                options={yearOptions} 
                placeholder="Yıl" 
                flexClass="flex-[1.5]" 
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1">Astrolojik yorumlamalar için burcunuz otomatik hesaplanacaktır.</p>
          </div>

          <button 
            type="submit"
            className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-pure-white font-medium shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all active:scale-95"
          >
            Rüya Alemine Giriş Yap
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
