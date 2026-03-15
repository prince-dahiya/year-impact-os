import { useState, useCallback, useMemo } from 'react';
import { Goal, DailyAction, ActionCompletion, Break, MonthlyScore, YearlyScore, SprintSession, Challenge, PointEntry } from '@/types';
import { format, getDaysInMonth, eachDayOfInterval, startOfMonth, endOfMonth, isAfter, isWithinInterval, parseISO, subDays, startOfWeek, endOfWeek } from 'date-fns';

function useLocalStorage<T>(key: string, initial: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });

  const setValue = useCallback((val: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [state, setValue];
}

export function useGoals(year: number) {
  const [goals, setGoals] = useLocalStorage<Goal[]>(`goals-${year}`, []);

  const createGoal = useCallback((goal: Omit<Goal, 'id' | 'created_at'>) => {
    const newGoal: Goal = { ...goal, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, [setGoals]);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [setGoals]);

  return { goals, createGoal, deleteGoal, isLoading: false };
}

export function useDailyActions(year: number) {
  const [actions, setActions] = useLocalStorage<DailyAction[]>(`actions-${year}`, []);

  const createAction = useCallback((action: { name: string; goal_id: string; year: number }) => {
    const newAction: DailyAction = { ...action, id: crypto.randomUUID(), is_active: true, created_at: new Date().toISOString() };
    setActions(prev => [...prev, newAction]);
    return newAction;
  }, [setActions]);

  const deleteAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, [setActions]);

  return { actions: actions.filter(a => a.is_active), createAction, deleteAction, isLoading: false };
}

export function useCompletions(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const [allCompletions, setAllCompletions] = useLocalStorage<ActionCompletion[]>('completions', []);

  const completions = useMemo(() => allCompletions.filter(c => c.completed_date === dateStr), [allCompletions, dateStr]);

  const toggleCompletion = useCallback((actionId: string) => {
    setAllCompletions(prev => {
      const existing = prev.find(c => c.action_id === actionId && c.completed_date === dateStr);
      if (existing) return prev.filter(c => c.id !== existing.id);
      return [...prev, { id: crypto.randomUUID(), action_id: actionId, completed_date: dateStr }];
    });
  }, [dateStr, setAllCompletions]);

  return { completions, toggleCompletion };
}

export function useAllCompletions() {
  const [completions] = useLocalStorage<ActionCompletion[]>('completions', []);
  return completions;
}

export function useBreaks(year: number) {
  const [breaks, setBreaks] = useLocalStorage<Break[]>(`breaks-${year}`, []);

  const createBreak = useCallback((b: Omit<Break, 'id'>) => {
    setBreaks(prev => [...prev, { ...b, id: crypto.randomUUID() }]);
  }, [setBreaks]);

  const deleteBreak = useCallback((id: string) => {
    setBreaks(prev => prev.filter(b => b.id !== id));
  }, [setBreaks]);

  const isBreakDay = useCallback((date: Date) => {
    return breaks.some(b => {
      try { return isWithinInterval(date, { start: parseISO(b.start_date), end: parseISO(b.end_date) }); }
      catch { return false; }
    });
  }, [breaks]);

  return { breaks, createBreak, deleteBreak, isBreakDay, isLoading: false };
}

export function useRunSessions() {
  const [sessions, setSessions] = useLocalStorage<any[]>('run-sessions', []);

  const addSession = useCallback((session: any) => {
    setSessions(prev => [...prev, { ...session, id: crypto.randomUUID() }]);
  }, [setSessions]);

  return { sessions, addSession };
}

export function useSprintSessions() {
  const [sessions, setSessions] = useLocalStorage<SprintSession[]>('sprint-sessions', []);

  const addSprint = useCallback((sprint: Omit<SprintSession, 'id'>) => {
    setSessions(prev => [...prev, { ...sprint, id: crypto.randomUUID() }]);
  }, [setSessions]);

  const deleteSprint = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [setSessions]);

  return { sprints: sessions, addSprint, deleteSprint };
}

