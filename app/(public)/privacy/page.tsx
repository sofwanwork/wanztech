import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Polisi Privasi | KlikForm',
    description: 'Ketahui bagaimana KlikForm menguruskan dan melindungi data serta privasi anda.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-24">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-gray-100 pt-16 pb-12">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-gray-500 hover:text-gray-900">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke Laman Utama
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <LockKeyhole className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Polisi Privasi</h1>
                    </div>
                    <p className="text-gray-500 text-lg">
                        Ketahui bagaimana kami menjaga ketelusan dan melindungi maklumat peribadi anda di KlikForm.
                    </p>
                    <div className="mt-6 flex items-center text-sm text-gray-400">
                        Kemas kini terakhir: 20 Februari 2026
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 max-w-4xl mt-12">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">1. Pengenalan</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Selamat datang ke <strong className="font-semibold text-gray-900">KlikForm</strong> ("kami"). Kami komited untuk melindungi maklumat peribadi anda dan hak privasi anda. Polisi Privasi ini menerangkan cara kami mengumpul, menggunakan, melindungi dan mendedahkan maklumat peribadi anda apabila anda menggunakan laman web dan perkhidmatan kami (secara kolektif dirujuk sebagai "Perkhidmatan").
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Dengan mengakses atau menggunakan Perkhidmatan kami, anda bersetuju dengan amalan pengumpulan dan penggunaan maklumat seperti yang dinyatakan dalam dasar ini.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Maklumat yang Kami Kumpul</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Kami mungkin mengumpul jenis maklumat peribadi yang anda berikan secara sukarela apabila anda mendaftar, menyatakan minat terhadap produk, atau apabila menghubungi kami:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Maklumat Akaun:</strong> Nama, alamat e-mel, nama pengguna, dan kata laluan.</li>
                        <li><strong className="font-semibold text-gray-900">Data Transaksi:</strong> Data yang diperlukan untuk memproses pembayaran jika anda membuat pembelian borang langganan.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Data Pengguna Google (Google User Data)</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Aplikasi kami berintegrasi dengan <strong className="font-semibold text-gray-900">Google Drive</strong> dan kelak dengan <strong className="font-semibold text-gray-900">Google Sheets API</strong> untuk menyediakan kefungsian automasi yang mantap. Jika anda bersetuju untuk menyambungkan akaun Google anda, kami mengakses data berikut:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Fail Google Drive:</strong> Kami mungkin mengakses ruangan folder spesifik (yang telah diizinkan) atau membina folder/fail baru bagi tujuan memuatnaikkan simpanan gambar dokumen pengguna anda.</li>
                        <li><strong className="font-semibold text-gray-900">Google Sheets:</strong> Kami mungkin membaca, mencipta dan mengemaskini fail lembaran hamparan cerminan untuk menyelaras pendaftaran sistem responden borang ke awan.</li>
                    </ul>
                    <p className="text-gray-600 leading-relaxed mb-2">
                        <strong className="font-semibold text-gray-900">Pendedahan Penggunaan Terhad (Limited Use Disclosure):</strong>
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6 bg-gray-50 border border-gray-100 p-4 rounded-lg">
                        Penggunaan serta pemindahan kepada mana-mana aplikasi atau maklumat lain yang diakses melalui APIs Google oleh KlikForm akan sentiasa mematuhi sepenuhnya
                        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium ml-1">
                            Polisi Data Pengguna API Servis Google
                        </a> (Google API Services User Data Policy), khususnya melibatkan syarat peruntukan Penggunaan Terhad (Limited Use requirements).
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Cara Kami Menggunakan Maklumat Anda</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Maklumat yang dikumpul digunakan untuk tujuan perniagaan berikut:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Mengendalikan pendaftaran log masuk (account creation) dan tetapan automasi.</li>
                        <li>Memproses transaksi pembayaran dan memudahkan pengurusan pengebilan.</li>
                        <li>Melindungi aset Perkhidmatan (mencengah salah laku dan penipuan).</li>
                        <li>Menghantar pengumuman penting sistem, kemas kini teknikal, notis keselamatan kepada pengguna.</li>
                        <li>Menganalisis pola penggunaan dan interaksi agar perkhidmatan lebih stabil hari demi hari.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Kuki (Cookies) dan Penjejakan</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Kami menggunakan "cookies" pada aplikasi kami (terutamanya untuk tujuan pengesahan log masuk/sesi menerusi integrasi). Namun jika tetapan privasi pelayar ditukar, ia mungkin menghalang navigasi halaman platform pembina anda.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Perkongsian dan Pendedahan</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Kami mungkin berkongsi data anda di dalam terma berwajib seperti senario di bawah ini:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Peruntukan Syarat Undang-undang:</strong> Sekiranya dituntut keperluannya oleh proses kehakiman yang rasmi bagi membanteras dan menjaga keselamatan komunit secara pukal mengikut laras tata amalan jenayah digital.</li>
                        <li><strong className="font-semibold text-gray-900">Pertukaran Transaksi Pengambilalihan Perniagaan:</strong> Semasa proses penjualan / pemerolehan syarikat secara berperingkat peribadi ke korporat.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Keselamatan Pengurusan Rekod</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Maklumat pengguna disimpan dan dilindungi menerusi penyekatan pentadbiran teknikal berasaskan amalan sistem tinggi untuk menggagalkan pemolosan di luar duga. Harap ambil maklum, biarpun inisiatif pemanjangan talian SSL / enkripsi dilakukan, apa jua infrastruktur internet sememangnya bukan seratus peratus dijamin tanpa kompromi tebus-guna (unimpeachable perfection).
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Hak Pentadbiran Rekod Anda</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Anda mempunyai keupayaan pentabdiran penuh dan hak selamanya untuk memadam dan menggubal kembali sebarang privasi data atau menyalin log fail sistem secepat 2 minit di "Profil Sistem". Sekiranya masih memerlukan kelulusan pentadbiran dalaman sila kemukakannya serta merta di halaman utama.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Hubungi Kami</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Jika anda mempunyai sebarang soalan, kekeliruan, atau aduan berkaitan polisi privasi ini, sila hubungi kami di <a href="mailto:support@klikform.com" className="text-primary hover:underline font-medium">support@klikform.com</a>.
                    </p>

                </div>
            </div>
        </div>
    );
}
