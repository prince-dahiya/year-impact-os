import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Zap, Target, TrendingUp, Shield, RotateCcw } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, resetEverything } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !fullName)) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = isLogin ? await signIn(email, password) : await signUp(email, password, fullName);
      if (result.error) setError(result.error.message);
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const features = [
    { icon: <Target className="w-5 h-5" />, title: 'Track Every Day', desc: 'Monitor daily habits across all life areas' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'Future Projections', desc: 'See where your habits take you in 5 years' },
    { icon: <Zap className="w-5 h-5" />, title: 'Performance Mode', desc: 'GPS running tracker built right in' },
    { icon: <Shield className="w-5 h-5" />, title: 'Life Score', desc: 'One number to measure your life momentum' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-sunrise)] opacity-70" />
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-confetti)] opacity-80" />
        <div className="relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center neon-border">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-mono text-muted-foreground tracking-widest uppercase">Year Impact</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              Your <span className="gradient-text">Life</span><br />Operating System
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-md">
              Track habits, project your future, compete with friends, and transform your life — all in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-4 space-y-2"
              >
                <div className="text-primary">{f.icon}</div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Year Impact <span className="gradient-text">OS</span></h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold">{isLogin ? 'Welcome back' : 'Create account'}</h2>
            <p className="text-muted-foreground mt-1">{isLogin ? 'Sign in to continue your journey' : 'Start your transformation today'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="bg-secondary border-border"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary hover:underline font-medium">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (window.confirm('Reset all local accounts, goals, actions, diary, and performance history?')) {
                resetEverything();
                setEmail('');
                setPassword('');
                setFullName('');
                setError('Everything was reset. Create a fresh account now.');
              }
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset everything on this device
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
