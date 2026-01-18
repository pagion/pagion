import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          toast({
            title: 'Passwords do not match',
            description: 'Please make sure your passwords match.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          toast({
            title: 'Password too short',
            description: 'Password must be at least 6 characters.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(name, email, password);
        if (error) {
          console.error('Registration error:', error);
          toast({
            title: 'Registration failed',
            description: 'Unable to create account. Please try again or contact support.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome to Pagion!',
            description: 'Your account has been created successfully.',
          });
          navigate('/chat');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          toast({
            title: 'Login failed',
            description: 'Invalid email or password.',
            variant: 'destructive',
          });
        } else {
          navigate('/chat');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pagion-gradient">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-card p-4 rounded-2xl shadow-lg mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-white">Pagion</h1>
          <p className="text-white/80 text-sm mt-1">Fast as a pigeon, reliable as a pager.</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' 
                ? 'Sign in to continue to Pagion' 
                : 'Join Pagion and start messaging'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 pagion-gradient text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'login' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
