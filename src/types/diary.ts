export interface Diary {
  id: string;
  name: string;
  pinHash: string; // simple hash for local PIN protection
  color: string; // accent color for the diary card
  icon: string; // emoji icon
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntry {
  id: string;
  diaryId: string;
  content: string;
  mood: MoodType | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type MoodType = 'amazing' | 'good' | 'neutral' | 'bad' | 'terrible';

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  amazing: { emoji: '🤩', label: 'Amazing', color: 'hsl(155 100% 45%)' },
  good: { emoji: '😊', label: 'Good', color: 'hsl(170 80% 40%)' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'hsl(215 16% 52%)' },
  bad: { emoji: '😔', label: 'Bad', color: 'hsl(38 92% 50%)' },
  terrible: { emoji: '😢', label: 'Terrible', color: 'hsl(0 72% 51%)' },
};

export const DIARY_COLORS = [
  'hsl(155 100% 45%)',
  'hsl(210 100% 56%)',
  'hsl(280 100% 55%)',
  'hsl(38 92% 50%)',
  'hsl(340 82% 52%)',
  'hsl(170 80% 40%)',
];

export const DIARY_ICONS = ['📔', '📓', '📕', '📗', '📘', '📙', '🔒', '💭', '✨', '🌙', '🔥', '💎'];
