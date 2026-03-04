import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreaks } from '@/hooks/useAppData';
import { BREAK_REASONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Coffee, Plus, Trash2, Calendar } from 'lucide-react';

export function BreaksManager({ year }: { year: number }) {
  const { breaks, createBreak, deleteBreak } = useBreaks(year);
  const [isAdding, setIsAdding] = useState(false);
  const [newBreak, setNewBreak] = useState({ reason: '', start_date: '', end_date: '' });

  const handleCreate = () => {
    if (!newBreak.reason || !newBreak.start_date || !newBreak.end_date) return;
    createBreak({ ...newBreak, year });
    setNewBreak({ reason: '', start_date: '', end_date: '' });
    setIsAdding(false);
  };

  const getIcon = (reason: string) => {
    const icons: Record<string, string> = { Vacation: '🏖️', Trip: '✈️', Rest: '😴', Health: '🏥', Emergency: '🚨' };
    return icons[reason] || '☕';
  };

  const totalBreakDays = breaks.reduce((sum, b) => {
    try { return sum + differenceInDays(parseISO(b.end_date), parseISO(b.start_date)) + 1; } catch { return sum; }
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Breaks</h2>
          <p className="text-xs text-muted-foreground font-mono">{totalBreakDays} days total</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Break</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>Schedule Break</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={newBreak.reason} onValueChange={v => setNewBreak(p => ({ ...p, reason: v }))}>
                <SelectTrigger className="bg-secondary"><SelectValue placeholder="Reason" /></SelectTrigger>
                <SelectContent>
                  {BREAK_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start</label>
                  <Input type="date" value={newBreak.start_date} onChange={e => setNewBreak(p => ({ ...p, start_date: e.target.value }))} className="bg-secondary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End</label>
                  <Input type="date" value={newBreak.end_date} onChange={e => setNewBreak(p => ({ ...p, end_date: e.target.value }))} className="bg-secondary" />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {breaks.length === 0 ? (
        <div className="glass-card p-6 text-center">
          <Coffee className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No breaks scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {breaks.map(b => {
            const days = differenceInDays(parseISO(b.end_date), parseISO(b.start_date)) + 1;
            return (
              <motion.div key={b.id} layout className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getIcon(b.reason)}</span>
                  <div>
                    <p className="text-sm font-medium">{b.reason}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(parseISO(b.start_date), 'MMM d')} → {format(parseISO(b.end_date), 'MMM d')} · {days}d
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBreak(b.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
