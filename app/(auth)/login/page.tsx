'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, ArrowRight, Loader2, Lock, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'signup') {
      setActiveTab('signup');
    }
  }, []);

  // Security: Only allow safe relative redirect paths (never external URLs)
  function getSafeLoginRedirect(): string {
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect') || '';
    if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      return redirectTo;
    }
    return '/forms';
  }
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    setLoading(true);
    let signInEmail = email;

    // If not an email, assume it's a username and lookup the email
    if (!email.includes('@')) {
      const { data: lookedUpEmail, error: lookupError } = await supabase.rpc(
        'get_email_by_username',
        {
          username_input: email,
        }
      );

      if (lookupError || !lookedUpEmail) {
        toast.error('Invalid username or password');
        setLoading(false);
        return;
      }
      signInEmail = lookedUpEmail;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      const redirectTo = getSafeLoginRedirect();
      router.push(redirectTo);
      router.refresh();
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: {
          username: username,
          full_name: username, // Default full name to username
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSignupSuccess(true);
      toast.success('Account created! Please verify your email.');
    }
    setLoading(false);
  }

  async function handleResetPassword() {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email and click the reset link');
      setShowForgotPassword(false);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/forms`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 relative overflow-hidden pb-24">
      {/* Minimal Background */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div
        className="z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* ... (Header content unchanged) ... */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 relative mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <Image
              src="/logo.png"
              alt="KlikForm Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">KlikForm</h1>
          <p className="text-gray-500 mt-1 text-sm">Create beautiful forms in seconds.</p>
        </div>

        <AnimatePresence mode="wait">
          {signupSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <Card className="border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm text-center p-6">
                <CardContent className="pt-6 flex flex-col items-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h3>
                  <p className="text-gray-500 mb-6">
                    We&apos;ve sent a verification link to{' '}
                    <span className="font-semibold text-gray-900">{email}</span>. Please confirm
                    your account to log in.
                  </p>
                  <Button
                    onClick={() => {
                      setSignupSuccess(false);
                      setActiveTab('login');
                    }}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                  >
                    Back to Login
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              layout
            >
              <Tabs
                defaultValue="login"
                value={activeTab}
                className="w-full"
                onValueChange={(value) => setActiveTab(value)}
              >
                {/* Custom Sliding Tabs */}
                <div className="relative grid w-full grid-cols-2 mb-6 bg-gray-100/50 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('login')}
                    className="relative z-10 flex items-center justify-center py-2.5 text-sm font-medium transition-colors focus:outline-none"
                  >
                    {activeTab === 'login' && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white shadow-sm rounded-lg"
                        transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
                      />
                    )}
                    <span
                      className={`relative z-20 ${activeTab === 'login' ? 'text-black' : 'text-gray-500'}`}
                    >
                      Login
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('signup')}
                    className="relative z-10 flex items-center justify-center py-2.5 text-sm font-medium transition-colors focus:outline-none"
                  >
                    {activeTab === 'signup' && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-white shadow-sm rounded-lg"
                        transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
                      />
                    )}
                    <span
                      className={`relative z-20 ${activeTab === 'signup' ? 'text-black' : 'text-gray-500'}`}
                    >
                      Sign Up
                    </span>
                  </button>
                </div>

                <AnimatePresence>
                  <TabsContent value="login" key="login">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle>Welcome back</CardTitle>
                          <CardDescription>
                            Enter your credentials to access your dashboard.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </Button>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                          </div>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleLogin();
                            }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="email">Email or Username</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="email"
                                  type="text"
                                  placeholder="name@example.com or username"
                                  className="pl-10"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="px-0 h-auto font-normal text-xs text-indigo-600"
                                  onClick={() => setShowForgotPassword(true)}
                                  type="button"
                                >
                                  Forgot password?
                                </Button>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="password"
                                  type={showPassword ? 'text' : 'password'}
                                  className="pl-10 pr-10"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <Button
                              className="w-full bg-black hover:bg-gray-800 text-white mt-4"
                              type="submit"
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="mr-2 h-4 w-4" />
                              )}
                              Sign In
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="signup" key="signup">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle>Create an account</CardTitle>
                          <CardDescription>Start building your forms today.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </Button>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white px-2 text-gray-500">Or continue with</span>
                            </div>
                          </div>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSignUp();
                            }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="signup-username">Username</Label>
                              <div className="relative">
                                <Input
                                  id="signup-username"
                                  placeholder="username"
                                  className="pl-3"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-email">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="name@example.com"
                                  className="pl-10"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signup-password">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="signup-password"
                                  type={showPassword ? 'text' : 'password'}
                                  className="pl-10 pr-10"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <Button
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4"
                              type="submit"
                              disabled={loading}
                            >
                              {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                              )}
                              Create Account
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForgotPassword(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="absolute bottom-6 w-full text-center text-xs text-gray-400">
        &copy; 2026 KlikForm by WanzTech
      </div>
    </div>
  );
}
