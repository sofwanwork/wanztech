import Link from 'next/link';
import Image from 'next/image';
import { getForms, getProfile } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, ExternalLink, QrCode, User, FileText, LogOut } from 'lucide-react';
import { createFormAction } from '@/actions/form';
import { logoutAction } from '@/actions/auth';
import { getProxiedImageUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function DashboardPage() {
  const forms = await getForms();
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto py-4 px-4 max-w-6xl">
          <div className="flex justify-between items-center">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden transition-transform duration-200 hover:scale-110 cursor-pointer border-2 border-primary/30 hover:border-primary">
                <Image
                  src="/logo.png"
                  alt="KlikForm Logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">KlikForm</h1>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await createFormAction({});
                }}
              >
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Form
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Welcome Section */}
        <div className="flex items-center gap-4 mb-8 p-6 bg-white rounded-lg border border-gray-200">
          <Avatar className="h-14 w-14 border-2 border-gray-100">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'KF'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Hello, {profile?.full_name || profile?.username || 'Creator'}!
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
              <span className="text-primary font-medium">@{profile?.username || 'user'}</span>
              <span>•</span>
              <span>{forms.length} Forms Created</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {forms.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg bg-white">
              <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">No forms yet</h3>
              <p className="text-gray-500 mb-6 text-center text-sm max-w-xs">
                Create your first form to start collecting responses.
              </p>
            </div>
          )}

          {forms.map((form) => (
            <Card
              key={form.id}
              className="group hover:border-primary/30 transition-colors duration-200 overflow-hidden border-gray-200 flex flex-col h-full p-0 gap-0 bg-white"
            >
              <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                {form.coverImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${getProxiedImageUrl(form.coverImage)})` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <QrCode className="h-10 w-10 text-gray-300" />
                  </div>
                )}
              </div>

              <CardHeader className="p-4 pb-2">
                <CardTitle className="truncate text-base font-semibold">{form.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm mt-1">{form.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow px-4 py-2">
                <div className="text-xs text-gray-400">
                  Created {new Date(form.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-2 flex items-center gap-2">
                <Link href={`/builder/${form.id}`} className="flex-1">
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white">
                    Edit
                  </Button>
                </Link>
                <Link href={`/form/${form.id}`} target="_blank">
                  <Button variant="outline" size="icon" title="View Form" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
