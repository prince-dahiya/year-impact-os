import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';

export function MonthlyReview({ year }: { year: number }) {
  const { monthlyScores, yearlyScore, getStreakDays } = useScores(year);
  const currentMonth = new Date().getMonth();
  const current = monthlyScores[currentMonth];
  const previous = currentMonth > 0 ? monthlyScores[currentMonth - 1] : null;

  const improvement = previous ? current.percentage - previous.percentage : 0;
  const streak = getStreakDays();
  const trackedDays = current.activeDays + current.breakDays;
  const totalDays = current.totalDays;

  // Find strongest/weakest (simulated from consistency)
  const strongestArea = current.percentage >= 70 ? 'Consistency' : 'Showing Up';
  const weakestArea = current.percentage < 50 ? 'Daily Completion' : 'Maintaining Streaks';

  const suggestions = [
    current.percentage < 50 && 'Try completing at least 3 actions per day this month.',
    improvement < 0 && 'Your consistency dropped. Consider reducing your daily actions count.',
    streak < 7 && 'Build a streak! Focus on one action per day minimum.',
    current.percentage >= 80 && 'Amazing month! Consider adding a new challenge.',
  ].filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Monthly Review</h3>
          <p className="text-xs text-muted-foreground">AI-powered insights</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
        <p className="text-sm leading-relaxed">
          This month you tracked <span className="font-mono font-bold text-primary">{trackedDays}</span> days out of {totalDays}.
          {previous && (
            <> Your consistency {improvement >= 0 ? 'improved' : 'decreased'} by{' '}
              <span className={improvement >= 0 ? 'text-primary' : 'text-destructive'}>
                {Math.abs(improvement)}%
              </span>{' '}
              compared to last month.</>
          )}
          {' '}Your strongest area was <span className="text-primary font-medium">{strongestArea}</span>.
          {current.percentage < 80 && <> Your weakest was <span className="text-warning font-medium">{weakestArea}</span>.</>}
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm">
        {improvement >= 0 ? (
          <TrendingUp className="w-4 h-4 text-primary" />
        ) : (
          <TrendingDown className="w-4 h-4 text-destructive" />
        )}
        <span className="text-muted-foreground">
          Trend: {improvement >= 0 ? '+' : ''}{improvement}% from last month
        </span>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 text-warning" />
            <span className="uppercase tracking-wider">Suggestions</span>
          </div>
          {suggestions.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-warning/5 border border-warning/10 text-xs text-muted-foreground">
              {s}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
