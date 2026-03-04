import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRunSessions } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, MapPin, Clock, Flame, TrendingUp, Trophy, ArrowLeft, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(pace: number) {
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function PerformanceMode({ onBack }: { onBack: () => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [tab, setTab] = useState<'run' | 'history' | 'analytics'>('run');
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
            const d = haversine(
              lastPos.current.coords.latitude, lastPos.current.coords.longitude,
              latitude, longitude
            );
            if (d > 0.005) { // min 5m
              setDistance(prev => prev + d);
            }
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
      const calories = Math.round(distance * 60); // rough estimate
      addSession({
        date: new Date().toISOString(),
        distance: Math.round(distance * 100) / 100,
        duration: elapsed,
        avgPace: Math.round(avgPace * 100) / 100,
        calories,
        route: positions,
      });
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

  // Monthly stats
  const currentMonth = new Date().getMonth();
  const monthSessions = sessions.filter(s => new Date(s.date).getMonth() === currentMonth);
  const totalKm = monthSessions.reduce((sum: number, s: any) => sum + s.distance, 0);
  const totalCal = monthSessions.reduce((sum: number, s: any) => sum + s.calories, 0);

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
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
          {(['run', 'history', 'analytics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize',
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'run' && (
            <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Main Display */}
              <div className="glass-card p-8 text-center space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Distance</p>
                  <p className="text-6xl font-bold font-mono gradient-text">{distance.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">km</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-mono font-bold text-lg">{formatTime(elapsed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pace</p>
                    <p className="font-mono font-bold text-lg">{avgPace > 0 ? formatPace(avgPace) : '--:--'}</p>
                    <p className="text-[10px] text-muted-foreground">min/km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="font-mono font-bold text-lg">{calories}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {!isRunning ? (
                    <Button size="lg" onClick={startRun} className="w-20 h-20 rounded-full text-lg gap-2">
                      <Play className="w-8 h-8" />
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" variant="outline" onClick={pauseRun} className="w-16 h-16 rounded-full">
                        {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                      </Button>
                      <Button size="lg" variant="destructive" onClick={stopRun} className="w-16 h-16 rounded-full">
                        <Square className="w-6 h-6" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {sessions.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No runs yet. Start your first run!</p>
                </div>
              ) : (
                sessions.slice().reverse().map((s: any, i: number) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{format(new Date(s.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(s.duration)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="font-mono font-bold text-primary">{s.distance.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">km</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold">{formatPace(s.avgPace)}</p>
                        <p className="text-[10px] text-muted-foreground">min/km</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold">{s.calories}</p>
                        <p className="text-[10px] text-muted-foreground">cal</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {tab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 text-center">
                  <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono gradient-text">{totalKm.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">KM this month</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Flame className="w-5 h-5 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono">{totalCal}</p>
                  <p className="text-xs text-muted-foreground">Calories burned</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Activity className="w-5 h-5 text-info mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono">{monthSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Runs this month</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <Trophy className="w-5 h-5 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold font-mono">{sessions.length}</p>
                  <p className="text-xs text-muted-foreground">Total runs</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
