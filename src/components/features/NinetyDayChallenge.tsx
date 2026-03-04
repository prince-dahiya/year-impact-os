import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Swords, Target, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NinetyDayChallenge({ year }: { year: number }) {
  const { getStreakDays, yearlyScore } = useScores(year);
  const [isActive, setIsActive] = useState(() => {
    return localStorage.getItem('90-day-active') === 'true';
  });
  const [startDate] = useState(() => {
    return localStorage.getItem('90-day-start') || new Date().toISOString();
  });

  const activate = () => {
    setIsActive(true);
    localStorage.setItem('90-day-active', 'true');
    localStorage.setItem('90-day-start', new Date().toISOString());
  };

  const daysSinceStart = isActive
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const progress = Math.min(daysSinceStart, 90);
  const disciplineScore = Math.round(yearlyScore.totalPercentage * 0.8 + Math.min(getStreakDays(), 20));

  if (!isActive) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center mx-auto">
          <Swords className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h3 className="font-bold text-lg">90-Day Transformation</h3>
          <p className="text-sm text-muted-foreground mt-1">Push yourself to the limit for 90 days</p>
        </div>
        <button onClick={activate} className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-destructive to-warning text-primary-foreground transition-all hover:scale-105">
          Activate Challenge Mode
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Swords className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">90-Day Challenge</h3>
            <p className="text-xs text-muted-foreground">Day {progress} of 90</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-primary">{Math.round((progress / 90) * 100)}%</span>
      </div>

      {/* Progress */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(0 72% 51%), hsl(38 92% 50%), hsl(155 100% 45%))' }}
          initial={{ width: 0 }}
          animate={{ width: `${(progress / 90) * 100}%` }}
          transition={{ duration: 1.5 }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-secondary/50">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-mono font-bold text-sm">{progress}</p>
          <p className="text-[10px] text-muted-foreground">Days</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50">
          <Flame className="w-4 h-4 text-warning mx-auto mb-1" />
          <p className="font-mono font-bold text-sm">{getStreakDays()}</p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-mono font-bold text-sm">{disciplineScore}</p>
          <p className="text-[10px] text-muted-foreground">Discipline</p>
        </div>
      </div>
    </motion.div>
  );
}
