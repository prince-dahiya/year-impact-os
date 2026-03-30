import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Tag, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoodType, MOOD_CONFIG } from '@/types/diary';

interface DiaryEditorProps {
  initialContent?: string;
  initialMood?: MoodType | null;
  initialTags?: string[];
  onSave: (content: string, mood: MoodType | null, tags: string[]) => void;
  onClose: () => void;
  autoSaveKey?: string;
}

export function DiaryEditor({ initialContent = '', initialMood = null, initialTags = [], onSave, onClose, autoSaveKey }: DiaryEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState<MoodType | null>(initialMood);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [showTags, setShowTags] = useState(initialTags.length > 0);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save draft
  useEffect(() => {
    if (!autoSaveKey) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(`diary-draft-${autoSaveKey}`, JSON.stringify({ content, mood, tags }));
    }, 1000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [content, mood, tags, autoSaveKey]);

  // Load draft
  useEffect(() => {
    if (!autoSaveKey || initialContent) return;
    try {
      const draft = localStorage.getItem(`diary-draft-${autoSaveKey}`);
      if (draft) {
        const { content: c, mood: m, tags: t } = JSON.parse(draft);
        if (c) setContent(c);
        if (m) setMood(m);
        if (t?.length) { setTags(t); setShowTags(true); }
      }
    } catch {}
  }, [autoSaveKey]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content.trim(), mood, tags);
    if (autoSaveKey) localStorage.removeItem(`diary-draft-${autoSaveKey}`);
    setSaved(true);
    setTimeout(() => onClose(), 400);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  const now = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-mono">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button size="sm" onClick={handleSave} disabled={!content.trim()} className="h-8 gap-1.5 text-xs">
            <Save className="w-3 h-3" />
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Mood selector */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Mood:</span>
          {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][]).map(([key, cfg]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMood(mood === key ? null : key)}
              className={`text-xl transition-all duration-200 ${mood === key ? 'scale-125 drop-shadow-lg' : 'opacity-40 hover:opacity-70'}`}
              title={cfg.label}
            >
              {cfg.emoji}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 container mx-auto px-4 py-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="What's on your mind today..."
          className="w-full h-full min-h-[50vh] bg-transparent resize-none outline-none text-foreground text-base leading-relaxed placeholder:text-muted-foreground/40 font-light"
          autoFocus
        />
      </div>

      {/* Tags */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 space-y-2">
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Tag className="w-3 h-3" />
            {tags.length > 0 ? `${tags.length} tags` : 'Add tags'}
          </button>

          <AnimatePresence>
            {showTags && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="h-7 text-xs bg-secondary/50 flex-1"
                  />
                  <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={addTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                        <Hash className="w-2.5 h-2.5" />{t}
                        <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="ml-0.5 hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
