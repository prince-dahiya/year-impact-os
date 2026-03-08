import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useScores, useRunSessions, useSprintSessions, useGoals, usePoints, useChallenges } from '@/hooks/useAppData';
import { Download, Share2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function ShareableCard({ year }: { year: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { yearlyScore, getStreakDays } = useScores(year);
  const { sessions } = useRunSessions();
  const { sprints } = useSprintSessions();
  const { goals } = useGoals(year);
  const { points } = usePoints();
  const { challenges } = useChallenges();
  const streak = getStreakDays();

  // Compute real metrics
  const totalKm = Math.round(sessions.reduce((s: number, r: any) => s + (r.distance || 0), 0) * 100) / 100;
  const totalCal = sessions.reduce((s: number, r: any) => s + (r.calories || 0), 0);
  const totalRuns = sessions.length;
  const totalSprints = sprints.length;
  const totalTime = sessions.reduce((s: number, r: any) => s + (r.duration || 0), 0);
  const avgPace = totalRuns > 0 && totalKm > 0 ? (totalTime / 60) / totalKm : 0;
  const avgPaceMins = Math.floor(avgPace);
  const avgPaceSecs = Math.round((avgPace - avgPaceMins) * 60);
  const paceStr = avgPace > 0 ? `${avgPaceMins}:${String(avgPaceSecs).padStart(2, '0')}` : '--:--';

  const completedGoals = goals.length; // goals created
  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalChallenges = challenges.length;

  const activityProgress = yearlyScore.daysTracked > 0
    ? Math.round((yearlyScore.daysTracked / 365) * 100)
    : 0;

  const hasData = yearlyScore.daysTracked > 0 || totalRuns > 0 || totalSprints > 0 || streak > 0;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `impact-report-${year}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Report card downloaded!');
    } catch {
      toast.error('Failed to generate image');
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'impact-report.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'My Year Impact Report' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  if (!hasData) {
    return (
      <div className="glass-card p-8 text-center">
        <Award className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Start tracking to generate your Impact Report</p>
        <p className="text-[10px] text-muted-foreground mt-1">Complete actions, runs, or challenges to unlock</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Impact Report Card</h3>
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
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a0f1c 0%, #0d1520 40%, #091210 100%)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '28px',
        }}
      >
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(155 100% 45%), transparent)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(200 80% 50%), transparent)' }} />

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase font-medium" style={{ color: 'hsl(155 100% 45%)' }}>Impact Report</p>
              <h2 className="text-xl font-bold mt-1" style={{ color: '#e2e8f0' }}>{user?.name || 'User'}</h2>
              <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{format(new Date(), 'MMMM d, yyyy')} · {year}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <Award className="w-6 h-6" style={{ color: 'hsl(155 100% 45%)' }} />
            </div>
          </div>

          {/* Score + Streak row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{yearlyScore.totalPercentage}%</p>
              <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>Score</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{streak}🔥</p>
              <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>Streak</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{points}</p>
              <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: '#64748b' }}>Points</p>
            </div>
          </div>

          {/* Running Performance */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: '#94a3b8' }}>Running Performance</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{totalKm.toFixed(1)}</p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>KM</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{paceStr}</p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>Pace</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{totalCal}</p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>Cal</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{totalRuns}</p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>Runs</p>
              </div>
            </div>
          </div>

          {/* Goals & Challenges */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: '#94a3b8' }}>Goals & Challenges</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{completedGoals}</p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>Goals Set</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>
                  {completedChallenges}/{totalChallenges}
                </p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>Challenges</p>
              </div>
              <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{yearlyScore.daysTracked}</p>
                <p className="text-[8px] uppercase" style={{ color: '#64748b' }}>Days Active</p>
              </div>
            </div>
          </div>

          {/* Activity Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between" style={{ fontSize: '10px', color: '#64748b' }}>
              <span>Year Activity</span>
              <span>{activityProgress}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${activityProgress}%`, background: 'linear-gradient(90deg, hsl(155 100% 45%), hsl(200 80% 45%))' }} />
            </div>
          </div>

          {/* Sprints summary if any */}
          {totalSprints > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>Sprint Sessions</span>
              <span className="font-mono font-bold text-sm" style={{ color: '#e2e8f0' }}>{totalSprints}</span>
            </div>
          )}

          {/* Footer */}
          <p className="text-[9px] text-center pt-1" style={{ color: '#334155' }}>yearimpact.os · {year}</p>
        </div>
      </div>
    </div>
  );
}
