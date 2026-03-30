import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2, Pencil, Search, Filter, Hash } from 'lucide-react';
import { DiaryEntry, MOOD_CONFIG, MoodType } from '@/types/diary';
import { Input } from '@/components/ui/input';

interface DiaryTimelineProps {
  entries: DiaryEntry[];
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  searchEntries: (q: string) => DiaryEntry[];
}

export function DiaryTimeline({ entries, onEdit, onDelete, searchEntries }: DiaryTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<MoodType | null>(null);

  let displayed = searchQuery ? searchEntries(searchQuery) : entries;
  if (filterMood) displayed = displayed.filter(e => e.mood === filterMood);

  const grouped = displayed.reduce<Record<string, DiaryEntry[]>>((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    (acc[date] = acc[date] || []).push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="h-8 text-xs pl-8 bg-secondary/50"
          />
        </div>
        <div className="flex items-center gap-1">
          {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterMood(filterMood === key ? null : key)}
              className={`text-sm transition-all ${filterMood === key ? 'scale-125' : 'opacity-30 hover:opacity-60'}`}
              title={`Filter: ${cfg.label}`}
            >
              {cfg.emoji}
            </button>
          ))}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {entries.length === 0 ? 'No entries yet. Start writing!' : 'No entries match your search.'}
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayEntries]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-xs font-mono text-muted-foreground sticky top-0 bg-background/80 backdrop-blur-sm py-1 z-10">{date}</h3>
            {dayEntries.map((entry, i) => {
              const isExpanded = expandedId === entry.id;
              const preview = entry.content.slice(0, 120);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary/50" />
                      <div className="w-px h-full bg-border/50 min-h-[20px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {entry.mood && <span className="text-sm">{MOOD_CONFIG[entry.mood].emoji}</span>}
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {isExpanded ? entry.content : `${preview}${entry.content.length > 120 ? '...' : ''}`}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.map(t => (
                            <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                              <Hash className="w-2 h-2" />{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/30 px-4 py-2 flex gap-2 overflow-hidden"
                      >
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onEdit(entry)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => onDelete(entry.id)}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

// Need to import Button
import { Button } from '@/components/ui/button';
