import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Compass, Sparkles, MapPin } from 'lucide-react';
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
  const experiencesEstimate = Math.round(daysLived * 3); // ~3 meaningful moments/day

  // Milestone markers
  const milestones = [
    { label: 'Youth', pct: 25 },
    { label: 'Prime', pct: 50 },
    { label: 'Wisdom', pct: 75 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Life Journey</h3>
          <p className="text-xs text-muted-foreground">Celebrate every step forward</p>
        </div>
      </div>

      {/* Hero stat */}
      <div className="text-center py-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="text-5xl font-bold font-mono gradient-text"
        >
          {percentage.toFixed(1)}%
        </motion.div>
        <p className="text-sm text-muted-foreground mt-1.5">of your life journey explored</p>
      </div>

      {/* Journey progress bar with milestones */}
      <div className="space-y-2">
        <div className="relative h-5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full progress-bar-glow"
            style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(170 80% 40%), hsl(var(--info)))' }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold drop-shadow-lg text-foreground">{percentage.toFixed(1)}%</span>
          </div>
        </div>
        {/* Milestones */}
        <div className="relative h-4">
          {milestones.map(m => (
            <div key={m.label} className="absolute flex flex-col items-center -translate-x-1/2" style={{ left: `${m.pct}%` }}>
              <div className={`w-1.5 h-1.5 rounded-full ${percentage >= m.pct ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
              <span className="text-[9px] text-muted-foreground mt-0.5">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-secondary/50 text-center space-y-1">
          <Sparkles className="w-3.5 h-3.5 text-primary mx-auto" />
          <p className="font-mono font-bold text-sm">{yearsLived}y</p>
          <p className="text-[10px] text-muted-foreground">Explored</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50 text-center space-y-1">
          <MapPin className="w-3.5 h-3.5 text-info mx-auto" />
          <p className="font-mono font-bold text-sm">{daysLived.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Days Experienced</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/50 text-center space-y-1">
          <Compass className="w-3.5 h-3.5 text-warning mx-auto" />
          <p className="font-mono font-bold text-sm">{daysRemaining.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Adventures Ahead</p>
        </div>
      </div>

      {/* Motivational footer */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
        <p className="text-xs text-muted-foreground">
          You've gathered approximately <span className="font-mono text-primary font-medium">{experiencesEstimate.toLocaleString()}</span> experiences so far. Keep exploring! ✨
        </p>
      </div>
    </motion.div>
  );
}
