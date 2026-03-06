import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Gauge, Zap, Flame, TrendingUp } from 'lucide-react';
import { ScoreRing } from '../dashboard/ScoreRing';
import { cn } from '@/lib/utils';

export function LifeScore({ year }: { year: number }) {
  const { yearlyScore, getStreakDays } = useScores(year);
  const streak = getStreakDays();

  const consistency = yearlyScore.totalPercentage;
  const consistencyContribution = Math.round(consistency * 0.6);
  const streakBonus = Math.min(streak * 2, 30);
  const improvementBonus = Math.min(Math.round(consistency * 0.1), 10);
  const lifeScore = Math.min(consistencyContribution + streakBonus + improvementBonus, 100);

  // Don't show if no data
  const hasData = yearlyScore.daysTracked > 0 || streak > 0;

  if (!hasData) {
    return (
      <div className="glass-card p-6 text-center">
        <Gauge className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Start tracking to see your Momentum Score</p>
        <p className="text-[10px] text-muted-foreground mt-1">Based on habits, streaks, and growth</p>
      </div>
    );
  }

  const getLevel = (score: number) => {
    if (score >= 90) return { label: 'Elite', color: 'text-primary' };
    if (score >= 70) return { label: 'Strong', color: 'text-primary' };
    if (score >= 50) return { label: 'Building', color: 'text-warning' };
    if (score >= 30) return { label: 'Starting', color: 'text-warning' };
    return { label: 'Awakening', color: 'text-muted-foreground' };
  };

  const level = getLevel(lifeScore);

  const factors = [
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Habit Consistency',
      detail: `${Math.round(consistency)}% completion → ${consistencyContribution} pts`,
      value: consistencyContribution,
      max: 60,
      color: 'bg-primary',
      iconColor: 'text-primary',
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: 'Streak Power',
      detail: `${streak} day streak → ${streakBonus} pts`,
      value: streakBonus,
      max: 30,
      color: 'bg-warning',
      iconColor: 'text-warning',
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Growth Trend',
      detail: `${improvementBonus} pts from improvement`,
      value: improvementBonus,
      max: 10,
      color: 'bg-info',
      iconColor: 'text-info',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Gauge className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Momentum Score</h3>
            <span className={cn('text-xs font-medium', level.color)}>{level.label}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold font-mono gradient-text">{lifeScore}</p>
          <p className="text-[10px] text-muted-foreground">/100</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="space-y-1.5">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
          <motion.div className="bg-primary h-full" initial={{ width: 0 }} animate={{ width: `${consistencyContribution}%` }} transition={{ duration: 0.8 }} />
          <motion.div className="bg-warning h-full" initial={{ width: 0 }} animate={{ width: `${streakBonus}%` }} transition={{ duration: 0.8, delay: 0.15 }} />
          <motion.div className="bg-info h-full" initial={{ width: 0 }} animate={{ width: `${improvementBonus}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Habits ({consistencyContribution})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warning" /> Streak ({streakBonus})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-info" /> Growth ({improvementBonus})</span>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-3">
        {factors.map((f, i) => (
          <div key={f.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={f.iconColor}>{f.icon}</span>
                <span className="text-xs font-medium">{f.label}</span>
              </div>
              <span className="font-mono text-xs">
                <span className={cn('font-bold', f.iconColor)}>{f.value}</span>
                <span className="text-muted-foreground">/{f.max}</span>
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', f.color)}
                initial={{ width: 0 }}
                animate={{ width: `${(f.value / f.max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{f.detail}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
