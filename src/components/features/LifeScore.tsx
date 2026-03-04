import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Gauge, Zap, Brain, Flame, TrendingUp } from 'lucide-react';
import { ScoreRing } from '../dashboard/ScoreRing';

export function LifeScore({ year }: { year: number }) {
  const { yearlyScore, getStreakDays } = useScores(year);
  const streak = getStreakDays();

  // Calculate Life Momentum Score
  const consistency = yearlyScore.totalPercentage;
  const streakBonus = Math.min(streak * 2, 30); // max 30 pts from streak
  const improvementBonus = 10; // placeholder
  const lifeScore = Math.min(Math.round(consistency * 0.6 + streakBonus + improvementBonus), 100);

  const getLevel = (score: number) => {
    if (score >= 90) return { label: 'Elite', color: 'text-primary' };
    if (score >= 70) return { label: 'Strong', color: 'text-primary' };
    if (score >= 50) return { label: 'Building', color: 'text-warning' };
    if (score >= 30) return { label: 'Starting', color: 'text-warning' };
    return { label: 'Awakening', color: 'text-muted-foreground' };
  };

  const level = getLevel(lifeScore);

  const factors = [
    { icon: <Zap className="w-3.5 h-3.5" />, label: 'Habit Consistency', value: consistency, max: 100 },
    { icon: <Flame className="w-3.5 h-3.5" />, label: 'Streak Power', value: streakBonus, max: 30 },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Improvement', value: improvementBonus, max: 20 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Life Momentum Score</h3>
          <p className={`text-xs font-medium ${level.color}`}>{level.label}</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <ScoreRing percentage={lifeScore} size="lg" label="LMS" />
      </div>

      <div className="space-y-3">
        {factors.map((f, i) => (
          <div key={f.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {f.icon}
                <span>{f.label}</span>
              </div>
              <span className="font-mono">{f.value}/{f.max}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(f.value / f.max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
