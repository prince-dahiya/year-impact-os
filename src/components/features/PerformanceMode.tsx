import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRunSessions, useSprintSessions, useChallenges, usePoints } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RunMap } from './RunMap';
import {
  Play, Pause, Square, MapPin, Clock, Flame, TrendingUp, Trophy, ArrowLeft, Activity,
  Award, BarChart3, Calendar, Zap, Star, Plus, Target, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks, getDaysInMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from 'recharts';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(pace: number) {
  if (!pace || !isFinite(pace)) return '--:--';
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ACHIEVEMENTS = [
  { id: 'first_run', label: 'First Steps', desc: 'Complete your first run', icon: '🏃', check: (s: any[]) => s.length >= 1 },
  { id: '5_runs', label: 'Getting Started', desc: 'Complete 5 runs', icon: '⭐', check: (s: any[]) => s.length >= 5 },
  { id: '10_runs', label: 'Dedicated Runner', desc: 'Complete 10 runs', icon: '🌟', check: (s: any[]) => s.length >= 10 },
  { id: '5km', label: '5K Club', desc: 'Run 5km total', icon: '🎯', check: (s: any[]) => s.reduce((a: number, r: any) => a + r.distance, 0) >= 5 },
  { id: '25km', label: 'Quarter Century', desc: 'Run 25km total', icon: '🏆', check: (s: any[]) => s.reduce((a: number, r: any) => a + r.distance, 0) >= 25 },
  { id: '50km', label: 'Ultra Distance', desc: 'Run 50km total', icon: '💎', check: (s: any[]) => s.reduce((a: number, r: any) => a + r.distance, 0) >= 50 },
  { id: '100km', label: 'Century Runner', desc: 'Run 100km total', icon: '👑', check: (s: any[]) => s.reduce((a: number, r: any) => a + r.distance, 0) >= 100 },
  { id: '1000cal', label: 'Calorie Crusher', desc: 'Burn 1000 calories', icon: '🔥', check: (s: any[]) => s.reduce((a: number, r: any) => a + r.calories, 0) >= 1000 },
];

const SPRINT_BENCHMARKS = [
  { distance: 100, elite: 10, good: 13, average: 16, label: '100m' },
  { distance: 200, elite: 20, good: 26, average: 32, label: '200m' },
  { distance: 400, elite: 45, good: 58, average: 75, label: '400m' },
];

const CHALLENGE_TEMPLATES = [
  { name: 'Run 10km this week', type: 'distance' as const, target: 10, days: 7 },
  { name: 'Complete 5 runs', type: 'runs' as const, target: 5, days: 14 },
  { name: 'Burn 500 calories', type: 'calories' as const, target: 500, days: 7 },
  { name: 'Run 50km this month', type: 'distance' as const, target: 50, days: 30 },
];

export function PerformanceMode({ onBack }: { onBack: () => void }) {
  // Run state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [tab, setTab] = useState<'run' | 'sprint' | 'history' | 'analytics' | 'challenges' | 'leaderboard' | 'achievements'>('run');
  const { sessions, addSession } = useRunSessions();
  const { sprints, addSprint } = useSprintSessions();
  const { challenges, createChallenge, updateProgress, deleteChallenge } = useChallenges();
  const { points, addPoints } = usePoints();
  const watchId = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPos = useRef<GeolocationPosition | null>(null);

  // Sprint state - auto timer
  const [sprintDistance, setSprintDistance] = useState(100);
  const [isSprintRunning, setIsSprintRunning] = useState(false);
  const [sprintElapsed, setSprintElapsed] = useState(0);
  const [sprintPositions, setSprintPositions] = useState<[number, number][]>([]);
  const sprintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sprintWatchRef = useRef<number | null>(null);
  const sprintLastPos = useRef<GeolocationPosition | null>(null);
  const [sprintDistanceCovered, setSprintDistanceCovered] = useState(0);

  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  // --- RUN CONTROLS ---
  const startRun = useCallback(() => {
    setIsRunning(true); setIsPaused(false); setElapsed(0); setDistance(0); setPositions([]); lastPos.current = null;
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    if ('geolocation' in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPositions(prev => [...prev, [latitude, longitude]]);
          if (lastPos.current) {
            const d = haversine(lastPos.current.coords.latitude, lastPos.current.coords.longitude, latitude, longitude);
            if (d > 0.005) setDistance(prev => prev + d);
          }
          lastPos.current = pos;
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
  }, []);

  const stopRun = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setIsRunning(false); setIsPaused(false);
    if (distance > 0.01) {
      const avgPace = elapsed > 0 && distance > 0 ? (elapsed / 60) / distance : 0;
      const calories = Math.round(distance * 60);
      addSession({ date: new Date().toISOString(), distance: Math.round(distance * 100) / 100, duration: elapsed, avgPace: Math.round(avgPace * 100) / 100, calories, route: positions, type: 'run' });
      addPoints(Math.round(distance * 10), `Run ${distance.toFixed(2)}km`);
      challenges.forEach(c => {
        if (c.completed) return;
        if (c.type === 'distance') updateProgress(c.id, c.current + distance);
        if (c.type === 'runs') updateProgress(c.id, c.current + 1);
        if (c.type === 'calories') updateProgress(c.id, c.current + calories);
      });
    }
  }, [distance, elapsed, positions, addSession, addPoints, challenges, updateProgress]);

  const pauseRun = () => {
    if (isPaused) { timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000); setIsPaused(false); }
    else { if (timerRef.current) clearInterval(timerRef.current); setIsPaused(true); }
  };

  // --- SPRINT AUTO-TIMER ---
  const startSprint = useCallback(() => {
    setIsSprintRunning(true);
    setSprintElapsed(0);
    setSprintDistanceCovered(0);
    setSprintPositions([]);
    sprintLastPos.current = null;

    sprintTimerRef.current = setInterval(() => setSprintElapsed(p => p + 0.1), 100);

    if ('geolocation' in navigator) {
      sprintWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setSprintPositions(prev => [...prev, [latitude, longitude]]);
          if (sprintLastPos.current) {
            const d = haversine(sprintLastPos.current.coords.latitude, sprintLastPos.current.coords.longitude, latitude, longitude);
            if (d > 0.001) setSprintDistanceCovered(prev => prev + d * 1000); // meters
          }
          sprintLastPos.current = pos;
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
    }
  }, []);

  const stopSprint = useCallback(() => {
    if (sprintTimerRef.current) clearInterval(sprintTimerRef.current);
    if (sprintWatchRef.current !== null) navigator.geolocation.clearWatch(sprintWatchRef.current);
    setIsSprintRunning(false);

    const time = Math.round(sprintElapsed * 10) / 10;
    if (time > 0.5) {
      const actualDistance = sprintDistanceCovered > 10 ? Math.round(sprintDistanceCovered) : sprintDistance;
      const distKm = actualDistance / 1000;
      const speed = Math.round((distKm / (time / 3600)) * 10) / 10;
      addSprint({ date: new Date().toISOString(), distance: actualDistance, duration: time, speed });
      addPoints(Math.round(actualDistance / 10), `Sprint ${actualDistance}m in ${time}s`);
    }
  }, [sprintElapsed, sprintDistance, sprintDistanceCovered, addSprint, addPoints]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (sprintTimerRef.current) clearInterval(sprintTimerRef.current);
      if (sprintWatchRef.current !== null) navigator.geolocation.clearWatch(sprintWatchRef.current);
    };
  }, []);

  const handleCreateChallenge = (template: typeof CHALLENGE_TEMPLATES[0]) => {
    const now = new Date();
    const end = new Date(now.getTime() + template.days * 86400000);
    createChallenge({ name: template.name, type: template.type, target: template.target, startDate: now.toISOString(), endDate: end.toISOString() });
    setShowChallengeDialog(false);
  };

  // Computed values
  const avgPace = elapsed > 0 && distance > 0 ? (elapsed / 60) / distance : 0;
  const calories = Math.round(distance * 60);
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthSessions = sessions.filter((s: any) => new Date(s.date).getMonth() === currentMonth);
  const totalKm = monthSessions.reduce((sum: number, s: any) => sum + s.distance, 0);
  const totalCal = monthSessions.reduce((sum: number, s: any) => sum + s.calories, 0);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekSessions = sessions.filter((s: any) => isWithinInterval(new Date(s.date), { start: weekStart, end: weekEnd }));
  const weekKm = weekSessions.reduce((sum: number, s: any) => sum + s.distance, 0);

  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((name, i) => {
      const ms = sessions.filter((s: any) => new Date(s.date).getMonth() === i);
      return { name, distance: Math.round(ms.reduce((s: number, r: any) => s + r.distance, 0) * 10) / 10, calories: ms.reduce((s: number, r: any) => s + r.calories, 0), runs: ms.length };
    });
  }, [sessions]);

  const weeklyChartData = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const wStart = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
      const wEnd = endOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
      const ws = sessions.filter((s: any) => isWithinInterval(new Date(s.date), { start: wStart, end: wEnd }));
      return { name: `W${i + 1}`, distance: Math.round(ws.reduce((s: number, r: any) => s + r.distance, 0) * 10) / 10, calories: ws.reduce((s: number, r: any) => s + r.calories, 0) };
    });
  }, [sessions]);

  const heatmapData = useMemo(() => {
    const daysInMonth = getDaysInMonth(now);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = format(new Date(now.getFullYear(), now.getMonth(), day), 'yyyy-MM-dd');
      const daySessions = sessions.filter((s: any) => s.date.startsWith(dateStr));
      const totalDist = daySessions.reduce((s: number, r: any) => s + r.distance, 0);
      return { day, distance: totalDist, hasActivity: daySessions.length > 0 };
    });
  }, [sessions]);

  const maxHeatDist = Math.max(...heatmapData.map(d => d.distance), 1);
  const earnedAchievements = ACHIEVEMENTS.filter(a => a.check(sessions));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.check(sessions));

  const getSprintFeedback = (dist: number, time: number) => {
    const bench = SPRINT_BENCHMARKS.find(b => b.distance === dist) || SPRINT_BENCHMARKS[0];
    if (time <= bench.elite) return { level: 'Elite', color: 'text-primary', tip: 'Outstanding! Professional level speed.' };
    if (time <= bench.good) return { level: 'Good', color: 'text-info', tip: 'Solid performance. Push for consistency.' };
    if (time <= bench.average) return { level: 'Average', color: 'text-warning', tip: 'Good start. Focus on explosive starts.' };
    return { level: 'Needs Work', color: 'text-destructive', tip: 'Keep training. Speed comes with practice.' };
  };

  const tabs = [
    { id: 'run' as const, label: 'Run', icon: <Play className="w-3.5 h-3.5" /> },
    { id: 'sprint' as const, label: 'Sprint', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'history' as const, label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'analytics' as const, label: 'Stats', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'challenges' as const, label: 'Challenges', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'leaderboard' as const, label: 'Ranks', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'achievements' as const, label: 'Awards', icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen pb-12">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="font-bold text-sm">Performance Mode</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {points > 0 && (
              <span className="text-xs font-mono text-warning flex items-center gap-1">
                <Star className="w-3 h-3" /> {points} pts
              </span>
            )}
            {sessions.length > 0 && (
              <span className="text-xs text-muted-foreground font-mono">{sessions.length} runs</span>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 py-2 px-2 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 min-w-fit',
                tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* RUN TAB */}
          {tab === 'run' && (
            <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="glass-card p-8 text-center space-y-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Distance</p>
                  <p className="text-6xl font-bold font-mono gradient-text leading-none">{distance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">km</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Clock className="w-4 h-4 text-info mx-auto mb-1" /><p className="font-mono font-bold text-lg">{formatTime(elapsed)}</p><p className="text-[10px] text-muted-foreground">Time</p></div>
                  <div><TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" /><p className="font-mono font-bold text-lg">{avgPace > 0 ? formatPace(avgPace) : '--:--'}</p><p className="text-[10px] text-muted-foreground">Pace</p></div>
                  <div><Flame className="w-4 h-4 text-warning mx-auto mb-1" /><p className="font-mono font-bold text-lg">{calories}</p><p className="text-[10px] text-muted-foreground">Cal</p></div>
                </div>

                {/* Live Route Preview */}
                {isRunning && positions.length >= 2 && (
                  <RunMap route={positions} height="180px" />
                )}

                <div className="flex items-center justify-center gap-5 pt-2">
                  {!isRunning ? (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startRun}
                      className="w-20 h-20 rounded-full flex items-center justify-center text-primary-foreground shadow-lg" style={{ background: 'var(--gradient-primary)' }}
                    ><Play className="w-8 h-8 ml-1" /></motion.button>
                  ) : (
                    <>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={pauseRun} className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center">
                        {isPaused ? <Play className="w-6 h-6 text-primary" /> : <Pause className="w-6 h-6 text-foreground" />}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={stopRun} className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive/50 flex items-center justify-center">
                        <Square className="w-6 h-6 text-destructive" />
                      </motion.button>
                    </>
                  )}
                </div>
                {isRunning && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">{isPaused ? 'Paused' : 'GPS Tracking Active'}</span>
                  </div>
                )}
              </div>
              {sessions.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">This Week</p>
                    <p className="text-xl font-bold font-mono mt-1">{weekKm.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">km</span></p>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">This Month</p>
                    <p className="text-xl font-bold font-mono mt-1">{totalKm.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">km</span></p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SPRINT TAB - Auto Timer */}
          {tab === 'sprint' && (
            <motion.div key="sprint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Sprint Tracker</h3>
                    <p className="text-xs text-muted-foreground">Auto-timed · GPS distance tracking</p>
                  </div>
                </div>

                {/* Distance selector */}
                {!isSprintRunning && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Target Distance</label>
                    <div className="flex gap-2">
                      {[100, 200, 400].map(d => (
                        <button
                          key={d}
                          onClick={() => setSprintDistance(d)}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                            sprintDistance === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                          )}
                        >{d}m</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timer display */}
                <div className="text-center space-y-3">
                  <p className="text-5xl font-bold font-mono gradient-text">
                    {sprintElapsed.toFixed(1)}<span className="text-lg text-muted-foreground ml-1">s</span>
                  </p>
                  {isSprintRunning && sprintDistanceCovered > 0 && (
                    <p className="text-sm text-muted-foreground font-mono">
                      {Math.round(sprintDistanceCovered)}m covered
                    </p>
                  )}
                </div>

                {/* Start/Stop button */}
                <div className="flex justify-center">
                  {!isSprintRunning ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startSprint}
                      className="w-20 h-20 rounded-full flex items-center justify-center text-primary-foreground shadow-lg"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--warning)), hsl(38 92% 40%))' }}
                    >
                      <Play className="w-8 h-8 ml-1" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={stopSprint}
                      className="w-20 h-20 rounded-full bg-destructive/20 border-2 border-destructive/50 flex items-center justify-center"
                    >
                      <Square className="w-8 h-8 text-destructive" />
                    </motion.button>
                  )}
                </div>

                {isSprintRunning && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    <span className="text-xs text-muted-foreground">Sprint in progress — tap stop when finished</span>
                  </div>
                )}

                {/* Benchmarks */}
                {!isSprintRunning && (
                  <div className="p-4 rounded-xl bg-secondary/40 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Benchmark for {sprintDistance}m</p>
                    {(() => {
                      const bench = SPRINT_BENCHMARKS.find(b => b.distance === sprintDistance);
                      if (!bench) return null;
                      return (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div><p className="text-xs text-primary font-medium">Elite</p><p className="font-mono font-bold">{bench.elite}s</p></div>
                          <div><p className="text-xs text-info font-medium">Good</p><p className="font-mono font-bold">{bench.good}s</p></div>
                          <div><p className="text-xs text-warning font-medium">Average</p><p className="font-mono font-bold">{bench.average}s</p></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Sprint History */}
              {sprints.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Zap className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sprints recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap start, sprint, then stop to log automatically</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider px-1">Recent Sprints</p>
                  {sprints.slice().reverse().slice(0, 10).map(s => {
                    const feedback = getSprintFeedback(s.distance, s.duration);
                    return (
                      <div key={s.id} className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-warning" />
                            <span className="text-sm font-medium">{s.distance}m</span>
                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full bg-secondary', feedback.color)}>{feedback.level}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{format(new Date(s.date), 'MMM d')}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-2 rounded-lg bg-secondary/40">
                            <p className="font-mono font-bold text-primary">{s.duration}s</p>
                            <p className="text-[10px] text-muted-foreground">Time</p>
                          </div>
                          <div className="p-2 rounded-lg bg-secondary/40">
                            <p className="font-mono font-bold">{s.speed}</p>
                            <p className="text-[10px] text-muted-foreground">km/h</p>
                          </div>
                          <div className="p-2 rounded-lg bg-secondary/40">
                            <p className="text-[10px] text-muted-foreground mt-1">{feedback.tip.slice(0, 40)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sprint progress chart */}
              {sprints.length >= 2 && (
                <div className="glass-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-warning" /> Sprint Progress</h3>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sprints.slice(-20).map((s, i) => ({ name: `#${i + 1}`, time: s.duration, speed: s.speed }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="speed" stroke="hsl(var(--warning))" fill="hsl(var(--warning) / 0.15)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY TAB - with route maps */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Activity — {format(now, 'MMMM yyyy')}</h3>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="text-[9px] text-muted-foreground text-center">{d}</div>)}
                  {Array.from({ length: (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7 }, (_, i) => <div key={`p-${i}`} />)}
                  {heatmapData.map(d => {
                    const intensity = d.distance / maxHeatDist;
                    return (
                      <div
                        key={d.day}
                        className={cn(
                          'aspect-square rounded-md flex items-center justify-center text-[9px] font-mono',
                          d.hasActivity ? 'text-primary-foreground font-medium' : d.day <= now.getDate() ? 'bg-muted text-muted-foreground' : 'bg-muted/30 text-muted-foreground/30'
                        )}
                        style={d.hasActivity ? { background: `hsl(var(--primary) / ${0.3 + intensity * 0.7})` } : undefined}
                      >{d.day}</div>
                    );
                  })}
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <MapPin className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No runs recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start your first run to see history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.slice().reverse().map((s: any) => {
                    const isExpanded = expandedRun === s.id;
                    return (
                      <div key={s.id} className="glass-card overflow-hidden">
                        <button
                          className="w-full p-4 text-left"
                          onClick={() => setExpandedRun(isExpanded ? null : s.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{format(new Date(s.date), 'MMM d, yyyy')}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(s.date), 'h:mm a')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground font-mono">{formatTime(s.duration)}</span>
                              {s.route && s.route.length >= 2 && (
                                <p className="text-[10px] text-primary">📍 Route available</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 rounded-lg bg-secondary/40">
                              <p className="font-mono font-bold text-primary">{s.distance.toFixed(2)}</p>
                              <p className="text-[10px] text-muted-foreground">km</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-secondary/40">
                              <p className="font-mono font-bold">{formatPace(s.avgPace)}</p>
                              <p className="text-[10px] text-muted-foreground">min/km</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-secondary/40">
                              <p className="font-mono font-bold">{s.calories}</p>
                              <p className="text-[10px] text-muted-foreground">cal</p>
                            </div>
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && s.route && s.route.length >= 2 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4">
                                <RunMap route={s.route} height="220px" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {tab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {sessions.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <BarChart3 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Complete some runs to see analytics</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="glass-card p-4 text-center">
                      <MapPin className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <p className="text-xl font-bold font-mono">{totalKm.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">KM This Month</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <Flame className="w-4 h-4 text-warning mx-auto mb-1.5" />
                      <p className="text-xl font-bold font-mono">{totalCal}</p>
                      <p className="text-[10px] text-muted-foreground">Calories</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <Activity className="w-4 h-4 text-info mx-auto mb-1.5" />
                      <p className="text-xl font-bold font-mono">{monthSessions.length}</p>
                      <p className="text-[10px] text-muted-foreground">Runs</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                      <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <p className="text-xl font-bold font-mono">{monthSessions.length > 0 ? formatPace(monthSessions.reduce((s: number, r: any) => s + r.avgPace, 0) / monthSessions.length) : '--'}</p>
                      <p className="text-[10px] text-muted-foreground">Avg Pace</p>
                    </div>
                  </div>

                  <div className="glass-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Monthly Distance</h3>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="distance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-info" /> Weekly Progress</h3>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="distance" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.15)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* CHALLENGES TAB */}
          {tab === 'challenges' && (
            <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Active Challenges</h3>
                <Button size="sm" onClick={() => setShowChallengeDialog(true)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Join
                </Button>
              </div>

              <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
                <DialogContent className="glass-card border-border max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-base">Pick a Challenge</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 mt-2">
                    {CHALLENGE_TEMPLATES.map(t => (
                      <button
                        key={t.name}
                        onClick={() => handleCreateChallenge(t)}
                        className="w-full text-left p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-transparent hover:border-primary/20 transition-all"
                      >
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Target: {t.target} {t.type === 'distance' ? 'km' : t.type === 'calories' ? 'cal' : 'runs'} · {t.days} days
                        </p>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              {challenges.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Target className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active challenges</p>
                  <p className="text-xs text-muted-foreground mt-1">Join a challenge to start competing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.map(c => {
                    const pct = Math.min(Math.round((c.current / c.target) * 100), 100);
                    return (
                      <div key={c.id} className={cn('glass-card p-4 space-y-3', c.completed && 'border-primary/30')}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {c.current.toFixed(1)} / {c.target} {c.type === 'distance' ? 'km' : c.type === 'calories' ? 'cal' : 'runs'}
                            </p>
                          </div>
                          {c.completed ? (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">✓ Done</span>
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
                          )}
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full', c.completed ? 'bg-primary' : 'bg-primary/60')}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* LEADERBOARD TAB - Real data only */}
          {tab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card p-6 text-center space-y-3">
                <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                <div>
                  <h3 className="text-sm font-semibold">Global Leaderboard</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    No rankings available yet. The leaderboard requires multiple users with real activity data.
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Rankings are based on distance, calories, and activity points.
                  </p>
                </div>
                {sessions.length > 0 && (
                  <div className="p-4 rounded-xl bg-secondary/40 space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Stats This Week</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="font-mono font-bold text-lg text-primary">{weekKm.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">km</span></p>
                        <p className="text-[10px] text-muted-foreground">Distance</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-lg">{weekSessions.length}</p>
                        <p className="text-[10px] text-muted-foreground">Runs</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-lg text-warning">{points}</p>
                        <p className="text-[10px] text-muted-foreground">Points</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {tab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-warning" />
                    <h3 className="text-sm font-semibold">Achievements</h3>
                  </div>
                  <span className="text-xs font-mono text-primary">{earnedAchievements.length}/{ACHIEVEMENTS.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${(earnedAchievements.length / ACHIEVEMENTS.length) * 100}%` }} transition={{ duration: 0.8 }} />
                </div>
              </div>

              {/* Points summary */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning" />
                    <h3 className="text-sm font-semibold">Total Points</h3>
                  </div>
                  <span className="font-mono font-bold text-lg text-warning">{points}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Earned from runs, sprints, and challenges</p>
              </div>

              {earnedAchievements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-1">Unlocked</p>
                  <div className="grid grid-cols-2 gap-2">
                    {earnedAchievements.map(a => (
                      <div key={a.id} className="glass-card p-4 text-center space-y-1.5 border-primary/20">
                        <span className="text-2xl">{a.icon}</span>
                        <p className="text-xs font-semibold">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lockedAchievements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-1">Locked</p>
                  <div className="grid grid-cols-2 gap-2">
                    {lockedAchievements.map(a => (
                      <div key={a.id} className="glass-card p-4 text-center space-y-1.5 opacity-35">
                        <span className="text-2xl grayscale">{a.icon}</span>
                        <p className="text-xs font-semibold">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
