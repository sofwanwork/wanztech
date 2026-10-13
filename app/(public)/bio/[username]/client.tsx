'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  BioPageWithLinks,
  BioLink,
  BioSocialLinks,
} from '@/lib/types/bio-links';
import {
  BIO_THEMES,
  resolveSocialUrl,
  getBioButtonClass,
  getBioButtonCustomStyle,
  getBioPatternStyle,
  getBioPatternOpacity,
  formatHandleTiles,
  getBioDisplayHandle,
  getHeroFadeMask,
} from '@/lib/bio-links/themes';
import { trackBioClickAction } from '@/actions/bio-links';
import {
  Sparkles,
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
  Share2,
  Copy,
  Check,
  QrCode,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PublicBioClientProps {
  page: BioPageWithLinks;
}

export function PublicBioClient({ page }: PublicBioClientProps) {
  const [imgError, setImgError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const qrRef = useRef<SVGSVGElement>(null);

  const fallbackUrl = `https://www.klikform.com/bio/${page.username}`;
  const shareTargetUrl = currentUrl || fallbackUrl;

  useEffect(() => {
    setImgError(false);
    setPosterError(false);
  }, [page.avatarUrl, page.themeConfig?.posterUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const theme = BIO_THEMES[page.theme] || BIO_THEMES.emerald;
  const isHeroMode = page.themeConfig?.headerType === 'hero' && Boolean(page.themeConfig?.posterUrl) && !posterError;
  const isPosterMode = page.themeConfig?.headerType === 'poster' && Boolean(page.themeConfig?.posterUrl) && !posterError;
  const badgeStyle = page.themeConfig?.badgeStyle || (isHeroMode ? 'stencil' : isPosterMode ? 'tiles' : 'none');
  const activeLinks = page.links.filter((l) => l.isActive);

  const handleLinkClick = (link: BioLink) => {
    // Fire-and-forget click tracker
    trackBioClickAction(link.id).catch(() => {});
  };

  const handleCopyPageUrl = () => {
    const url = currentUrl || (typeof window !== 'undefined' ? window.location.href : fallbackUrl);
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Bio link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: page.title || page.username,
          text: page.bio || `Check out @${page.username} on KlikBio`,
          url: currentUrl || (typeof window !== 'undefined' ? window.location.href : fallbackUrl),
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    setShareOpen(true);
  };

  const handleShareLink = (link: BioLink) => {
    let targetUrl = link.url;
    if (targetUrl.startsWith('/')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.klikform.com';
      targetUrl = `${origin}${targetUrl}`;
    }
    navigator.clipboard.writeText(targetUrl);
    toast.success(`Copied link for "${link.title}"!`);
  };

  const handleDownloadQr = () => {
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
        ctx.fillRect(0, 0, 600, 600);
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

  const displayHandle = getBioDisplayHandle(page.username, page.themeConfig?.customHandle);
  const { tiles } = formatHandleTiles(displayHandle, page.themeConfig?.handleUppercase);

  return (
    <main
      className={`min-h-[100dvh] ${theme.bg} flex flex-col justify-between items-center ${
        isHeroMode ? 'pt-0 px-4' : 'px-4 pt-4 sm:pt-6'
      } pb-6 relative selection:bg-emerald-500 selection:text-white w-full overflow-x-hidden`}
    >
      {/* Background Pattern Overlay */}
      {page.themeConfig?.pattern && page.themeConfig.pattern !== 'none' && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-200"
          style={{
            ...getBioPatternStyle(page.themeConfig.pattern, theme),
            opacity: getBioPatternOpacity(page.themeConfig),
            ...(isHeroMode
              ? {
                  maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 160px, black 270px)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, transparent 160px, black 270px)',
                }
              : {}),
          }}
        />
      )}

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-4 relative z-10">
        {/* HERO MODE: True Full-Bleed Edge-to-Edge Banner with Floating Action Overlays */}
        {isHeroMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="w-[calc(100%+2rem)] -mx-4 relative overflow-hidden select-none"
          >
            {/* Floating Action Overlay on top of Hero Graphic */}
            <div className="absolute top-4 left-4 z-20">
              <div className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/45 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-md select-none transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/45 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                title="Share Bio Page"
                aria-label="Share Bio Page"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {/* Top-bleed flyer image blending seamlessly into background via bottom gradient mask */}
            <div
              className="w-full relative overflow-hidden"
              style={{
                maskImage: getHeroFadeMask(page.themeConfig?.fadeStyle),
                WebkitMaskImage: getHeroFadeMask(page.themeConfig?.fadeStyle),
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.themeConfig?.posterUrl}
                alt={page.title || page.username}
                onError={() => setPosterError(true)}
                className="w-full h-[280px] sm:h-[340px] object-cover object-top pointer-events-none"
              />
            </div>

            {/* Optional Title & Bio if not hidden (e.g. if flyer doesn't contain text) */}
            {!page.themeConfig?.hideTitleInHero && (page.title || page.bio) && (
              <div className="text-center space-y-1 max-w-sm mx-auto px-4 -mt-2 relative z-10">
                {page.title && (
                  <h1 className={`font-bold text-lg sm:text-xl leading-tight ${theme.textColor}`}>
                    {page.title}
                  </h1>
                )}
                {page.bio && (
                  <p className={`text-xs sm:text-sm leading-relaxed ${theme.bioColor} whitespace-pre-line`}>
                    {page.bio}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {/* Standard Top Header Action Bar for Non-Hero Modes */}
            <div className="w-full flex items-center justify-between px-1">
              <div className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-sm select-none transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Share Bio Page"
                aria-label="Share Bio Page"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            {isPosterMode ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full flex flex-col items-center space-y-4"
              >
                {/* Prominent Event Poster Graphic Card */}
                <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-white/25 bg-white/10 relative backdrop-blur-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.themeConfig?.posterUrl}
                    alt={page.title || page.username}
                    onError={() => setPosterError(true)}
                    className="w-full h-auto object-cover max-h-[520px] rounded-3xl"
                  />
                </div>

                {/* Optional Title & Bio if provided */}
                {(page.title || page.bio) && (
                  <div className="text-center space-y-1.5 max-w-sm px-2">
                    {page.title && (
                      <h1 className={`font-bold text-lg sm:text-xl leading-tight ${theme.textColor}`}>
                        {page.title}
                      </h1>
                    )}
                    {page.bio && (
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme.bioColor} whitespace-pre-line`}>
                        {page.bio}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <>
                {/* Classic Profile Avatar */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {page.avatarUrl && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.avatarUrl}
                      alt={page.title || page.username}
                      onError={() => setImgError(true)}
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
              </>
            )}
          </>
        )}

        {/* Handle Badge Styling (Stencil @USER, Letter Tiles, or Pill) */}
        <div className={isHeroMode && page.themeConfig?.hideTitleInHero ? '-mt-6 sm:-mt-8 relative z-20' : ''}>
          {badgeStyle === 'stencil' ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className={`font-['Monofett',monospace] text-3xl sm:text-4xl tracking-wider select-none py-1 drop-shadow-sm text-center ${
                theme.id === 'minimal' ? 'text-slate-900' : 'text-white'
              }`}
            >
              @{page.themeConfig?.handleUppercase ? displayHandle.toUpperCase() : displayHandle}
            </motion.div>
          ) : badgeStyle === 'tiles' ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex items-center justify-center gap-1 my-1 flex-wrap max-w-full px-2"
            >
              <span
                className={`${
                  displayHandle.length > 7
                    ? 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs'
                    : 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm'
                } rounded-lg bg-white/90 text-slate-800 font-bold flex items-center justify-center shadow-md border border-white/80 select-none`}
              >
                @
              </span>
              {tiles.map((char, idx) => (
                <span
                  key={idx}
                  className={`${
                    displayHandle.length > 7
                      ? 'w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs'
                      : 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm'
                  } rounded-lg bg-white/90 text-slate-800 font-bold flex items-center justify-center shadow-md border border-white/80 select-none`}
                >
                  {char}
                </span>
              ))}
            </motion.div>
          ) : badgeStyle === 'pill' ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-mono text-xs font-semibold shadow-sm my-1"
            >
              @{page.themeConfig?.handleUppercase ? displayHandle.toUpperCase() : displayHandle}
            </motion.div>
          ) : null}
        </div>

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
              const hasImageThumb = Boolean(
                link.icon &&
                (link.icon.startsWith('http://') ||
                  link.icon.startsWith('https://') ||
                  link.icon.startsWith('/') ||
                  link.icon.startsWith('data:image'))
              );

              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target={link.url.startsWith('http') || link.type === 'form' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(link)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={getBioButtonCustomStyle(page.themeConfig, isHighlight)}
                  className={`w-full py-3.5 px-4 font-semibold text-sm sm:text-base flex items-center justify-between transition-all duration-200 cursor-pointer ${getBioButtonClass(
                    theme,
                    page.themeConfig?.buttonStyle || 'rounded-full',
                    isHighlight
                  )} ${isHighlight ? 'animate-pulse' : ''}`}
                >
                  {/* Left thumbnail or invisible balance spacer */}
                  {hasImageThumb ? (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center mr-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={link.icon}
                        alt=""
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-white/40 shadow-sm bg-white/20"
                      />
                    </div>
                  ) : (
                    /* Invisible balance spacer so title remains 100% centered against the right 3-dots button */
                    <div className="w-8 h-8 shrink-0 mr-2 invisible pointer-events-none" aria-hidden="true" />
                  )}

                  {/* Center title */}
                  <span className="truncate flex-1 text-center px-2 font-bold text-sm sm:text-base">
                    {link.title}
                  </span>

                  {/* Right 3-dots action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShareLink(link);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity shrink-0 cursor-pointer ml-2"
                    title="Share link"
                    aria-label="Share link"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </motion.a>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-6 pb-2 text-center relative z-10 shrink-0">
        <a
          href="https://www.klikform.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/25 hover:bg-black/35 text-white/80 hover:text-white backdrop-blur-md text-xs font-medium border border-white/10 transition-all hover:scale-105 shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Create your own with <strong>KlikForm</strong>
          </span>
        </a>
      </footer>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4 text-emerald-600" />
              Share Bio Page
            </DialogTitle>
            <DialogDescription className="text-xs">
              Share @{page.username} across your channels
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCopyPageUrl}
              variant="outline"
              className="w-full justify-between h-10 text-xs font-medium"
            >
              <span className="flex items-center gap-2">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied to Clipboard' : 'Copy Bio Link'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                klikform.com/bio/{page.username}
              </span>
            </Button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Check out ${page.title || page.username}: ${shareTargetUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                Share on WhatsApp
              </Button>
            </a>

            <Button
              onClick={() => {
                setShareOpen(false);
                setQrOpen(true);
              }}
              variant="outline"
              className="w-full justify-start gap-2 h-10 text-xs font-medium"
            >
              <QrCode className="h-4 w-4" />
              View QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs text-center rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Scan to Visit</DialogTitle>
            <DialogDescription className="text-xs">
              @{page.username} on KlikBio
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-200 my-2 shadow-inner">
            <QRCodeSVG
              ref={qrRef}
              value={shareTargetUrl}
              size={180}
              level="H"
              includeMargin
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrOpen(false)}
              className="flex-1 text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadQr}
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              Save QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
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
