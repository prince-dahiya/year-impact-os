import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDailyActions, useCompletions, useBreaks } from '@/hooks/useAppData';
import { format, isToday, isFuture, subDays, addDays } from 'date-fns';
import { Check, Coffee, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DailyActionsTracker({ year }: { year: number }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { actions, isLoading } = useDailyActions(year);
  const { completions, toggleCompletion } = useCompletions(selectedDate);
  const { isBreakDay } = useBreaks(year);

  const isDateBreak = isBreakDay(selectedDate);
  const isFutureDate = isFuture(selectedDate) && !isToday(selectedDate);
  const completedIds = new Set(completions.map(c => c.action_id));
  const completedCount = completions.length;
  const totalCount = actions.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 glass-card animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Date Nav */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daily Actions</h2>
          <p className="text-xs text-muted-foreground font-mono">{format(selectedDate, 'EEEE, MMM d yyyy')}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {!isToday(selectedDate) && (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setSelectedDate(new Date())}>Today</Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, 1))} disabled={isToday(selectedDate)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-mono font-bold">{completedCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full progress-bar-glow"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {isDateBreak && (
        <div className="glass-card p-4 flex items-center gap-3 border-warning/30">
          <Coffee className="w-5 h-5 text-warning" />
          <span className="text-sm text-warning">Break Day — Rest up! 🧘</span>
        </div>
      )}

      {actions.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No actions yet. Add goals first, then create daily actions.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action, i) => {
            const isCompleted = completedIds.has(action.id);
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !isFutureDate && !isDateBreak && toggleCompletion(action.id)}
                disabled={isFutureDate || isDateBreak}
                className={cn(
                  'w-full glass-card p-4 flex items-center gap-3 text-left transition-all duration-200',
                  isCompleted && 'border-primary/30 bg-primary/5',
                  !isFutureDate && !isDateBreak && 'hover:border-primary/20 cursor-pointer'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                  isCompleted ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <span className={cn('text-sm', isCompleted && 'line-through text-muted-foreground')}>{action.name}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
