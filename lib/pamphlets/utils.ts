/**
 * Utility functions for E-Pamphlet & Buku Program Digital
 */

import { Pamphlet } from '@/lib/types/pamphlets';

/**
 * Validates a pamphlet slug
 * Must be 3-60 chars, only lowercase letters, numbers, hyphens and underscores
 */
export function isValidPamphletSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 60) return false;
  return /^[a-z0-9][a-z0-9-_]*[a-z0-9]$/.test(slug);
}

/**
 * Cleans and converts raw string to a valid slug
 */
export function cleanPamphletSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Audio synthesis helper using Web Audio API for page flip effect.
 * Produces a soft, realistic paper rustle without requiring external mp3 assets!
 */
export function playPageTurnSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Buffer of white noise filtered to sound like paper rustle
    const bufferSize = ctx.sampleRate * 0.08; // 80ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Noise with natural decay
      const decay = Math.exp(-i / (bufferSize * 0.25));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter to isolate paper-like frequency (1.2kHz - 3.5kHz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.08);
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

/**
 * Curated sample pamphlet for demonstration or template seeding
 */
export function getSamplePamphlet(id: string = 'demo-pamphlet'): Pamphlet {
  return {
    id,
    userId: 'demo-user',
    slug: 'buku-program-anugerah-cemerlang',
    title: 'Buku Program Hari Apresiasi & Anugerah Kecemerlangan',
    description:
      'Buku Program Rasmi Sempena Majlis Hari Apresiasi Murid & Anugerah Kecemerlangan Akademik Tahun 2026.',
    eventDate: '24 Oktober 2026',
    location: 'Dewan Gemilang Bitara, SMK Cyberjaya',
    coverImage:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop',
    pdfUrl: '',
    theme: 'emerald',
    displayMode: 'flipbook',
    pages: [
      {
        id: 'p1',
        pageNumber: 1,
        title: 'Muka Hadapan (Cover)',
        imageUrl:
          'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: 1.414,
      },
      {
        id: 'p2',
        pageNumber: 2,
        title: 'Kata Aluan & Falsafah',
        imageUrl:
          'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: 1.414,
      },
      {
        id: 'p3',
        pageNumber: 3,
        title: 'Atur Cara & Tentatif Majlis',
        imageUrl:
          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: 1.414,
      },
      {
        id: 'p4',
        pageNumber: 4,
        title: 'Senarai Penerima Anugerah',
        imageUrl:
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: 1.414,
      },
      {
        id: 'p5',
        pageNumber: 5,
        title: 'Jawatankuasa Pelaksana',
        imageUrl:
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: 1.414,
      },
      {
        id: 'p6',
        pageNumber: 6,
        title: 'Sekalung Penghargaan (Back Cover)',
        imageUrl:
          'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000&auto=format&fit=crop',
        aspectRatio: 1.414,
      },
    ],
    actionButtons: [
      {
        id: 'b1',
        label: 'Daftar Kehadiran (Check-In)',
        url: '#',
        icon: 'QrCode',
        type: 'checkin',
      },
      {
        id: 'b2',
        label: 'Tebus E-Sijil',
        url: '#',
        icon: 'Award',
        type: 'cert',
      },
      {
        id: 'b3',
        label: 'WhatsApp Urusetia',
        url: 'https://wa.me/60123456789?text=Salam%20Urusetia%20Majlis',
        icon: 'MessageCircle',
        type: 'whatsapp',
      },
    ],
    isActive: true,
    views: 128,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
