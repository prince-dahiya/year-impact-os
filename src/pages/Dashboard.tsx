import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScores, usePoints } from '@/hooks/useAppData';
import { StatCard } from '@/components/dashboard/StatCard';
import { DailyActionsTracker } from '@/components/dashboard/DailyActionsTracker';
import { GoalsManager } from '@/components/dashboard/GoalsManager';
import { BreaksManager } from '@/components/dashboard/BreaksManager';
import { MonthlyGrid } from '@/components/dashboard/MonthlyGrid';
import { ChallengeTracker } from '@/components/dashboard/ChallengeTracker';
import { FutureProjection } from '@/components/features/FutureProjection';
import { MonthlyReview } from '@/components/features/MonthlyReview';
import { ShareableCard } from '@/components/features/ShareableCard';
import { LifeScore } from '@/components/features/LifeScore';
import { PerformanceMode } from '@/components/features/PerformanceMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, LogOut, Calendar, Zap, TrendingUp, Coffee, Activity, Brain, Gauge, Play, Star, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const currentYear = new Date().getFullYear();
  const { yearlyScore, getStreakDays } = useScores(currentYear);
  const { points } = usePoints();
  const [showPerformance, setShowPerformance] = useState(false);

  const hasData = yearlyScore.daysTracked > 0;

  if (showPerformance) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="perf" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
          <PerformanceMode onBack={() => setShowPerformance(false)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Target className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-base">Year Impact <span className="gradient-text">OS</span></h1>
              <p className="text-[10px] text-muted-foreground font-mono">{currentYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {points > 0 && (
              <span className="text-xs font-mono text-warning flex items-center gap-1">
                <Star className="w-3 h-3" /> {points}
              </span>
            )}
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5 space-y-5">
        {/* Top Stats - only show real values */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Year Score"
            value={hasData ? `${yearlyScore.totalPercentage}%` : '—'}
            icon={<TrendingUp className="w-4 h-4" />}
            delay={0}
          />
          <StatCard
            title="Days Tracked"
            value={hasData ? yearlyScore.daysTracked : 0}
            icon={<Calendar className="w-4 h-4" />}
            delay={0.1}
          />
          <StatCard
            title="Streak"
            value={hasData ? `${getStreakDays()}🔥` : '0🔥'}
            icon={<Zap className="w-4 h-4" />}
            delay={0.2}
          />
          <StatCard
            title="Break Days"
            value={yearlyScore.breakDays}
            icon={<Coffee className="w-4 h-4" />}
            delay={0.3}
          />
        </div>

        {/* Performance Mode CTA */}
        <motion.button
          onClick={() => setShowPerformance(true)}
          className="w-full glass-card p-4 flex items-center justify-between group"
          whileHover={{ scale: 1.002 }}
          whileTap={{ scale: 0.998 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm">Performance Mode</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Run Tracker · Sprints · Challenges · Points</p>
            </div>
          </div>
          <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.button>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-secondary">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Gauge className="w-3.5 h-3.5 hidden sm:inline" /> Overview
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 hidden sm:inline" /> Today
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs">
              <Brain className="w-3.5 h-3.5 hidden sm:inline" /> Insights
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5 hidden sm:inline" /> Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <MonthlyGrid year={currentYear} />
                <ChallengeTracker year={currentYear} />
              </div>
              <div className="space-y-5">
                <LifeScore year={currentYear} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-5">
            <div className="grid lg:grid-cols-2 gap-5">
              <DailyActionsTracker year={currentYear} />
              <BreaksManager year={currentYear} />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-5">
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <FutureProjection year={currentYear} />
                <MonthlyReview year={currentYear} />
              </div>
              <ShareableCard year={currentYear} />
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-5">
            <GoalsManager year={currentYear} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
