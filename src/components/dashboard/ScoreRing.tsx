import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScoreRingProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizes = {
  sm: { container: 'w-16 h-16', stroke: 4, text: 'text-lg' },
  md: { container: 'w-24 h-24', stroke: 6, text: 'text-2xl' },
  lg: { container: 'w-32 h-32', stroke: 8, text: 'text-3xl' },
  xl: { container: 'w-40 h-40', stroke: 10, text: 'text-4xl' }
};

export function ScoreRing({ percentage, size = 'md', showLabel = true, label, className }: ScoreRingProps) {
  const { container, stroke, text } = sizes[size];
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return 'text-primary';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className={cn('relative flex items-center justify-center', container, className)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          className={getColor()}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold font-mono', text)}>{Math.round(percentage)}</span>
        {showLabel && <span className="text-xs text-muted-foreground">{label || '%'}</span>}
      </div>
    </div>
  );
}
