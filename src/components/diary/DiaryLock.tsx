import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DiaryLockProps {
  diaryName: string;
  diaryIcon: string;
  onUnlock: () => void;
  onBack: () => void;
  verifyPin: (pin: string) => boolean;
}

export function DiaryLock({ diaryName, diaryIcon, onUnlock, onBack, verifyPin }: DiaryLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pin)) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="glass-card p-8 w-full max-w-sm text-center space-y-6"
      >
        <div className="space-y-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl"
          >
            {diaryIcon}
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground">{diaryName}</h2>
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
            <Lock className="w-3 h-3" />
            <span>Enter PIN to unlock</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={8}
            placeholder="••••"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="text-center text-lg tracking-[0.5em] bg-secondary/50 border-border/50"
            autoFocus
          />
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-xs">
              Incorrect PIN. Try again.
            </motion.p>
          )}
          <Button type="submit" className="w-full" disabled={pin.length < 1}>
            Unlock
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
