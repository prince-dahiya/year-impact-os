import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Gauge, Zap, Flame, TrendingUp } from 'lucide-react';
import { ScoreRing } from '../dashboard/ScoreRing';
import { cn } from '@/lib/utils';

export function LifeScore({ year }: { year: number }) {
  const { yearlyScore, getStreakDays } = useScores(year);
  const streak = getStreakDays();

  // Calculate Life Momentum Score from 3 clear components
  const consistency = yearlyScore.totalPercentage; // 0-100
  const consistencyContribution = Math.round(consistency * 0.6); // max 60 pts
  const streakBonus = Math.min(streak * 2, 30); // max 30 pts
  const improvementBonus = Math.min(Math.round(consistency * 0.1), 10); // max 10 pts
  const lifeScore = Math.min(consistencyContribution + streakBonus + improvementBonus, 100);

  const getLevel = (score: number) => {
    if (score >= 90) return { label: 'Elite', color: 'text-primary', bg: 'bg-primary/10' };
    if (score >= 70) return { label: 'Strong', color: 'text-primary', bg: 'bg-primary/10' };
    if (score >= 50) return { label: 'Building', color: 'text-warning', bg: 'bg-warning/10' };
    if (score >= 30) return { label: 'Starting', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Awakening', color: 'text-muted-foreground', bg: 'bg-muted/50' };
  };

  const level = getLevel(lifeScore);

  const factors = [
    {
      icon: <Zap className="w-4 h-4" />,
      label: 'Habit Consistency',
      description: '60% of your score',
      value: consistencyContribution,
      max: 60,
      rawValue: consistency,
      rawMax: 100,
      color: 'bg-primary',
      iconColor: 'text-primary',
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: 'Streak Power',
      description: 'Up to 30 pts from streaks',
      value: streakBonus,
      max: 30,
      rawValue: streak,
      rawMax: 15,
      color: 'bg-warning',
      iconColor: 'text-warning',
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Growth Trend',
      description: 'Up to 10 pts from improvement',
      value: improvementBonus,
      max: 10,
      rawValue: improvementBonus,
      rawMax: 10,
      color: 'bg-info',
      iconColor: 'text-info',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Life Momentum Score</h3>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', level.color, level.bg)}>
              {level.label}
            </span>
          </div>
        </div>
      </div>

      {/* Score ring with breakdown */}
      <div className="flex items-center justify-center py-2">
        <div className="relative">
          <ScoreRing percentage={lifeScore} size="lg" label="LMS" />
        </div>
      </div>

      {/* How it's calculated - visual stacked bar */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Score Breakdown</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="bg-primary h-full"
            initial={{ width: 0 }}
            animate={{ width: `${consistencyContribution}%` }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="bg-warning h-full"
            initial={{ width: 0 }}
            animate={{ width: `${streakBonus}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.div
            className="bg-info h-full"
            initial={{ width: 0 }}
            animate={{ width: `${improvementBonus}%` }}
            transition={{ duration: 1, delay: 0.4 }}
          />
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Habits</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warning" /> Streak</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-info" /> Growth</span>
        </div>
      </div>

      {/* Individual factors */}
      <div className="space-y-4">
        {factors.map((f, i) => (
          <div key={f.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={f.iconColor}>{f.icon}</span>
                <div>
                  <span className="text-xs font-medium">{f.label}</span>
                  <p className="text-[10px] text-muted-foreground">{f.description}</p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold">
                <span className={f.iconColor}>{f.value}</span>
                <span className="text-muted-foreground">/{f.max}</span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', f.color)}
                initial={{ width: 0 }}
                animate={{ width: `${(f.value / f.max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-secondary/50 text-center">
        <p className="text-xs text-muted-foreground">
          Your score is <span className="font-mono font-bold text-foreground">{consistencyContribution}</span> from habits +{' '}
          <span className="font-mono font-bold text-foreground">{streakBonus}</span> from streaks +{' '}
          <span className="font-mono font-bold text-foreground">{improvementBonus}</span> from growth ={' '}
          <span className="font-mono font-bold text-primary">{lifeScore}</span>
        </p>
      </div>
    </motion.div>
  );
}
