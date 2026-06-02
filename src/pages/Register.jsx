import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Mail, Lock, Calendar, Loader2 } from 'lucide-react';
import { useDreamContext } from '../context/DreamContext';

const Register = () => {
  const navigate = useNavigate();
  const { setUserProfile } = useDreamContext();
  const [formData, setFormData] = useState({ email: '', password: '', dob: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Firebase Auth'ta Kullanıcı Oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Firestore "kullanicilar" koleksiyonuna UID ile kaydet
      const userData = {
        email: formData.email,
        dob: formData.dob,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "kullanicilar", user.uid), userData);

      // Context'i güncelle
      setUserProfile(userData);
      
      // Başarılı olunca ana sayfaya yönlendir
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Kayıt başarısız: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080B14] flex flex-col items-center justify-center relative overflow-hidden px-6">
      
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-dream-accent/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white tracking-widest mb-2">Aramıza Katıl</h1>
          <p className="text-sm text-dream-accent/70 font-light">Bilinçaltının derinliklerini keşfet</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type="email"
              required
              placeholder="E-posta adresiniz"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-dream-accent transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type="password"
              required
              placeholder="Şifreniz (En az 6 karakter)"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-dream-accent transition-colors"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input 
              type="date"
              required
              value={formData.dob}
              onChange={(e) => setFormData({...formData, dob: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-dream-accent transition-colors"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-[10px] text-white/40 mt-1 ml-2">Astrolojik rüya analizi için doğum tarihiniz gereklidir.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full py-4 mt-4 rounded-2xl bg-gradient-to-r from-dream-accent to-blue-600 text-white font-medium shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Kayıt Ol'}
          </motion.button>
        </form>

        <p className="text-center text-xs text-white/50 mt-6">
          Zaten hesabın var mı? {' '}
          <Link to="/login" className="text-dream-accent hover:underline">
            Giriş Yap
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
