import { useState, useCallback, useMemo } from 'react';
import { Diary, DiaryEntry } from '@/types/diary';
import { scopedStorageKey } from '@/lib/accountStorage';

function useLocalStorage<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void] {
  const storageKey = scopedStorageKey(key);
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });
  const setValue = useCallback((val: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);
  return [state, setValue];
}

// Simple hash for PIN (not cryptographic, but sufficient for local protection)
export function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'pin_' + Math.abs(hash).toString(36);
}

export function useDiaries() {
  const [diaries, setDiaries] = useLocalStorage<Diary[]>('diaries', []);

  const createDiary = useCallback((name: string, pin: string, color: string, icon: string) => {
    const diary: Diary = {
      id: crypto.randomUUID(),
      name,
      pinHash: hashPin(pin),
      color,
      icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDiaries(prev => [...prev, diary]);
    return diary;
  }, [setDiaries]);

  const deleteDiary = useCallback((id: string) => {
    setDiaries(prev => prev.filter(d => d.id !== id));
    localStorage.removeItem(scopedStorageKey(`diary-entries-${id}`));
  }, [setDiaries]);

  const renameDiary = useCallback((id: string, name: string) => {
    setDiaries(prev => prev.map(d => d.id === id ? { ...d, name, updatedAt: new Date().toISOString() } : d));
  }, [setDiaries]);

  const verifyPin = useCallback((id: string, pin: string) => {
    const diary = diaries.find(d => d.id === id);
    if (!diary) return false;
    return diary.pinHash === hashPin(pin);
  }, [diaries]);

  return { diaries, createDiary, deleteDiary, renameDiary, verifyPin };
}

export function useDiaryEntries(diaryId: string) {
  const [entries, setEntries] = useLocalStorage<DiaryEntry[]>(`diary-entries-${diaryId}`, []);

  const createEntry = useCallback((content: string, mood: DiaryEntry['mood'], tags: string[]) => {
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      diaryId,
      content,
      mood,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    return entry;
  }, [diaryId, setEntries]);

  const updateEntry = useCallback((id: string, updates: Partial<Pick<DiaryEntry, 'content' | 'mood' | 'tags'>>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
  }, [setEntries]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, [setEntries]);

  const searchEntries = useCallback((query: string) => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter(e =>
      e.content.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [entries]);

  const filterByDate = useCallback((startDate: string, endDate: string) => {
    return entries.filter(e => e.createdAt >= startDate && e.createdAt <= endDate);
  }, [entries]);

  const filterByMood = useCallback((mood: string) => {
    return entries.filter(e => e.mood === mood);
  }, [entries]);

  const insights = useMemo(() => {
    const totalEntries = entries.length;
    if (totalEntries === 0) return { totalEntries: 0, streakDays: 0, moodDistribution: {}, avgEntriesPerWeek: 0, tagsUsed: [] as string[] };

    // Mood distribution
    const moodDist: Record<string, number> = {};
    entries.forEach(e => { if (e.mood) moodDist[e.mood] = (moodDist[e.mood] || 0) + 1; });

    // Unique days
    const uniqueDays = new Set(entries.map(e => e.createdAt.slice(0, 10)));
    const sortedDays = Array.from(uniqueDays).sort().reverse();

    // Streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (uniqueDays.has(ds)) streak++;
      else if (i > 0) break;
    }

    // Avg entries per week
    const firstEntry = new Date(entries[entries.length - 1]?.createdAt || new Date());
    const weeks = Math.max(1, Math.ceil((Date.now() - firstEntry.getTime()) / (7 * 86400000)));
    const avgPerWeek = Math.round((totalEntries / weeks) * 10) / 10;

    // Top tags
    const tagCount: Record<string, number> = {};
    entries.forEach(e => e.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const tagsUsed = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 10);

    return { totalEntries, streakDays: streak, moodDistribution: moodDist, avgEntriesPerWeek: avgPerWeek, tagsUsed };
  }, [entries]);

  return { entries, createEntry, updateEntry, deleteEntry, searchEntries, filterByDate, filterByMood, insights };
}
