import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRunSessions } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, Square, MapPin, Clock, Flame, TrendingUp, Trophy, ArrowLeft, Activity,
  Award, Target, BarChart3, Calendar, Zap, Star, Medal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, isWithinInterval, subWeeks, getDaysInMonth, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Area, AreaChart
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

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_run', label: 'First Steps', desc: 'Complete your first run', icon: '🏃', check: (sessions: any[]) => sessions.length >= 1 },
  { id: '5_runs', label: 'Getting Started', desc: 'Complete 5 runs', icon: '⭐', check: (sessions: any[]) => sessions.length >= 5 },
  { id: '10_runs', label: 'Dedicated Runner', desc: 'Complete 10 runs', icon: '🌟', check: (sessions: any[]) => sessions.length >= 10 },
  { id: '25_runs', label: 'Marathon Spirit', desc: 'Complete 25 runs', icon: '🏅', check: (sessions: any[]) => sessions.length >= 25 },
  { id: '5km_total', label: '5K Club', desc: 'Run 5km total', icon: '🎯', check: (sessions: any[]) => sessions.reduce((s: number, r: any) => s + r.distance, 0) >= 5 },
  { id: '25km_total', label: 'Quarter Century', desc: 'Run 25km total', icon: '🏆', check: (sessions: any[]) => sessions.reduce((s: number, r: any) => s + r.distance, 0) >= 25 },
  { id: '50km_total', label: 'Ultra Distance', desc: 'Run 50km total', icon: '💎', check: (sessions: any[]) => sessions.reduce((s: number, r: any) => s + r.distance, 0) >= 50 },
  { id: '100km_total', label: 'Century Runner', desc: 'Run 100km total', icon: '👑', check: (sessions: any[]) => sessions.reduce((s: number, r: any) => s + r.distance, 0) >= 100 },
  { id: '1000cal', label: 'Calorie Crusher', desc: 'Burn 1000 calories', icon: '🔥', check: (sessions: any[]) => sessions.reduce((s: number, r: any) => s + r.calories, 0) >= 1000 },
  { id: '3_day_streak', label: 'Hat Trick', desc: '3 runs in one week', icon: '🎩', check: (sessions: any[]) => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return sessions.filter((s: any) => isWithinInterval(new Date(s.date), { start: weekStart, end: weekEnd })).length >= 3;
  }},
];

// Simulated leaderboard data
function generateLeaderboard(userKm: number, userCal: number) {
  const names = ['Alex Runner', 'Sarah Sprint', 'Mike Marathon', 'Luna Pacer', 'Jay Stride', 'Kai Endure', 'Mia Trail'];
  const others = names.map(name => ({
    name,
    km: Math.round((Math.random() * 30 + 5) * 10) / 10,
    calories: Math.round(Math.random() * 2000 + 300),
  }));
  const all = [...others, { name: 'You', km: userKm, calories: userCal }];
  all.sort((a, b) => b.km - a.km);
  return all.map((u, i) => ({ ...u, rank: i + 1 }));
}

