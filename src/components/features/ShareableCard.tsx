import { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useScores, useRunSessions, useSprintSessions, useGoals, usePoints, useChallenges } from '@/hooks/useAppData';
import { Download, Share2, Award, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RunMap } from './RunMap';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function ShareableCard({ year }: { year: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { yearlyScore, monthlyScores, getStreakDays } = useScores(year);
  const { sessions } = useRunSessions();
  const { sprints } = useSprintSessions();
  const { goals } = useGoals(year);
  const { points } = usePoints();
  const { challenges } = useChallenges();
  const streak = getStreakDays();

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = yearly
  const isMonthly = selectedMonth !== null;
  const currentMonthIndex = new Date().getMonth();

  // Filter sessions by month if selected
  const filteredSessions = useMemo(() => {
    if (!isMonthly) return sessions;
    return sessions.filter((s: any) => new Date(s.date).getMonth() === selectedMonth);
  }, [sessions, selectedMonth, isMonthly]);

  const filteredSprints = useMemo(() => {
    if (!isMonthly) return sprints;
    return sprints.filter(s => new Date(s.date).getMonth() === selectedMonth);
  }, [sprints, selectedMonth, isMonthly]);

  // Metrics
  const totalKm = Math.round(filteredSessions.reduce((s: number, r: any) => s + (r.distance || 0), 0) * 100) / 100;
  const totalCal = filteredSessions.reduce((s: number, r: any) => s + (r.calories || 0), 0);
  const totalRuns = filteredSessions.length;
  const totalSprintCount = filteredSprints.length;
  const totalTime = filteredSessions.reduce((s: number, r: any) => s + (r.duration || 0), 0);
  const avgPace = totalRuns > 0 && totalKm > 0 ? (totalTime / 60) / totalKm : 0;
  const avgPaceMins = Math.floor(avgPace);
  const avgPaceSecs = Math.round((avgPace - avgPaceMins) * 60);
  const paceStr = avgPace > 0 ? `${avgPaceMins}:${String(avgPaceSecs).padStart(2, '0')}` : '--:--';

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalChallenges = challenges.length;

  const scoreValue = isMonthly && selectedMonth !== null
    ? monthlyScores[selectedMonth]?.percentage || 0
    : yearlyScore.totalPercentage;
  const daysTracked = isMonthly && selectedMonth !== null
    ? monthlyScores[selectedMonth]?.activeDays || 0
    : yearlyScore.daysTracked;

  const activityProgress = isMonthly
    ? (daysTracked > 0 ? Math.round((daysTracked / (monthlyScores[selectedMonth!]?.totalDays || 30)) * 100) : 0)
    : (yearlyScore.daysTracked > 0 ? Math.round((yearlyScore.daysTracked / 365) * 100) : 0);

  // Latest route for display
  const latestRunWithRoute = filteredSessions.slice().reverse().find((s: any) => s.route && s.route.length >= 2);

  const hasData = daysTracked > 0 || totalRuns > 0 || totalSprintCount > 0 || streak > 0;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3 });
      const link = document.createElement('a');
      const label = isMonthly ? MONTHS[selectedMonth!].toLowerCase() : 'year';
      link.download = `impact-${label}-${year}.png`;
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
        await navigator.share({ files: [file], title: 'My Impact Report' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const title = isMonthly ? `${MONTHS[selectedMonth!]} ${year}` : `Year ${year}`;

  if (!hasData && !isMonthly) {
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
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Impact Report</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" /> PNG
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setSelectedMonth(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0',
            !isMonthly ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          Year
        </button>
        {MONTHS.map((m, i) => {
          if (i > currentMonthIndex) return null;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(i)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0',
                selectedMonth === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {m.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a0f1c 0%, #0d1520 40%, #091210 100%)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '24px',
        }}
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(155 100% 45%), transparent)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(200 80% 50%), transparent)' }} />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase font-medium" style={{ color: 'hsl(155 100% 45%)' }}>
                {isMonthly ? 'Monthly Report' : 'Year Impact Report'}
              </p>
              <h2 className="text-lg font-bold mt-1" style={{ color: '#e2e8f0' }}>{user?.name || 'User'}</h2>
              <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{title}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <Award className="w-5 h-5" style={{ color: 'hsl(155 100% 45%)' }} />
            </div>
          </div>

          {/* Score row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{scoreValue}%</p>
              <p className="text-[9px] mt-0.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Score</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{isMonthly ? daysTracked : streak}
                {!isMonthly && '🔥'}
              </p>
              <p className="text-[9px] mt-0.5 uppercase tracking-wider" style={{ color: '#64748b' }}>{isMonthly ? 'Days Active' : 'Streak'}</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(155 100% 45%)' }}>{isMonthly ? totalRuns : points}</p>
              <p className="text-[9px] mt-0.5 uppercase tracking-wider" style={{ color: '#64748b' }}>{isMonthly ? 'Runs' : 'Points'}</p>
            </div>
          </div>

          {/* Running Performance */}
          <div className="space-y-1.5">
            <p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: '#94a3b8' }}>Running</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: totalKm.toFixed(1), label: 'KM' },
                { val: paceStr, label: 'Pace' },
                { val: String(totalCal), label: 'Cal' },
                { val: String(totalRuns), label: 'Runs' },
              ].map(m => (
                <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-base font-bold font-mono" style={{ color: '#e2e8f0' }}>{m.val}</p>
                  <p className="text-[7px] uppercase" style={{ color: '#64748b' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Goals & Challenges */}
          {(!isMonthly || totalSprintCount > 0 || goals.length > 0) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-base font-bold font-mono" style={{ color: '#e2e8f0' }}>{goals.length}</p>
                <p className="text-[7px] uppercase" style={{ color: '#64748b' }}>Goals</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-base font-bold font-mono" style={{ color: '#e2e8f0' }}>{completedChallenges}/{totalChallenges}</p>
                <p className="text-[7px] uppercase" style={{ color: '#64748b' }}>Challenges</p>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-base font-bold font-mono" style={{ color: '#e2e8f0' }}>{totalSprintCount}</p>
                <p className="text-[7px] uppercase" style={{ color: '#64748b' }}>Sprints</p>
              </div>
            </div>
          )}

          {/* Activity Progress */}
          <div className="space-y-1">
            <div className="flex justify-between" style={{ fontSize: '9px', color: '#64748b' }}>
              <span>{isMonthly ? 'Month Activity' : 'Year Activity'}</span>
              <span>{activityProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${activityProgress}%`, background: 'linear-gradient(90deg, hsl(155 100% 45%), hsl(200 80% 45%))' }} />
            </div>
          </div>

          {/* Route Map Preview */}
          {latestRunWithRoute && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" style={{ color: '#94a3b8' }} />
                <p className="text-[9px] uppercase tracking-[0.15em] font-medium" style={{ color: '#94a3b8' }}>Latest Route</p>
              </div>
              <RunMap route={latestRunWithRoute.route} height="140px" />
            </div>
          )}

          {/* Footer */}
          <p className="text-[8px] text-center pt-1" style={{ color: '#334155' }}>yearimpact.os · {title}</p>
        </div>
      </div>
    </div>
  );
}
