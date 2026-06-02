// Web Audio API ile alarm sesleri oluşturma
// Harici ses dosyası gerektirmez — tamamen programatik

let audioContext = null;
let currentOscillators = [];
let isPlaying = false;

const getAudioContext = () => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// ============================================
// Alarm Tonları Tanımları
// ============================================

export const ALARM_SOUNDS = [
  { id: 'gentle', name: 'Huzurlu Uyanış', emoji: '🌅', description: 'Yumuşak ve sakin' },
  { id: 'classic', name: 'Klasik Alarm', emoji: '⏰', description: 'Geleneksel bip sesi' },
  { id: 'melody', name: 'Melodi', emoji: '🎵', description: 'Müzikal arpej' },
  { id: 'cosmic', name: 'Kozmik', emoji: '🌌', description: 'Uzay temalı' },
  { id: 'birds', name: 'Kuş Sesleri', emoji: '🐦', description: 'Doğa sesleri' },
  { id: 'dream', name: 'Rüya Çanı', emoji: '🔔', description: 'Mistik çan sesi' },
];

// --- 1. Huzurlu Uyanış (Gentle) ---
const playGentle = (ctx) => {
  const now = ctx.currentTime;
  const oscillators = [];

  const playNote = (freq, startTime, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + startTime);
    gain.gain.setValueAtTime(0, now + startTime);
    gain.gain.linearRampToValueAtTime(0.15, now + startTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, now + startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startTime);
    osc.stop(now + startTime + duration);
    oscillators.push(osc);
  };

  // Soft ascending pattern repeating
  const pattern = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  for (let rep = 0; rep < 4; rep++) {
    pattern.forEach((freq, i) => {
      playNote(freq, rep * 3.5 + i * 0.8, 1.2);
    });
  }

  return oscillators;
};

// --- 2. Klasik Alarm (Classic) ---
const playClassic = (ctx) => {
  const now = ctx.currentTime;
  const oscillators = [];

  for (let rep = 0; rep < 8; rep++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now + rep * 1.0);
    osc.frequency.setValueAtTime(698.46, now + rep * 1.0 + 0.25);
    gain.gain.setValueAtTime(0, now + rep * 1.0);
    gain.gain.linearRampToValueAtTime(0.12, now + rep * 1.0 + 0.05);
    gain.gain.setValueAtTime(0.12, now + rep * 1.0 + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + rep * 1.0 + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + rep * 1.0);
    osc.stop(now + rep * 1.0 + 0.5);
    oscillators.push(osc);
  }

  return oscillators;
};

// --- 3. Melodi (Melody) ---
const playMelody = (ctx) => {
  const now = ctx.currentTime;
  const oscillators = [];
  // Arpej notaları — güzel bir dizi
  const notes = [
    523.25, 587.33, 659.25, 783.99, 880, 783.99, 659.25, 587.33,
    523.25, 659.25, 783.99, 1046.50, 880, 783.99, 659.25, 523.25
  ];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + i * 0.35);
    gain.gain.setValueAtTime(0, now + i * 0.35);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.35 + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + i * 0.35 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.35);
    osc.stop(now + i * 0.35 + 0.35);
    oscillators.push(osc);
  });

  return oscillators;
};

// --- 4. Kozmik (Cosmic) ---
const playCosmic = (ctx) => {
  const now = ctx.currentTime;
  const oscillators = [];

  for (let rep = 0; rep < 3; rep++) {
    const baseTime = rep * 3;
    // Deep pad
    const pad = ctx.createOscillator();
    const padGain = ctx.createGain();
    pad.type = 'sine';
    pad.frequency.setValueAtTime(110, now + baseTime);
    pad.frequency.exponentialRampToValueAtTime(220, now + baseTime + 2.5);
    padGain.gain.setValueAtTime(0, now + baseTime);
    padGain.gain.linearRampToValueAtTime(0.1, now + baseTime + 1);
    padGain.gain.linearRampToValueAtTime(0, now + baseTime + 2.8);
    pad.connect(padGain);
    padGain.connect(ctx.destination);
    pad.start(now + baseTime);
    pad.stop(now + baseTime + 3);
    oscillators.push(pad);

    // Shimmer overtones
    [440, 660, 880].forEach((freq, j) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + baseTime + j * 0.5);
      osc.frequency.setValueAtTime(freq * 1.02, now + baseTime + j * 0.5 + 0.5);
      gain.gain.setValueAtTime(0, now + baseTime + j * 0.5);
      gain.gain.linearRampToValueAtTime(0.06, now + baseTime + j * 0.5 + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + baseTime + j * 0.5 + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + baseTime + j * 0.5);
      osc.stop(now + baseTime + j * 0.5 + 1.5);
      oscillators.push(osc);
    });
  }

  return oscillators;
};

