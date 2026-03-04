import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  delay?: number;
}

export function StatCard({ title, value, subtitle, icon, trend, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn('glass-card-hover p-5', className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold font-mono">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className={cn('text-xs flex items-center gap-1', trend.isPositive ? 'text-primary' : 'text-destructive')}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
