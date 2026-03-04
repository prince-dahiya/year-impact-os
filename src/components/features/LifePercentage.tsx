import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Heart, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export function LifePercentage() {
  const { user } = useAuth();
  const birthDate = user?.birthDate || '2003-01-01';
  const lifespan = user?.expectedLifespan || 80;

  const today = new Date();
  const birth = parseISO(birthDate);
  const daysLived = differenceInDays(today, birth);
  const totalDays = lifespan * 365;
  const daysRemaining = Math.max(totalDays - daysLived, 0);
  const percentage = Math.min((daysLived / totalDays) * 100, 100);
  const yearsLived = (daysLived / 365).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Life Awareness</h3>
          <p className="text-xs text-muted-foreground">Make every day count</p>
        </div>
      </div>

      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="text-4xl font-bold font-mono gradient-text"
        >
          {percentage.toFixed(1)}%
        </motion.div>
        <p className="text-sm text-muted-foreground mt-1">of your expected life</p>
      </div>

      {/* Life bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(155 100% 45%), hsl(38 92% 50%), hsl(0 72% 51%))' }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-mono font-bold drop-shadow-lg">{percentage.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Lived</p>
          <p className="font-mono font-bold text-sm">{yearsLived}y</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Days</p>
          <p className="font-mono font-bold text-sm">{daysLived.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="font-mono font-bold text-sm">{daysRemaining.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}
