import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { ScoreRing } from './ScoreRing';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MonthlyGrid({ year }: { year: number }) {
  const { monthlyScores, isLoading } = useScores(year);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  if (isLoading) {
    return <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array(12).fill(0).map((_, i) => <div key={i} className="aspect-square glass-card animate-pulse" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Monthly Overview</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {monthlyScores.map((score, i) => {
          const isCurrent = year === currentYear && i === currentMonth;
          const isFuture = year > currentYear || (year === currentYear && i > currentMonth);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'p-3 rounded-xl border text-center transition-all duration-300',
                isFuture ? 'border-border/30 opacity-40' :
                isCurrent ? 'border-primary/50 bg-primary/5 neon-border' :
                'glass-card-hover'
              )}
            >
              <p className="text-xs text-muted-foreground mb-2">{MONTHS[i]}</p>
              <ScoreRing percentage={score.percentage} size="sm" showLabel={false} />
              <p className="text-xs font-mono mt-2">{score.percentage}%</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
