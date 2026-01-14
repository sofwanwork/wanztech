'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Sparkles, ArrowRight, Loader2, QrCode, Lock, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('login')
    const [showPassword, setShowPassword] = useState(false)
    const [signupSuccess, setSignupSuccess] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState('')

    const router = useRouter()
    const supabase = createClient()


    async function handleLogin() {
        setLoading(true)
        let signInEmail = email

        // If not an email, assume it's a username and lookup the email
        if (!email.includes('@')) {
            const { data: lookedUpEmail, error: lookupError } = await supabase.rpc('get_email_by_username', {
                username_input: email
            })

            if (lookupError || !lookedUpEmail) {
                toast.error('Invalid username or password')
                setLoading(false)
                return
            }
            signInEmail = lookedUpEmail
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: signInEmail,
            password,
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Welcome back!')
            router.push('/')
            router.refresh()
        }
        setLoading(false)
    }

    async function handleSignUp() {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    username: username,
                    full_name: username, // Default full name to username
                }
            },
        })

        if (error) {
            toast.error(error.message)
        } else {
            setSignupSuccess(true)
            toast.success('Account created! Please verify your email.')
        }
        setLoading(false)
    }


    async function handleResetPassword() {
        if (!resetEmail) {
            toast.error('Please enter your email')
            return
        }
        setLoading(true)
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Check your email for the password reset link')
            setShowForgotPassword(false)
        }
        setLoading(false)
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
                transition={{ duration: 0.6, ease: "easeOut" }}
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
                    <h1 className="text-3xl font-bold text-gray-900">
                        KlikForm
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Create beautiful forms in seconds.</p>
                </div>

                <AnimatePresence mode="wait">
                    {signupSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4, type: "spring" }}
                        >
                            <Card className="border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm text-center p-6">
                                <CardContent className="pt-6 flex flex-col items-center">
                                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h3>
                                    <p className="text-gray-500 mb-6">
                                        We've sent a verification link to <span className="font-semibold text-gray-900">{email}</span>. Please confirm your account to log in.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setSignupSuccess(false)
                                            setActiveTab('login')
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
                            <Tabs defaultValue="login" value={activeTab} className="w-full" onValueChange={(value) => setActiveTab(value)}>
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
                                                transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                                            />
                                        )}
                                        <span className={`relative z-20 ${activeTab === 'login' ? "text-black" : "text-gray-500"}`}>Login</span>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('signup')}
                                        className="relative z-10 flex items-center justify-center py-2.5 text-sm font-medium transition-colors focus:outline-none"
                                    >
                                        {activeTab === 'signup' && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute inset-0 bg-white shadow-sm rounded-lg"
                                                transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
                                            />
                                        )}
                                        <span className={`relative z-20 ${activeTab === 'signup' ? "text-black" : "text-gray-500"}`}>Sign Up</span>
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
                                            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                                                <Card className="border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm">
                                                    <CardHeader>
                                                        <CardTitle>Welcome back</CardTitle>
                                                        <CardDescription>
                                                            Enter your credentials to access your dashboard.
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
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
                                                                    type={showPassword ? "text" : "password"}
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
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button className="w-full bg-black hover:bg-gray-800 text-white" type="submit" disabled={loading}>
                                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                                            Sign In
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </form>
                                        </motion.div>
                                    </TabsContent>

                                    <TabsContent value="signup" key="signup">
                                        {/* ... (Signup Form - already has code, just referencing it here to match structure if needed, but I will replace the whole return block if simpler or just specific parts) */}
                                        {/* WAITING: I should probably just replace the Return block efficiently. */}
                                        {/* Actually, I will use the "match this big block" strategy to be safe. */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
                                                <Card className="border-gray-200 shadow-xl bg-white/80 backdrop-blur-sm">
                                                    <CardHeader>
                                                        <CardTitle>Create an account</CardTitle>
                                                        <CardDescription>
                                                            Start building your forms today.
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="signup-username">Username</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="signup-username"
                                                                    placeholder="wanztech"
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
                                                                    type={showPassword ? "text" : "password"}
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
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" type="submit" disabled={loading}>
                                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                                            Create Account
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </form>
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
                            Enter your email address and we'll send you a link to reset your password.
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
                        <Button variant="outline" onClick={() => setShowForgotPassword(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="absolute bottom-6 w-full text-center text-xs text-gray-400">
                &copy; 2026 KlikForm by WanzTech
            </div>
        </div >
    )
}
