import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  isNativePlatform, 
  scheduleNativeAlarm, 
  cancelNativeAlarm, 
  rescheduleAllAlarms,
  scheduleReminderNotification 
} from '../utils/nativeAlarm';
import { formatAlarmTime } from '../utils/timeFormat';

// Firebase imports
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

const DreamContext = createContext();

export const useDreamContext = () => useContext(DreamContext);

export const DreamProvider = ({ children }) => {
  // --- Kullanıcı ve Firebase Auth ---
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // --- Rüyalar ---
  const [dreams, setDreams] = useState([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Kullanıcı giriş yaptı, Firestore'dan bilgilerini çek
        const docRef = doc(db, "kullanicilar", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setUserProfile({ email: user.email });
        }
      } else {
        // Çıkış yaptı
        setUserProfile(null);
        setDreams([]); // Rüyaları temizle
      }
    });

    return () => unsubscribe();
  }, []);

  // Rüyaları Firestore'dan Dinle (Real-time)
  useEffect(() => {
    if (!firebaseUser) return;

    const q = collection(db, `kullanicilar/${firebaseUser.uid}/ruyalar`);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dreamsArray = [];
      querySnapshot.forEach((docSnap) => {
        dreamsArray.push({ id: docSnap.id, ...docSnap.data() });
      });
      // ID'ye (Date.now) veya date'e göre azalan sıralama
      dreamsArray.sort((a, b) => b.id.localeCompare(a.id));
      setDreams(dreamsArray);
    }, (error) => {
      console.error("Firestore rüya çekme hatası:", error);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // --- Çoklu Alarmlar (Cihaza özel olduğu için localStorage'da tutulur) ---
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem('dreamAI_alarms');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Tema Ayarı ---
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dreamAI_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('dreamAI_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- Zaman Formatı Ayarı ---
  const [timeFormat, setTimeFormat] = useState(() => {
    return localStorage.getItem('dreamAI_timeFormat') || '24h';
  });

  // --- Günlük Hatırlatıcı Ayarları ---
  const [reminderSettings, setReminderSettings] = useState(() => {
    const saved = localStorage.getItem('dreamAI_reminderSettings');
    return saved ? JSON.parse(saved) : { active: false, time: '08:00' };
  });

  useEffect(() => {
    localStorage.setItem('dreamAI_timeFormat', timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    localStorage.setItem('dreamAI_reminderSettings', JSON.stringify(reminderSettings));

    if (isNativePlatform()) {
      scheduleReminderNotification(reminderSettings);
    } else {
      if (reminderSettings.active && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('📝 Rüya Hatırlatıcısı', {
            body: `Rüya hatırlatıcınız her gün saat ${formatAlarmTime(reminderSettings.time, timeFormat)} için aktif edildi! ✨`,
            icon: '/favicon.svg'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('📝 Rüya Hatırlatıcısı', {
                body: `Rüya hatırlatıcınız her gün saat ${formatAlarmTime(reminderSettings.time, timeFormat)} için aktif edildi! ✨`,
              });
            }
          });
        }
      }
    }
  }, [reminderSettings, timeFormat]);

  useEffect(() => {
    localStorage.setItem('dreamAI_alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    if (isNativePlatform() && alarms.length > 0) {
      rescheduleAllAlarms(alarms);
    }
  }, []);

  // Yeni rüya ekleme (Firestore'a yazar)
  const addDream = async (dreamData) => {
    if (!firebaseUser) return null;
    const newId = Date.now().toString();
    const newDream = {
      date: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }),
      ...dreamData,
      isFavorite: false
    };
    
    // Firestore'a kaydet (onSnapshot hook'u sayesinde `dreams` state'i otomatik güncellenecek)
    await setDoc(doc(db, `kullanicilar/${firebaseUser.uid}/ruyalar`, newId), newDream);
    return newId;
  };

  const toggleFavorite = async (id) => {
    if (!firebaseUser) return;
    const dream = dreams.find(d => d.id === id);
    if (dream) {
      await setDoc(doc(db, `kullanicilar/${firebaseUser.uid}/ruyalar`, id), { 
        ...dream, 
        isFavorite: !dream.isFavorite 
      });
    }
  };
  
  const setImageForDream = async (id, imageUrl) => {
    if (!firebaseUser) return;
    const dream = dreams.find(d => d.id === id);
    if (dream) {
      await setDoc(doc(db, `kullanicilar/${firebaseUser.uid}/ruyalar`, id), { 
        ...dream, 
        imageUrl 
      });
    }
  };

  const deleteDream = async (id) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, `kullanicilar/${firebaseUser.uid}/ruyalar`, id));
  };

  // Alarm Fonksiyonları
  const addAlarm = (time, sound = 'gentle') => {
    const newAlarm = { id: Date.now().toString(), time, active: true, sound };
    setAlarms(prev => [...prev, newAlarm]);
    if (isNativePlatform()) {
      scheduleNativeAlarm(newAlarm);
    }
  };

  const updateAlarmSound = (id, sound) => {
    setAlarms(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, sound } : a);
      if (isNativePlatform()) {
        const alarm = updated.find(a => a.id === id);
        if (alarm && alarm.active) {
          scheduleNativeAlarm(alarm);
        }
      }
      return updated;
    });
  };

  const toggleAlarm = (id) => {
    setAlarms(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, active: !a.active } : a);
      if (isNativePlatform()) {
        const alarm = updated.find(a => a.id === id);
        if (alarm) {
          if (alarm.active) {
            scheduleNativeAlarm(alarm);
          } else {
            cancelNativeAlarm(alarm.id);
          }
        }
      }
      return updated;
    });
  };

  const removeAlarm = (id) => {
    if (isNativePlatform()) {
      cancelNativeAlarm(id);
    }
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  return (
    <DreamContext.Provider value={{
      userProfile, setUserProfile,
      firebaseUser,
      dreams, addDream, toggleFavorite, setImageForDream, deleteDream,
      alarms, addAlarm, toggleAlarm, removeAlarm, updateAlarmSound,
      theme, toggleTheme,
      timeFormat, setTimeFormat,
      reminderSettings, setReminderSettings
    }}>
      {children}
    </DreamContext.Provider>
  );
};
