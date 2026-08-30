'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  BioPageWithLinks,
  BioLink,
  BioSocialLinks,
} from '@/lib/types/bio-links';
import {
  BIO_THEMES,
  BUTTON_STYLES,
  resolveSocialUrl,
} from '@/lib/bio-links/themes';
import { trackBioClickAction } from '@/actions/bio-links';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Share2,
  Copy,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Send,
  Github,
  Mail,
  Globe,
  Linkedin,
  FileText,
  Download,
} from 'lucide-react';

interface PublicBioClientProps {
  page: BioPageWithLinks;
}

export function PublicBioClient({ page }: PublicBioClientProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const theme = BIO_THEMES[page.theme] || BIO_THEMES.emerald;
  const buttonStyle =
    BUTTON_STYLES[page.themeConfig?.buttonStyle || 'rounded-full'] ||
    BUTTON_STYLES['rounded-full'];

  const activeLinks = page.links.filter((l) => l.isActive);

  const handleLinkClick = (link: BioLink) => {
    // Fire-and-forget click tracker
    trackBioClickAction(link.id).catch(() => {});
  };

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 600, 600);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `klikbio-${page.username}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://www.klikform.com/bio/${page.username}`;

  return (
    <main
      className={`min-h-screen ${theme.bg} flex flex-col justify-between items-center px-4 py-8 relative selection:bg-emerald-500 selection:text-white`}
    >
      {/* Floating Share Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShareOpen(true)}
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-md"
          title="Share this page"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6 pt-4">
        {/* Profile Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {page.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.avatarUrl}
              alt={page.title || page.username}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl mx-auto ${theme.avatarBorder}`}
            />
          ) : (
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-2xl mx-auto ${theme.avatarBorder}`}
            >
              {(page.title || page.username).charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center space-y-2 max-w-sm px-2"
        >
          <h1 className={`font-bold text-xl sm:text-2xl leading-tight ${theme.textColor}`}>
            {page.title || page.username}
          </h1>
          {page.bio && (
            <p className={`text-sm leading-relaxed ${theme.bioColor} whitespace-pre-line`}>
              {page.bio}
            </p>
          )}
        </motion.div>

        {/* Social Icons Row */}
        {page.socialLinks && Object.values(page.socialLinks).some(Boolean) && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2.5 pt-1"
          >
            {Object.entries(page.socialLinks).map(([platform, val]) => {
              if (!val) return null;
              const p = platform as keyof BioSocialLinks;
              const url = resolveSocialUrl(p, val);
              if (!url) return null;

              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md transition-transform hover:scale-110 active:scale-95"
                  title={platform}
                >
                  {getSocialIcon(p)}
                </a>
              );
            })}
          </motion.div>
        )}

        {/* Links List */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="w-full space-y-3.5 pt-2"
        >
          {activeLinks.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/70">
              No links available at the moment.
            </div>
          ) : (
            activeLinks.map((link) => {
              if (link.type === 'header') {
                return (
                  <div key={link.id} className="pt-4 pb-1 text-center">
                    <span
                      className={`text-xs font-bold tracking-widest uppercase ${theme.textColor} opacity-90`}
                    >
                      {link.title}
                    </span>
                  </div>
                );
              }

              const isHighlight = link.highlight;
              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target={link.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(link)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 px-5 font-semibold text-sm sm:text-base flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    buttonStyle.class
                  } ${
                    isHighlight
                      ? `${theme.highlightButtonClass} animate-pulse`
                      : theme.buttonClass
                  }`}
                >
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    {getLinkTypeIcon(link.type)}
                  </div>
                  <span className="truncate flex-1 text-center px-2">
                    {link.title}
                  </span>
                  <div className="w-5 shrink-0 flex items-center justify-center opacity-70">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </motion.a>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-12 pb-4 text-center">
        <a
          href="https://www.klikform.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/35 text-white/80 hover:text-white backdrop-blur-md text-xs font-medium border border-white/10 transition-all hover:scale-105 shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Create your own with <strong>KlikForm</strong>
          </span>
        </a>
      </footer>

      {/* Share Modal Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Share @{page.username}</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Scan this QR code or copy link to share this profile.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 shadow-sm my-2">
            <QRCodeSVG
              ref={qrRef}
              value={currentUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
            <p className="font-mono text-xs text-gray-500 mt-2 truncate max-w-full">
              {currentUrl}
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="w-full gap-1.5 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Link Copied!' : 'Copy Link'}
            </Button>
            <Button
              size="sm"
              onClick={downloadQR}
              className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-3.5 w-3.5" />
              Save QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function getLinkTypeIcon(type: string) {
  switch (type) {
    case 'whatsapp':
      return <MessageCircle className="h-4 w-4" />;
    case 'form':
      return <FileText className="h-4 w-4" />;
    default:
      return null;
  }
}

function getSocialIcon(platform: keyof BioSocialLinks) {
  switch (platform) {
    case 'whatsapp':
      return <MessageCircle className="h-5 w-5" />;
    case 'instagram':
      return <Instagram className="h-5 w-5" />;
    case 'tiktok':
      return <Send className="h-5 w-5" />;
    case 'facebook':
      return <Facebook className="h-5 w-5" />;
    case 'twitter':
      return <Twitter className="h-5 w-5" />;
    case 'youtube':
      return <Youtube className="h-5 w-5" />;
    case 'telegram':
      return <Send className="h-5 w-5" />;
    case 'email':
      return <Mail className="h-5 w-5" />;
    case 'website':
      return <Globe className="h-5 w-5" />;
    case 'github':
      return <Github className="h-5 w-5" />;
    case 'linkedin':
      return <Linkedin className="h-5 w-5" />;
    default:
      return <Globe className="h-5 w-5" />;
  }
}
