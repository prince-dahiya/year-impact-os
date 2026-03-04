import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScores } from '@/hooks/useAppData';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { StatCard } from '@/components/dashboard/StatCard';
import { DailyActionsTracker } from '@/components/dashboard/DailyActionsTracker';
import { GoalsManager } from '@/components/dashboard/GoalsManager';
import { BreaksManager } from '@/components/dashboard/BreaksManager';
import { MonthlyGrid } from '@/components/dashboard/MonthlyGrid';
import { ChallengeTracker } from '@/components/dashboard/ChallengeTracker';
import { FutureProjection } from '@/components/features/FutureProjection';
import { LifePercentage } from '@/components/features/LifePercentage';
import { MonthlyReview } from '@/components/features/MonthlyReview';
import { ShareableCard } from '@/components/features/ShareableCard';
import { LifeScore } from '@/components/features/LifeScore';
import { NinetyDayChallenge } from '@/components/features/NinetyDayChallenge';
import { PerformanceMode } from '@/components/features/PerformanceMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, LogOut, Calendar, Zap, TrendingUp, Coffee, Heart, Activity, Rocket, Brain, Gauge, Share2, Swords } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const currentYear = new Date().getFullYear();
  const { yearlyScore, getStreakDays } = useScores(currentYear);
  const [showPerformance, setShowPerformance] = useState(false);

  if (showPerformance) {
    return (
      <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <PerformanceMode onBack={() => setShowPerformance(false)} />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center neon-border">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Year Impact <span className="gradient-text">OS</span></h1>
              <p className="text-xs text-muted-foreground font-mono">{currentYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hey, <span className="text-foreground font-medium">{user?.name}</span>
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Year Score" value={`${yearlyScore.totalPercentage}%`} icon={<TrendingUp className="w-4 h-4" />} delay={0} />
          <StatCard title="Days Tracked" value={yearlyScore.daysTracked} icon={<Calendar className="w-4 h-4" />} delay={0.1} />
          <StatCard title="Current Streak" value={`${getStreakDays()}🔥`} icon={<Zap className="w-4 h-4" />} delay={0.2} />
          <StatCard title="Break Days" value={yearlyScore.breakDays} icon={<Coffee className="w-4 h-4" />} delay={0.3} />
        </div>

        {/* Performance Mode CTA */}
        <motion.button
          onClick={() => setShowPerformance(true)}
          className="w-full glass-card p-4 flex items-center justify-between group"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(280 100% 55%), hsl(320 100% 50%))' }}>
              <Activity className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm performance-gradient-text">Performance Mode</h3>
              <p className="text-xs text-muted-foreground">GPS Run Tracker · Fitness Dashboard</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Enter →</span>
        </motion.button>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-secondary">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Gauge className="w-3.5 h-3.5 hidden sm:inline" /> Overview
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 hidden sm:inline" /> Tracking
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs">
              <Brain className="w-3.5 h-3.5 hidden sm:inline" /> Insights
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5 hidden sm:inline" /> Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <MonthlyGrid year={currentYear} />
                <ChallengeTracker year={currentYear} />
              </div>
              <div className="space-y-6">
                <LifeScore year={currentYear} />
                <LifePercentage />
                <NinetyDayChallenge year={currentYear} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <DailyActionsTracker year={currentYear} />
              <BreaksManager year={currentYear} />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FutureProjection year={currentYear} />
                <MonthlyReview year={currentYear} />
              </div>
              <ShareableCard year={currentYear} />
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <GoalsManager year={currentYear} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
