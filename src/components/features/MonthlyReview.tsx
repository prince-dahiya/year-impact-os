import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Brain, TrendingUp, TrendingDown, Lightbulb, BarChart3, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MonthlyReview({ year }: { year: number }) {
  const { monthlyScores, yearlyScore, getStreakDays } = useScores(year);
  const currentMonth = new Date().getMonth();
  const current = monthlyScores[currentMonth];
  const previous = currentMonth > 0 ? monthlyScores[currentMonth - 1] : null;

  const hasData = current.totalPossibleActions > 0;

  if (!hasData) {
    return (
      <div className="glass-card p-6 text-center">
        <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Start tracking to get your monthly review</p>
        <p className="text-[10px] text-muted-foreground mt-1">Complete daily actions to generate insights</p>
      </div>
    );
  }

  const improvement = previous ? current.percentage - previous.percentage : 0;
  const streak = getStreakDays();
  const trackedDays = current.activeDays + current.breakDays;
  const totalDays = current.totalDays;
  const completionRate = current.totalPossibleActions > 0
    ? Math.round((current.completedActions / current.totalPossibleActions) * 100)
    : 0;

  const strongestArea = current.percentage >= 70 ? 'Consistency' : 'Showing Up';
  const weakestArea = current.percentage < 50 ? 'Daily Completion' : 'Maintaining Streaks';

  const suggestions = [
    current.percentage < 50 && 'Try completing at least 3 actions per day this month.',
    improvement < 0 && 'Your consistency dropped. Consider reducing your daily actions count.',
    streak < 7 && 'Build a streak! Focus on one action per day minimum.',
    current.percentage >= 80 && 'Amazing month! Consider adding a new challenge.',
  ].filter(Boolean);

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-primary' };
    if (pct >= 80) return { grade: 'A', color: 'text-primary' };
    if (pct >= 70) return { grade: 'B+', color: 'text-primary' };
    if (pct >= 60) return { grade: 'B', color: 'text-info' };
    if (pct >= 50) return { grade: 'C', color: 'text-warning' };
    return { grade: 'D', color: 'text-destructive' };
  };

  const grade = getGrade(current.percentage);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{months[currentMonth]} Review</h3>
            <p className="text-xs text-muted-foreground">Performance Report</p>
          </div>
        </div>
        <div className="text-center">
          <p className={cn('text-2xl font-bold font-mono', grade.color)}>{grade.grade}</p>
          <p className="text-[10px] text-muted-foreground">Grade</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-secondary/50 text-center">
          <Target className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
          <p className="font-mono font-bold text-lg">{trackedDays}</p>
          <p className="text-[10px] text-muted-foreground">Days Active</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50 text-center">
          <BarChart3 className="w-3.5 h-3.5 text-info mx-auto mb-1" />
          <p className="font-mono font-bold text-lg">{completionRate}%</p>
          <p className="text-[10px] text-muted-foreground">Completion</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50 text-center">
          <Flame className="w-3.5 h-3.5 text-warning mx-auto mb-1" />
          <p className="font-mono font-bold text-lg">{streak}</p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
        <p className="text-sm leading-relaxed">
          This month you tracked <span className="font-mono font-bold text-primary">{trackedDays}</span> days out of {totalDays}.
          {previous && previous.totalPossibleActions > 0 && (
            <> Your consistency {improvement >= 0 ? 'improved' : 'decreased'} by{' '}
              <span className={cn('font-mono font-bold', improvement >= 0 ? 'text-primary' : 'text-destructive')}>
                {Math.abs(improvement)}%
              </span>{' '}
              compared to last month.</>
          )}
          {' '}Your strongest area is <span className="text-primary font-medium">{strongestArea}</span>.
          {current.percentage < 80 && <> Focus area: <span className="text-warning font-medium">{weakestArea}</span>.</>}
        </p>
      </div>

      {previous && previous.totalPossibleActions > 0 && (
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          improvement >= 0 ? 'bg-primary/5 border border-primary/10' : 'bg-destructive/5 border border-destructive/10'
        )}>
          {improvement >= 0 ? <TrendingUp className="w-5 h-5 text-primary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
          <span className="text-sm">
            <span className={cn('font-mono font-bold', improvement >= 0 ? 'text-primary' : 'text-destructive')}>
              {improvement >= 0 ? '+' : ''}{improvement}%
            </span>
            <span className="text-muted-foreground ml-1.5">from last month</span>
          </span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 text-warning" />
            <span className="uppercase tracking-wider font-medium">Suggestions</span>
          </div>
          {suggestions.map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-warning/5 border border-warning/10 text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-warning mt-0.5">→</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
