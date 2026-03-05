import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScores } from '@/hooks/useAppData';
import { ScoreRing } from './ScoreRing';
import { cn } from '@/lib/utils';
import { ChevronRight, Target, Calendar, Coffee, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, X } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MonthlyGrid({ year }: { year: number }) {
  const { monthlyScores, isLoading } = useScores(year);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  if (isLoading) {
    return <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array(12).fill(0).map((_, i) => <div key={i} className="aspect-square glass-card animate-pulse" />)}
    </div>;
  }

  const selected = selectedMonth !== null ? monthlyScores[selectedMonth] : null;
  const prevMonth = selectedMonth !== null && selectedMonth > 0 ? monthlyScores[selectedMonth - 1] : null;
  const improvement = selected && prevMonth ? selected.percentage - prevMonth.percentage : 0;

  const getStrength = (score: typeof selected) => {
    if (!score) return null;
    if (score.percentage >= 80) return { label: 'Excellent consistency', icon: <CheckCircle className="w-4 h-4 text-primary" /> };
    if (score.percentage >= 60) return { label: 'Good habit tracking', icon: <CheckCircle className="w-4 h-4 text-primary" /> };
    if (score.activeDays > score.totalDays * 0.5) return { label: 'Showing up regularly', icon: <CheckCircle className="w-4 h-4 text-info" /> };
    return { label: 'Getting started', icon: <Target className="w-4 h-4 text-muted-foreground" /> };
  };

  const getWeakness = (score: typeof selected) => {
    if (!score) return null;
    if (score.percentage < 30) return { label: 'Low daily completion rate', tip: 'Try reducing actions to 2-3 essentials' };
    if (score.activeDays < score.totalDays * 0.4) return { label: 'Missing too many days', tip: 'Aim for at least 4 active days per week' };
    if (score.percentage < 60) return { label: 'Inconsistent completion', tip: 'Focus on completing all actions on active days' };
    if (score.breakDays > 5) return { label: 'Many break days taken', tip: 'Try to limit breaks to planned rest only' };
    return null;
  };

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', color: 'text-primary' };
    if (pct >= 80) return { grade: 'A', color: 'text-primary' };
    if (pct >= 70) return { grade: 'B+', color: 'text-primary' };
    if (pct >= 60) return { grade: 'B', color: 'text-info' };
    if (pct >= 50) return { grade: 'C', color: 'text-warning' };
    if (pct >= 30) return { grade: 'D', color: 'text-warning' };
    return { grade: 'F', color: 'text-destructive' };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Monthly Overview</h2>

      {/* Month Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {monthlyScores.map((score, i) => {
          const isCurrent = year === currentYear && i === currentMonth;
          const isFuture = year > currentYear || (year === currentYear && i > currentMonth);
          const isSelected = selectedMonth === i;
          const grade = getGrade(score.percentage);

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => !isFuture && setSelectedMonth(isSelected ? null : i)}
              disabled={isFuture}
              className={cn(
                'p-3 rounded-xl border text-center transition-all duration-200 relative',
                isFuture ? 'border-border/30 opacity-30 cursor-not-allowed' :
                isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]' :
                isCurrent ? 'border-primary/40 bg-primary/5' :
                'border-border/50 bg-card/40 hover:border-primary/30 hover:bg-card/80'
              )}
            >
              <p className={cn('text-[11px] font-medium mb-1.5', isSelected ? 'text-primary' : 'text-muted-foreground')}>{SHORT_MONTHS[i]}</p>
              <p className={cn('text-xl font-bold font-mono', score.percentage > 0 ? grade.color : 'text-muted-foreground/50')}>
                {score.percentage > 0 ? score.percentage : '—'}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {score.percentage > 0 ? grade.grade : ''}
              </p>
              {isCurrent && !isSelected && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && selectedMonth !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScoreRing percentage={selected.percentage} size="md" label={getGrade(selected.percentage).grade} />
                  <div>
                    <h3 className="font-bold text-lg">{MONTHS[selectedMonth]}</h3>
                    <p className="text-xs text-muted-foreground">{year} · Detailed Breakdown</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMonth(null)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Calendar className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <p className="font-mono font-bold text-lg">{selected.activeDays}</p>
                  <p className="text-[10px] text-muted-foreground">Active Days</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Coffee className="w-3.5 h-3.5 text-warning mx-auto mb-1" />
                  <p className="font-mono font-bold text-lg">{selected.breakDays}</p>
                  <p className="text-[10px] text-muted-foreground">Break Days</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <CheckCircle className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <p className="font-mono font-bold text-lg">{selected.completedActions}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Target className="w-3.5 h-3.5 text-info mx-auto mb-1" />
                  <p className="font-mono font-bold text-lg">{selected.totalPossibleActions}</p>
                  <p className="text-[10px] text-muted-foreground">Total Actions</p>
                </div>
              </div>

              {/* Completion bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-mono font-bold text-primary">{selected.percentage}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary progress-bar-glow"
                    initial={{ width: 0 }}
                    animate={{ width: `${selected.percentage}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              {/* Trend vs prev month */}
              {prevMonth && (
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  improvement >= 0 ? 'bg-primary/5 border border-primary/10' : 'bg-destructive/5 border border-destructive/10'
                )}>
                  {improvement >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive shrink-0" />
                  )}
                  <span className="text-sm">
                    <span className={cn('font-mono font-bold', improvement >= 0 ? 'text-primary' : 'text-destructive')}>
                      {improvement >= 0 ? '+' : ''}{improvement}%
                    </span>
                    <span className="text-muted-foreground ml-1.5">vs {MONTHS[selectedMonth - 1]}</span>
                  </span>
                </div>
              )}

              {/* Strength & Weakness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Strength */}
                {getStrength(selected) && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {getStrength(selected)!.icon}
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">Strength</span>
                    </div>
                    <p className="text-sm font-medium">{getStrength(selected)!.label}</p>
                  </div>
                )}

                {/* Weakness */}
                {getWeakness(selected) && (
                  <div className="p-4 rounded-xl bg-warning/5 border border-warning/15 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-warning">Focus Area</span>
                    </div>
                    <p className="text-sm font-medium">{getWeakness(selected)!.label}</p>
                    <p className="text-xs text-muted-foreground">💡 {getWeakness(selected)!.tip}</p>
                  </div>
                )}

                {/* No weakness = all good */}
                {!getWeakness(selected) && selected.percentage > 0 && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">No Issues</span>
                    </div>
                    <p className="text-sm font-medium">Great balance this month! Keep it up.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
