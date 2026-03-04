import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoals, useDailyActions } from '@/hooks/useAppData';
import { GOAL_CATEGORIES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Target, Trash2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoalsManager({ year }: { year: number }) {
  const { goals, createGoal, deleteGoal } = useGoals(year);
  const { actions, createAction, deleteAction } = useDailyActions(year);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [newGoal, setNewGoal] = useState({ name: '', category: '', priority: 1 });
  const [addingActionTo, setAddingActionTo] = useState<string | null>(null);
  const [newActionName, setNewActionName] = useState('');

  const handleCreateGoal = () => {
    if (!newGoal.name || !newGoal.category) return;
    createGoal({ ...newGoal, year });
    setNewGoal({ name: '', category: '', priority: 1 });
    setIsAdding(false);
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

  const grouped = GOAL_CATEGORIES.reduce((acc, cat) => {
    const catGoals = goals.filter(g => g.category === cat);
    if (catGoals.length > 0) acc[cat] = catGoals;
    return acc;
  }, {} as Record<string, typeof goals>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Goals & Actions</h2>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border">
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Goal name" value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} className="bg-secondary" />
              <Select value={newGoal.category} onValueChange={v => setNewGoal(p => ({ ...p, category: v }))}>
                <SelectTrigger className="bg-secondary"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateGoal} className="w-full">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No goals yet. Create your first goal!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, catGoals]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
              {catGoals.map(goal => {
                const goalActions = actions.filter(a => a.goal_id === goal.id);
                const isExpanded = expandedGoals.has(goal.id);
                return (
                  <motion.div key={goal.id} layout className="glass-card overflow-hidden">
                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(goal.id)}>
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{goal.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">({goalActions.length} actions)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteGoal(goal.id); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                            {goalActions.map(action => (
                              <div key={action.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-sm">{action.name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteAction(action.id)}>
                                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                            {addingActionTo === goal.id ? (
                              <div className="flex gap-2">
                                <Input placeholder="Action name" value={newActionName} onChange={e => setNewActionName(e.target.value)} className="bg-secondary text-sm h-8" />
                                <Button size="sm" className="h-8" onClick={() => handleCreateAction(goal.id)}>Add</Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => setAddingActionTo(goal.id)}>
                                <Plus className="w-3 h-3" /> Add Action
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
