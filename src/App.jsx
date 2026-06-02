import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

import { DreamProvider, useDreamContext } from './context/DreamContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import DreamDetail from './pages/DreamDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Alarm from './pages/Alarm';
import AlarmRinging from './pages/AlarmRinging';
import { 
  requestNotificationPermission, 
  addNotificationClickListener, 
  registerAlarmActions,
  isNativePlatform
} from './utils/nativeAlarm';

const AuthWrapper = ({ children }) => {
  const { userProfile } = useDreamContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userProfile && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    }
  }, [userProfile, navigate, location]);

  return children;
};

// Web tarayıcısında alarm zamanlayıcısı (native'de LocalNotifications kullanılır)
const AlarmScheduler = () => {
  const { alarms } = useDreamContext();
  const navigate = useNavigate();
  const location = useLocation();
  const firedAlarmsRef = useRef(new Set());

  useEffect(() => {
    // Native platformda bu scheduler çalışmasın — native notifications halleder
    if (isNativePlatform()) return;
    // Zaten alarm çalma ekranındaysa kontrol etme
    if (location.pathname === '/alarm-ringing') return;

    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDateStr = now.toDateString(); // Günlük bazda tetiklemeyi sınırlamak için
      
      const matchingAlarm = alarms.find(a => 
        a.active && 
        a.time === currentTime && 
        !firedAlarmsRef.current.has(`${a.id}-${currentDateStr}-${currentTime}`)
      );
      
      if (matchingAlarm) {
        firedAlarmsRef.current.add(`${matchingAlarm.id}-${currentDateStr}-${currentTime}`);
        navigate('/alarm-ringing', { state: { sound: matchingAlarm.sound || 'gentle' } });
      }
    };

    // Her 15 saniyede kontrol et
    const interval = setInterval(checkAlarms, 15000);
    // İlk kontrolü hemen yap
    checkAlarms();

    return () => clearInterval(interval);
  }, [alarms, navigate, location.pathname]);

  return null;
};

// Native platform başlatma (bildirim izni, listener'lar, status bar)
const NativeInitializer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const initNative = async () => {
      // Bildirim izni iste
      await requestNotificationPermission();
      
      // Alarm action tiplerini kaydet (Kaydet / Ertele butonları)
      await registerAlarmActions();

      // Bildirim tıklama olayını dinle
      await addNotificationClickListener(({ sound }) => {
        navigate('/alarm-ringing', { state: { sound } });
      });

      // Status Bar ayarla (koyu tema)
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#080B14' });
      } catch (err) {
        console.log('StatusBar ayarlanamadı:', err);
      }
    };

    initNative();
  }, [navigate]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <>
      <AlarmScheduler />
      <NativeInitializer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/alarm-ringing" element={<AlarmRinging />} />
          
          <Route path="/" element={<AuthWrapper><Layout /></AuthWrapper>}>
            <Route index element={<Home />} />
            <Route path="journal" element={<Journal />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />
            <Route path="alarm" element={<Alarm />} />
          </Route>
          
          <Route path="/dream/:id" element={<AuthWrapper><DreamDetail /></AuthWrapper>} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <DreamProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </DreamProvider>
  );
}

export default App;
