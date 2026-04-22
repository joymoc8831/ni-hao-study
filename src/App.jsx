import React, { useState, useEffect, useRef } from 'react';
import { Home as HomeIcon, BookOpen, AlertCircle, Plus, BarChart3, Volume2, X, Check, Flame, Trophy, Sparkles, ChevronRight, ArrowLeft, Zap, Heart, Music, Trash2, Edit3, Play, Eye, EyeOff, ListPlus, Save } from 'lucide-react';

// localStorage wrapper compatible with Claude's storage API
const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? { key, value } : null;
    } catch (e) { return null; }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (e) { return null; }
  },
  async delete(key) {
    try {
      const existed = localStorage.getItem(key) !== null;
      localStorage.removeItem(key);
      return { key, deleted: existed };
    } catch (e) { return null; }
  },
};

const STORAGE_PREFIX = 'ni-hao-v2-';
const PROFILES_KEY = STORAGE_PREFIX + 'profiles';
const ACTIVE_KEY = STORAGE_PREFIX + 'active';
const dataKeyFor = (id) => STORAGE_PREFIX + 'data-' + id;

const AVATAR_EMOJIS = ['🐻‍❄️', '🐈‍⬛', '🐥', '🦖', '🦄', '🐏'];

const INITIAL_WORDS = [
  // 挨拶
  { id: 'w1', chinese: '你好', pinyin: 'nǐ hǎo', japanese: 'こんにちは', category: 'greeting' },
  { id: 'w2', chinese: '谢谢', pinyin: 'xiè xie', japanese: 'ありがとう', category: 'greeting' },
  { id: 'w3', chinese: '对不起', pinyin: 'duì bu qǐ', japanese: 'ごめんなさい', category: 'greeting' },
  { id: 'w4', chinese: '再见', pinyin: 'zài jiàn', japanese: 'さようなら', category: 'greeting' },
  { id: 'w5', chinese: '没关系', pinyin: 'méi guān xi', japanese: '大丈夫', category: 'greeting' },
  { id: 'w6', chinese: '不客气', pinyin: 'bú kè qi', japanese: 'どういたしまして', category: 'greeting' },
  // 基礎
  { id: 'w7', chinese: '我', pinyin: 'wǒ', japanese: '私', category: 'basic' },
  { id: 'w8', chinese: '你', pinyin: 'nǐ', japanese: 'あなた', category: 'basic' },
  { id: 'w9', chinese: '他', pinyin: 'tā', japanese: '彼', category: 'basic' },
  { id: 'w10', chinese: '她', pinyin: 'tā', japanese: '彼女', category: 'basic' },
  { id: 'w11', chinese: '是', pinyin: 'shì', japanese: '〜です', category: 'basic' },
  { id: 'w12', chinese: '不', pinyin: 'bù', japanese: '〜ない', category: 'basic' },
  // 動詞
  { id: 'w13', chinese: '吃', pinyin: 'chī', japanese: '食べる', category: 'verb' },
  { id: 'w14', chinese: '喝', pinyin: 'hē', japanese: '飲む', category: 'verb' },
  { id: 'w15', chinese: '看', pinyin: 'kàn', japanese: '見る', category: 'verb' },
  { id: 'w16', chinese: '听', pinyin: 'tīng', japanese: '聞く', category: 'verb' },
  { id: 'w17', chinese: '去', pinyin: 'qù', japanese: '行く', category: 'verb' },
  { id: 'w18', chinese: '来', pinyin: 'lái', japanese: '来る', category: 'verb' },
  { id: 'w19', chinese: '喜欢', pinyin: 'xǐ huān', japanese: '好き', category: 'verb' },
  { id: 'w20', chinese: '爱', pinyin: 'ài', japanese: '愛する', category: 'verb' },
  // 感情・ポップ系
  { id: 'w21', chinese: '心', pinyin: 'xīn', japanese: '心', category: 'emotion' },
  { id: 'w22', chinese: '梦', pinyin: 'mèng', japanese: '夢', category: 'emotion' },
  { id: 'w23', chinese: '永远', pinyin: 'yǒng yuǎn', japanese: '永遠', category: 'emotion' },
  { id: 'w24', chinese: '想你', pinyin: 'xiǎng nǐ', japanese: 'あなたが恋しい', category: 'emotion' },
  { id: 'w25', chinese: '一起', pinyin: 'yì qǐ', japanese: '一緒に', category: 'emotion' },
  { id: 'w26', chinese: '回忆', pinyin: 'huí yì', japanese: '思い出', category: 'emotion' },
  { id: 'w27', chinese: '时间', pinyin: 'shí jiān', japanese: '時間', category: 'emotion' },
  { id: 'w28', chinese: '星', pinyin: 'xīng', japanese: '星', category: 'emotion' },
  // フレーズ
  { id: 'w29', chinese: '你好吗？', pinyin: 'nǐ hǎo ma?', japanese: '元気ですか？', category: 'phrase' },
  { id: 'w30', chinese: '我很好', pinyin: 'wǒ hěn hǎo', japanese: '元気です', category: 'phrase' },
  { id: 'w31', chinese: '我爱你', pinyin: 'wǒ ài nǐ', japanese: '愛してる', category: 'phrase' },
  { id: 'w32', chinese: '多少钱？', pinyin: 'duō shǎo qián?', japanese: 'いくらですか？', category: 'phrase' },
  { id: 'w33', chinese: '我不知道', pinyin: 'wǒ bù zhī dào', japanese: '知りません', category: 'phrase' },
  { id: 'w34', chinese: '请问', pinyin: 'qǐng wèn', japanese: 'すみません（尋ねる）', category: 'phrase' },
  // 数字・時間
  { id: 'w35', chinese: '一', pinyin: 'yī', japanese: '1', category: 'number' },
  { id: 'w36', chinese: '二', pinyin: 'èr', japanese: '2', category: 'number' },
  { id: 'w37', chinese: '三', pinyin: 'sān', japanese: '3', category: 'number' },
  { id: 'w38', chinese: '今天', pinyin: 'jīn tiān', japanese: '今日', category: 'number' },
  { id: 'w39', chinese: '明天', pinyin: 'míng tiān', japanese: '明日', category: 'number' },
  { id: 'w40', chinese: '昨天', pinyin: 'zuó tiān', japanese: '昨日', category: 'number' },
];

const CATEGORY_LABELS = {
  greeting: '挨拶',
  basic: '基礎',
  verb: '動詞',
  emotion: '感情・詞世界',
  phrase: 'フレーズ',
  number: '数字・時間',
  custom: 'マイ単語',
};

const CATEGORY_COLORS = {
  greeting: '#ff2d7c',
  basic: '#00e5ff',
  verb: '#ffd60a',
  emotion: '#ff2d7c',
  phrase: '#c77dff',
  number: '#00e5ff',
  custom: '#ffd60a',
};

const DEFAULT_DATA = {
  stats: {
    xp: 0,
    level: 1,
    streak: 0,
    totalCorrect: 0,
    totalWrong: 0,
    lastStudyDate: null,
    daysStudied: 0,
  },
  progress: {},
  customWords: [],
  mistakeIds: [],
  songs: [],
};

