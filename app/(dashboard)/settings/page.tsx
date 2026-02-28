'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ExternalLink, Eye, EyeOff, User, CreditCard, Mail, Shield } from 'lucide-react';
import { saveSettingsAction, getSettingsAction } from '@/actions/forms';
import { getUserProfile, getUserSubscription, type UserProfile, type UserSubscription } from '@/actions/user';
import { resetPasswordAction } from '@/actions/auth';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function SettingsContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Google Sheets Settings State
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [key, setKey] = useState('');
  const [folderId, setFolderId] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // New state for OAuth status
  const hasShownError = useRef(false);

  // User Profile & Subscription State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (errorParam === 'missing_config' && !hasShownError.current) {
      toast.error('Please configure your settings first before creating a form.');
      hasShownError.current = true;
    }
    if (searchParams.get('success') === 'google_connected' && !hasShownError.current) {
      toast.success('Successfully connected to Google Drive!');
      hasShownError.current = true;
      // Clean URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [errorParam, searchParams]);

  useEffect(() => {
    let active = true;

    // Fetch all data in parallel
    const fetchData = async () => {
      try {
        const [settings, userProfile, userSub] = await Promise.all([
          getSettingsAction(),
          getUserProfile(),
          getUserSubscription()
        ]);

        if (!active) return;

        if (settings) {
          if (settings.googleClientEmail) setEmail(settings.googleClientEmail);
          if (settings.userPersonalEmail) setPersonalEmail(settings.userPersonalEmail);
          if (settings.googlePrivateKey) setKey(settings.googlePrivateKey);
          if (settings.googleDriveFolderId) setFolderId(settings.googleDriveFolderId);
          if (settings.googleAccessToken) setIsConnected(true); // Check token presence
        }

        if (userProfile) setProfile(userProfile);
        if (userSub) setSubscription(userSub);

      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("Failed to load settings");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveSettingsAction({
        googleClientEmail: email,
        userPersonalEmail: personalEmail,
        googlePrivateKey: key,
        googleDriveFolderId: folderId,
      });
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!profile?.email) return;
    setResetting(true);
    try {
      const res = await resetPasswordAction(profile.email);
      if (res?.success) {
        toast.success('Password reset email sent! Check your inbox.');
      } else {
        toast.error(res?.error || 'Failed to send reset email');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your profile, preferences, and integrations</p>
      </div>

      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Personal Information
              </CardTitle>
              <CardDescription>Manage your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback className="text-xl">
                    {profile?.fullName?.substring(0, 2).toUpperCase() || 'KF'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{profile?.fullName}</h3>
                  <p className="text-gray-500 text-sm">Dashboard User</p>
                </div>
              </div>

              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="flex gap-2">
                    <Input id="profile-email" name="profile-email" autoComplete="email" value={profile?.email || ''} disabled className="bg-gray-50" />
                    {profile?.email && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Send Email"
                        onClick={() => window.open(`mailto:${profile.email}`)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-500" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-gray-500">
                    Forgot your password? Send a reset link to your email.
                  </p>
                </div>
                <Button onClick={handleResetPassword} disabled={resetting} variant="outline">
                  {resetting ? 'Sending...' : 'Reset Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTION TAB */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-500" />
                Current Plan
              </CardTitle>
              <CardDescription>View your subscription status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-500">Plan</p>
                  <p className="text-2xl font-bold text-primary capitalize">
                    {subscription?.tier || 'Free'} Plan
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${subscription?.status === 'active' ? 'bg-green-100 text-green-800' :
                      subscription?.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                    {subscription?.status || 'Active'}
                  </div>
                </div>
              </div>

              {subscription?.currentPeriodEnd && (
                <div>
                  <Label>Expiry Date</Label>
                  <p className="text-sm text-gray-600 mt-1" suppressHydrationWarning>
                    Valid until {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t items-center justify-between">
              <p className="text-xs text-gray-500">Need to upgrade or cancel?</p>
              <Button variant="outline" onClick={() => window.open('mailto:support@klikform.com')}>
                Contact Support
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS TAB */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Google Integrations</h2>
            <p className="text-gray-500 text-sm">Choose how you want to connect KlikForm to your Google Workspace.</p>
          </div>

          <Tabs defaultValue="oauth" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 p-1 bg-gray-100/80 rounded-lg h-auto sm:h-12 gap-1 sm:gap-0">
              <TabsTrigger value="oauth" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2 h-auto whitespace-normal min-h-[40px]">
                Connect with Google (Recommended)
              </TabsTrigger>
              <TabsTrigger value="service-account" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md py-2 h-auto whitespace-normal min-h-[40px]">
                Service Account (Advanced)
              </TabsTrigger>
            </TabsList>

            {/* OAUTH METHOD */}
            <TabsContent value="oauth" className="space-y-4">
              <Card className="border border-green-100/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Google Drive & Sheets
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">Recommended</span>
                  </CardTitle>
                  <CardDescription>
                    The easiest way to connect. Just sign in with your Google account to allow KlikForm to generate certificates and export sheet data automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-6">
                  {isConnected ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-green-50 border border-green-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Connected to Google</p>
                          <p className="text-xs text-green-700">Ready to sync data and generate certificates.</p>
                        </div>
                      </div>
                      <Button variant="outline" className="mt-4 sm:mt-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => window.location.href = '/api/auth/google/login?prompt=consent'}>
                        Reconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Not Connected</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-sm">Connect your Google account to enable seamless integration with Sheets and Drive.</p>
                      <Button
                        onClick={() => window.location.href = '/api/auth/google/login'}
                        className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                      >
                        Connect with Google
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SERVICE ACCOUNT METHOD */}
            <TabsContent value="service-account" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm mb-4">
                <strong>Advanced Users Only:</strong> This legacy method requires configuring a Google Cloud project manually. We strongly recommend using the "Connect with Google" method above instead.
              </div>

              <Card className="border border-gray-200 bg-white">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-base font-semibold">Service Account Credentials</CardTitle>
                  <CardDescription className="text-sm">
                    Configure your manual Google Service Account JSON keys.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <Label>Google Service Account Email</Label>
                    <Input
                      id="google-service-email"
                      name="google-service-email"
                      placeholder="example@project-id.iam.gserviceaccount.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Personal Email (For Auto-Share)</Label>
                    <Input
                      id="personal-email"
                      name="personal-email"
                      autoComplete="email"
                      placeholder="your.email@gmail.com"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for &quot;Auto-Create Sheet&quot;. The bot will share new sheets with this email.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Google Drive Folder ID (Optional)</Label>
                    <Input
                      id="google-drive-folder-id"
                      name="google-drive-folder-id"
                      placeholder="1-D7dlraZiTG7zOjqi5LVt7mJaTr1i8az"
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only needed if you want uploads to go to a specific folder. Share that folder with your Service Account email.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label>Google Private Key</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" /> Show
                          </>
                        )}
                      </Button>
                    </div>
                    {showPrivateKey ? (
                      <Textarea
                        id="google-private-key"
                        name="google-private-key"
                        placeholder="-----BEGIN PRIVATE KEY-----\n..."
                        className="font-mono text-xs min-h-[150px]"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                      />
                    ) : (
                      <div className="relative">
                        <Input
                          id="google-private-key-hidden"
                          name="google-private-key-hidden"
                          type="password"
                          value={key ? 'FAKEPASSWORD' : ''}
                          readOnly
                          className="font-mono text-xs cursor-not-allowed bg-muted/50"
                          placeholder="Private Key (Hidden)"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded border shadow-sm">
                            {key ? 'Key is Set' : 'No Key Set'}
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Copy the entire private key from your service account JSON file.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50/50 border-t pt-4 border-gray-100">
                  <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    {saving ? 'Saving...' : 'Save Manual Settings'}
                  </Button>
                </CardFooter>
              </Card>

              {/* SETUP GUIDE ACCORDION */}
              <Card>
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-base text-gray-700">Service Account Setup Guide</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-sm">Step 1: Create Google Service Account</AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        <ol className="list-decimal list-inside space-y-2 pl-2 mt-2">
                          <li>
                            Go to the{' '}
                            <a
                              href="https://console.cloud.google.com/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline inline-flex items-center font-medium"
                            >
                              Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </li>
                          <li>Create a new project (or select an existing one).</li>
                          <li>
                            Enable <strong>Google Sheets API</strong> and <strong>Google Drive API</strong>{' '}
                            from the &quot;APIs & Services&quot; &gt; &quot;Library&quot; menu.
                          </li>
                          <li>
                            Go to &quot;APIs & Services&quot; &gt; &quot;Credentials&quot; &gt; &quot;Create
                            Credentials&quot; &gt; &quot;Service Account&quot;.
                          </li>
                          <li>Fill in a name (e.g., &quot;form-bot&quot;) and click Create.</li>
                          <li>
                            Copy the generated <strong>Service Account Email</strong> and paste it into the setting above.
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-sm">Step 2: Get Private Key</AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        <ol className="list-decimal list-inside space-y-2 pl-2 mt-2">
                          <li>
                            In the Google Cloud Console, click on your newly created Service Account email.
                          </li>
                          <li>Go to the <strong>Keys</strong> tab.</li>
                          <li>
                            Click &quot;Add Key&quot; &gt; &quot;Create new key&quot; &gt; Select{' '}
                            <strong>JSON</strong> &gt; Create.
                          </li>
                          <li>
                            Copy the entire content of the <code>private_key</code> field from the downloaded JSON file and paste it into the &quot;Google Private Key&quot; field above.
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-sm">Step 3: Setup Google Drive Folder (Optional)</AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        <ol className="list-decimal list-inside space-y-2 pl-2 mt-2">
                          <li>
                            Go to Google Drive and create a new folder where you want your sheets to be stored.
                          </li>
                          <li>Open the folder. Look at the URL in your browser bar.</li>
                          <li>
                            It will look like{' '}
                            <code>
                              drive.google.com/drive/folders/<b>1-D7dlraZiTG...</b>
                            </code>
                            .
                          </li>
                          <li>
                            Copy that ID string (the bold part) and paste it into the &quot;Google Drive Folder ID&quot; field.
                          </li>
                          <li>
                            <strong>Important:</strong> You must <strong>Share</strong> this folder with your Service Account Email (from Step 1) so the bot can write to it.
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
