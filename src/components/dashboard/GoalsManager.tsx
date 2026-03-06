import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals, useDailyActions } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Target, Trash2, ChevronDown, ChevronUp, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const GOAL_TEMPLATES = [
  {
    category: 'Body & Fitness',
    icon: '💪',
    templates: [
      { name: 'Build a workout habit', actions: ['Exercise for 30 minutes', 'Drink 2L water', 'Stretch for 10 minutes'] },
      { name: 'Run regularly', actions: ['Go for a run', 'Track distance', 'Do warm-up stretches'] },
      { name: 'Improve nutrition', actions: ['Eat a healthy meal', 'Track calories', 'No junk food'] },
    ],
  },
  {
    category: 'Skill Learning',
    icon: '📚',
    templates: [
      { name: 'Read more books', actions: ['Read for 30 minutes', 'Write book notes'] },
      { name: 'Learn a new language', actions: ['Study vocabulary', 'Practice speaking', 'Review flashcards'] },
      { name: 'Learn to code', actions: ['Code for 1 hour', 'Complete a tutorial', 'Build a small project'] },
    ],
  },
  {
    category: 'Personal Growth',
    icon: '🧠',
    templates: [
      { name: 'Build a morning routine', actions: ['Wake up early', 'Meditate for 10 minutes', 'Journal'] },
      { name: 'Practice mindfulness', actions: ['Meditate', 'Gratitude journaling', 'Digital detox for 1 hour'] },
      { name: 'Improve focus', actions: ['Deep work session', 'No social media until noon', 'Plan tomorrow'] },
    ],
  },
  {
    category: 'Money Earning',
    icon: '💰',
    templates: [
      { name: 'Grow side income', actions: ['Work on side project', 'Learn a marketable skill', 'Network with 1 person'] },
      { name: 'Save more money', actions: ['Track spending', 'No impulse purchases', 'Review budget'] },
    ],
  },
  {
    category: 'Health & Wellness',
    icon: '🧘',
    templates: [
      { name: 'Sleep better', actions: ['No screens 1hr before bed', 'Sleep by 11pm', 'Wake at same time'] },
      { name: 'Reduce stress', actions: ['Take a walk', 'Practice deep breathing', 'Limit caffeine'] },
    ],
  },
];

export function GoalsManager({ year }: { year: number }) {
  const { goals, createGoal, deleteGoal } = useGoals(year);
  const { actions, createAction, deleteAction } = useDailyActions(year);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [addingActionTo, setAddingActionTo] = useState<string | null>(null);
  const [newActionName, setNewActionName] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const handleSelectTemplate = (category: string, template: { name: string; actions: string[] }) => {
    const goal = createGoal({ name: template.name, category, priority: 1, year });
    template.actions.forEach(actionName => {
      createAction({ name: actionName, goal_id: goal.id, year });
    });
    setShowTemplates(false);
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    createGoal({ name: customName, category: customCategory || 'Personal Growth', priority: 1, year });
    setCustomName('');
    setCustomCategory('');
    setShowCustom(false);
    setShowTemplates(false);
  };

  const handleCreateAction = (goalId: string) => {
    if (!newActionName.trim()) return;
    createAction({ name: newActionName, goal_id: goalId, year });
    setNewActionName('');
    setAddingActionTo(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Goals</h2>
          <p className="text-xs text-muted-foreground">Set goals and daily actions will be created automatically</p>
        </div>
        <Button size="sm" onClick={() => setShowTemplates(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Goal
        </Button>
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="glass-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Choose a Goal</DialogTitle>
            <p className="text-xs text-muted-foreground">Pick a template — daily actions are created for you automatically.</p>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {GOAL_TEMPLATES.map(cat => (
              <div key={cat.category} className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.category}
                </p>
                <div className="space-y-1.5">
                  {cat.templates.map(t => (
                    <button
                      key={t.name}
                      onClick={() => handleSelectTemplate(cat.category, t)}
                      className="w-full text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-transparent hover:border-primary/20 transition-all"
                    >
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t.actions.length} daily actions: {t.actions.join(' · ')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom option */}
            <div className="border-t border-border pt-4">
              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-dashed border-border transition-all"
                >
                  <p className="text-sm font-medium text-muted-foreground">✏️ Create custom goal</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Write your own goal name</p>
                </button>
              ) : (
                <div className="space-y-3 p-3 rounded-xl bg-secondary/30">
                  <Input
                    placeholder="Goal name..."
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="bg-secondary h-9 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateCustom} className="flex-1 h-8 text-xs">Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCustom(false)} className="h-8 text-xs">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No goals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tap "Add Goal" to pick from templates or create your own</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const goalActions = actions.filter(a => a.goal_id === goal.id);
            const isExpanded = expandedGoals.has(goal.id);
            return (
              <motion.div key={goal.id} layout className="glass-card overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => toggleExpand(goal.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{goal.name}</p>
                      <p className="text-[10px] text-muted-foreground">{goal.category} · {goalActions.length} actions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={e => { e.stopPropagation(); deleteGoal(goal.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                        {goalActions.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">No daily actions linked yet</p>
                        )}
                        {goalActions.map(action => (
                          <div key={action.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                            <div className="flex items-center gap-2.5">
                              <Zap className="w-3.5 h-3.5 text-primary/60" />
                              <span className="text-sm">{action.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteAction(action.id)}>
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                        {addingActionTo === goal.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="New action..."
                              value={newActionName}
                              onChange={e => setNewActionName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCreateAction(goal.id)}
                              className="bg-secondary text-sm h-8"
                              autoFocus
                            />
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleCreateAction(goal.id)}>Add</Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingActionTo(goal.id)}
                            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Add action
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