const speak = (text) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.75;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const daysBetween = (a, b) => {
  if (!a || !b) return Infinity;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState('home');
  const [studyConfig, setStudyConfig] = useState(null);
  const [activeSongId, setActiveSongId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Load from persistent storage
  useEffect(() => {
    (async () => {
      try {
        const profilesRes = await storage.get(PROFILES_KEY);
        const profilesList = profilesRes?.value ? JSON.parse(profilesRes.value) : [];
        setProfiles(profilesList);

        if (profilesList.length > 0) {
          let activeRes = null;
          try { activeRes = await storage.get(ACTIVE_KEY); } catch (e) {}
          let activeId = activeRes?.value || profilesList[0].id;
          // Ensure active id is valid
          if (!profilesList.find((p) => p.id === activeId)) activeId = profilesList[0].id;
          setActiveProfileId(activeId);

          try {
            const dataRes = await storage.get(dataKeyFor(activeId));
            if (dataRes?.value) setData({ ...DEFAULT_DATA, ...JSON.parse(dataRes.value) });
          } catch (e) {}
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const saveData = async (next) => {
    setData(next);
    if (!activeProfileId) return;
    try {
      await storage.set(dataKeyFor(activeProfileId), JSON.stringify(next));
    } catch (e) {}
  };

  const createProfile = async (name, emoji) => {
    const newProfile = { id: 'p' + Date.now(), name: name.trim(), emoji: emoji || '🌸', createdAt: Date.now() };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    setActiveProfileId(newProfile.id);
    setData(DEFAULT_DATA);
    setShowProfileMenu(false);
    setScreen('home');
    try {
      await storage.set(PROFILES_KEY, JSON.stringify(newProfiles));
      await storage.set(ACTIVE_KEY, newProfile.id);
      await storage.set(dataKeyFor(newProfile.id), JSON.stringify(DEFAULT_DATA));
    } catch (e) {}
  };

  const switchProfile = async (id) => {
    if (id === activeProfileId) { setShowProfileMenu(false); return; }
    setActiveProfileId(id);
    setShowProfileMenu(false);
    setScreen('home');
    try {
      await storage.set(ACTIVE_KEY, id);
      const dataRes = await storage.get(dataKeyFor(id));
      setData(dataRes?.value ? { ...DEFAULT_DATA, ...JSON.parse(dataRes.value) } : DEFAULT_DATA);
    } catch (e) {
      setData(DEFAULT_DATA);
    }
  };

  const renameProfile = async (id, name, emoji) => {
    const newProfiles = profiles.map((p) => (p.id === id ? { ...p, name: name.trim(), emoji } : p));
    setProfiles(newProfiles);
    try {
      await storage.set(PROFILES_KEY, JSON.stringify(newProfiles));
    } catch (e) {}
  };

  const deleteProfile = async (id) => {
    if (profiles.length <= 1) {
      alert('最後のアカウントは削除できません');
      return;
    }
    if (!confirm('このアカウントとすべての学習データを削除しますか？')) return;
    const newProfiles = profiles.filter((p) => p.id !== id);
    setProfiles(newProfiles);
    try {
      await storage.set(PROFILES_KEY, JSON.stringify(newProfiles));
      await storage.delete(dataKeyFor(id));
    } catch (e) {}
    if (activeProfileId === id) {
      const newActive = newProfiles[0].id;
      setActiveProfileId(newActive);
      try {
        await storage.set(ACTIVE_KEY, newActive);
        const dataRes = await storage.get(dataKeyFor(newActive));
        setData(dataRes?.value ? { ...DEFAULT_DATA, ...JSON.parse(dataRes.value) } : DEFAULT_DATA);
      } catch (e) { setData(DEFAULT_DATA); }
    }
  };

  const allWords = [...INITIAL_WORDS, ...data.customWords];

  const recordStudy = (results) => {
    // results: [{ wordId, correct }]
    const next = JSON.parse(JSON.stringify(data));
    let gainedXP = 0;
    let correctCount = 0;
    let wrongCount = 0;

    for (const r of results) {
      if (!next.progress[r.wordId]) {
        next.progress[r.wordId] = { correctCount: 0, wrongCount: 0, mistakeStreak: 0 };
      }
      const p = next.progress[r.wordId];
      if (r.correct) {
        p.correctCount += 1;
        gainedXP += 10;
        correctCount += 1;
        // Remove from mistakes if answered correctly in mistake review
        if (next.mistakeIds.includes(r.wordId)) {
          p.mistakeStreak = (p.mistakeStreak || 0) + 1;
          if (p.mistakeStreak >= 2) {
            next.mistakeIds = next.mistakeIds.filter((id) => id !== r.wordId);
            p.mistakeStreak = 0;
          }
        }
      } else {
        p.wrongCount += 1;
        wrongCount += 1;
        p.mistakeStreak = 0;
        if (!next.mistakeIds.includes(r.wordId)) {
          next.mistakeIds.push(r.wordId);
        }
      }
    }

    // Update stats
    const today = todayISO();
    const s = next.stats;
    s.xp += gainedXP;
    s.level = Math.floor(s.xp / 100) + 1;
    s.totalCorrect += correctCount;
    s.totalWrong += wrongCount;

    if (s.lastStudyDate !== today) {
      const diff = daysBetween(s.lastStudyDate, today);
      if (diff === 1) s.streak += 1;
      else if (diff > 1 || !s.lastStudyDate) s.streak = 1;
      s.lastStudyDate = today;
      s.daysStudied += 1;
    }

    saveData(next);
  };

  const addCustomWord = (word) => {
    const next = { ...data, customWords: [...data.customWords, { ...word, id: 'c' + Date.now(), category: 'custom' }] };
    saveData(next);
  };

  const deleteCustomWord = (id) => {
    const next = { ...data };
    next.customWords = next.customWords.filter((w) => w.id !== id);
    next.mistakeIds = next.mistakeIds.filter((mid) => mid !== id);
    delete next.progress[id];
    saveData(next);
  };

  const saveSong = (song) => {
    const next = { ...data };
    const existing = next.songs.findIndex((s) => s.id === song.id);
    if (existing >= 0) {
      next.songs[existing] = song;
    } else {
      next.songs = [...next.songs, song];
    }
    saveData(next);
  };

  const deleteSong = (id) => {
    if (!confirm('この曲を削除しますか？（マイ単語に追加したフレーズは残ります）')) return;
    const next = { ...data, songs: data.songs.filter((s) => s.id !== id) };
    saveData(next);
    setScreen('songs');
  };

  const addSongLinesToVocab = (lines) => {
    const next = { ...data };
    const existingChinese = new Set(next.customWords.map((w) => w.chinese));
    let added = 0;
    for (const line of lines) {
      if (!line.cn?.trim() || !line.jp?.trim()) continue;
      if (existingChinese.has(line.cn.trim())) continue;
      next.customWords.push({
        id: 'c' + Date.now() + '_' + added,
        chinese: line.cn.trim(),
        pinyin: (line.py || '').trim(),
        japanese: line.jp.trim(),
        category: 'custom',
      });
      added += 1;
    }
    saveData(next);
    return added;
  };

  const resetAll = () => {
    if (confirm('このアカウントのデータをリセットしますか？（他のアカウントには影響しません）')) {
      saveData(DEFAULT_DATA);
      setScreen('home');
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0a0614] flex items-center justify-center">
        <div className="text-pink-400 text-lg animate-pulse" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>加载中...</div>
      </div>
    );
  }

  // First-time setup: no profiles exist
  if (profiles.length === 0) {
    return (
      <div className="min-h-screen relative" style={{ background: 'radial-gradient(ellipse at top, #1a0830 0%, #0a0614 60%, #050208 100%)', fontFamily: "'Noto Sans JP', sans-serif" }}>
        <FontAndGlobals />
        <ProfileSetupScreen onCreate={createProfile} isFirst={true} />
      </div>
    );
  }

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const activeSong = activeSongId ? data.songs.find((s) => s.id === activeSongId) : null;

  return (
    <div className="min-h-screen relative" style={{ background: 'radial-gradient(ellipse at top, #1a0830 0%, #0a0614 60%, #050208 100%)', fontFamily: "'Noto Sans JP', sans-serif" }}>
      <FontAndGlobals />
      <div className="max-w-md mx-auto pb-28 relative">
        {screen === 'home' && <HomeScreen data={data} allWords={allWords} activeProfile={activeProfile} onStart={(cfg) => { setStudyConfig(cfg); setScreen('study'); }} onNavigate={setScreen} onProfileClick={() => setShowProfileMenu(true)} />}
        {screen === 'study' && <StudyScreen config={studyConfig} allWords={allWords} mistakeIds={data.mistakeIds} onFinish={(results) => { recordStudy(results); setScreen('result'); setStudyConfig({ ...studyConfig, results }); }} onExit={() => setScreen(studyConfig?.backTo || 'home')} />}
        {screen === 'result' && <ResultScreen results={studyConfig?.results || []} allWords={allWords} onContinue={() => setScreen(studyConfig?.backTo || 'home')} />}
        {screen === 'mistakes' && <MistakesScreen mistakeIds={data.mistakeIds} allWords={allWords} onStart={(cfg) => { setStudyConfig(cfg); setScreen('study'); }} />}
        {screen === 'add' && <AddScreen customWords={data.customWords} onAdd={addCustomWord} onDelete={deleteCustomWord} />}
        {screen === 'stats' && <StatsScreen data={data} allWords={allWords} onReset={resetAll} />}
        {screen === 'songs' && <SongsListScreen songs={data.songs} onOpen={(id) => { setActiveSongId(id); setScreen('song-study'); }} onNew={() => { setActiveSongId('new'); setScreen('song-edit'); }} />}
        {screen === 'song-edit' && <SongEditScreen song={activeSongId === 'new' ? null : activeSong} onSave={(s) => { saveSong(s); setActiveSongId(s.id); setScreen('song-study'); }} onCancel={() => setScreen(activeSongId === 'new' ? 'songs' : 'song-study')} />}
        {screen === 'song-study' && activeSong && <SongStudyScreen song={activeSong} allWords={allWords} onEdit={() => setScreen('song-edit')} onDelete={() => deleteSong(activeSong.id)} onBack={() => setScreen('songs')} onAddAllToVocab={addSongLinesToVocab} onQuizSong={() => { setStudyConfig({ mode: 'mixed', wordIds: null, songLines: activeSong.lines, backTo: 'song-study' }); setScreen('study'); }} />}
        {screen === 'phrasebook' && <PhrasebookScreen allWords={allWords} progress={data.progress} mistakeIds={data.mistakeIds} onBack={() => setScreen('home')} onQuiz={(wordIds, mode) => { setStudyConfig({ mode: mode || 'mixed', wordIds, categoryKey: null, backTo: 'phrasebook' }); setScreen('study'); }} />}
      </div>
      {!['study', 'song-edit'].includes(screen) && <BottomNav current={screen} onChange={(s) => { setScreen(s); }} />}
      {showProfileMenu && (
        <ProfileMenuModal
          profiles={profiles}
          activeId={activeProfileId}
          onSwitch={switchProfile}
          onCreate={createProfile}
          onRename={renameProfile}
          onDelete={deleteProfile}
          onClose={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
}

function FontAndGlobals() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Sans+SC:wght@400;500;700;900&family=Bricolage+Grotesque:wght@600;800&family=JetBrains+Mono:wght@400;600&display=swap');
      .font-cn { font-family: 'Noto Sans SC', sans-serif; }
      .font-display { font-family: 'Bricolage Grotesque', sans-serif; letter-spacing: -0.02em; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      .grain::before {
        content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
        opacity: 0.06; mix-blend-mode: overlay;
      }
      @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pop { 0% { transform: scale(0.9); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(255, 45, 124, 0.3); } 50% { box-shadow: 0 0 35px rgba(255, 45, 124, 0.6); } }
      .animate-slideUp { animation: slideUp 0.4s ease-out; }
      .animate-pop { animation: pop 0.3s ease-out; }
      .animate-shake { animation: shake 0.4s ease-out; }
      .animate-glow { animation: glow 2s ease-in-out infinite; }
    `}</style>
  );
}

/* ---------- HOME ---------- */
function HomeScreen({ data, allWords, activeProfile, onStart, onNavigate, onProfileClick }) {
  const { stats, mistakeIds } = data;
  const xpInLevel = stats.xp % 100;
  const studiedToday = stats.lastStudyDate === todayISO();
  const [quizMode, setQuizMode] = useState('mixed');

  const modeLabels = {
    mixed: { label: 'ミックス', sub: '3種類をランダム', icon: Sparkles },
    listening: { label: 'リスニング', sub: '音を聞いて意味を当てる', icon: Volume2 },
    translation: { label: '作文', sub: '日本語→中国語', icon: Edit3 },
  };

  const categories = [
    { key: 'all', label: 'すべて', sub: `${allWords.length}語` },
    ...Object.keys(CATEGORY_LABELS).map((k) => ({
      key: k,
      label: CATEGORY_LABELS[k],
      sub: `${allWords.filter((w) => w.category === k).length}語`,
    })),
  ];

  return (
    <div className="px-5 pt-10 animate-slideUp">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-pink-400/70 text-xs tracking-[0.3em] uppercase font-mono mb-1">Chinese · 中文</div>
          <h1 className="font-display text-4xl font-extrabold text-white leading-none">
            你好<span className="text-pink-400">.</span>
          </h1>
          <div className="text-white/50 text-sm mt-1">
            {activeProfile ? `${activeProfile.emoji} ${activeProfile.name}さん、今日も一步一步 🌱` : '今日も一步一步 🌱'}
          </div>
        </div>
        <button onClick={onProfileClick} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition">
            {activeProfile?.emoji || '👤'}
          </div>
          <div className="text-white/50 text-[9px] uppercase tracking-widest font-mono">Lv.{stats.level}</div>
        </button>
      </div>

      {/* XP Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span className="text-white/60">あと {100 - xpInLevel} XP でレベルアップ</span>
          <span className="text-white font-mono">{xpInLevel}/100</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div className="h-full transition-all duration-700" style={{ width: `${xpInLevel}%`, background: 'linear-gradient(90deg, #ff2d7c 0%, #ffd60a 100%)' }} />
        </div>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <StatPill icon={<Flame className="w-4 h-4" />} value={stats.streak} label="連続日数" color="#ff2d7c" active={studiedToday} />
        <StatPill icon={<Zap className="w-4 h-4" />} value={stats.xp} label="Total XP" color="#ffd60a" />
        <StatPill icon={<AlertCircle className="w-4 h-4" />} value={mistakeIds.length} label="復習待ち" color="#00e5ff" />
      </div>

      {/* Mode Selector */}
      <div className="mb-3">
        <div className="text-white/50 text-[10px] uppercase tracking-widest font-mono mb-1.5">出題モード</div>
        <div className="flex gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          {Object.entries(modeLabels).map(([key, info]) => {
            const Icon = info.icon;
            const active = quizMode === key;
            return (
              <button
                key={key}
                onClick={() => setQuizMode(key)}
                className={`flex-1 py-2 px-2 rounded-lg flex flex-col items-center gap-0.5 transition ${active ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30' : 'border border-transparent hover:bg-white/5'}`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-pink-300' : 'text-white/50'}`} />
                <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-white/50'}`}>{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => onStart({ mode: quizMode, wordIds: null, categoryKey: 'all' })}
        className="w-full mb-3 p-5 rounded-2xl text-left relative overflow-hidden animate-glow"
        style={{ background: 'linear-gradient(135deg, #ff2d7c 0%, #c77dff 100%)' }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/80 text-xs uppercase tracking-widest mb-0.5">Quick Study</div>
            <div className="font-display text-2xl font-extrabold text-white">開始学習 →</div>
            <div className="text-white/90 text-xs mt-1">10問チャレンジ · {modeLabels[quizMode].sub}</div>
          </div>
          <Sparkles className="w-8 h-8 text-white/80" />
        </div>
        <div className="absolute -right-6 -bottom-6 text-white/10 font-display text-[120px] font-extrabold leading-none select-none">学</div>
      </button>

      {/* Mistakes Quick Access */}
      {mistakeIds.length > 0 && (
        <button
          onClick={() => onNavigate('mistakes')}
          className="w-full mb-6 p-4 rounded-2xl bg-white/5 backdrop-blur border border-cyan-400/30 hover:border-cyan-400/60 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-cyan-300 text-sm font-bold">間違えた単語 {mistakeIds.length}個</div>
              <div className="text-white/50 text-xs">復習して克服しよう</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        </button>
      )}

      {/* Category Picker */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-display text-lg font-extrabold">カテゴリから選ぶ</h2>
          <div className="text-white/40 text-xs font-mono">{categories.length} groups</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => {
            const count = c.key === 'all' ? allWords.length : allWords.filter((w) => w.category === c.key).length;
            if (count === 0 && c.key !== 'all') return null;
            const color = c.key === 'all' ? '#ffffff' : CATEGORY_COLORS[c.key] || '#ffffff';
            return (
              <button
                key={c.key}
                onClick={() => onStart({ mode: quizMode, wordIds: null, categoryKey: c.key })}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                <div className="text-white font-bold text-sm">{c.label}</div>
                <div className="text-white/40 text-xs font-mono">{count} 语</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Songs Access */}
      <div className="p-4 rounded-2xl border border-pink-400/20 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-pink-300" />
          </div>
          <div className="flex-1">
            <div className="text-pink-300 text-sm font-bold mb-0.5">歌詞で勉強する</div>
            <div className="text-white/60 text-xs leading-relaxed mb-2">WayVの歌詞を貼り付けて、行ごとに意味を勉強できます。</div>
            <button onClick={() => onNavigate('songs')} className="text-pink-400 text-xs font-bold hover:text-pink-300">歌詞ライブラリを開く →</button>
          </div>
        </div>
      </div>

      {/* Phrasebook Access */}
      <button
        onClick={() => onNavigate('phrasebook')}
        className="w-full p-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent mb-4 hover:border-cyan-400/40 transition text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="flex-1">
            <div className="text-cyan-300 text-sm font-bold mb-0.5">単語帳を見る</div>
            <div className="text-white/60 text-xs leading-relaxed">全 {allWords.length} 語を検索・絞り込みで確認</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      </button>
    </div>
  );
}

function StatPill({ icon, value, label, color, active }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="font-display text-xl font-extrabold">{value}</span>
      </div>
      <div className="text-white/50 text-[10px] leading-tight">{label}</div>
      {active && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px #4ade80' }} />}
    </div>
  );
}

/* ---------- STUDY (QUIZ) ---------- */
function StudyScreen({ config, allWords, mistakeIds, onFinish, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Build question pool
    let pool;
    if (config?.songLines) {
      // Convert song lines to quiz word format
      pool = config.songLines
        .filter((l) => l.cn?.trim() && l.jp?.trim())
        .map((l, i) => ({
          id: 'sl_' + i + '_' + (l.id || Date.now()),
          chinese: l.cn,
          pinyin: l.py || '',
          japanese: l.jp,
          category: 'custom',
        }));
    } else if (config?.wordIds) {
      pool = allWords.filter((w) => config.wordIds.includes(w.id));
    } else if (config?.categoryKey && config.categoryKey !== 'all') {
      pool = allWords.filter((w) => w.category === config.categoryKey);
    } else {
      pool = [...allWords];
    }
    if (pool.length < 2) { onExit(); return; }

    // For distractors, include allWords so song lines have varied wrong options
    const distractorPool = config?.songLines ? [...pool, ...allWords] : allWords;
    const selectedPool = shuffle(pool).slice(0, Math.min(10, pool.length));
    const qs = selectedPool.map((w) => {
      let dir;
      if (config?.mode === 'listening') {
        dir = 'listen';
      } else if (config?.mode === 'reading') {
        dir = 'cn2jp';
      } else if (config?.mode === 'translation') {
        dir = 'jp2cn';
      } else {
        // mixed: random mix of all three directions
        const r = Math.random();
        dir = r < 0.34 ? 'cn2jp' : r < 0.67 ? 'jp2cn' : 'listen';
      }
      const distractors = shuffle(distractorPool.filter((x) => x.id !== w.id && x.chinese !== w.chinese && x.japanese !== w.japanese)).slice(0, 3);
      const options = shuffle([w, ...distractors]);
      return { word: w, dir, options };
    });
    setQuestions(qs);
  }, []);

  if (questions.length === 0) {
    return <div className="pt-20 text-center text-white/60">Loading...</div>;
  }

  const q = questions[index];
  const progress = ((index + (showFeedback ? 1 : 0)) / questions.length) * 100;

  // Auto-play audio for listen questions
  useEffect(() => {
    if (q && q.dir === 'listen' && !showFeedback) {
      const t = setTimeout(() => speak(q.word.chinese), 300);
      return () => clearTimeout(t);
    }
  }, [index, q?.dir, showFeedback]);

  const handleSelect = (opt) => {
    if (showFeedback) return;
    setSelected(opt);
    setShowFeedback(true);
    const correct = opt.id === q.word.id;
    const newResults = [...results, { wordId: q.word.id, correct, word: q.word }];
    setResults(newResults);
    if (correct) speak(q.word.chinese);

    setTimeout(() => {
      if (index + 1 >= questions.length) {
        onFinish(newResults);
      } else {
        setIndex(index + 1);
        setSelected(null);
        setShowFeedback(false);
      }
    }, 1400);
  };

  return (
    <div className="px-5 pt-8 pb-10 animate-slideUp">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onExit} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10">
          <X className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff2d7c, #ffd60a)' }} />
        </div>
        <div className="text-white/60 text-sm font-mono">{index + 1}/{questions.length}</div>
      </div>

      {/* Question */}
      <div className={`mb-8 p-6 rounded-3xl text-center border transition-all ${showFeedback ? (selected?.id === q.word.id ? 'border-green-400/50 bg-green-400/5' : 'border-red-400/50 bg-red-400/5 animate-shake') : 'border-white/10 bg-white/[0.03]'}`}>
        <div className="text-white/40 text-xs uppercase tracking-widest mb-3 font-mono">
          {q.dir === 'cn2jp' ? 'この中国語の意味は？' : q.dir === 'listen' ? '聞こえた言葉の意味は？' : 'この日本語を中国語で？'}
        </div>
        {q.dir === 'cn2jp' ? (
          <div>
            <div className="font-cn text-5xl font-black text-white mb-2 tracking-tight">{q.word.chinese}</div>
            <button onClick={() => speak(q.word.chinese)} className="inline-flex items-center gap-1.5 text-pink-400 text-sm mt-2">
              <Volume2 className="w-4 h-4" />
              <span className="font-mono">{q.word.pinyin}</span>
            </button>
          </div>
        ) : q.dir === 'listen' ? (
          <div className="py-4">
            <button
              onClick={() => speak(q.word.chinese)}
              className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-3 active:scale-95 transition"
              style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)', boxShadow: '0 0 40px rgba(255,45,124,0.4)' }}
            >
              <Volume2 className="w-10 h-10 text-white" />
            </button>
            <div className="text-white/50 text-xs">タップでもう一度聞く</div>
            {showFeedback && (
              <div className="mt-3 font-cn text-2xl font-bold text-white animate-slideUp">
                {q.word.chinese}
                <span className="ml-2 text-pink-300/80 text-sm font-mono">{q.word.pinyin}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-3xl font-bold text-white py-3 leading-snug">{q.word.japanese}</div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {q.options.map((opt) => {
          const isCorrect = showFeedback && opt.id === q.word.id;
          const isWrong = showFeedback && selected?.id === opt.id && opt.id !== q.word.id;
          const dim = showFeedback && !isCorrect && !isWrong;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-2xl text-left transition-all border-2 ${
                isCorrect ? 'bg-green-400/10 border-green-400 animate-pop' :
                isWrong ? 'bg-red-400/10 border-red-400' :
                dim ? 'bg-white/[0.02] border-white/5 opacity-40' :
                'bg-white/5 border-white/10 hover:border-pink-400/50 hover:bg-white/10 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {q.dir === 'cn2jp' || q.dir === 'listen' ? (
                    <div className="text-white text-base">{opt.japanese}</div>
                  ) : (
                    <div>
                      <div className="font-cn text-xl font-bold text-white">{opt.chinese}</div>
                      <div className="text-white/40 text-xs font-mono mt-0.5">{opt.pinyin}</div>
                    </div>
                  )}
                </div>
                {isCorrect && <Check className="w-5 h-5 text-green-400 flex-shrink-0" />}
                {isWrong && <X className="w-5 h-5 text-red-400 flex-shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback bar */}
      {showFeedback && (
        <div className="mt-5 animate-slideUp">
          <div className={`text-center text-sm font-bold ${selected?.id === q.word.id ? 'text-green-400' : 'text-red-400'}`}>
            {selected?.id === q.word.id ? '✓ 正解！ +10 XP' : '✗ もう一度'}
          </div>
          {selected?.id !== q.word.id && (
            <div className="mt-2 text-center text-white/60 text-xs">
              <span className="font-cn font-bold">{q.word.chinese}</span>
              <span className="mx-2 font-mono">{q.word.pinyin}</span>
              <span>{q.word.japanese}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- RESULT ---------- */
function ResultScreen({ results, allWords, onContinue }) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongWords = results.filter((r) => !r.correct).map((r) => r.word);

  return (
    <div className="px-5 pt-12 animate-slideUp">
      <div className="text-center mb-6">
        <div className="text-pink-400/70 text-xs uppercase tracking-[0.3em] font-mono mb-2">Session Complete</div>
        <div className="font-display text-7xl font-extrabold text-white mb-1">{pct}<span className="text-pink-400 text-4xl">%</span></div>
        <div className="text-white/50 text-sm">{correct} / {total} 正解 · +{correct * 10} XP</div>
      </div>

      <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 mb-5">
        <div className="flex gap-2 mb-4">
          {results.map((r, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${r.correct ? 'bg-green-400' : 'bg-red-400/70'}`} />
          ))}
        </div>
        {pct === 100 && <div className="text-center text-green-400 text-sm font-bold mb-1">🎉 全問正解！太厉害了！</div>}
        {pct >= 70 && pct < 100 && <div className="text-center text-yellow-400 text-sm font-bold mb-1">👏 いい調子！继续加油！</div>}
        {pct < 70 && <div className="text-center text-cyan-300 text-sm font-bold mb-1">💪 復習して再挑戦しよう</div>}
      </div>

      {wrongWords.length > 0 && (
        <div className="mb-5">
          <div className="text-white/60 text-xs uppercase tracking-widest mb-2 font-mono">Review · 復習単語</div>
          <div className="space-y-2">
            {wrongWords.map((w) => (
              <div key={w.id} className="p-3 rounded-xl bg-red-400/5 border border-red-400/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-cn text-xl font-bold text-white">{w.chinese}</div>
                    <div className="text-white/50 text-xs font-mono">{w.pinyin}</div>
                  </div>
                  <div className="text-white/70 text-sm text-right">{w.japanese}</div>
                  <button onClick={() => speak(w.chinese)} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4 text-pink-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onContinue} className="w-full p-4 rounded-2xl font-display font-extrabold text-lg text-white" style={{ background: 'linear-gradient(135deg, #ff2d7c 0%, #c77dff 100%)' }}>
        ホームに戻る
      </button>
    </div>
  );
}

/* ---------- MISTAKES ---------- */
function MistakesScreen({ mistakeIds, allWords, onStart }) {
  const mistakeWords = mistakeIds.map((id) => allWords.find((w) => w.id === id)).filter(Boolean);

  return (
    <div className="px-5 pt-10 animate-slideUp">
      <div className="mb-6">
        <div className="text-cyan-300/70 text-xs uppercase tracking-[0.3em] font-mono mb-1">Mistakes</div>
        <h1 className="font-display text-3xl font-extrabold text-white">間違えた単語</h1>
        <div className="text-white/50 text-sm mt-1">{mistakeWords.length}個の単語が復習待ち</div>
      </div>

      {mistakeWords.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-5xl mb-3">🌸</div>
          <div className="text-white font-bold mb-1">間違いなし！</div>
          <div className="text-white/50 text-sm">学習を続けて、新しい単語にチャレンジしよう</div>
        </div>
      ) : (
        <>
          <button
            onClick={() => onStart({ mode: 'mixed', wordIds: mistakeIds, categoryKey: 'mistakes' })}
            className="w-full mb-5 p-4 rounded-2xl font-display font-extrabold text-lg text-white"
            style={{ background: 'linear-gradient(135deg, #00e5ff 0%, #c77dff 100%)' }}
          >
            まとめて復習する →
          </button>

          <div className="space-y-2">
            {mistakeWords.map((w) => (
              <div key={w.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-cn text-2xl font-bold text-white leading-tight">{w.chinese}</div>
                  <div className="text-white/50 text-xs font-mono">{w.pinyin}</div>
                  <div className="text-white/70 text-sm mt-0.5">{w.japanese}</div>
                </div>
                <button onClick={() => speak(w.chinese)} className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-4 h-4 text-pink-400" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- ADD CUSTOM ---------- */
function AddScreen({ customWords, onAdd, onDelete }) {
  const [chinese, setChinese] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [japanese, setJapanese] = useState('');

  const handleAdd = () => {
    if (!chinese.trim() || !japanese.trim()) return;
    onAdd({ chinese: chinese.trim(), pinyin: pinyin.trim(), japanese: japanese.trim() });
    setChinese(''); setPinyin(''); setJapanese('');
  };

  return (
    <div className="px-5 pt-10 animate-slideUp">
      <div className="mb-5">
        <div className="text-yellow-300/70 text-xs uppercase tracking-[0.3em] font-mono mb-1">Custom</div>
        <h1 className="font-display text-3xl font-extrabold text-white">マイ単語を追加</h1>
        <div className="text-white/50 text-sm mt-1">歌詞・ドラマのセリフなど自由に登録</div>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6">
        <label className="block mb-3">
          <div className="text-white/60 text-xs uppercase tracking-widest mb-1.5 font-mono">中文 (中国語)</div>
          <input value={chinese} onChange={(e) => setChinese(e.target.value)} placeholder="例: 永远的你" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white font-cn text-lg focus:outline-none focus:border-pink-400/50" />
        </label>
        <label className="block mb-3">
          <div className="text-white/60 text-xs uppercase tracking-widest mb-1.5 font-mono">拼音 (任意)</div>
          <input value={pinyin} onChange={(e) => setPinyin(e.target.value)} placeholder="例: yǒng yuǎn de nǐ" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-pink-400/50" />
        </label>
        <label className="block mb-4">
          <div className="text-white/60 text-xs uppercase tracking-widest mb-1.5 font-mono">日本語訳</div>
          <input value={japanese} onChange={(e) => setJapanese(e.target.value)} placeholder="例: 永遠のあなた" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-400/50" />
        </label>
        <button onClick={handleAdd} disabled={!chinese.trim() || !japanese.trim()} className="w-full p-3.5 rounded-xl font-bold text-white disabled:opacity-30 transition" style={{ background: 'linear-gradient(135deg, #ffd60a 0%, #ff2d7c 100%)' }}>
          <Plus className="w-4 h-4 inline mr-1" />
          追加する
        </button>
      </div>

      {customWords.length > 0 && (
        <div>
          <div className="text-white/60 text-xs uppercase tracking-widest mb-2 font-mono">登録済み · {customWords.length}個</div>
          <div className="space-y-2">
            {customWords.slice().reverse().map((w) => (
              <div key={w.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-cn text-lg font-bold text-white truncate">{w.chinese}</div>
                  {w.pinyin && <div className="text-white/50 text-xs font-mono truncate">{w.pinyin}</div>}
                  <div className="text-white/70 text-sm truncate">{w.japanese}</div>
                </div>
                <button onClick={() => speak(w.chinese)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                </button>
                <button onClick={() => onDelete(w.id)} className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- STATS ---------- */
function StatsScreen({ data, allWords, onReset }) {
  const { stats, progress } = data;
  const learnedIds = Object.keys(progress).filter((id) => progress[id].correctCount > 0);
  const masteredIds = Object.keys(progress).filter((id) => progress[id].correctCount >= 3 && progress[id].wrongCount === 0);
  const totalAttempts = stats.totalCorrect + stats.totalWrong;
  const accuracy = totalAttempts > 0 ? Math.round((stats.totalCorrect / totalAttempts) * 100) : 0;

  // Top struggling words
  const struggling = Object.keys(progress)
    .map((id) => ({ id, ...progress[id], word: allWords.find((w) => w.id === id) }))
    .filter((x) => x.word && x.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  return (
    <div className="px-5 pt-10 animate-slideUp">
      <div className="mb-6">
        <div className="text-cyan-300/70 text-xs uppercase tracking-[0.3em] font-mono mb-1">Progress</div>
        <h1 className="font-display text-3xl font-extrabold text-white">学習データ</h1>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <BigStat label="学習した単語" value={learnedIds.length} sub={`/ ${allWords.length} 語`} color="#ff2d7c" />
        <BigStat label="マスター" value={masteredIds.length} sub="3回以上正解" color="#ffd60a" />
        <BigStat label="正答率" value={`${accuracy}%`} sub={`${totalAttempts} 回中`} color="#00e5ff" />
        <BigStat label="学習日数" value={stats.daysStudied} sub="日" color="#c77dff" />
      </div>

      {struggling.length > 0 && (
        <div className="mb-5">
          <div className="text-white/60 text-xs uppercase tracking-widest mb-2 font-mono">苦手な単語 TOP {struggling.length}</div>
          <div className="space-y-2">
            {struggling.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-cn text-lg font-bold text-white">{s.word.chinese}</div>
                  <div className="text-white/50 text-xs">{s.word.japanese}</div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-mono text-sm font-bold">✗ {s.wrongCount}</div>
                  <div className="text-green-400 font-mono text-xs">✓ {s.correctCount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onReset} className="w-full p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-bold mt-4">
        すべてのデータをリセット
      </button>
    </div>
  );
}

function BigStat({ label, value, sub, color }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
      <div className="text-white/50 text-[10px] uppercase tracking-widest font-mono mb-1">{label}</div>
      <div className="font-display text-3xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-white/40 text-xs font-mono">{sub}</div>
    </div>
  );
}

/* ---------- SONGS LIST ---------- */
function SongsListScreen({ songs, onOpen, onNew }) {
  return (
    <div className="px-5 pt-10 animate-slideUp">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-pink-400/70 text-xs uppercase tracking-[0.3em] font-mono mb-1">Lyrics Library</div>
          <h1 className="font-display text-3xl font-extrabold text-white">歌詞で学ぶ</h1>
          <div className="text-white/50 text-sm mt-1">{songs.length}曲を保存中</div>
        </div>
        <button onClick={onNew} className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)' }}>
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {songs.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
          <Music className="w-10 h-10 text-pink-400/60 mx-auto mb-3" />
          <div className="text-white font-bold mb-1">まだ曲がありません</div>
          <div className="text-white/50 text-sm mb-4">好きな歌詞を貼り付けて追加しよう</div>
          <button onClick={onNew} className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)' }}>
            <Plus className="w-4 h-4 inline mr-1" />
            新しい曲を追加
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {songs.slice().reverse().map((song) => (
            <button
              key={song.id}
              onClick={() => onOpen(song.id)}
              className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-pink-400/40 hover:bg-white/[0.05] transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(255,45,124,0.3), rgba(199,125,255,0.3))' }}>
                  <Music className="w-5 h-5 text-pink-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-cn text-lg font-bold text-white truncate">{song.title || '(無題)'}</div>
                  {song.artist && <div className="text-white/50 text-xs truncate">{song.artist}</div>}
                  <div className="text-white/40 text-[10px] font-mono mt-0.5">{song.lines.length} 行</div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- SONG EDIT ---------- */
function SongEditScreen({ song, onSave, onCancel }) {
  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [lines, setLines] = useState(song?.lines || [{ id: 'l0', cn: '', py: '', jp: '' }]);
  const [mode, setMode] = useState('line'); // 'line' or 'bulk'
  const [bulkCn, setBulkCn] = useState('');
  const [bulkJp, setBulkJp] = useState('');

  const updateLine = (idx, field, value) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  };

  const addLine = () => {
    setLines([...lines, { id: 'l' + Date.now(), cn: '', py: '', jp: '' }]);
  };

  const removeLine = (idx) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const importBulk = () => {
    const cnLines = bulkCn.split('\n').map((l) => l.trim());
    const jpLines = bulkJp.split('\n').map((l) => l.trim());
    const maxLen = Math.max(cnLines.length, jpLines.length);
    const imported = [];
    for (let i = 0; i < maxLen; i++) {
      const cn = cnLines[i] || '';
      const jp = jpLines[i] || '';
      if (!cn && !jp) continue;
      imported.push({ id: 'l' + Date.now() + '_' + i, cn, py: '', jp });
    }
    if (imported.length > 0) {
      // Merge with existing non-empty lines
      const existing = lines.filter((l) => l.cn.trim() || l.jp.trim());
      setLines([...existing, ...imported]);
      setBulkCn('');
      setBulkJp('');
      setMode('line');
    }
  };

  const handleSave = () => {
    const cleanLines = lines.filter((l) => l.cn.trim() || l.jp.trim());
    if (!title.trim() || cleanLines.length === 0) {
      alert('曲名と少なくとも1行の歌詞が必要です');
      return;
    }
    onSave({
      id: song?.id || 's' + Date.now(),
      title: title.trim(),
      artist: artist.trim(),
      lines: cleanLines,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="px-5 pt-8 pb-10 animate-slideUp">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex-1">
          <div className="text-pink-400/70 text-xs uppercase tracking-widest font-mono">Edit</div>
          <div className="text-white font-display text-xl font-extrabold">{song ? '曲を編集' : '新しい曲'}</div>
        </div>
        <button onClick={handleSave} className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)' }}>
          <Save className="w-4 h-4 inline mr-1" />
          保存
        </button>
      </div>

      {/* Title/Artist */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-4">
        <label className="block mb-3">
          <div className="text-white/60 text-[10px] uppercase tracking-widest mb-1 font-mono">曲名 *</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: Love Talk 中文版" className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-pink-400/50 text-sm" />
        </label>
        <label className="block">
          <div className="text-white/60 text-[10px] uppercase tracking-widest mb-1 font-mono">アーティスト</div>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="例: WayV / 威神V" className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-pink-400/50 text-sm" />
        </label>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-3 bg-white/[0.03] p-1 rounded-xl border border-white/10">
        <button onClick={() => setMode('line')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mode === 'line' ? 'bg-white/10 text-white' : 'text-white/50'}`}>
          1行ずつ入力
        </button>
        <button onClick={() => setMode('bulk')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mode === 'bulk' ? 'bg-white/10 text-white' : 'text-white/50'}`}>
          まとめて貼付け
        </button>
      </div>

      {mode === 'bulk' ? (
        <div className="space-y-3 mb-3">
          <div className="p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/20 text-xs text-cyan-200 leading-relaxed">
            💡 中国語と日本語訳をそれぞれのボックスに改行で貼り付け。行数を合わせると自動で対応します。
          </div>
          <label className="block">
            <div className="text-white/60 text-[10px] uppercase tracking-widest mb-1 font-mono">中国語（改行区切り）</div>
            <textarea value={bulkCn} onChange={(e) => setBulkCn(e.target.value)} placeholder="第一行&#10;第二行&#10;第三行" rows={6} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white font-cn focus:outline-none focus:border-pink-400/50 text-sm resize-none" />
          </label>
          <label className="block">
            <div className="text-white/60 text-[10px] uppercase tracking-widest mb-1 font-mono">日本語訳（改行区切り）</div>
            <textarea value={bulkJp} onChange={(e) => setBulkJp(e.target.value)} placeholder="1行目の訳&#10;2行目の訳&#10;3行目の訳" rows={6} className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-pink-400/50 text-sm resize-none" />
          </label>
          <button onClick={importBulk} disabled={!bulkCn.trim()} className="w-full p-3 rounded-xl font-bold text-white text-sm disabled:opacity-30" style={{ background: 'linear-gradient(135deg, #00e5ff, #c77dff)' }}>
            取り込む
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {lines.map((line, idx) => (
            <div key={line.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white/40 text-[10px] font-mono">行 {idx + 1}</div>
                <button onClick={() => removeLine(idx)} disabled={lines.length <= 1} className="w-6 h-6 rounded-lg bg-red-400/10 flex items-center justify-center disabled:opacity-30">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
              <input value={line.cn} onChange={(e) => updateLine(idx, 'cn', e.target.value)} placeholder="中国語" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white font-cn text-sm mb-1.5 focus:outline-none focus:border-pink-400/50" />
              <input value={line.py} onChange={(e) => updateLine(idx, 'py', e.target.value)} placeholder="拼音（任意）" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white font-mono text-xs mb-1.5 focus:outline-none focus:border-pink-400/50" />
              <input value={line.jp} onChange={(e) => updateLine(idx, 'jp', e.target.value)} placeholder="日本語訳" className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-pink-400/50" />
            </div>
          ))}
          <button onClick={addLine} className="w-full p-3 rounded-xl border-2 border-dashed border-white/20 text-white/60 text-sm font-bold hover:border-pink-400/50 hover:text-pink-400 transition">
            <Plus className="w-4 h-4 inline mr-1" />
            行を追加
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- SONG STUDY ---------- */
function SongStudyScreen({ song, allWords, onEdit, onDelete, onBack, onAddAllToVocab, onQuizSong }) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showJapanese, setShowJapanese] = useState(true);
  const [hiddenJpLines, setHiddenJpLines] = useState(new Set());
  const [playingIdx, setPlayingIdx] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const playIntervalRef = useRef(null);

  useEffect(() => () => {
    if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }, []);

  const toggleLineJp = (idx) => {
    const next = new Set(hiddenJpLines);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setHiddenJpLines(next);
  };

  const playLine = (idx) => {
    setPlayingIdx(idx);
    speak(song.lines[idx].cn);
    // Clear playing state after estimate
    setTimeout(() => setPlayingIdx((p) => (p === idx ? null : p)), 2500);
  };

  const playAll = () => {
    let i = 0;
    const playNext = () => {
      if (i >= song.lines.length) {
        setPlayingIdx(null);
        return;
      }
      setPlayingIdx(i);
      speak(song.lines[i].cn);
      // estimate duration based on chars
      const dur = Math.max(1500, song.lines[i].cn.length * 250);
      i += 1;
      playIntervalRef.current = setTimeout(playNext, dur);
    };
    playNext();
  };

  const stopPlaying = () => {
    if (playIntervalRef.current) clearTimeout(playIntervalRef.current);
    try { window.speechSynthesis.cancel(); } catch (e) {}
    setPlayingIdx(null);
  };

  const handleAddAll = () => {
    const count = onAddAllToVocab(song.lines);
    alert(`${count}個のフレーズをマイ単語に追加しました`);
    setMenuOpen(false);
  };

  const quizable = song.lines.filter((l) => l.cn?.trim() && l.jp?.trim()).length;

  return (
    <div className="pt-8 pb-10 animate-slideUp">
      {/* Header */}
      <div className="px-5 flex items-center gap-2 mb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-cn font-extrabold text-lg text-white truncate leading-tight">{song.title}</div>
          {song.artist && <div className="text-white/50 text-xs truncate">{song.artist}</div>}
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white/70" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 p-1 z-30 shadow-xl">
              <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/5 text-left text-sm text-white/80">
                <Edit3 className="w-4 h-4" /> 編集する
              </button>
              <button onClick={handleAddAll} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/5 text-left text-sm text-white/80">
                <ListPlus className="w-4 h-4" /> 全行をマイ単語に追加
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-red-500/10 text-left text-sm text-red-400">
                <Trash2 className="w-4 h-4" /> 曲を削除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={playingIdx !== null ? stopPlaying : playAll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)' }}
        >
          {playingIdx !== null ? <><X className="w-3.5 h-3.5" />停止</> : <><Play className="w-3.5 h-3.5" />通しで再生</>}
        </button>
        <button onClick={() => setShowPinyin(!showPinyin)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold flex-shrink-0 border transition ${showPinyin ? 'bg-cyan-400/10 border-cyan-400/40 text-cyan-300' : 'bg-white/5 border-white/10 text-white/50'}`}>
          拼音 {showPinyin ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => { setShowJapanese(!showJapanese); setHiddenJpLines(new Set()); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold flex-shrink-0 border transition ${showJapanese ? 'bg-yellow-400/10 border-yellow-400/40 text-yellow-300' : 'bg-white/5 border-white/10 text-white/50'}`}>
          訳 {showJapanese ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Quiz CTA */}
      {quizable >= 2 && (
        <div className="px-5 mb-4">
          <button onClick={onQuizSong} className="w-full p-3.5 rounded-2xl border border-pink-400/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent flex items-center gap-3 hover:border-pink-400/60 transition">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <div className="flex-1 text-left">
              <div className="text-white text-sm font-bold">この曲のフレーズでクイズ</div>
              <div className="text-white/50 text-xs">{quizable} 行から出題</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </button>
        </div>
      )}

      {/* Lines */}
      <div className="px-5 space-y-2">
        {song.lines.map((line, idx) => {
          const jpHidden = !showJapanese || hiddenJpLines.has(idx);
          const isPlaying = playingIdx === idx;
          return (
            <div
              key={line.id || idx}
              className={`p-3.5 rounded-2xl border transition-all ${isPlaying ? 'border-pink-400/60 bg-pink-400/5 animate-glow' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-white/30 text-[10px] font-mono w-6 pt-1 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-cn text-xl font-bold text-white leading-snug mb-0.5 break-words">{line.cn}</div>
                  {showPinyin && line.py && (
                    <div className="text-pink-300/80 text-xs font-mono mb-1 break-words">{line.py}</div>
                  )}
                  {line.jp && (
                    <button
                      onClick={() => showJapanese && toggleLineJp(idx)}
                      className="w-full text-left"
                    >
                      {jpHidden ? (
                        <div className="text-white/30 text-xs italic flex items-center gap-1.5">
                          <EyeOff className="w-3 h-3" />
                          訳を隠しています {showJapanese && '(タップで表示)'}
                        </div>
                      ) : (
                        <div className="text-white/75 text-sm leading-snug break-words">{line.jp}</div>
                      )}
                    </button>
                  )}
                </div>
                <button onClick={() => playLine(idx)} className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPlaying ? 'bg-pink-400/30' : 'bg-white/5 hover:bg-white/10'}`}>
                  <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-pink-300' : 'text-pink-400/70'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- PHRASEBOOK ---------- */
function PhrasebookScreen({ allWords, progress, mistakeIds, onBack, onQuiz }) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | unseen | learning | mastered | mistake
  const [selected, setSelected] = useState(null);

  const categories = [
    { key: 'all', label: 'すべて' },
    ...Object.keys(CATEGORY_LABELS).filter((k) => allWords.some((w) => w.category === k)).map((k) => ({
      key: k,
      label: CATEGORY_LABELS[k],
    })),
  ];

  const statusOf = (wordId) => {
    const p = progress?.[wordId];
    if (mistakeIds?.includes(wordId)) return 'mistake';
    if (!p || p.correctCount === 0) return 'unseen';
    if (p.correctCount >= 3 && p.wrongCount === 0) return 'mastered';
    return 'learning';
  };

  const STATUS_COLORS = {
    unseen: '#ffffff40',
    learning: '#ffd60a',
    mastered: '#4ade80',
    mistake: '#ff4d6d',
  };
  const STATUS_LABELS = {
    unseen: '未学習',
    learning: '学習中',
    mastered: 'マスター',
    mistake: '要復習',
  };

  const q = query.trim().toLowerCase();
  const filtered = allWords.filter((w) => {
    if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && statusOf(w.id) !== statusFilter) return false;
    if (!q) return true;
    return (
      w.chinese.toLowerCase().includes(q) ||
      (w.pinyin || '').toLowerCase().includes(q) ||
      w.japanese.toLowerCase().includes(q)
    );
  });

  const statusCounts = ['unseen', 'learning', 'mastered', 'mistake'].reduce((acc, k) => {
    acc[k] = allWords.filter((w) => statusOf(w.id) === k).length;
    return acc;
  }, {});

  return (
    <div className="pt-8 pb-10 animate-slideUp">
      {/* Header */}
      <div className="px-5 flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex-1">
          <div className="text-cyan-300/70 text-xs uppercase tracking-widest font-mono">Phrasebook</div>
          <h1 className="font-display text-2xl font-extrabold text-white">単語帳</h1>
        </div>
        <div className="text-white/50 text-xs font-mono">{filtered.length} / {allWords.length}</div>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="中国語・拼音・日本語で検索..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400/50"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
              <X className="w-3 h-3 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-3 overflow-x-auto no-scrollbar">
        <div className="px-5 flex gap-1.5 pb-1" style={{ width: 'max-content', minWidth: '100%' }}>
          {categories.map((c) => {
            const active = categoryFilter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                  active ? 'bg-pink-500/20 border-pink-400/50 text-pink-200' : 'bg-white/[0.03] border-white/10 text-white/60'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter */}
      <div className="px-5 mb-3 grid grid-cols-4 gap-1.5">
        {[
          { key: 'all', label: 'すべて', count: allWords.length },
          { key: 'mastered', label: 'マスター', count: statusCounts.mastered },
          { key: 'learning', label: '学習中', count: statusCounts.learning },
          { key: 'mistake', label: '要復習', count: statusCounts.mistake },
        ].map((s) => {
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`p-2 rounded-lg border transition text-center ${active ? 'bg-white/10 border-white/30' : 'bg-white/[0.02] border-white/5'}`}
            >
              <div className={`text-xs font-bold ${active ? 'text-white' : 'text-white/50'}`}>{s.label}</div>
              <div className={`text-[10px] font-mono ${active ? 'text-cyan-300' : 'text-white/40'}`}>{s.count}</div>
            </button>
          );
        })}
      </div>

      {/* Quiz filtered */}
      {filtered.length >= 2 && (categoryFilter !== 'all' || statusFilter !== 'all' || query) && (
        <div className="px-5 mb-3">
          <button
            onClick={() => onQuiz(filtered.map((w) => w.id), 'mixed')}
            className="w-full p-3 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #00e5ff, #c77dff)' }}
          >
            <Sparkles className="w-4 h-4" />
            絞り込んだ {filtered.length} 語でクイズ
          </button>
        </div>
      )}

      {/* Word List */}
      <div className="px-5 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-white/40 text-sm">該当する単語がありません</div>
          </div>
        ) : (
          filtered.map((w) => {
            const status = statusOf(w.id);
            const isOpen = selected === w.id;
            const p = progress?.[w.id];
            return (
              <div
                key={w.id}
                className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setSelected(isOpen ? null : w.id)}
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/[0.02]"
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-cn text-lg font-bold text-white leading-tight truncate">{w.chinese}</div>
                    <div className="flex items-center gap-2 text-[11px] mt-0.5">
                      {w.pinyin && <span className="text-pink-300/80 font-mono truncate">{w.pinyin}</span>}
                      <span className="text-white/60 truncate">{w.japanese}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(w.chinese); }}
                    className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 hover:bg-white/10"
                  >
                    <Volume2 className="w-4 h-4 text-pink-400" />
                  </button>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5 bg-black/20 animate-slideUp">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status] }}>
                        {STATUS_LABELS[status]}
                      </div>
                      <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-white/60">
                        {CATEGORY_LABELS[w.category] || w.category}
                      </div>
                      {p && (
                        <div className="text-[10px] font-mono text-white/50">
                          <span className="text-green-400">✓{p.correctCount}</span>
                          <span className="mx-1.5 text-red-400">✗{p.wrongCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-white/70 text-sm leading-relaxed">{w.japanese}</div>
                    <button
                      onClick={() => onQuiz([w.id], 'mixed')}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-400/30 text-pink-300 text-xs font-bold"
                    >
                      この単語を練習
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- PROFILE SETUP ---------- */
function ProfileSetupScreen({ onCreate, isFirst }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌸');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-slideUp relative">
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="text-pink-400/70 text-xs tracking-[0.3em] uppercase font-mono mb-2">Welcome</div>
          <div className="font-display text-6xl font-extrabold text-white leading-none mb-3">
            你好<span className="text-pink-400">.</span>
          </div>
          <div className="text-white/60 text-sm">
            {isFirst ? 'まずアカウントを作成しましょう' : '新しいアカウントを作成'}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-white/60 text-[10px] uppercase tracking-widest mb-2 font-mono">アイコンを選ぶ</div>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`aspect-square rounded-xl text-xl flex items-center justify-center transition ${emoji === e ? 'bg-pink-500/20 border-2 border-pink-400 scale-105' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <label className="block mb-6">
          <div className="text-white/60 text-[10px] uppercase tracking-widest mb-2 font-mono">ニックネーム</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="あなたの名前"
            maxLength={20}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-pink-400/50 text-base"
          />
        </label>

        <button
          onClick={() => name.trim() && onCreate(name, emoji)}
          disabled={!name.trim()}
          className="w-full p-4 rounded-2xl font-display font-extrabold text-lg text-white disabled:opacity-30 transition"
          style={{ background: 'linear-gradient(135deg, #ff2d7c 0%, #c77dff 100%)' }}
        >
          开始学习 →
        </button>

        <div className="text-center text-white/30 text-[10px] mt-6 font-mono">
          各アカウントは個別に進捗が保存されます
        </div>
      </div>
    </div>
  );
}

/* ---------- PROFILE MENU ---------- */
function ProfileMenuModal({ profiles, activeId, onSwitch, onCreate, onRename, onDelete, onClose }) {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('🌸');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🌸');

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditEmoji(p.emoji);
    setView('edit');
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    onRename(editingId, editName, editEmoji);
    setView('list');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName, newEmoji);
    setNewName('');
    setNewEmoji('🌸');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slideUp">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0f0820] border-t border-white/10 sm:border sm:rounded-3xl rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {view === 'list' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-pink-400/70 text-[10px] uppercase tracking-[0.3em] font-mono">Accounts</div>
                <h2 className="font-display text-2xl font-extrabold text-white">アカウント切替</h2>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {profiles.map((p) => {
                const active = p.id === activeId;
                return (
                  <div key={p.id} className={`p-3 rounded-2xl border flex items-center gap-3 transition ${active ? 'border-pink-400/50 bg-pink-400/5' : 'border-white/10 bg-white/[0.03]'}`}>
                    <button onClick={() => onSwitch(p.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${active ? 'bg-gradient-to-br from-pink-500/40 to-purple-500/40' : 'bg-white/5'}`}>
                        {p.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                          {p.name}
                          {active && <span className="text-[9px] bg-pink-400/20 text-pink-300 px-1.5 py-0.5 rounded-full font-mono">ACTIVE</span>}
                        </div>
                        <div className="text-white/40 text-[10px] font-mono">ID: {p.id.slice(0, 10)}</div>
                      </div>
                    </button>
                    <button onClick={() => startEdit(p)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Edit3 className="w-3.5 h-3.5 text-white/60" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setView('create')}
              className="w-full p-3.5 rounded-2xl border-2 border-dashed border-white/15 text-white/70 font-bold text-sm hover:border-pink-400/50 hover:text-pink-400 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新しいアカウントを追加
            </button>

            <div className="text-center text-white/30 text-[10px] mt-4 font-mono leading-relaxed">
              各アカウントは独立したXP・進捗・単語・歌詞を保持します
            </div>
          </>
        )}

        {view === 'create' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setView('list')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
              <h2 className="font-display text-xl font-extrabold text-white">新しいアカウント</h2>
            </div>

            <div className="mb-4">
              <div className="text-white/60 text-[10px] uppercase tracking-widest mb-2 font-mono">アイコン</div>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`aspect-square rounded-xl text-lg flex items-center justify-center transition ${newEmoji === e ? 'bg-pink-500/20 border-2 border-pink-400' : 'bg-white/5 border-2 border-transparent'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <label className="block mb-5">
              <div className="text-white/60 text-[10px] uppercase tracking-widest mb-2 font-mono">ニックネーム</div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="名前を入力"
                maxLength={20}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-400/50"
              />
            </label>

            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="w-full p-3.5 rounded-2xl font-bold text-white disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)' }}
            >
              作成して切替
            </button>
          </>
        )}

        {view === 'edit' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setView('list')} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
              <h2 className="font-display text-xl font-extrabold text-white">アカウント編集</h2>
            </div>

            <div className="mb-4">
              <div className="text-white/60 text-[10px] uppercase tracking-widest mb-2 font-mono">アイコン</div>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEditEmoji(e)}
                    className={`aspect-square rounded-xl text-lg flex items-center justify-center transition ${editEmoji === e ? 'bg-pink-500/20 border-2 border-pink-400' : 'bg-white/5 border-2 border-transparent'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <label className="block mb-5">
              <div className="text-white/60 text-[10px] uppercase tracking-widest mb-2 font-mono">ニックネーム</div>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-pink-400/50"
              />
            </label>

            <button
              onClick={saveEdit}
              disabled={!editName.trim()}
              className="w-full p-3.5 rounded-2xl font-bold text-white disabled:opacity-30 mb-2"
              style={{ background: 'linear-gradient(135deg, #ff2d7c, #c77dff)' }}
            >
              保存
            </button>

            <button
              onClick={() => { onDelete(editingId); setView('list'); }}
              disabled={profiles.length <= 1}
              className="w-full p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-bold disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              このアカウントを削除
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function BottomNav({ current, onChange }) {
  const items = [
    { key: 'home', icon: HomeIcon, label: 'ホーム' },
    { key: 'songs', icon: Music, label: '歌詞' },
    { key: 'mistakes', icon: AlertCircle, label: '復習' },
    { key: 'add', icon: Plus, label: '追加' },
    { key: 'stats', icon: BarChart3, label: '統計' },
  ];
  // Map special song screens back to 'songs' for highlighting
  const normalized = ['song-study', 'song-edit'].includes(current) ? 'songs' : current;
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 pt-2 z-20" style={{ background: 'linear-gradient(to top, rgba(10,6,20,0.95) 60%, transparent)' }}>
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = normalized === item.key;
          return (
            <button key={item.key} onClick={() => onChange(item.key)} className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-0.5 transition ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-pink-400' : 'text-white/50'}`} />
              <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-white/50'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