export function PerformanceMode({ onBack }: { onBack: () => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [tab, setTab] = useState<'run' | 'history' | 'analytics' | 'leaderboard' | 'achievements'>('run');
  const { sessions, addSession } = useRunSessions();
  const watchId = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPos = useRef<GeolocationPosition | null>(null);

  const startRun = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setElapsed(0);
    setDistance(0);
    setPositions([]);
    lastPos.current = null;
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
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  }, []);

  const stopRun = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setIsRunning(false);
    setIsPaused(false);
    if (distance > 0.01) {
      const avgPace = elapsed > 0 && distance > 0 ? (elapsed / 60) / distance : 0;
      const calories = Math.round(distance * 60);
      addSession({ date: new Date().toISOString(), distance: Math.round(distance * 100) / 100, duration: elapsed, avgPace: Math.round(avgPace * 100) / 100, calories, route: positions });
    }
  }, [distance, elapsed, positions, addSession]);

  const pauseRun = () => {
    if (isPaused) {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      setIsPaused(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const avgPace = elapsed > 0 && distance > 0 ? (elapsed / 60) / distance : 0;
  const calories = Math.round(distance * 60);

  // Monthly/weekly data
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthSessions = sessions.filter((s: any) => new Date(s.date).getMonth() === currentMonth);
  const totalKm = monthSessions.reduce((sum: number, s: any) => sum + s.distance, 0);
  const totalCal = monthSessions.reduce((sum: number, s: any) => sum + s.calories, 0);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekSessions = sessions.filter((s: any) => isWithinInterval(new Date(s.date), { start: weekStart, end: weekEnd }));
  const weekKm = weekSessions.reduce((sum: number, s: any) => sum + s.distance, 0);
  const weekCal = weekSessions.reduce((sum: number, s: any) => sum + s.calories, 0);

  // Chart data: monthly
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((name, i) => {
      const ms = sessions.filter((s: any) => new Date(s.date).getMonth() === i);
      return {
        name,
        distance: Math.round(ms.reduce((s: number, r: any) => s + r.distance, 0) * 10) / 10,
        calories: ms.reduce((s: number, r: any) => s + r.calories, 0),
        runs: ms.length,
        avgPace: ms.length > 0 ? Math.round(ms.reduce((s: number, r: any) => s + r.avgPace, 0) / ms.length * 10) / 10 : 0,
      };
    });
  }, [sessions]);

  // Weekly chart data (last 4 weeks)
  const weeklyChartData = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const wStart = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
      const wEnd = endOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
      const ws = sessions.filter((s: any) => isWithinInterval(new Date(s.date), { start: wStart, end: wEnd }));
      return {
        name: `W${4 - (3 - i)}`,
        distance: Math.round(ws.reduce((s: number, r: any) => s + r.distance, 0) * 10) / 10,
        calories: ws.reduce((s: number, r: any) => s + r.calories, 0),
        runs: ws.length,
      };
    });
  }, [sessions]);

  // Heatmap data for current month
  const heatmapData = useMemo(() => {
    const daysInMonth = getDaysInMonth(now);
    const monthStart = startOfMonth(now);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = format(new Date(now.getFullYear(), now.getMonth(), day), 'yyyy-MM-dd');
      const daySessions = sessions.filter((s: any) => s.date.startsWith(dateStr));
      const totalDist = daySessions.reduce((s: number, r: any) => s + r.distance, 0);
      return { day, distance: totalDist, hasActivity: daySessions.length > 0 };
    });
  }, [sessions, now]);

  const maxHeatDist = Math.max(...heatmapData.map(d => d.distance), 1);

  // Achievements
  const earnedAchievements = ACHIEVEMENTS.filter(a => a.check(sessions));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.check(sessions));

  // Leaderboard
  const leaderboard = useMemo(() => generateLeaderboard(weekKm, weekCal), [weekKm, weekCal]);

  const tabs = [
    { id: 'run' as const, label: 'Run', icon: <Play className="w-3.5 h-3.5" /> },
    { id: 'history' as const, label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'analytics' as const, label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'leaderboard' as const, label: 'Ranks', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'achievements' as const, label: 'Awards', icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h1 className="font-bold performance-gradient-text">Performance Mode</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{sessions.length} runs</span>
            <span>·</span>
            <span className="font-mono">{totalKm.toFixed(1)}km</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 py-2.5 px-2 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 min-w-fit',
                tab === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ============ RUN TAB ============ */}
          {tab === 'run' && (
            <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="glass-card p-8 text-center space-y-8">
                {/* Distance hero */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3">Distance</p>
                  <p className="text-7xl font-bold font-mono gradient-text leading-none">{distance.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">kilometers</p>
                </div>

                {/* Live stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <Clock className="w-4 h-4 text-info mx-auto" />
                    <p className="font-mono font-bold text-xl">{formatTime(elapsed)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</p>
                  </div>
                  <div className="space-y-1">
                    <TrendingUp className="w-4 h-4 text-primary mx-auto" />
                    <p className="font-mono font-bold text-xl">{avgPace > 0 ? formatPace(avgPace) : '--:--'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pace</p>
                  </div>
                  <div className="space-y-1">
                    <Flame className="w-4 h-4 text-warning mx-auto" />
                    <p className="font-mono font-bold text-xl">{calories}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cal</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  {!isRunning ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startRun}
                      className="w-24 h-24 rounded-full flex items-center justify-center text-primary-foreground shadow-lg"
                      style={{ background: 'var(--gradient-primary)' }}
                    >
                      <Play className="w-10 h-10 ml-1" />
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={pauseRun}
                        className="w-18 h-18 rounded-full bg-secondary border-2 border-border flex items-center justify-center"
                        style={{ width: 72, height: 72 }}
                      >
                        {isPaused ? <Play className="w-7 h-7 text-primary" /> : <Pause className="w-7 h-7 text-foreground" />}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={stopRun}
                        className="w-18 h-18 rounded-full bg-destructive/20 border-2 border-destructive/50 flex items-center justify-center"
                        style={{ width: 72, height: 72 }}
                      >
                        <Square className="w-7 h-7 text-destructive" />
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

              {/* Quick stats below */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This Week</p>
                  <p className="text-2xl font-bold font-mono gradient-text mt-1">{weekKm.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">km</span></p>
                  <p className="text-xs text-muted-foreground">{weekSessions.length} runs</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This Month</p>
                  <p className="text-2xl font-bold font-mono gradient-text mt-1">{totalKm.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">km</span></p>
                  <p className="text-xs text-muted-foreground">{monthSessions.length} runs</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ HISTORY TAB ============ */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Heatmap */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Activity Heatmap — {format(now, 'MMMM yyyy')}</h3>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-[9px] text-muted-foreground text-center font-medium">{d}</div>
                  ))}
                  {/* Padding for first day of month */}
                  {Array.from({ length: (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7 }, (_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {heatmapData.map(d => {
                    const intensity = d.distance / maxHeatDist;
                    return (
                      <motion.div
                        key={d.day}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: d.day * 0.02 }}
                        className={cn(
                          'aspect-square rounded-md flex items-center justify-center text-[9px] font-mono transition-colors',
                          d.hasActivity
                            ? 'text-primary-foreground font-medium'
                            : d.day <= now.getDate() ? 'bg-muted text-muted-foreground' : 'bg-muted/30 text-muted-foreground/30'
                        )}
                        style={d.hasActivity ? {
                          background: `hsl(155 100% ${45 - intensity * 15}% / ${0.3 + intensity * 0.7})`
                        } : undefined}
                        title={d.hasActivity ? `${d.distance.toFixed(1)}km` : undefined}
                      >
                        {d.day}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-end gap-2 text-[9px] text-muted-foreground">
                  <span>Less</span>
                  {[0.1, 0.3, 0.6, 1].map((v, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `hsl(155 100% ${45 - v * 15}% / ${0.3 + v * 0.7})` }} />
                  ))}
                  <span>More</span>
                </div>
              </div>

              {/* Session list */}
              {sessions.length === 0 ? (
                <div className="glass-card p-10 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No runs yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start your first run to see history here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.slice().reverse().map((s: any, i: number) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="glass-card p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{format(new Date(s.date), 'MMM d, yyyy')}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(s.date), 'h:mm a')}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(s.duration)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="font-mono font-bold text-primary text-lg">{s.distance.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">km</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="font-mono font-bold text-lg">{formatPace(s.avgPace)}</p>
                          <p className="text-[10px] text-muted-foreground">min/km</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="font-mono font-bold text-lg">{s.calories}</p>
                          <p className="text-[10px] text-muted-foreground">cal</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ============ ANALYTICS TAB ============ */}
          {tab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-card p-4 text-center">
                  <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono gradient-text">{totalKm.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KM This Month</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Flame className="w-5 h-5 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono">{totalCal}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Calories Burned</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Activity className="w-5 h-5 text-info mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono">{monthSessions.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Runs</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono">{monthSessions.length > 0 ? formatPace(monthSessions.reduce((s: number, r: any) => s + r.avgPace, 0) / monthSessions.length) : '--'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Pace</p>
                </div>
              </div>

              {/* Distance chart */}
              <div className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Monthly Distance (km)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 16%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215 16% 52%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215 16% 52%)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(225 18% 10%)', border: '1px solid hsl(225 14% 16%)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="distance" fill="hsl(155 100% 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly comparison */}
              <div className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-info" /> Weekly Progress</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 16%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215 16% 52%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215 16% 52%)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(225 18% 10%)', border: '1px solid hsl(225 14% 16%)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="distance" stroke="hsl(210 100% 56%)" fill="hsl(210 100% 56% / 0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Calories chart */}
              <div className="glass-card p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Flame className="w-4 h-4 text-warning" /> Monthly Calories Burned</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 14% 16%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215 16% 52%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215 16% 52%)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(225 18% 10%)', border: '1px solid hsl(225 14% 16%)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="calories" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Monthly Review */}
              <div className="glass-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Monthly Performance Review</h3>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                  {monthSessions.length > 0 ? (
                    <>
                      <p className="text-sm leading-relaxed">
                        This month you completed <span className="font-mono font-bold text-primary">{monthSessions.length}</span> runs,
                        covering <span className="font-mono font-bold text-primary">{totalKm.toFixed(1)}km</span> and
                        burning <span className="font-mono font-bold text-warning">{totalCal}</span> calories.
                        {monthSessions.length >= 8 && ' Your consistency is excellent — keep up the great work!'}
                        {monthSessions.length >= 4 && monthSessions.length < 8 && ' You\'re building a solid routine. Try to add one more run per week.'}
                        {monthSessions.length < 4 && ' Consider increasing your frequency for better results.'}
                      </p>
                      {monthSessions.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          Your average distance is {(totalKm / monthSessions.length).toFixed(1)}km per run
                          with an average pace of {formatPace(monthSessions.reduce((s: number, r: any) => s + r.avgPace, 0) / monthSessions.length)} min/km.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No runs this month yet. Start running to get your personalized performance review!</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ LEADERBOARD TAB ============ */}
          {tab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-warning" />
                    <h3 className="text-sm font-semibold">Weekly Leaderboard</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Resets Monday</span>
                </div>

                {/* Top 3 podium */}
                <div className="flex items-end justify-center gap-3 py-4">
                  {leaderboard.slice(0, 3).map((u, i) => {
                    const heights = ['h-24', 'h-20', 'h-16'];
                    const medals = ['🥇', '🥈', '🥉'];
                    const order = [1, 0, 2]; // silver, gold, bronze
                    const idx = order[i];
                    const user = leaderboard[idx];
                    return (
                      <div key={idx} className="flex flex-col items-center" style={{ order: i }}>
                        <span className="text-2xl mb-1">{medals[idx]}</span>
                        <p className={cn('text-xs font-medium mb-1', user.name === 'You' && 'text-primary')}>{user.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{user.km.toFixed(1)}km</p>
                        <div className={cn('w-16 rounded-t-lg mt-2', heights[idx], user.name === 'You' ? 'bg-primary/30 border border-primary/50' : 'bg-secondary')} />
                      </div>
                    );
                  })}
                </div>

                {/* Full list */}
                <div className="space-y-1.5">
                  {leaderboard.map((u) => (
                    <div key={u.name} className={cn(
                      'flex items-center justify-between p-3 rounded-lg transition-colors',
                      u.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30'
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold w-6 text-center text-muted-foreground">#{u.rank}</span>
                        <span className={cn('text-sm font-medium', u.name === 'You' && 'text-primary')}>{u.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                        <span>{u.km.toFixed(1)}km</span>
                        <span>{u.calories}cal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ ACHIEVEMENTS TAB ============ */}
          {tab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-warning" />
                    <h3 className="text-sm font-semibold">Achievements</h3>
                  </div>
                  <span className="text-xs font-mono text-primary">{earnedAchievements.length}/{ACHIEVEMENTS.length}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${(earnedAchievements.length / ACHIEVEMENTS.length) * 100}%` }} transition={{ duration: 1 }} />
                </div>
              </div>

              {/* Earned */}
              {earnedAchievements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-1">Unlocked</p>
                  <div className="grid grid-cols-2 gap-2">
                    {earnedAchievements.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        className="glass-card p-4 text-center space-y-2 border-primary/20"
                      >
                        <span className="text-3xl">{a.icon}</span>
                        <p className="text-xs font-semibold">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked */}
              {lockedAchievements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-1">Locked</p>
                  <div className="grid grid-cols-2 gap-2">
                    {lockedAchievements.map(a => (
                      <div key={a.id} className="glass-card p-4 text-center space-y-2 opacity-40">
                        <span className="text-3xl grayscale">{a.icon}</span>
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
