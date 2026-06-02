import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Native platform üzerinde çalışıp çalışmadığımızı kontrol eder.
 * Web tarayıcısında false döner, Android/iOS'ta true döner.
 */
export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Bildirim izni ister.
 * @returns {Promise<boolean>} İzin verildi mi?
 */
export const requestNotificationPermission = async () => {
  if (!isNativePlatform()) return false;

  try {
    const permStatus = await LocalNotifications.checkPermissions();
    
    if (permStatus.display === 'granted') return true;
    
    if (permStatus.display === 'denied') {
      console.warn('Bildirim izni reddedildi.');
      return false;
    }

    // İzin iste
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.error('Bildirim izni hatası:', err);
    return false;
  }
};

/**
 * Verilen saate native bildirim zamanlar.
 * Eğer saat geçmişse, bir sonraki gün aynı saatte zamanlar.
 * 
 * @param {Object} alarm - { id, time (HH:MM), sound, active }
 */
export const scheduleNativeAlarm = async (alarm) => {
  if (!isNativePlatform()) return;
  if (!alarm.active) return;

  try {
    // Mevcut aynı ID'li bildirimi iptal et
    await cancelNativeAlarm(alarm.id);

    // Alarm zamanını hesapla
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const now = new Date();
    const alarmDate = new Date();
    alarmDate.setHours(hours, minutes, 0, 0);

    // Eğer saat geçtiyse, yarına zamanla
    if (alarmDate <= now) {
      alarmDate.setDate(alarmDate.getDate() + 1);
    }

    // Benzersiz integer ID oluştur (string ID'den)
    const notificationId = hashStringToInt(alarm.id);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: '⏰ Rüya Günlüğü',
          body: 'Günaydın! Rüyanızı unutmadan kaydedin. ✨',
          schedule: {
            at: alarmDate,
            allowWhileIdle: true,
          },
          sound: getAlarmSoundFile(alarm.sound),
          extra: {
            alarmId: alarm.id,
            sound: alarm.sound || 'gentle',
          },
          actionTypeId: 'ALARM_ACTION',
          autoCancel: true,
        }
      ]
    });

    console.log(`Alarm zamanlandı: ${alarm.time} → ${alarmDate.toISOString()}`);
  } catch (err) {
    console.error('Alarm zamanlama hatası:', err);
  }
};

/**
 * Native bildirim zamanlamasını iptal eder.
 * @param {string} alarmId
 */
export const cancelNativeAlarm = async (alarmId) => {
  if (!isNativePlatform()) return;

  try {
    const notificationId = hashStringToInt(alarmId);
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
  } catch (err) {
    console.error('Alarm iptal hatası:', err);
  }
};

/**
 * Tüm native alarm bildirimlerini iptal eder.
 */
export const cancelAllNativeAlarms = async () => {
  if (!isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }
  } catch (err) {
    console.error('Tüm alarmları iptal etme hatası:', err);
  }
};

/**
 * Tüm aktif alarmları yeniden zamanlar.
 * Uygulama başlatıldığında çağrılmalı.
 * @param {Array} alarms - Alarm dizisi
 */
export const rescheduleAllAlarms = async (alarms) => {
  if (!isNativePlatform()) return;

  await cancelAllNativeAlarms();
  
  for (const alarm of alarms) {
    if (alarm.active) {
      await scheduleNativeAlarm(alarm);
    }
  }
};

/**
 * Bildirim tıklama olayını dinler.
 * @param {Function} callback - Tıklama olayında çağrılacak fonksiyon
 * @returns {Promise<void>}
 */
export const addNotificationClickListener = async (callback) => {
  if (!isNativePlatform()) return;

  await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    const extra = notification.notification?.extra;
    if (extra) {
      callback({
        alarmId: extra.alarmId,
        sound: extra.sound || 'gentle',
      });
    }
  });
};

/**
 * Bildirim action tiplerini kaydeder (Kaydet / Ertele butonları).
 */
export const registerAlarmActions = async () => {
  if (!isNativePlatform()) return;

  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'ALARM_ACTION',
          actions: [
            {
              id: 'record',
              title: '📝 Rüyamı Kaydet',
              foreground: true,
            },
            {
              id: 'snooze',
              title: '⏰ 5 dk Ertele',
              foreground: false,
            }
          ]
        }
      ]
    });
  } catch (err) {
    console.error('Alarm action kayıt hatası:', err);
  }
};

// ============================================
// Yardımcı Fonksiyonlar
// ============================================

/**
 * String ID'yi integer'a dönüştürür (LocalNotifications integer ID gerektirir).
 */
const hashStringToInt = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32-bit integer'a dönüştür
  }
  return Math.abs(hash);
};

/**
 * Alarm ses ID'sini native ses dosyası adına çevirir.
 * Android: res/raw/ dizininde .wav dosyaları olmalı
 * iOS: bundle'da .wav dosyaları olmalı
 */
const getAlarmSoundFile = (soundId) => {
  const soundMap = {
    gentle: 'alarm_gentle.wav',
    classic: 'alarm_classic.wav',
    melody: 'alarm_melody.wav',
    cosmic: 'alarm_cosmic.wav',
    birds: 'alarm_birds.wav',
    dream: 'alarm_dream.wav',
  };
  return soundMap[soundId] || 'alarm_gentle.wav';
};

/**
 * Rüya hatırlatıcı bildirimini zamanlar.
 * @param {Object} settings - { active, time }
 */
export const scheduleReminderNotification = async (settings) => {
  if (!isNativePlatform()) return;

  const reminderNotificationId = 999999; // Rüya hatırlatıcı için sabit ID

  try {
    // Önceki bildirimi iptal et
    await LocalNotifications.cancel({
      notifications: [{ id: reminderNotificationId }]
    });

    if (!settings.active) return;

    const [hours, minutes] = settings.time.split(':').map(Number);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: reminderNotificationId,
          title: '📝 Rüya Hatırlatıcı',
          body: 'Günaydın! Gördüğünüz rüyaları unutmadan kaydetmek ister misiniz? ✨',
          schedule: {
            on: {
              hour: hours,
              minute: minutes
            },
            every: 'day',
            allowWhileIdle: true
          },
          sound: null, // Varsayılan bildirim sesi
          autoCancel: true,
        }
      ]
    });

    console.log(`Rüya hatırlatıcısı zamanlandı: Her gün saat ${settings.time}`);
  } catch (err) {
    console.error('Rüya hatırlatıcı zamanlama hatası:', err);
  }
};