// --- 5. Kuş Sesleri (Birds) ---
const playBirds = (ctx) => {
  const now = ctx.currentTime;
  const oscillators = [];

  const chirp = (startTime, baseFreq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now + startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + startTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + startTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + startTime + 0.2);
    gain.gain.setValueAtTime(0, now + startTime);
    gain.gain.linearRampToValueAtTime(0.12, now + startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.08, now + startTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.12, now + startTime + 0.15);
    gain.gain.linearRampToValueAtTime(0, now + startTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startTime);
    osc.stop(now + startTime + 0.3);
    oscillators.push(osc);
  };

  // Randomized bird chirps
  const times = [0, 0.3, 0.8, 1.5, 1.8, 2.5, 3.0, 3.3, 4.0, 4.5, 5.2, 5.5, 6.0, 6.8, 7.2, 7.5];
  const freqs = [2000, 2400, 1800, 2200, 2600, 1900, 2100, 2500];
  times.forEach((t, i) => {
    chirp(t, freqs[i % freqs.length]);
  });

  return oscillators;
};

// --- 6. Rüya Çanı (Dream Bell) ---
const playDreamBell = (ctx) => {
  const now = ctx.currentTime;
  const oscillators = [];

  const bell = (startTime, freq) => {
    // Fundamental
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now + startTime);
    gain1.gain.setValueAtTime(0.2, now + startTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + startTime + 2.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now + startTime);
    osc1.stop(now + startTime + 2.5);
    oscillators.push(osc1);

    // Overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, now + startTime);
    gain2.gain.setValueAtTime(0.08, now + startTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + startTime + 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + startTime);
    osc2.stop(now + startTime + 1.5);
    oscillators.push(osc2);

    // High shimmer
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 5.4, now + startTime);
    gain3.gain.setValueAtTime(0.03, now + startTime);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + startTime + 0.8);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + startTime);
    osc3.stop(now + startTime + 0.8);
    oscillators.push(osc3);
  };

  // Çan dizisi
  const notes = [261.63, 329.63, 392, 523.25, 392, 329.63];
  notes.forEach((freq, i) => {
    bell(i * 1.8, freq);
  });

  return oscillators;
};

// ============================================
// Ses Çalma / Durdurma API
// ============================================

const soundPlayers = {
  gentle: playGentle,
  classic: playClassic,
  melody: playMelody,
  cosmic: playCosmic,
  birds: playBirds,
  dream: playDreamBell,
};

/**
 * Belirtilen alarm sesini çalar.
 * @param {string} soundId - ALARM_SOUNDS'daki id değeri
 * @param {boolean} loop - Tekrarlansın mı (varsayılan true)
 */
export const playAlarmSound = (soundId = 'gentle', loop = true) => {
  stopAlarmSound();
  
  const ctx = getAudioContext();
  const player = soundPlayers[soundId] || soundPlayers.gentle;
  
  isPlaying = true;
  
  const play = () => {
    if (!isPlaying) return;
    currentOscillators = player(ctx);
    
    if (loop) {
      // Ses süresine göre tekrarla
      const durations = {
        gentle: 14000,
        classic: 8000,
        melody: 6000,
        cosmic: 9000,
        birds: 8000,
        dream: 11000,
      };
      const duration = durations[soundId] || 8000;
      
      setTimeout(() => {
        if (isPlaying) play();
      }, duration);
    }
  };
  
  play();
};

/**
 * Sadece önizleme için bir kez çalar (loop yok, kısa versiyon).
 * @param {string} soundId
 */
export const previewAlarmSound = (soundId = 'gentle') => {
  stopAlarmSound();
  
  const ctx = getAudioContext();
  const player = soundPlayers[soundId] || soundPlayers.gentle;
  
  isPlaying = true;
  currentOscillators = player(ctx);
  
  // Önizleme: birkaç saniye sonra durdur
  const previewDurations = {
    gentle: 3500,
    classic: 2000,
    melody: 3000,
    cosmic: 3000,
    birds: 3000,
    dream: 3600,
  };
  
  setTimeout(() => {
    stopAlarmSound();
  }, previewDurations[soundId] || 3000);
};

/**
 * Tüm alarm seslerini durdurur.
 */
export const stopAlarmSound = () => {
  isPlaying = false;
  currentOscillators.forEach(osc => {
    try { 
      osc.stop(); 
      osc.disconnect(); 
    } catch (e) { /* zaten durmuş olabilir */ }
  });
  currentOscillators = [];
  
  // Sesi ANINDA ve kesin olarak kesmek için AudioContext'i kapatıyoruz.
  // Bir sonraki alarmda getAudioContext() yenisini oluşturacaktır.
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch(e) {}
    audioContext = null;
  }
};

export const isAlarmPlaying = () => isPlaying;
