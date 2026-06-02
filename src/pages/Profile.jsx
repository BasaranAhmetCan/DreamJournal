import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDreamContext } from '../context/DreamContext';
import { Sparkles, Quote, Moon, Compass, Brain, Activity, Heart } from 'lucide-react';

const Profile = () => {
  const { userProfile, dreams, theme } = useDreamContext();

  // --- 1. Günün Ay Evresi Hesaplama ---
  const moonPhase = useMemo(() => {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (month < 3) {
      year--;
      month += 12;
    }
    month++;
    
    const c = 365.25 * year;
    const e = 30.6 * month;
    let jd = c + e + day - 694039.09; // Julian gün farkı
    jd /= 29.530588853; // Sinodik ay döngüsüne böl
    const b = parseInt(jd);
    jd -= b;
    const phaseVal = Math.round(jd * 8) % 8; // 0-7 arası evre
    
    const phases = [
      { name: "Yeni Ay", icon: "🌑", desc: "Yeni başlangıçlar dönemi. Bilinçaltınız rüyalarda daha taze ve keşfedilmemiş alanlara yönelir." },
      { name: "Büyüyen Hilal", icon: "🌒", desc: "Niyet ve tohum atma zamanı. Rüyalarınız geleceğe dair ipuçları ve sezgisel semboller taşıyabilir." },
      { name: "İlk Dördün", icon: "🌓", desc: "Kararlılık ve aksiyon dönemi. Rüyalarınızda engellerle yüzleştiğiniz mücadeleci temalar öne çıkabilir." },
      { name: "Büyüyen Şişkin", icon: "🌔", desc: "Gelişme ve analiz zamanı. Bilinçaltınız karmaşık detayları ve günlük olayları rüyalarda çözümler." },
      { name: "Dolunay", icon: "🌕", desc: "En yüksek bilinç ve sezgi evresi. Rüyalarınız son derece canlı, duygusal ve akılda kalıcı olur." },
      { name: "Küçülen Şişkin", icon: "🌖", desc: "Paylaşım ve farkındalık dönemi. Rüyalarınızda eski anılar veya öğretici rehberler görebilirsiniz." },
      { name: "Son Dördün", icon: "🌗", desc: "Serbest bırakma ve arınma zamanı. Korkularınızı ve sizi kısıtlayan kalıpları rüyalarda bırakabilirsiniz." },
      { name: "Küçülen Hilal", icon: "🌘", desc: "Dinlenme ve içe dönüş dönemi. Rüyalarınız daha sakin, mistik ve derin dinlenme odaklıdır." }
    ];
    
    return phases[phaseVal];
  }, []);

  // --- 2. Zihin Dalgaları / Rüya Metrikleri Hesaplama ---
  const metrics = useMemo(() => {
    if (!dreams || dreams.length === 0) {
      return { lucidity: 0, surrealism: 0, emotionality: 0, symbolism: 0 };
    }
    let lucidCount = 0;
    let surrealCount = 0;
    let emotionalCount = 0;
    let symbolCount = 0;

    dreams.forEach(d => {
      const textLower = d.text.toLowerCase();
      const hasLucidTag = d.keywords?.some(k => k.toLowerCase().includes('lucid') || k.toLowerCase().includes('bilinçli'));
      const hasLucidText = textLower.includes('farkında') || textLower.includes('kontrol') || textLower.includes('uyandım');
      if (hasLucidTag || hasLucidText) lucidCount++;

      const hasSurrealTag = d.keywords?.some(k => k.toLowerCase().includes('gerçeküstü') || k.toLowerCase().includes('karmaşık') || k.toLowerCase().includes('kabus'));
      if (hasSurrealTag || d.sentiment === 'negative') surrealCount++;

      if (d.sentiment !== 'neutral') emotionalCount++;

      if (d.keywords && d.keywords.length > 2) symbolCount++;
    });

    const total = dreams.length;
    return {
      lucidity: Math.min(100, Math.round(20 + (lucidCount / total) * 80)),
      surrealism: Math.min(100, Math.round(30 + (surrealCount / total) * 70)),
      emotionality: Math.min(100, Math.round(40 + (emotionalCount / total) * 60)),
      symbolism: Math.min(100, Math.round(35 + (symbolCount / total) * 65))
    };
  }, [dreams]);

  // --- 3. Rüya Arketipi Belirleme ---
  const archetype = useMemo(() => {
    if (!dreams || dreams.length === 0) {
      return {
        title: "Aday Gözlemci",
        icon: "🌱",
        desc: "Henüz hiç rüya kaydetmediniz. Rüyalarınızı kaydettikçe bilinçaltı arketipiniz burada şekillenecektir."
      };
    }

    let kabusCount = 0;
    let lucidCount = 0;
    let positiveCount = 0;

    dreams.forEach(d => {
      if (d.keywords?.some(k => k.toLowerCase().includes('kabus'))) kabusCount++;
      if (d.keywords?.some(k => k.toLowerCase().includes('lucid') || k.toLowerCase().includes('bilinçli'))) lucidCount++;
      if (d.sentiment === 'positive') positiveCount++;
    });

    if (lucidCount > 0 && lucidCount >= kabusCount) {
      return {
        title: "Bilinçli Gezgin (Lucid Explorer)",
        icon: "🧭",
        desc: "Rüyalarınızın kontrolünü ele alabilen, bilinçaltı boyutlarında aktif olarak seyahat eden uyanık bir zihne sahipsiniz."
      };
    } else if (kabusCount > 0 && kabusCount >= positiveCount) {
      return {
        title: "Gölge Avcısı (Shadow Hunter)",
        icon: "🛡️",
        desc: "Rüyalarınızda korkularınızla ve zihninizin gölge yanlarıyla yüzleşiyorsunuz. Bu rüyalar zihinsel bir arınma sürecine işaret eder."
      };
    } else if (positiveCount > 0 && positiveCount >= kabusCount) {
      return {
        title: "Huzurlu Gözlemci (Peaceful Observer)",
        icon: "🕊️",
        desc: "Rüyalarınız genellikle dingin, yapıcı ve dinlendirici sahnelerle dolu. Ruhsal dengenizi koruyan berrak bir iç dünyanız var."
      };
    } else {
      return {
        title: "Mistik Düşünür (Mystic Thinker)",
        icon: "🔮",
        desc: "Rüyalarınız semboller, derin anlamlar ve gizemli hikayelerle dolu. Bilinçaltınız size klasik yorumların ötesinde mesajlar veriyor."
      };
    }
  }, [dreams]);

  // --- 4. Günlük Olumlama Belirleme ---
  const dailyAffirmation = useMemo(() => {
    if (!dreams || dreams.length === 0) {
      return "Rüya günlüğünüzü tutmaya başlamak, kendi içinizdeki hazineyi keşfetmenin ilk adımıdır. Bugün kendine inan.";
    }

    let negativeCount = 0;
    dreams.forEach(d => {
      if (d.sentiment === 'negative') negativeCount++;
    });

    if (negativeCount / dreams.length > 0.4) {
      return "Zihnim rüyalar aracılığıyla günün yüklerini ve streslerini temizliyor. Uyandığımda güvendeyim ve güne huzurla başlıyorum.";
    } else if (dreams.some(d => d.sentiment === 'positive')) {
      return "İçimdeki yaratıcı ve berrak enerji rüyalarımda çiçek açıyor. Bu enerjiyi bugün uyanık hayatıma da sevgiyle taşıyorum.";
    } else {
      return "Ruhum ve zihnim dengede. Evrenin getirdiği tüm mesajlara açık ve uyumluyum. Akışa güveniyorum.";
    }
  }, [dreams]);

  const writtenAnalysis = useMemo(() => {
    if (!dreams || dreams.length === 0) {
      return "Sisteme henüz rüya kaydetmediniz. Analiz yapabilmem için rüyalarınızın derinliklerine inmem gerekiyor.";
    }

    const totalDreams = dreams.length;
    let positive = 0, negative = 0, neutral = 0;
    const keywordCounts = {};

    dreams.forEach(d => {
      if (d.sentiment === 'positive') positive++;
      else if (d.sentiment === 'negative') negative++;
      else neutral++;

      d.keywords?.forEach(k => {
        keywordCounts[k] = (keywordCounts[k] || 0) + 1;
      });
    });

    const topKeyword = Object.keys(keywordCounts).length > 0 
      ? Object.keys(keywordCounts).reduce((a, b) => keywordCounts[a] > keywordCounts[b] ? a : b)
      : null;

    let sentimentAnalysis = "";
    if (positive > negative && positive > neutral) {
      sentimentAnalysis = "Son zamanlarda rüyalarınız ağırlıklı olarak pozitif ve huzurlu bir auraya sahip. Bilinçaltınız günlük hayatın stresinden uzak, kendini yenileme evresinde.";
    } else if (negative > positive && negative > neutral) {
      sentimentAnalysis = "Kayıtlarınızda yoğun bir stres ve kabus eğilimi (negatif enerji) göze çarpıyor. Çözülmemiş bazı günlük sorunlar uyku kalitenizi etkiliyor olabilir; yatmadan önce zihninizi boşaltacak pratikler yapmanız faydalı olacaktır.";
    } else {
      sentimentAnalysis = "Ruh haliniz oldukça dengeli seyrediyor. Ne aşırı bir stres ne de uyarıcı bir mutluluk var; bilinçaltınız olayları nötr bir gözlemci gibi kaydediyor.";
    }

    let keywordAnalysis = "";
    if (topKeyword) {
      keywordAnalysis = ` Özellikle rüyalarınızda "${topKeyword}" sembolünün sıklıkla karşınıza çıkması tesadüf değil. Bu, şu sıralar odağınızın veya bastırdığınız duyguların tam da bu temanın etrafında şekillendiğini gösteriyor.`;
    }

    let astroAnalysis = "";
    if (userProfile?.zodiac) {
      astroAnalysis = ` ${userProfile.zodiac} burcunun karakteristik sezgiselliği, tüm bu rüya döngünüzü daha da derin ve anlamlı kılıyor. Evrenin size mesajı var.`;
    }

    return `${sentimentAnalysis}${keywordAnalysis}${astroAnalysis}`;
  }, [dreams, userProfile]);

  return (
    <div className="min-h-screen w-full bg-dream-dark text-white p-6 pt-12 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto flex flex-col gap-6"
      >
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-widest uppercase text-white/90">İçgörüler</h1>
          <Sparkles className="text-dream-accent" />
        </header>

        {/* Yazılı Analiz (Yapay Zeka İçgörüsü) */}
        <div className="bg-dream-accent/5 border border-dream-accent/20 rounded-3xl p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-4 right-4 text-dream-accent/10">
            <Quote size={50} />
          </div>
          
          <div className="flex items-center gap-2.5 mb-4 relative z-10">
            <Sparkles size={20} className="text-dream-accent" />
            <h3 className="text-sm tracking-widest uppercase text-dream-accent font-medium">Bilinçaltı Raporu</h3>
          </div>
          
          <p className="text-sm font-light leading-relaxed text-white/80 relative z-10">
            {writtenAnalysis}
          </p>
        </div>

        {/* 1. Günün Ay Evresi & Bilinçaltı Etkisi */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-md flex gap-4 items-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-dream-accent/10 border border-dream-accent/20 flex items-center justify-center text-4xl shadow-inner select-none flex-shrink-0"
          >
            {moonPhase.icon}
          </motion.div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/40">
              <Moon size={12} className="text-dream-accent" />
              <span>Günün Ay Evresi ({moonPhase.name})</span>
            </div>
            <p className="text-xs font-light text-white/70 leading-relaxed">
              {moonPhase.desc}
            </p>
          </div>
        </div>

        {/* 2. Rüya Arketip Kartı */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-md flex gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-dream-accent/10 border border-dream-accent/20 flex items-center justify-center text-4xl shadow-inner select-none flex-shrink-0">
            {archetype.icon}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/40">
              <Compass size={12} className="text-dream-accent" />
              <span>Bilinçaltı Arketipiniz</span>
            </div>
            <h4 className="text-sm font-semibold text-white/95">{archetype.title}</h4>
            <p className="text-xs font-light text-white/70 leading-relaxed">
              {archetype.desc}
            </p>
          </div>
        </div>

        {/* 3. Zihin Dalgaları Grafiği */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/40">
            <Activity size={12} className="text-dream-accent" />
            <span>Zihin Dalgaları Analizi</span>
          </div>

          <div className="flex flex-col gap-3.5 mt-1">
            {/* Metrik 1 */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-light text-white/70">
                <span className="flex items-center gap-1"><Brain size={11} className="text-dream-accent/70" /> Farkındalık (Lucidity)</span>
                <span>%{metrics.lucidity}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.lucidity}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-dream-accent to-[#a78bfa] rounded-full"
                />
              </div>
            </div>

            {/* Metrik 2 */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-light text-white/70">
                <span className="flex items-center gap-1"><Sparkles size={11} className="text-dream-accent/70" /> Gerçeküstülük (Surrealism)</span>
                <span>%{metrics.surrealism}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.surrealism}%` }}
                  transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-dream-accent to-[#a78bfa] rounded-full"
                />
              </div>
            </div>

            {/* Metrik 3 */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-light text-white/70">
                <span className="flex items-center gap-1"><Heart size={11} className="text-dream-accent/70" /> Duygusallık (Emotionality)</span>
                <span>%{metrics.emotionality}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.emotionality}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-dream-accent to-[#a78bfa] rounded-full"
                />
              </div>
            </div>

            {/* Metrik 4 */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-light text-white/70">
                <span className="flex items-center gap-1"><Compass size={11} className="text-dream-accent/70" /> Sembolizm (Symbolism)</span>
                <span>%{metrics.symbolism}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.symbolism}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-dream-accent to-[#a78bfa] rounded-full"
                />
              </div>
            </div>

          </div>
        </div>

        {/* 4. Günlük Olumlama */}
        <div className="bg-dream-accent/5 border border-dream-accent/15 rounded-3xl p-6 relative overflow-hidden shadow-md">
          <div className="absolute -left-3 -bottom-3 text-dream-accent/5 pointer-events-none select-none">
            <Heart size={80} />
          </div>
          <div className="flex flex-col gap-2 relative z-10">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-dream-accent/80 font-medium">
              <Heart size={12} />
              <span>Günün Olumlaması</span>
            </div>
            <p className="text-sm italic font-light leading-relaxed text-white/80">
              "{dailyAffirmation}"
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Profile;
