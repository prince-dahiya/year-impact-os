import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, BookOpen, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Diary } from '@/types/diary';
import { useDiaryEntries } from '@/hooks/useDiary';
import { DiaryEditor } from './DiaryEditor';
import { DiaryTimeline } from './DiaryTimeline';
import { DiaryInsights } from './DiaryInsights';
import { DiaryEntry } from '@/types/diary';

interface DiaryViewProps {
  diary: Diary;
  onBack: () => void;
}

export function DiaryView({ diary, onBack }: DiaryViewProps) {
  const { entries, createEntry, updateEntry, deleteEntry, searchEntries, insights } = useDiaryEntries(diary.id);
  const [writing, setWriting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  const handleSave = (content: string, mood: DiaryEntry['mood'], tags: string[]) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, { content, mood, tags });
      setEditingEntry(null);
    } else {
      createEntry(content, mood, tags);
    }
    setWriting(false);
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setWriting(true);
  };

  if (writing) {
    return (
      <AnimatePresence mode="wait">
        <DiaryEditor
          key={editingEntry?.id || 'new'}
          initialContent={editingEntry?.content}
          initialMood={editingEntry?.mood}
          initialTags={editingEntry?.tags}
          onSave={handleSave}
          onClose={() => { setWriting(false); setEditingEntry(null); }}
          autoSaveKey={editingEntry ? undefined : diary.id}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="min-h-screen pb-12"
    >
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{diary.icon}</span>
              <h1 className="font-bold text-base">{diary.name}</h1>
            </div>
          </div>
          <Button size="sm" onClick={() => setWriting(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> Write
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5">
        <Tabs defaultValue="entries" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid bg-secondary">
            <TabsTrigger value="entries" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Entries
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <DiaryTimeline entries={entries} onEdit={handleEdit} onDelete={deleteEntry} searchEntries={searchEntries} />
          </TabsContent>

          <TabsContent value="insights">
            <DiaryInsights data={insights} />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