export function useChallenges() {
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('challenges', []);

  const createChallenge = useCallback((c: Omit<Challenge, 'id' | 'current' | 'completed'>) => {
    setChallenges(prev => [...prev, { ...c, id: crypto.randomUUID(), current: 0, completed: false }]);
  }, [setChallenges]);

  const updateProgress = useCallback((id: string, current: number) => {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, current, completed: current >= c.target } : c));
  }, [setChallenges]);

  const deleteChallenge = useCallback((id: string) => {
    setChallenges(prev => prev.filter(c => c.id !== id));
  }, [setChallenges]);

  return { challenges, createChallenge, updateProgress, deleteChallenge };
}

export function usePoints() {
  const [points, setPoints] = useLocalStorage<{ total: number; history: PointEntry[] }>('user-points', { total: 0, history: [] });

  const addPoints = useCallback((amount: number, reason: string) => {
    setPoints(prev => ({
      total: prev.total + amount,
      history: [...prev.history, { id: crypto.randomUUID(), amount, reason, date: new Date().toISOString() }]
    }));
  }, [setPoints]);

  return { points: points.total, history: points.history, addPoints };
}

export function useScores(year: number) {
  const { actions } = useDailyActions(year);
  const allCompletions = useAllCompletions();
  const { breaks, isBreakDay } = useBreaks(year);

  const today = new Date();
  const currentYear = today.getFullYear();

  const monthlyScores = useMemo((): MonthlyScore[] => {
    const scores: MonthlyScore[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthDate = new Date(year, month - 1, 1);
      if (year > currentYear || (year === currentYear && month > today.getMonth() + 1)) {
        scores.push({ month, year, totalDays: getDaysInMonth(monthDate), activeDays: 0, breakDays: 0, completedActions: 0, totalPossibleActions: 0, percentage: 0 });
        continue;
      }
      const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
      let activeDays = 0, breakDays = 0, completedActions = 0, totalPossibleActions = 0;
      for (const day of days) {
        if (isAfter(day, today)) continue;
        if (isBreakDay(day)) { breakDays++; continue; }
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayCompletions = allCompletions.filter(c => c.completed_date === dateStr);
        const actionIds = new Set(actions.map(a => a.id));
        const completed = dayCompletions.filter(c => actionIds.has(c.action_id)).length;
        totalPossibleActions += actions.length;
        completedActions += completed;
        if (completed > 0) activeDays++;
      }
      const percentage = totalPossibleActions > 0 ? Math.round((completedActions / totalPossibleActions) * 100) : 0;
      scores.push({ month, year, totalDays: getDaysInMonth(monthDate), activeDays, breakDays, completedActions, totalPossibleActions, percentage });
    }
    return scores;
  }, [year, actions, allCompletions, isBreakDay, currentYear]);

  const yearlyScore = useMemo((): YearlyScore => {
    const totalPercentage = monthlyScores.reduce((sum, m) => sum + m.percentage, 0);
    const activeMonths = monthlyScores.filter(m => m.totalPossibleActions > 0).length;
    return {
      year,
      monthlyScores,
      totalPercentage: activeMonths > 0 ? Math.round(totalPercentage / activeMonths) : 0,
      daysTracked: monthlyScores.reduce((sum, m) => sum + m.activeDays, 0),
      breakDays: monthlyScores.reduce((sum, m) => sum + m.breakDays, 0),
    };
  }, [monthlyScores, year]);

  const getStreakDays = useCallback(() => {
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (isBreakDay(checkDate)) { checkDate = subDays(checkDate, 1); streak++; continue; }
      const dayCompletions = allCompletions.filter(c => c.completed_date === dateStr);
      if (dayCompletions.length > 0) { streak++; checkDate = subDays(checkDate, 1); }
      else break;
    }
    return streak;
  }, [allCompletions, isBreakDay]);

  return { monthlyScores, yearlyScore, getStreakDays, isLoading: false };
}
