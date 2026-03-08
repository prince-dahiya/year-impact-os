import { motion } from 'framer-motion';
import { useScores, useRunSessions, useSprintSessions } from '@/hooks/useAppData';
import { Rocket, MapPin, Flame, BarChart3, Activity, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function FutureProjection({ year }: { year: number }) {
  const { yearlyScore, getStreakDays } = useScores(year);
  const { sessions } = useRunSessions();
  const { sprints } = useSprintSessions();
  const [show5Year, setShow5Year] = useState(false);
  const streak = getStreakDays();
  const consistency = yearlyScore.totalPercentage;

  const totalKm = sessions.reduce((s: number, r: any) => s + (r.distance || 0), 0);
  const totalCal = sessions.reduce((s: number, r: any) => s + (r.calories || 0), 0);
  const totalRuns = sessions.length;

  const hasData = yearlyScore.daysTracked > 0 || totalRuns > 0;

  if (!hasData) {
    return (
      <div className="glass-card p-6 text-center">
        <Rocket className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Start tracking to see projections</p>
        <p className="text-[10px] text-muted-foreground mt-1">Based on your real activity data</p>
      </div>
    );
  }

  // Calculate real weekly averages from actual data
  const daysSinceFirstRun = totalRuns > 0
    ? Math.max(1, Math.ceil((Date.now() - new Date(sessions[0]?.date).getTime()) / 86400000))
    : 1;
  const weeksSoFar = Math.max(1, daysSinceFirstRun / 7);
  const kmPerWeek = totalKm / weeksSoFar;
  const calPerWeek = totalCal / weeksSoFar;
  const runsPerWeek = totalRuns / weeksSoFar;

  const multiplier = show5Year ? 5 : 1;
  const weeksInYear = 52;

  const projections = [
    { icon: <MapPin className="w-5 h-5" />, label: 'KM Projected', value: Math.round(kmPerWeek * weeksInYear * multiplier), suffix: 'km', color: 'text-primary' },
    { icon: <Flame className="w-5 h-5" />, label: 'Calories Projected', value: Math.round(calPerWeek * weeksInYear * multiplier), suffix: '', color: 'text-warning' },
    { icon: <Activity className="w-5 h-5" />, label: 'Runs Projected', value: Math.round(runsPerWeek * weeksInYear * multiplier), suffix: '', color: 'text-info' },
    { icon: <Zap className="w-5 h-5" />, label: 'Sprints Projected', value: Math.round((sprints.length / weeksSoFar) * weeksInYear * multiplier), suffix: '', color: 'text-warning' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-info/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">At this pace…</h3>
            <p className="text-xs text-muted-foreground">Projected from real activity</p>
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
              className="font-mono font-bold text-2xl gradient-text block"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              {p.value}{p.suffix}
            </motion.span>
            <p className="text-xs text-muted-foreground">{p.label}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Based on {kmPerWeek.toFixed(1)} km/week · {runsPerWeek.toFixed(1)} runs/week average
      </p>
    </motion.div>
  );
}
