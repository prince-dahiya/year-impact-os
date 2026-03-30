import { motion } from 'framer-motion';
import { BarChart3, Flame, BookOpen, TrendingUp, Hash } from 'lucide-react';
import { MOOD_CONFIG, MoodType } from '@/types/diary';

interface InsightsData {
  totalEntries: number;
  streakDays: number;
  moodDistribution: Record<string, number>;
  avgEntriesPerWeek: number;
  tagsUsed: string[];
}

export function DiaryInsights({ data }: { data: InsightsData }) {
  if (data.totalEntries === 0) {
    return (
      <div className="glass-card p-6 text-center text-muted-foreground text-sm">
        Start writing to see your insights here.
      </div>
    );
  }

  const maxMoodCount = Math.max(...Object.values(data.moodDistribution), 1);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Entries', value: data.totalEntries, icon: <BookOpen className="w-4 h-4" /> },
          { label: 'Streak', value: `${data.streakDays}🔥`, icon: <Flame className="w-4 h-4" /> },
          { label: 'Per Week', value: data.avgEntriesPerWeek, icon: <TrendingUp className="w-4 h-4" /> },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4 text-center"
          >
            <div className="text-muted-foreground mb-2 flex justify-center">{s.icon}</div>
            <div className="text-lg font-bold text-foreground">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Mood chart */}
      {Object.keys(data.moodDistribution).length > 0 && (
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Mood Distribution
          </h4>
          <div className="space-y-2">
            {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG[MoodType]][]).map(([key, cfg]) => {
              const count = data.moodDistribution[key] || 0;
              if (count === 0) return null;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-sm w-6">{cfg.emoji}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxMoodCount) * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top tags */}
      {data.tagsUsed.length > 0 && (
        <div className="glass-card p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" /> Top Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.tagsUsed.map(t => (
              <span key={t} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px]">#{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
