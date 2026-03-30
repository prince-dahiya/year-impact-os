import { motion } from 'framer-motion';
import { Lock, Trash2, Pencil } from 'lucide-react';
import { Diary } from '@/types/diary';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DiaryCardProps {
  diary: Diary;
  index: number;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  entryCount: number;
}

export function DiaryCard({ diary, index, onOpen, onDelete, onRename, entryCount }: DiaryCardProps) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(diary.name);

  const handleRename = () => {
    if (newName.trim() && newName !== diary.name) onRename(diary.id, newName.trim());
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !editing && onOpen(diary.id)}
      className="glass-card-hover cursor-pointer p-5 relative group overflow-hidden"
      style={{ borderColor: `${diary.color}20` }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${diary.color}15, transparent 70%)` }}
      />

      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${diary.color}15` }}>
            {diary.icon}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              className="p-1.5 rounded-lg hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(diary.id); }}
              className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-sm" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleRename()} />
            <Button size="sm" className="h-8 text-xs" onClick={handleRename}>Save</Button>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-foreground">{diary.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-mono">{new Date(diary.updatedAt).toLocaleDateString()}</span>
          <Lock className="w-3 h-3" style={{ color: diary.color }} />
        </div>
      </div>
    </motion.div>
  );
}
