import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terma & Syarat | KlikForm',
    description: 'Terma dan syarat penggunaan platform KlikForm.',
};

export default function TermsPage() {
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
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Terma & Syarat</h1>
                    </div>
                    <p className="text-gray-500 text-lg">
                        Sila baca terma dan syarat ini dengan teliti sebelum menggunakan perkhidmatan kami.
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
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Selamat datang ke <strong className="font-semibold text-gray-900">KlikForm</strong> ("Perkhidmatan"). Dengan mengakses dan menggunakan perkhidmatan kami, anda bersetuju untuk mematuhi dan terikat dengan Terma dan Syarat ("Terma") ini. Jika anda tidak bersetuju dengan mana-mana bahagian terma ini, anda tidak dibenarkan untuk mengakses Perkhidmatan ini.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Penerangan Perkhidmatan</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        KlikForm adalah platform pembina borang dan pengurusan data yang membolehkan pengguna mencipta borang, mengumpul data, dan mengintegrasikan dengan perkhidmatan pihak ketiga seperti Google Sheets dan Google Drive.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Pendaftaran Akaun</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Apabila anda mendaftar akaun dengan kami, anda memberi jaminan bahawa anda berumur melebihi 18 tahun, dan maklumat yang anda berikan adalah tepat, lengkap, dan terkini pada setiap masa. Maklumat yang tidak tepat, tidak lengkap, atau lapuk boleh mengakibatkan penamatan akaun anda secara serta-merta pada Perkhidmatan ini.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Anda bertanggungjawab sepenuhnya untuk mengekalkan kerahsiaan akaun dan kata laluan anda, termasuk tetapi tidak terhad kepada mengehadkan akses ke komputer dan/atau akaun anda. Anda bersetuju untuk menerima tanggungjawab bagi sebarang dan semua aktiviti atau tindakan yang berlaku di bawah akaun dan/atau kata laluan anda.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Penggunaan yang Dibenarkan</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">Anda bersetuju untuk tidak menggunakan Perkhidmatan ini:</p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Untuk sebarang tujuan yang menyalahi undang-undang atau untuk memujuk orang lain melakukan atau mengambil bahagian dalam sebarang tindakan yang menyalahi undang-undang.</li>
                        <li>Untuk mengganggu, menyalahgunakan, menghina, memudaratkan, memfitnah, memperlekeh, mengintimidasi, atau mendiskriminasi berdasarkan jantina, orientasi seksual, agama, etnik, ras, umur, asal usul warganegara, atau kecacatan.</li>
                        <li>Untuk menghantar maklumat yang palsu atau mengelirukan.</li>
                        <li>Untuk memuat naik atau memindahkan virus atau sebarang jenis kod berniat jahat (malicious code).</li>
                        <li>Untuk mengumpul atau menjejaki maklumat peribadi orang lain tanpa persetujuan mereka ("phishing").</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Perkhidmatan Pihak Ketiga</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Perkhidmatan kami mungkin mengandungi pautan ke laman web atau perkhidmatan pihak ketiga yang tidak dimiliki atau dikawal oleh KlikForm. KlikForm tiada kawalan ke atas, dan tidak menganggap tanggungjawab terhadap kandungan, dasar privasi, atau amalan mana-mana laman web atau perkhidmatan pihak ketiga. Anda dengan ini memperakui dan bersetuju bahawa KlikForm tidak akan dipertanggungjawabkan atau menanggung tanggunganliabiliti, secara langsung atau tidak langsung, atas sebarang kerosakan atau kerugian yang berpunca atau didakwa berpunca daripada pihak ketiga.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Data Responden dan Keselamatan Maklumat</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Pengguna bertanggungjawab sepenuhnya ke atas semua borang, maklumat, data, teks, dan kandungan lain yang dimuat naik atau dipaparkan melalui Perkhidmatan.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Penggunaan Perkhidmatan kami juga tertakluk pada <strong className="font-semibold text-gray-900">Polisi Privasi</strong> kami. Sebagai pengguna yang mengumpul data, anda mesti mematuhi undang-undang privasi data yang terpakai (seperti Akta Perlindungan Data Peribadi 2010 di Malaysia) apabila memproses maklumat responden anda.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Langganan dan Pembayaran</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Sesetengah Perkhidmatan tertakluk kepada pembayaran yuran. Jika anda melanggan pelan berbayar, anda bersetuju untuk membayar semua fi yang berkaitan mengikut terma pembayaran yang ditetapkan semasa pembelian. KlikForm berhak mengubah harga perkhidmatan pada bila-bila masa dengan memberikan notis awal yang munasabah.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Had Liabiliti</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Setakat yang dibenarkan oleh undang-undang, KlikForm tidak akan bertanggungjawab atas sebarang ganti rugi langsung, tidak langsung, kebetulan, khas, berbangkit, atau punitif, termasuk tanpa had, kehilangan keuntungan, data, atau niaga yang berpunca daripada penyalahgunaan Perkhidmatan.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Pengubahsuaian Terma</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Kami berhak, mengikut budi bicara mutlak kami, untuk mengubah atau menggantikan Terma ini pada bila-bila masa. Jika pindaan yang dilakukan adalah material, kami akan cuba memberikan notis sekurang-kurangnya 30 hari sebelum sebarang terma baharu berkuat kuasa. Dengan meneruskan penggunaan Perkhidmatan selepas perubahan tersebut berkuat kuasa, anda bersetuju untuk terikat dengan terma yang telah dipinda.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">10. Hubungi Kami</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Jika anda mempunyai sebarang soalan tentang Terma dan Syarat ini, sila hubungi kami di <a href="mailto:support@klikform.com" className="text-primary hover:underline font-medium">support@klikform.com</a>.
                    </p>

                </div>
            </div>
        </div>
    );
}
