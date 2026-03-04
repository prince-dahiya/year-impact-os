import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Flame, Award, TrendingUp } from 'lucide-react';

export function ChallengeTracker({ year }: { year: number }) {
  const { getStreakDays, yearlyScore } = useScores(year);
  const streak = getStreakDays();
  const progress = Math.min(streak, 30);
  const isCompleted = progress >= 30;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">30-Day Streak</h3>
            <p className="text-xs text-muted-foreground">Complete actions daily</p>
          </div>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
            <Award className="w-3.5 h-3.5" /> Done!
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono font-medium">{progress}/30</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-warning to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(progress / 30) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {Array(30).fill(0).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < progress ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
        <span>Current streak: <span className="font-mono text-foreground font-bold">{streak}</span> days</span>
      </div>
    </motion.div>
  );
}
