import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDailyActions, useCompletions, useBreaks } from '@/hooks/useAppData';
import { format, isToday, isFuture, subDays, addDays } from 'date-fns';
import { Check, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
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
          <h2 className="text-lg font-semibold">Today's Actions</h2>
          <p className="text-xs text-muted-foreground font-mono">{format(selectedDate, 'EEE, MMM d')}</p>
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
      {totalCount > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{completedCount}/{totalCount}</span>
        </div>
      )}

      {isDateBreak && (
        <div className="glass-card p-4 flex items-center gap-3 border-warning/30">
          <Coffee className="w-5 h-5 text-warning" />
          <span className="text-sm text-warning">Break Day — Rest up 🧘</span>
        </div>
      )}

      {actions.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No actions yet. Add a goal first — actions are created automatically.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {actions.map((action, i) => {
            const isCompleted = completedIds.has(action.id);
            const canToggle = !isFutureDate && !isDateBreak;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => canToggle && toggleCompletion(action.id)}
                disabled={!canToggle}
                className={cn(
                  'w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-150',
                  isCompleted
                    ? 'bg-primary/8 border border-primary/20'
                    : 'bg-secondary/40 border border-transparent',
                  canToggle && !isCompleted && 'hover:bg-secondary/60 active:scale-[0.99]'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  isCompleted ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {isCompleted && <Check className="w-3 h-3 text-primary-foreground" />}
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
