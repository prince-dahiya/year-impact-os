export interface Goal {
  id: string;
  name: string;
  category: string;
  priority: number;
  year: number;
  created_at: string;
}

export interface DailyAction {
  id: string;
  goal_id: string;
  name: string;
  year: number;
  is_active: boolean;
  created_at: string;
}

export interface ActionCompletion {
  id: string;
  action_id: string;
  completed_date: string;
}

export interface Break {
  id: string;
  reason: string;
  start_date: string;
  end_date: string;
  year: number;
}

export interface MonthlyScore {
  month: number;
  year: number;
  totalDays: number;
  activeDays: number;
  breakDays: number;
  completedActions: number;
  totalPossibleActions: number;
  percentage: number;
}

export interface YearlyScore {
  year: number;
  monthlyScores: MonthlyScore[];
  totalPercentage: number;
  daysTracked: number;
  breakDays: number;
}

export interface RunSession {
  id: string;
  date: string;
  distance: number;
  duration: number;
  avgPace: number;
  calories: number;
  route: [number, number][];
  type: 'run' | 'sprint';
}

export interface SprintSession {
  id: string;
  date: string;
  distance: number; // meters
  duration: number; // seconds
  speed: number; // km/h
}

export interface Challenge {
  id: string;
  name: string;
  type: 'distance' | 'runs' | 'streak' | 'calories';
  target: number;
  current: number;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export interface UserPoints {
  total: number;
  history: PointEntry[];
}

export interface PointEntry {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export interface UserProfile {
  name: string;
  email: string;
  birthDate?: string;
  expectedLifespan?: number;
}

export const GOAL_CATEGORIES = [
  'Body & Fitness', 'Communication', 'Social Media', 'Skill Learning',
  'Money Earning', 'Business', 'Time Management', 'Finance & Investing',
  'Health & Wellness', 'Relationships', 'Personal Growth', 'Other'
] as const;

export const BREAK_REASONS = [
  'Vacation', 'Trip', 'Rest', 'Health', 'Break', 'Emergency', 'Other'
] as const;
