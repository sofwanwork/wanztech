import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  FileSpreadsheet,
  Files,
  QrCode,
  Zap,
  ShieldCheck,
  Users,
  ArrowRight,
} from 'lucide-react';

export default async function LandingPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/forms');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.png"
                alt="KlikForm Logo"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <span>
              <span className="text-primary">Klik</span>Form
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">
              Ciri-ciri
            </Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">
              Harga
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log Masuk
              </Button>
            </Link>
            <Link href="/login?tab=signup">
              <Button size="sm">Daftar Percuma</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-900 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                Baru: Jana Sijil Digital Automatik 🚀
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Borang Online & <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#451263] via-[#9333ea] to-[#451263] animate-gradient-xy">
                  Sijil Digital Automatik
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Cipta borang pendaftaran, kutip data terus ke Google Sheets, dan hantar e-sijil
                kepada peserta secara automatik. Percuma untuk permulaan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/login?tab=signup">
                  <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto">
                    Mula Guna Percuma <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex justify-center items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Tiada Kad Kredit Diperlukan
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Data Selamat & Sulit
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Background Elements */}
          <div className="absolute top-0 left-0 -z-10 h-full w-full overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full bg-purple-100/50 blur-3xl"></div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
                Satu Platform, Pelbagai Kegunaan
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                KlikForm memudahkan pengurusan data dan automasi dokumen anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Integrasi Google Sheets</h3>
                <p className="text-gray-500 leading-relaxed">
                  Data yang diisi akan terus masuk ke Google Sheets anda secara real-time. Mudah
                  untuk analisis dan rekod.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Sijil Digital Automatik</h3>
                <p className="text-gray-500 leading-relaxed">
                  Peserta akan menerima e-sijil (PDF) melalui email/WhatsApp sejurus selepas mengisi
                  borang kehadiran/kuiz.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">QR Code Generator</h3>
                <p className="text-gray-500 leading-relaxed">
                  Jana QR code unik untuk setiap borang anda. Imbas dan isi - sangat mudah untuk
                  event fizikal.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                  <Files className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Template Borang Siap</h3>
                <p className="text-gray-500 leading-relaxed">
                  Jimat masa dengan template borang pendaftaran, kehadiran, maklum balas, dan banyak
                  lagi.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 text-red-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Sistem Pengesahan</h3>
                <p className="text-gray-500 leading-relaxed">
                  Sistem semakan ketulenan sijil (Verify) untuk mengelakkan penipuan sijil digital.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 text-cyan-600">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Tanpa Had (Pro)</h3>
                <p className="text-gray-500 leading-relaxed">
                  Naik taraf ke Pro untuk bina borang tanpa had dan terima respons tanpa had.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-24 border-t border-gray-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 mb-6">
                  Sesuai Untuk Pelbagai Organisasi
                </h2>
                <div className="space-y-4">
                  {[
                    'Guru & Sekolah - Borang kehadiran & sijil penyertaan murid',
                    'Penganjur Event - Pendaftaran peserta & tiket QR',
                    'HR & Syarikat - Borang cuti, claim, & penilaian staf',
                    'Peniaga Online - Borang tempahan produk (WhatsApp link)',
                    'Webinar & Kursus - E-sijil automatik selepas tamat sesi',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/login?tab=signup">
                    <Button size="lg">Cipta Akaun Sekarang</Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                {/* Abstract Visual Representation */}
                <div className="aspect-square bg-gray-100 rounded-2xl p-8 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50/50"></div>
                  <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 transform rotate-[-2deg] mb-6 border border-gray-100">
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-8 w-full bg-gray-50 rounded border border-gray-100"></div>
                      <div className="h-8 w-full bg-gray-50 rounded border border-gray-100"></div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="h-8 w-20 bg-blue-600 rounded"></div>
                    </div>
                  </div>
                  <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 transform rotate-[2deg] border border-gray-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <div className="h-6 w-6 text-yellow-600">🏆</div>
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-48 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-[#0F172A] text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
              Mula Mengurus Borang & Sijil Hari Ini
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
              Sertai ribuan pengguna yang telah memudahkan urusan kerja mereka dengan KlikForm.
              Percuma selama-lamanya untuk ciri asas.
            </p>
            <Link href="/login?tab=signup">
              <Button
                size="lg"
                className="h-14 px-10 text-lg bg-white text-gray-900 hover:bg-gray-100"
              >
                Daftar Akaun Percuma
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-400">Tiada kad kredit diperlukan.</p>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.png"
                  alt="KlikForm Logo"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span>
                <span className="text-primary">Klik</span>Form
              </span>
            </Link>
            <p className="text-sm text-gray-500 max-w-md mb-8">
              Platform automasi borang dan dokumen pilihan Malaysia.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-100 text-sm text-gray-400 gap-2">
            <p>© {new Date().getFullYear()} KlikForm. Hak Cipta Terpelihara.</p>
            <p>Made with ❤️ in Malaysia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
