import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Rocket, BookOpen, MapPin, Flame, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function FutureProjection({ year }: { year: number }) {
  const { yearlyScore, getStreakDays } = useScores(year);
  const [show5Year, setShow5Year] = useState(false);
  const streak = getStreakDays();
  const consistency = yearlyScore.totalPercentage;

  const hasData = yearlyScore.daysTracked > 0;

  if (!hasData) {
    return (
      <div className="glass-card p-6 text-center">
        <Rocket className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Start tracking to see future projections</p>
        <p className="text-[10px] text-muted-foreground mt-1">Based on your real activity data</p>
      </div>
    );
  }

  const pagesPerDay = 20;
  const booksPerYear = Math.round((pagesPerDay * 365 * (consistency / 100)) / 250);
  const kmPerWeek = 5;
  const kmPerYear = Math.round(kmPerWeek * 52 * (consistency / 100));

  const multiplier = show5Year ? 5 : 1;
  const projections = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'Books Read', value: booksPerYear * multiplier, suffix: '', color: 'text-info' },
    { icon: <MapPin className="w-5 h-5" />, label: 'KM Covered', value: kmPerYear * multiplier, suffix: 'km', color: 'text-primary' },
    { icon: <Flame className="w-5 h-5" />, label: 'Streak Potential', value: Math.min(streak * multiplier, 365 * multiplier), suffix: 'd', color: 'text-warning' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Yearly Completion', value: Math.min(consistency, 100), suffix: '%', color: 'text-primary' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-info/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">If you continue like this…</h3>
            <p className="text-xs text-muted-foreground">Based on your real progress</p>
          </div>
        </div>
        <button
          onClick={() => setShow5Year(!show5Year)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-mono font-medium transition-all',
            show5Year ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          )}
        >
          {show5Year ? '5Y' : '1Y'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {projections.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-secondary/50 space-y-2"
          >
            <div className={cn('mb-1', p.color)}>{p.icon}</div>
            <motion.span
              className="font-mono font-bold text-2xl gradient-text"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              {Math.round(p.value)}{p.suffix}
            </motion.span>
            <p className="text-xs text-muted-foreground">{p.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
