import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDiaries } from '@/hooks/useDiary';
import { DiaryCard } from '@/components/diary/DiaryCard';
import { DiaryLock } from '@/components/diary/DiaryLock';
import { DiaryView } from '@/components/diary/DiaryView';
import { CreateDiaryDialog } from '@/components/diary/CreateDiaryDialog';
import { Diary } from '@/types/diary';

interface DiaryHubProps {
  onBack: () => void;
}

export default function DiaryHub({ onBack }: DiaryHubProps) {
  const { diaries, createDiary, deleteDiary, renameDiary, verifyPin } = useDiaries();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);
  const [unlockedDiaryId, setUnlockedDiaryId] = useState<string | null>(null);

  const selectedDiary = diaries.find(d => d.id === selectedDiaryId);
  const unlockedDiary = diaries.find(d => d.id === unlockedDiaryId);

  // Auto-open if only one diary
  useEffect(() => {
    if (diaries.length === 1 && !selectedDiaryId) {
      setSelectedDiaryId(diaries[0].id);
    }
  }, [diaries.length]);

  const getEntryCount = (id: string) => {
    try {
      const data = localStorage.getItem(`diary-entries-${id}`);
      return data ? JSON.parse(data).length : 0;
    } catch { return 0; }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this diary and all its entries? This cannot be undone.')) {
      deleteDiary(id);
      if (selectedDiaryId === id) setSelectedDiaryId(null);
      if (unlockedDiaryId === id) setUnlockedDiaryId(null);
    }
  };

  // Show diary view if unlocked
  if (unlockedDiary) {
    return (
      <AnimatePresence mode="wait">
        <DiaryView
          key={unlockedDiary.id}
          diary={unlockedDiary}
          onBack={() => {
            setUnlockedDiaryId(null);
            setSelectedDiaryId(null);
          }}
        />
      </AnimatePresence>
    );
  }

  // Show lock screen if diary selected but not unlocked
  if (selectedDiary) {
    return (
      <DiaryLock
        diaryName={selectedDiary.name}
        diaryIcon={selectedDiary.icon}
        onUnlock={() => setUnlockedDiaryId(selectedDiary.id)}
        onBack={() => setSelectedDiaryId(null)}
        verifyPin={(pin) => verifyPin(selectedDiary.id, pin)}
      />
    );
  }

  // Show diary hub
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-12"
    >
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-base">My <span className="gradient-text">Diaries</span></h1>
                <p className="text-[10px] text-muted-foreground">{diaries.length} {diaries.length === 1 ? 'diary' : 'diaries'}</p>
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Diary
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {diaries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
              📔
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Start Your First Diary</h2>
              <p className="text-sm text-muted-foreground mt-1">A private space for your thoughts, feelings, and memories.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Create Diary
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {diaries.map((diary, i) => (
              <DiaryCard
                key={diary.id}
                diary={diary}
                index={i}
                onOpen={setSelectedDiaryId}
                onDelete={handleDelete}
                onRename={renameDiary}
                entryCount={getEntryCount(diary.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateDiaryDialog
            onClose={() => setShowCreate(false)}
            onCreate={createDiary}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
