import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useScores } from '@/hooks/useAppData';
import { Download, Share2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

export function ShareableCard({ year }: { year: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { yearlyScore, getStreakDays } = useScores(year);
  const streak = getStreakDays();
  const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
  const yearProgress = Math.round((dayOfYear / 365) * 100);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `year-impact-${year}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Card downloaded!');
    } catch {
      toast.error('Failed to generate image');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'impact-card.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'My Year Impact' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Impact Card</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" /> PNG
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </div>

      <div
        ref={cardRef}
        className="p-6 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a0f1c 0%, #0d1520 50%, #091210 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(155 100% 45%), transparent)' }} />

        <div className="relative z-10 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-widest uppercase" style={{ color: 'hsl(155 100% 45%)' }}>Year Impact OS</p>
              <h2 className="text-xl font-bold mt-1" style={{ color: '#e2e8f0' }}>{user?.name || 'User'}</h2>
            </div>
            <Award className="w-8 h-8" style={{ color: 'hsl(155 100% 45%)' }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{yearlyScore.totalPercentage}%</p>
              <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>Score</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{yearlyScore.daysTracked}</p>
              <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>Days</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{streak}🔥</p>
              <p className="text-[10px] mt-1" style={{ color: '#94a3b8' }}>Streak</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: '#94a3b8' }}>
              <span>Year Progress</span>
              <span>{yearProgress}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: `${yearProgress}%`, background: 'linear-gradient(90deg, hsl(155 100% 45%), hsl(170 80% 40%))' }} />
            </div>
          </div>

          <p className="text-[10px] text-center" style={{ color: '#475569' }}>yearimpact.os · {year}</p>
        </div>
      </div>
    </div>
  );
}
