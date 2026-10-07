'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getRotatingQrLiveTokenAction } from '@/actions/attendance';
import { RotatingQrPayload } from '@/lib/forms/rotating-qr';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PresenterClientProps {
  formId: string;
  formTitle: string;
  isRotatingEnabled: boolean;
  intervalSeconds: number;
  checkOutPasscode?: string;
}

export function PresenterClient({
  formId,
  formTitle,
  isRotatingEnabled,
  intervalSeconds: initialInterval,
  checkOutPasscode,
}: PresenterClientProps) {
  const [tokenPayload, setTokenPayload] = useState<RotatingQrPayload | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialInterval || 30);
  const [intervalSec, setIntervalSec] = useState<number>(initialInterval || 30);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const refreshLockRef = useRef<boolean>(false);

  // Digital Clock formatted in Malaysia Local Time (HH:mm:ss)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch token from server action
  const fetchToken = useCallback(async () => {
    if (refreshLockRef.current) return;
    refreshLockRef.current = true;
    try {
      const res = await getRotatingQrLiveTokenAction(formId);
      if (res.ok && res.payload) {
        setTokenPayload(res.payload);
        setSecondsRemaining(res.payload.expiresInSeconds);
        if (res.intervalSeconds) {
          setIntervalSec(res.intervalSeconds);
        }
        setErrorMsg(null);
      } else {
        setErrorMsg(res.error || 'Failed to load live QR code token.');
      }
    } catch (err) {
      console.error('Failed to fetch rotating QR token:', err);
      setErrorMsg('Network connection error with server.');
    } finally {
      setIsLoading(false);
      refreshLockRef.current = false;
    }
  }, [formId]);

  // Initial load
  useEffect(() => {
    if (isRotatingEnabled) {
      fetchToken();
    }
  }, [isRotatingEnabled, fetchToken]);

  // Countdown timer: pure state updater without side effects
  useEffect(() => {
    if (!isRotatingEnabled) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRotatingEnabled]);

  // Auto-refresh when seconds reach zero (cleanly in useEffect, not inside setState reducer)
  useEffect(() => {
    if (!isRotatingEnabled) return;

    if (secondsRemaining === 0 && !isLoading) {
      fetchToken();
    }
  }, [secondsRemaining, isRotatingEnabled, isLoading, fetchToken]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Keyboard shortcut listener ('F' for fullscreen, 'P' for passcode toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        if (checkOutPasscode) {
          e.preventDefault();
          setShowPasscode((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, checkOutPasscode]);

  // Track native fullscreen changes (e.g. user pressed Esc)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // If Rotating QR is NOT enabled for this form
  if (!isRotatingEnabled) {
    return (
      <main
        style={{ backgroundColor: '#020617', color: '#ffffff' }}
        className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center"
      >
        <div
          style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
          className="max-w-md w-full p-8 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Rotating QR Mode Not Enabled</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            This form has not enabled the <strong>Live Rotating QR Code</strong> feature. Please open form settings in Form Builder and enable the anti-fraud projector toggle.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white w-full">
              <Link href={`/builder/${formId}`}>Open Form Builder</Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
              <Link href={`/form/${formId}`} target="_blank">View Standard Form</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Calculate percentage of time elapsed in current window
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / intervalSec) * 100));

  return (
    <main
      style={{ backgroundColor: '#020617', color: '#ffffff' }}
      className="min-h-screen bg-[#020617] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none overflow-y-auto lg:overflow-hidden relative"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* TOP HEADER */}
      <header className="relative z-10 flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3 sm:pb-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>LIVE ATTENDANCE</span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-500">•</span>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium tracking-wide">
            KlikForm Anti-Fraud Mode
          </span>
        </div>

        {/* Digital Clock */}
        <div className="flex items-center gap-2 sm:gap-4 text-right">
          <div
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', borderColor: '#1e293b' }}
            className="flex items-center gap-2 text-slate-200 bg-[#0f172a]/90 border border-slate-800 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg font-mono text-xs sm:text-sm md:text-base font-semibold shadow-inner"
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>{currentTimeStr || '00:00:00'}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            className="text-slate-400 hover:text-white hover:bg-[#1e293b]"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* CENTER STAGE: FORM TITLE & BIG QR CODE */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center my-3 sm:my-6 text-center max-w-4xl mx-auto w-full px-2 sm:px-4">
        {/* Program Title */}
        <h1
          style={{ color: '#ffffff' }}
          className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 whitespace-pre-line leading-tight drop-shadow-md"
        >
          {formTitle}
        </h1>
        <p
          style={{ color: '#94a3b8' }}
          className="text-slate-400 text-xs sm:text-base md:text-lg mb-4 sm:mb-6 font-medium"
        >
          Scan the QR code below to <strong>Check-In</strong> or <strong>Check-Out</strong>
        </p>

        {/* QR Code Container Card */}
        <div className="relative group">
          {/* Subtle Outer Animated Aura */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-cyan-500/20 rounded-3xl blur-xl opacity-75 transition duration-1000 group-hover:opacity-100 animate-pulse" />

          <div
            style={{ backgroundColor: '#ffffff', borderColor: '#1e293b' }}
            className="relative bg-white p-5 sm:p-7 md:p-8 rounded-3xl shadow-2xl border-4 border-[#1e293b] flex flex-col items-center justify-center"
          >
            {isLoading ? (
              <div className="w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl animate-pulse text-slate-400">
                <RefreshCw className="w-10 h-10 animate-spin mb-3 text-slate-500" />
                <span className="text-sm font-medium">Generating Live QR Code...</span>
              </div>
            ) : errorMsg ? (
              <div className="w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] flex flex-col items-center justify-center bg-red-50 text-red-600 p-4 rounded-2xl">
                <AlertTriangle className="w-10 h-10 mb-2" />
                <p className="text-xs sm:text-sm font-semibold">{errorMsg}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchToken}
                  className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            ) : tokenPayload ? (
              <div className="flex flex-col items-center">
                <QRCodeSVG
                  value={tokenPayload.url}
                  size={320}
                  level="M"
                  marginSize={1}
                  className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[340px] md:h-[340px] lg:w-[360px] lg:h-[360px]"
                />
                <div
                  style={{ color: '#64748b' }}
                  className="mt-3 text-[11px] sm:text-xs font-mono text-slate-500 tracking-wider"
                >
                  TOKEN #W{tokenPayload.windowIndex} • {tokenPayload.signature.toUpperCase()}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ROTATING PROGRESS BAR & SECONDS REMAINING */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center w-full max-w-sm">
          <div className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-slate-400 mb-2">
            <span
              style={{ color: '#34d399' }}
              className="flex items-center gap-1.5 text-emerald-400 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              Auto-Refresh Active
            </span>
            <span
              style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#334155', color: '#ffffff' }}
              className="font-mono font-bold text-white bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700 shadow-xs"
            >
              {secondsRemaining}s left
            </span>
          </div>

          {/* Progress Track */}
          <div
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden border border-slate-700/60 shadow-inner"
          >
            <div
              style={{
                width: `${progressPercent}%`,
                backgroundColor: '#10b981',
                backgroundImage: 'linear-gradient(to right, #10b981, #2dd4bf)',
              }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear rounded-full"
            />
          </div>
        </div>
      </section>

      {/* BOTTOM FOOTER: SECURITY INFO & OPTIONAL STAGE PIN REVEAL */}
      <footer
        style={{ borderColor: 'rgba(30, 41, 59, 0.8)' }}
        className="relative z-10 max-w-7xl mx-auto w-full pt-3 sm:pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4"
      >
        {/* Security Badge */}
        <div className="flex items-center gap-3 text-slate-400 text-xs sm:text-sm text-center sm:text-left">
          <div
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
            className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0"
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p style={{ color: '#e2e8f0' }} className="font-semibold text-slate-200">Smart Anti-Fraud Protection</p>
            <p style={{ color: '#64748b' }} className="text-slate-500 text-[11px] sm:text-xs">
              This QR code updates every {intervalSec} seconds. Photos or old screenshots are invalid.
            </p>
          </div>
        </div>

        {/* Stage PIN Section (Solution 2 + 3 combined) */}
        {checkOutPasscode && (
          <div
            style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            className="flex items-center gap-2 bg-[#0f172a] border border-slate-800 p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-lg"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[11px] text-slate-400 block font-medium">Check-Out PIN:</span>
              <span className="font-mono text-base font-bold tracking-widest text-amber-300">
                {showPasscode ? checkOutPasscode : '••••••'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPasscode((v) => !v)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 ml-2 h-8 px-2"
              title={showPasscode ? 'Hide PIN' : 'Show Stage PIN (P)'}
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </footer>
    </main>
  );
}
