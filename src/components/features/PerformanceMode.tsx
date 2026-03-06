import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRunSessions } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, Square, MapPin, Clock, Flame, TrendingUp, Trophy, ArrowLeft, Activity,
  Award, BarChart3, Calendar, Zap
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
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
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
      addSession({ date: new Date().toISOString(), distance: Math.round(distance * 100) / 100, duration: elapsed, avgPace: Math.round(avgPace * 100) / 100, calories, route: positions });
    }
  }, [distance, elapsed, positions, addSession]);

  const pauseRun = () => {
    if (isPaused) { timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000); setIsPaused(false); }
    else { if (timerRef.current) clearInterval(timerRef.current); setIsPaused(true); }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

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

  const tabs = [
    { id: 'run' as const, label: 'Run', icon: <Play className="w-3.5 h-3.5" /> },
    { id: 'history' as const, label: 'History', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'analytics' as const, label: 'Stats', icon: <BarChart3 className="w-3.5 h-3.5" /> },
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
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">{sessions.length} runs · {totalKm.toFixed(1)}km</span>
          )}
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
                    <span className="text-xs text-muted-foreground">{isPaused ? 'Paused' : 'GPS Tracking'}</span>
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

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Heatmap */}
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
                  <p className="text-sm text-muted-foreground">No runs yet. Start your first run!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.slice().reverse().map((s: any, i: number) => (
                    <div key={s.id} className="glass-card p-4">
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
                        <span className="text-xs text-muted-foreground font-mono">{formatTime(s.duration)}</span>
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
                    </div>
                  ))}
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

                  {/* Monthly review */}
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Monthly Review</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/40 text-sm leading-relaxed">
                      {monthSessions.length > 0 ? (
                        <p>
                          You completed <span className="font-mono font-bold text-primary">{monthSessions.length}</span> runs covering{' '}
                          <span className="font-mono font-bold text-primary">{totalKm.toFixed(1)}km</span> and burning{' '}
                          <span className="font-mono font-bold text-warning">{totalCal}</span> calories this month.
                          {monthSessions.length >= 8 ? ' Excellent consistency!' : monthSessions.length >= 4 ? ' Try adding one more run per week.' : ' Consider running more frequently.'}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">Start running to get your monthly review.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* LEADERBOARD TAB - Real data only */}
          {tab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-card p-6 text-center space-y-3">
                <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto" />
                <div>
                  <h3 className="text-sm font-semibold">Weekly Leaderboard</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    No rankings available yet. Leaderboard requires multiple users with real running data.
                  </p>
                </div>
                {sessions.length > 0 && (
                  <div className="p-4 rounded-xl bg-secondary/40 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Stats This Week</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-mono font-bold text-lg text-primary">{weekKm.toFixed(1)}<span className="text-xs text-muted-foreground ml-0.5">km</span></p>
                        <p className="text-[10px] text-muted-foreground">Distance</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-lg">{weekSessions.length}</p>
                        <p className="text-[10px] text-muted-foreground">Runs</p>
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
