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
import { ArrowRight, Loader2, Lock, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { signUpAction } from '@/actions/auth';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';

const HAS_TURNSTILE = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [loginTurnstileToken, setLoginTurnstileToken] = useState('');
  const [loginTurnstileResetKey, setLoginTurnstileResetKey] = useState(0);
  const [resetTurnstileToken, setResetTurnstileToken] = useState('');
  const [resetTurnstileResetKey, setResetTurnstileResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    if (HAS_TURNSTILE && !loginTurnstileToken) {
      toast.error('Please complete the human verification check.');
      return;
    }

    setLoading(true);
    try {
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
          return;
        }
        signInEmail = lookedUpEmail;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password,
        ...(loginTurnstileToken ? { options: { captchaToken: loginTurnstileToken } } : {}),
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        const redirectTo = getSafeLoginRedirect();
        router.push(redirectTo);
        router.refresh();
      }
    } finally {
      setLoginTurnstileResetKey((k) => k + 1);
      setLoginTurnstileToken('');
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (HAS_TURNSTILE && !turnstileToken) {
      toast.error('Please complete the human verification check.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUpAction({
        username,
        email,
        password,
        honeypot,
        turnstileToken,
      });

      if (res.error) {
        toast.error(res.error);
      } else if (res.alreadyExists) {
        toast.error('This email is already registered. Please log in or continue with Google.');
        setActiveTab('login');
      } else if (res.autoConfirmed) {
        toast.success('Registration successful! Logging in...');
        router.push(getSafeLoginRedirect());
        router.refresh();
      } else {
        setSignupSuccess(true);
        toast.success('Account created! Please check your email.');
      }
    } catch {
      toast.error('Unable to create account right now. Please try again.');
    } finally {
      setTurnstileResetKey((k) => k + 1);
      setTurnstileToken('');
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    if (HAS_TURNSTILE && !resetTurnstileToken) {
      toast.error('Please complete the human verification check.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
        ...(resetTurnstileToken ? { captchaToken: resetTurnstileToken } : {}),
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email and click the reset link');
        setShowForgotPassword(false);
      }
    } finally {
      setResetTurnstileResetKey((k) => k + 1);
      setResetTurnstileToken('');
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/api/auth/callback?next=/forms`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-white text-slate-900 relative overflow-hidden py-8">
      {/* Subtle Grid Accent (No Radiant Glow) */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />

      <motion.div
        className="z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="h-10 w-10 relative mb-2 rounded-md overflow-hidden border border-slate-200">
            <Image
              src="/logo.png"
              alt="KlikForm Logo"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">KlikForm</h1>
        </div>

        <AnimatePresence mode="wait">
          {signupSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="border-slate-200 shadow-sm bg-white text-center p-6 rounded-lg">
                <CardContent className="pt-4 flex flex-col items-center">
                  <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center mb-4 text-slate-900">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Check Your Inbox</h3>
                  <p className="text-slate-600 mb-3 text-xs leading-relaxed">
                    A confirmation link has been sent to{' '}
                    <span className="font-semibold text-slate-900 font-mono">{email}</span>. Please verify your email to log in.
                  </p>
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5 mb-6 max-w-sm">
                    <strong>Note:</strong> Please check your <strong>Spam / Junk</strong> folder if the email does not appear in your primary inbox.
                  </p>
                  <Button
                    onClick={() => {
                      setSignupSuccess(false);
                      setActiveTab('login');
                    }}
                    className="w-full bg-violet-900 hover:bg-violet-950 text-white rounded-md h-10 text-xs font-medium shadow-xs"
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
                value={mounted ? activeTab : 'login'}
                className="w-full"
                onValueChange={(value) => setActiveTab(value)}
              >
                {/* Segmented Low-Radius Tabs */}
                <div className="grid w-full grid-cols-2 mb-3 bg-slate-100 p-1 rounded-md border border-slate-200">
                  <button
                    onClick={() => setActiveTab('login')}
                    className={`py-1.5 text-xs font-medium transition-colors rounded cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-white text-violet-900 font-semibold shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Login
                  </button>

                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`py-1.5 text-xs font-medium transition-colors rounded cursor-pointer ${
                      activeTab === 'signup'
                        ? 'bg-white text-violet-900 font-semibold shadow-2xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <AnimatePresence>
                  <TabsContent value="login" key="login">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-slate-200 shadow-2xs bg-white rounded-lg">
                        <CardHeader className="pb-2 pt-5 px-6">
                          <CardTitle className="text-base font-bold text-slate-900">Welcome Back</CardTitle>
                          <CardDescription className="text-xs text-slate-500">
                            Enter your credentials to access your dashboard.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5 pt-2 px-6 pb-6">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-md h-9 text-xs font-medium"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </Button>

                          <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                              <span className="bg-white px-2 text-slate-400">Or continue with email</span>
                            </div>
                          </div>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleLogin();
                            }}
                            className="space-y-3"
                          >
                            <div className="space-y-1">
                              <Label htmlFor="email" className="text-xs text-slate-700">Email or Username</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                  id="email"
                                  name="email"
                                  autoComplete="username"
                                  type="text"
                                  placeholder="name@example.com or username"
                                  className="pl-9 h-9 text-xs rounded-md"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs text-slate-700">Password</Label>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="px-0 h-auto font-normal text-xs text-slate-600 hover:text-violet-900"
                                  onClick={() => setShowForgotPassword(true)}
                                  type="button"
                                >
                                  Forgot password?
                                </Button>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                  id="password"
                                  name="password"
                                  autoComplete="current-password"
                                  type={showPassword ? 'text' : 'password'}
                                  className="pl-9 pr-9 h-9 text-xs rounded-md"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <TurnstileWidget
                              action="login"
                              onTokenChange={setLoginTurnstileToken}
                              resetKey={loginTurnstileResetKey}
                            />
                            <Button
                              className="w-full bg-violet-900 hover:bg-violet-950 text-white rounded-md h-9 text-xs font-medium mt-1 shadow-xs"
                              type="submit"
                              disabled={loading || (HAS_TURNSTILE && !loginTurnstileToken)}
                            >
                              {loading ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="mr-2 h-3.5 w-3.5" />
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
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-slate-200 shadow-2xs bg-white rounded-lg">
                        <CardHeader className="pb-2 pt-5 px-6">
                          <CardTitle className="text-base font-bold text-slate-900">Create an Account</CardTitle>
                          <CardDescription className="text-xs text-slate-500">
                            Start building forms and automated certificates.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3.5 pt-2 px-6 pb-6">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-md h-9 text-xs font-medium"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                          </Button>

                          <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                              <span className="bg-white px-2 text-slate-400">Or continue with email</span>
                            </div>
                          </div>

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSignUp();
                            }}
                            className="space-y-3"
                          >
                            {/* Honeypot trap for automated signup bots */}
                            <div
                              aria-hidden="true"
                              className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden opacity-0 pointer-events-none"
                            >
                              <label htmlFor="signup-company-url">Company Website</label>
                              <input
                                id="signup-company-url"
                                name="company_url"
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="signup-username" className="text-xs text-slate-700">Username</Label>
                              <Input
                                id="signup-username"
                                name="signup-username"
                                autoComplete="username"
                                placeholder="username"
                                className="h-9 text-xs rounded-md"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="signup-email" className="text-xs text-slate-700">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                  id="signup-email"
                                  name="signup-email"
                                  autoComplete="email"
                                  type="email"
                                  placeholder="name@example.com"
                                  className="pl-9 h-9 text-xs rounded-md"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="signup-password" className="text-xs text-slate-700">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                  id="signup-password"
                                  name="signup-password"
                                  autoComplete="new-password"
                                  type={showPassword ? 'text' : 'password'}
                                  className="pl-9 pr-9 h-9 text-xs rounded-md"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <TurnstileWidget
                              action="signup"
                              onTokenChange={setTurnstileToken}
                              resetKey={turnstileResetKey}
                            />
                            <Button
                              className="w-full bg-violet-900 hover:bg-violet-950 text-white rounded-md h-9 text-xs font-medium mt-1 shadow-xs"
                              type="submit"
                              disabled={loading || (HAS_TURNSTILE && !turnstileToken)}
                            >
                              {loading ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowRight className="mr-2 h-3.5 w-3.5" />
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
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                className="h-9 text-xs rounded-md"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            {showForgotPassword && (
              <TurnstileWidget
                action="reset-password"
                onTokenChange={setResetTurnstileToken}
                resetKey={resetTurnstileResetKey}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-md text-xs h-9" onClick={() => setShowForgotPassword(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-md text-xs h-9 bg-violet-900 hover:bg-violet-950 text-white shadow-xs"
              onClick={handleResetPassword}
              disabled={loading || (HAS_TURNSTILE && !resetTurnstileToken)}
            >
              {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full text-center text-[11px] text-slate-400 font-mono mt-6 pb-2">
        &copy; {new Date().getFullYear()} KlikForm. All rights reserved.
      </div>
    </div>
  );
}
