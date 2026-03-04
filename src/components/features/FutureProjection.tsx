import { motion } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { Rocket, BookOpen, MapPin, Flame, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      className="font-mono font-bold text-2xl gradient-text"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {Math.round(value)}{suffix}
    </motion.span>
  );
}

export function FutureProjection({ year }: { year: number }) {
  const { yearlyScore, getStreakDays } = useScores(year);
  const [show5Year, setShow5Year] = useState(false);
  const streak = getStreakDays();
  const consistency = yearlyScore.totalPercentage;

  // Projections based on current consistency
  const pagesPerDay = 20;
  const booksPerYear = Math.round((pagesPerDay * 365 * (consistency / 100)) / 250);
  const kmPerWeek = 5;
  const kmPerYear = Math.round(kmPerWeek * 52 * (consistency / 100));

  const multiplier = show5Year ? 5 : 1;
  const projections = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'Books Read', value: booksPerYear * multiplier, suffix: '', color: 'text-info' },
    { icon: <MapPin className="w-5 h-5" />, label: 'KM Covered', value: kmPerYear * multiplier, suffix: 'km', color: 'text-primary' },
    { icon: <Flame className="w-5 h-5" />, label: 'Streak Potential', value: Math.min(streak * multiplier, 365 * multiplier), suffix: 'd', color: 'text-warning' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Yearly Completion', value: Math.min(consistency * multiplier / (show5Year ? 5 : 1), 100), suffix: '%', color: 'text-primary' },
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
            <p className="text-xs text-muted-foreground">Future Projection Engine</p>
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
            <AnimatedCounter value={p.value} suffix={p.suffix} />
            <p className="text-xs text-muted-foreground">{p.label}</p>
            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((p.value / (show5Year ? p.value * 1.5 : p.value * 2)) * 100, 100)}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
