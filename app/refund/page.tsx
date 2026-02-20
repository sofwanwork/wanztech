import Link from 'next/link';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Polisi Bayaran Balik | KlikForm',
    description: 'Prosedur dan syarat mengenai bayaran balik di KlikForm.',
};

export default function RefundPage() {
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
                            <RefreshCcw className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Polisi Bayaran Balik</h1>
                    </div>
                    <p className="text-gray-500 text-lg">
                        Terma terperinci mengenai kelayakan dan proses pemulangan wang dan gantirugi.
                    </p>
                    <div className="mt-6 flex items-center text-sm text-gray-400">
                        Kemas kini terakhir: 20 Februari 2026
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 max-w-4xl mt-12">
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-8 mb-4 first:mt-0">1. Polisi Pengembalian Wang Asas</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Di <strong className="font-semibold text-gray-900">KlikForm</strong>, kami memastikan perkhidmatan pembina borang dalam talian (SaaS) sentiasa memuaskan. Memandangkan perkhidmatan kami adalah berasaskan langganan digital yang dapat diakses sertamerta, <strong className="font-semibold text-gray-900">kami umumnya tidak menawarkan bayaran balik (refund) sewenang-wenangnya setelah pembayaran langganan telah diproses sepenuhnya.</strong>
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Namun begitu, kami akan mempertimbangkan permohonan bayaran balik secara per se dasar (case-by-case basis) untuk isu teknikal tersendiri tertakluk kepada budi bicara kami di bawah syarat kelayakan tertentu.
                    </p>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Syarat Kelayakan Permohonan Awam </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Anda hanya layak dipertimbangkan untuk pemulangan penuh tatkala anda memenuhi situasi yang berikut:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li><strong className="font-semibold text-gray-900">Isu Kritikal Sistem:</strong> Anda mendapati sistem sama sekali tidak dapat berfungsi sejajar spesifikasi rasmi dalam tempoh masa <strong className="font-semibold text-gray-900">tiga (3) hari</strong> semenjak pembelian mula dibuat. Isu ini dibuktikan berpunca dari kecacatan keupayaan sistem pihak utama KlikForm serra 100% ralat terhenti tanpa keupayaan penyelesaian lain.</li>
                        <li><strong className="font-semibold text-gray-900">Caj Pertindihan:</strong> Di mana sistem mendapati berlaku insiden ketidaksengajaan terpotong caj langganan berulang melebihi 2 nilai transaksi pada bulan atau tempoh yang sama disebabkan isu gateway pangkalan.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Keadaan Yang Tidak Layak</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Bayaran ganti-rugi/pemulangan tunai <strong className="font-semibold text-gray-900">TIDAK AKAN DIBERI</strong> di bawah situasi berikut :
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Penyesalan sesudah membeli (Buyer's remorse) ataupun penukaran fikiran pengubah suaian bisnes pengguna secara spontan.</li>
                        <li>Adanya anda tertelupa membatalkan pakej langganan sebelum kitaran pengebilan / auto-pas bulanan di-caj kembali untuk tempoh kitar seterusnya. Pengguna adalah digalakkan membatalkan pakej dengan pantas melalai tetapan sistem pada tetapan "Renew / Batal" profil dashboard sedia ada jikalau tidak mahu auto-potongan pada bulan hadapan.</li>
                        <li>Tiada resit sah sebagai rekod urus niaga utama bersama klikform.</li>
                    </ul>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Proses Pemohonan Polisi</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        Untuk mengajukan semakan polisi bayaran pemulangan dengan pihak sokongan:
                    </p>
                    <ol className="list-decimal pl-6 mb-6 text-gray-600 space-y-2">
                        <li>Mohon emailkan butiran kes secara formal di: <a href="mailto:support@klikform.com" className="text-primary hover:underline font-medium">support@klikform.com</a>.</li>
                        <li>Judul Subjek E-mel: "Penyemakan Polisi Bayaran Balik: [Emel / Username Anda]".</li>
                        <li>Sertakan dalam salinan (tangkapan resit asal atau rujukan nombor pengesahan resit, huraian mendalam secara padu bersasar isu / justifikasi yang dipertikaikan).</li>
                    </ol>

                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Tempoh dan Kaedah Kelulusan Pindaan</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        Setiap aduan yang lengkap akan dibawa ke penelitian bahagian penyelia operasi. Jika semakan rayuan diluluskan, pembayaran ganti nilai akan didepositkan kembali secara terus menerusi mekanisma alat teras penyedia kad atau saluran asal pembayaran di masa terawal yang mungkin mengambil jangka kitaran berulang antara 5 sehingga ke 10 hari masa bekerja penuh (bergantung pada kelajuan proses pemproses perbankan / akaun antarabangsa penyalur).
                    </p>

                </div>
            </div>
        </div>
    );
}
