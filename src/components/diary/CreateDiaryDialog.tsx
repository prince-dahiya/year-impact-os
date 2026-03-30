import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DIARY_COLORS, DIARY_ICONS } from '@/types/diary';

interface CreateDiaryDialogProps {
  onClose: () => void;
  onCreate: (name: string, pin: string, color: string, icon: string) => void;
}

export function CreateDiaryDialog({ onClose, onCreate }: CreateDiaryDialogProps) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [color, setColor] = useState(DIARY_COLORS[0]);
  const [icon, setIcon] = useState(DIARY_ICONS[0]);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return setError('Name is required');
    if (pin.length < 4) return setError('PIN must be at least 4 characters');
    if (pin !== confirmPin) return setError('PINs do not match');
    onCreate(name.trim(), pin, color, icon);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Create New Diary</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Diary Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Personal Diary" className="bg-secondary/50" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {DIARY_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${icon === ic ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'bg-secondary/50 hover:bg-secondary'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Color</label>
            <div className="flex gap-2">
              {DIARY_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c, ringColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">PIN (min 4 characters)</label>
            <Input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" className="bg-secondary/50" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Confirm PIN</label>
            <Input type="password" inputMode="numeric" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="••••" className="bg-secondary/50" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleCreate}>Create Diary</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
