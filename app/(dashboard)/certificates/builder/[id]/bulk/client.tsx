'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Loader2,
  Download,
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { CertificateRenderer } from '@/components/certificates/renderer';
import {
  captureToCanvas,
  canvasToPngBlob,
  canvasToPdfBlob,
  safeFilename,
} from '@/lib/certificates/render';
import { parseCSV, pickField } from '@/lib/csv/parse';
import { generateCertSerial } from '@/lib/certificates/serial';
import type { CertificateTemplate } from '@/lib/types';

interface BulkGenerateClientProps {
  template: CertificateTemplate;
}

type Format = 'png' | 'pdf';

interface CsvRowOutput {
  name: string;
  program: string;
  date: string;
  ic?: string;
  organization?: string;
  role?: string;
  grade?: string;
}

interface ColumnMap {
  name: string;
  program: string;
  date: string;
  ic?: string;
  organization?: string;
  role?: string;
  grade?: string;
}

function nextFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

export function BulkGenerateClient({ template }: BulkGenerateClientProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [colMap, setColMap] = useState<ColumnMap>({
    name: '',
    program: '',
    date: '',
    ic: '',
  });
  const [format, setFormat] = useState<Format>('pdf');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [currentData, setCurrentData] = useState<CsvRowOutput | null>(null);

  const hiddenRef = useRef<HTMLDivElement>(null);

  const isPortrait = (template.height ?? 794) > (template.width ?? 1123);
  const tWidth = template.width ?? (isPortrait ? 794 : 1123);
  const tHeight = template.height ?? (isPortrait ? 1123 : 794);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CSV file is too large (max 5MB).');
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        toast.error('CSV is empty or invalid.');
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      // Auto-detect common column names so the user usually doesn't have to
      // map manually.
      const headerNames = parsed.headers;
      const findHeader = (cands: string[]) =>
        headerNames.find((h) =>
          cands.some((c) => h.toLowerCase().trim() === c.toLowerCase())
        ) ?? '';
      setColMap({
        name: findHeader(['name', 'nama', 'full name', 'nama penuh']),
        program: findHeader(['program', 'kursus', 'event', 'acara', 'course']),
        date: findHeader(['date', 'tarikh', 'tarikh acara']),
        ic: findHeader(['ic', 'no ic', 'kad pengenalan', 'mykad', 'passport']),
        organization: findHeader(['organization', 'organisasi', 'sekolah', 'school', 'jabatan', 'agensi']),
        role: findHeader(['role', 'peranan', 'jawatan', 'kategori']),
        grade: findHeader(['grade', 'gred', 'markah', 'score', 'jam cpd', 'jam latihan']),
      });
      toast.success(`${parsed.rows.length} rows imported`);
    } catch (err) {
      console.error('CSV parse failed:', err);
      toast.error('Failed to parse CSV file.');
    }
  };

  const canGenerate =
    rows.length > 0 && colMap.name && colMap.program && colMap.date && !busy;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setBusy(true);
    setProgress(0);
    setProgressLabel('Starting…');

    try {
      const JSZipMod = (await import('jszip')).default;
      const zip = new JSZipMod();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const data: CsvRowOutput = {
          name: pickField(row, [colMap.name]) ?? '',
          program: pickField(row, [colMap.program]) ?? '',
          date: pickField(row, [colMap.date]) ?? '',
          ic: colMap.ic ? pickField(row, [colMap.ic]) : undefined,
          organization: colMap.organization ? pickField(row, [colMap.organization]) : undefined,
          role: colMap.role ? pickField(row, [colMap.role]) : undefined,
          grade: colMap.grade ? pickField(row, [colMap.grade]) : undefined,
        };

        if (!data.name) {
          // Skip rows without a name — we have nothing to render.
          continue;
        }

        setCurrentData(data);
        setProgressLabel(`Generating ${i + 1} / ${rows.length}: ${data.name}`);
        // Wait two frames so React commits the new props AND the browser
        // paints them before we ask html2canvas to read computed styles.
        await nextFrame();
        await nextFrame();

        if (!hiddenRef.current) throw new Error('Hidden ref missing');
        const canvas = await captureToCanvas(hiddenRef.current, {
          width: tWidth,
          height: tHeight,
          scale: 3,
        });

        const safeName = safeFilename(data.name);
        if (format === 'png') {
          const blob = await canvasToPngBlob(canvas);
          zip.file(`${safeName}.png`, blob);
        } else {
          const blob = await canvasToPdfBlob(canvas, isPortrait);
          zip.file(`${safeName}.pdf`, blob);
        }
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setProgressLabel('Bundling ZIP archive…');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates-${safeFilename(template.name)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Complete! ${rows.length} certificates downloaded.`);
    } catch (err) {
      console.error('Bulk generate failed:', err);
      toast.error('Failed to generate certificates. Check console for details.');
    } finally {
      setBusy(false);
      setProgress(0);
      setProgressLabel('');
      setCurrentData(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/certificates/builder"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-2 flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" />
            Bulk Certificate Generator
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Template: <span className="font-medium">{template.name}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Upload CSV</CardTitle>
          <CardDescription>
            Each row in your CSV will generate one personalized certificate. Supported
            columns: name, program, date (and optional IC/ID for QR verification).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label
            htmlFor="bulk-csv-input"
            className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Click to upload CSV
            </span>
            <span className="text-xs text-gray-500">
              Header row required in first line, max 5MB
            </span>
            <Input
              id="bulk-csv-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </Label>

          {rows.length > 0 && (
            <div className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-md p-3">
              ✓ {rows.length} rows imported · Headers:{' '}
              <span className="font-mono text-xs">{headers.join(', ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Map Columns</CardTitle>
            <CardDescription>
              Match your CSV column headers to the template placeholders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                { key: 'name', label: 'Name', required: true },
                { key: 'program', label: 'Program / Event', required: true },
                { key: 'date', label: 'Date', required: true },
                { key: 'ic', label: 'IC / ID (optional — for QR verification)', required: false },
                { key: 'organization', label: 'Organization / School (optional)', required: false },
                { key: 'role', label: 'Role / Position (optional)', required: false },
                { key: 'grade', label: 'Grade / CPD Hours (optional)', required: false },
              ] as const
            ).map(({ key, label, required }) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <Label className="text-sm">
                  {label} {required && <span className="text-red-500">*</span>}
                </Label>
                <div className="md:col-span-2">
                  <Select
                    value={colMap[key] || ''}
                    onValueChange={(val) =>
                      setColMap((prev) => ({ ...prev, [key]: val === '__none__' ? '' : val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column…" />
                    </SelectTrigger>
                    <SelectContent>
                      {!required && <SelectItem value="__none__">— None —</SelectItem>}
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Choose Format &amp; Generate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Format:</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {busy && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-gray-600">{progressLabel}</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              size="lg"
              className="w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate ZIP ({rows.length} certificates)
                </>
              )}
            </Button>

            {!canGenerate && rows.length > 0 && !busy && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                <FileText className="h-3 w-3 inline mr-1" />
                Please complete the mapping for Name, Program, and Date first.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden full-size renderer — moved into view only inside the
          html2canvas cloned sandbox via the onclone hook. */}
      <div
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: tWidth,
          height: tHeight,
          pointerEvents: 'none',
        }}
        aria-hidden
      >
        <div
          id="bulk-print-container"
          ref={hiddenRef}
          style={{ width: tWidth, height: tHeight }}
        >
          {currentData && (
            <CertificateRenderer
              template={template}
              data={{
                name: currentData.name,
                program: currentData.program,
                date: currentData.date,
                ic: currentData.ic,
                serial: generateCertSerial(template.id, currentData.ic || ''),
                formId: undefined,
              }}
              id="bulk-print-inner"
            />
          )}
        </div>
      </div>
    </div>
  );
}
