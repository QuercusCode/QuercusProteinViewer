import React, { useEffect, useState } from 'react';
import { X, Copy, Download, Check, Linkedin } from 'lucide-react';
import QRCode from 'qrcode';
import { logEvent } from '../utils/analytics';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    isLightMode: boolean;
    warning?: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, isLightMode, warning }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');

    // Embed Options State
    const [embedSpin, setEmbedSpin] = useState(false);
    const [embedControls, setEmbedControls] = useState(true);
    const [embedTheme, setEmbedTheme] = useState<'dark' | 'light'>('dark');
    const [embedStatic, setEmbedStatic] = useState(false);
    const [embedScrollProtection, setEmbedScrollProtection] = useState(false);
    const [embedSize, setEmbedSize] = useState<'small' | 'medium' | 'large' | 'full' | 'custom'>('medium');
    const [customWidth, setCustomWidth] = useState('800');
    const [customHeight, setCustomHeight] = useState('600');

    // Generate QR Code
    useEffect(() => {
        if (isOpen && shareUrl) {
            console.log(`Generating QR for URL (${shareUrl.length} chars)`);
            QRCode.toDataURL(shareUrl, {
                margin: 2,
                width: 400,
                errorCorrectionLevel: 'L',
                color: {
                    dark: isLightMode ? '#000000' : '#FFFFFF',
                    light: isLightMode ? '#FFFFFF' : '#171717'
                }
            })
                .then(url => {
                    setQrCodeDataUrl(url);
                    setGenerationError(null);
                })
                .catch(err => {
                    console.error('Failed to generate QR code', err);
                    setGenerationError('URL too long for QR Code');
                });
        }
    }, [isOpen, shareUrl, isLightMode]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            logEvent('copy_share_link', { url: shareUrl });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownloadQR = () => {
        if (!qrCodeDataUrl) return;
        logEvent('download_qr');
        const link = document.createElement('a');
        link.href = qrCodeDataUrl;
        link.download = 'protein-viewer-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Generate Embed Code
    const getEmbedUrl = () => {
        let url = shareUrl.replace('?', '?embed=true&');
        if (embedSpin) url += '&spin=true';
        if (!embedControls) url += '&ui=false';
        if (embedTheme === 'light') url += '&theme=light';
        if (embedTheme === 'dark') url += '&theme=dark';
        if (embedStatic) url += '&interaction=false';
        if (embedScrollProtection) url += '&scroll=false';
        return url;
    };

    const finalEmbedUrl = getEmbedUrl();

    const getDimensions = () => {
        switch (embedSize) {
            case 'small': return { width: '400', height: '300' };
            case 'medium': return { width: '600', height: '450' };
            case 'large': return { width: '800', height: '600' };
            case 'full': return { width: '100%', height: '600' };
            case 'custom': return { width: customWidth, height: customHeight };
        }
    };
    const { width, height } = getDimensions();

    const embedCode = `<iframe
  src="${finalEmbedUrl}"
  width="${width}"
  height="${height}"
  style="border:none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 100%;"
  title="Quercus Viewer"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>`;

    const handleCopyEmbed = async () => {
        try {
            await navigator.clipboard.writeText(embedCode);
            setCopied(true);
            logEvent('copy_embed_code');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className={`relative w-full max-w-6xl rounded-xl shadow-2xl p-6 my-auto ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Share Visualization</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isLightMode ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {warning ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="p-4 rounded-full bg-yellow-500/10 text-yellow-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        </div>
                        <div>
                            <h3 className={`font-semibold ${isLightMode ? 'text-neutral-900' : 'text-white'}`}>Sharing Unavailable</h3>
                            <p className={`text-sm mt-1 ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                {warning}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className={`flex p-1 mb-6 rounded-lg ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-800'}`}>
                            <button
                                onClick={() => setActiveTab('link')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'link'
                                    ? (isLightMode ? 'bg-white shadow-sm text-neutral-900' : 'bg-neutral-700 shadow-sm text-white')
                                    : (isLightMode ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-400 hover:text-white')
                                    }`}
                            >
                                Share Link
                            </button>
                            <button
                                onClick={() => setActiveTab('embed')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'embed'
                                    ? (isLightMode ? 'bg-white shadow-sm text-neutral-900' : 'bg-neutral-700 shadow-sm text-white')
                                    : (isLightMode ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-400 hover:text-white')
                                    }`}
                            >
                                Embed Widget
                            </button>
                        </div>

                        {activeTab === 'link' ? (
                            <>
                                {/* QR Code */}
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    {qrCodeDataUrl ? (
                                        <div className={`p-4 rounded-lg border-2 ${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-950 border-neutral-700'}`}>
                                            <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 flex flex-col items-center justify-center text-center p-4">
                                            {generationError ? (
                                                <>
                                                    <div className="text-red-500 mb-2">⚠️</div>
                                                    <p className="text-sm text-red-400">{generationError}</p>
                                                    <p className="text-xs text-neutral-500 mt-2">Try shortening the URL or using fewer viewports.</p>
                                                </>
                                            ) : (
                                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Link */}
                                <div className="space-y-3 mb-6">
                                    <label className={`text-sm font-medium ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                                        Shareable Link
                                    </label>
                                    <div className={`flex items-center gap-2 p-3 rounded-lg border ${isLightMode ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-950 border-neutral-700'}`}>
                                        <input
                                            type="text"
                                            value={shareUrl}
                                            readOnly
                                            className={`flex-1 bg-transparent text-sm outline-none ${isLightMode ? 'text-neutral-900' : 'text-neutral-100'}`}
                                        />
                                        <button
                                            onClick={handleCopy}
                                            className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500 text-white' : (isLightMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}`}
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Social Sharing */}
                                <div className="space-y-3 mb-6">
                                    <label className={`text-sm font-medium ${isLightMode ? 'text-neutral-700' : 'text-neutral-300'}`}>
                                        Post to Socials
                                    </label>
                                    <div className="flex gap-2">
                                        <a
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out this protein structure I visualized with Quercus Viewer! 🧬✨")}&url=${encodeURIComponent(shareUrl)}&hashtags=StructuralBiology,ProteinDesign,QuercusViewer`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => logEvent('share_twitter')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-black text-white hover:bg-neutral-800 transition-colors border border-white/10"
                                        >
                                            <span className="text-xl">𝕏</span>
                                            <span className="text-xs">Post</span>
                                        </a>
                                        <a
                                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => logEvent('share_linkedin')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold bg-[#0077b5] text-white hover:bg-[#006396] transition-colors"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                            <span className="text-xs">Share</span>
                                        </a>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Embed Tab */
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-2">
                                {/* Left Column: Controls */}
                                <div className="md:col-span-5 space-y-6">
                                    {/* Behavior Group */}
                                    <div className="space-y-3">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Behavior
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setEmbedSpin(!embedSpin)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${embedSpin
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : (isLightMode ? 'bg-neutral-100/50 text-neutral-600 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800')
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${embedSpin ? 'bg-blue-500' : 'bg-neutral-400'}`} />
                                                    Auto-Spin
                                                </span>
                                                {embedSpin && <Check className="w-4 h-4" />}
                                            </button>

                                            <button
                                                onClick={() => setEmbedScrollProtection(!embedScrollProtection)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${embedScrollProtection
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : (isLightMode ? 'bg-neutral-100/50 text-neutral-600 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800')
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${embedScrollProtection ? 'bg-blue-500' : 'bg-neutral-400'}`} />
                                                    Scroll Protection
                                                </span>
                                                {embedScrollProtection && <Check className="w-4 h-4" />}
                                            </button>

                                            <button
                                                onClick={() => setEmbedStatic(!embedStatic)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${embedStatic
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : (isLightMode ? 'bg-neutral-100/50 text-neutral-600 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800')
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${embedStatic ? 'bg-blue-500' : 'bg-neutral-400'}`} />
                                                    Static Mode
                                                </span>
                                                {embedStatic && <Check className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Appearance Group */}
                                    <div className="space-y-3">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Appearance
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setEmbedControls(!embedControls)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${!embedControls
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : (isLightMode ? 'bg-neutral-100/50 text-neutral-600 border-neutral-200 hover:bg-neutral-100' : 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:bg-neutral-800')
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${!embedControls ? 'bg-blue-500' : 'bg-neutral-400'}`} />
                                                    Hide Controls
                                                </span>
                                                {!embedControls && <Check className="w-4 h-4" />}
                                            </button>

                                            {/* Theme Toggle */}
                                            <div className={`flex items-center justify-between p-1 rounded-lg border ${isLightMode ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-800 border-neutral-700'}`}>
                                                <button
                                                    onClick={() => setEmbedTheme('dark')}
                                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${embedTheme === 'dark'
                                                        ? (isLightMode ? 'bg-white shadow text-neutral-900' : 'bg-neutral-700 shadow text-white')
                                                        : 'text-neutral-500 hover:text-neutral-400'
                                                        }`}
                                                >
                                                    Dark Theme
                                                </button>
                                                <button
                                                    onClick={() => setEmbedTheme('light')}
                                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${embedTheme === 'light'
                                                        ? (isLightMode ? 'bg-white shadow text-neutral-900' : 'bg-neutral-600 shadow text-white')
                                                        : 'text-neutral-500 hover:text-neutral-400'
                                                        }`}
                                                >
                                                    Light Theme
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Frame Size Selector */}
                                    <div className="space-y-3">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Frame Width
                                        </label>
                                        <div className={`grid grid-cols-5 gap-1 p-1 rounded-lg ${isLightMode ? 'bg-neutral-100' : 'bg-neutral-800'}`}>
                                            {(['small', 'medium', 'large', 'full', 'custom'] as const).map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setEmbedSize(size)}
                                                    className={`py-1.5 text-xs font-medium rounded-md capitalize transition-all ${embedSize === size
                                                        ? (isLightMode ? 'bg-white shadow text-neutral-900' : 'bg-neutral-700 shadow text-white')
                                                        : 'text-neutral-500 hover:text-neutral-900'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Custom Dimensions Inputs */}
                                        {embedSize === 'custom' && (
                                            <div className="grid grid-cols-2 gap-3 mt-2 animate-in slide-in-from-top-2">
                                                <div className="space-y-1">
                                                    <label className={`text-[10px] font-medium ml-1 ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                        Width (px/%)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customWidth}
                                                        onChange={(e) => setCustomWidth(e.target.value)}
                                                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium outline-none border transition-all ${isLightMode
                                                            ? 'bg-neutral-100 border-neutral-200 focus:border-blue-500 text-neutral-900 placeholder:text-neutral-400'
                                                            : 'bg-neutral-800 border-neutral-700 focus:border-blue-500 text-white placeholder:text-neutral-500'}`}
                                                        placeholder="800"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={`text-[10px] font-medium ml-1 ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                        Height (px)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={customHeight}
                                                        onChange={(e) => setCustomHeight(e.target.value)}
                                                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium outline-none border transition-all ${isLightMode
                                                            ? 'bg-neutral-100 border-neutral-200 focus:border-blue-500 text-neutral-900 placeholder:text-neutral-400'
                                                            : 'bg-neutral-800 border-neutral-700 focus:border-blue-500 text-white placeholder:text-neutral-500'}`}
                                                        placeholder="600"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Preview & Code */}
                                <div className="md:col-span-7 space-y-4">
                                    {/* Preview */}
                                    <div className="space-y-2">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Live Preview
                                        </label>
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/50">
                                            <iframe
                                                src={finalEmbedUrl}
                                                className="w-full h-full border-none pointer-events-none"
                                                title="Embed Preview"
                                            />
                                        </div>
                                    </div>

                                    {/* Code Block */}
                                    <div className="space-y-2">
                                        <label className={`text-xs font-bold uppercase tracking-wider flex justify-between ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            <span>Embed Code</span>
                                            <span className="text-[10px] font-normal opacity-70">Click to copy</span>
                                        </label>
                                        <div
                                            onClick={handleCopyEmbed}
                                            className={`relative p-4 rounded-lg border leading-relaxed font-mono text-[10px] sm:text-xs overflow-x-auto whitespace-pre cursor-pointer hover:border-blue-500/50 transition-colors group ${isLightMode ? 'bg-neutral-800 text-green-400 border-neutral-700 shadow-inner' : 'bg-black text-green-400 border-neutral-800 shadow-inner'}`}
                                        >
                                            {embedCode}
                                            <div className="absolute top-2 right-2 p-1.5 rounded bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Copy size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCopyEmbed}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all shadow-lg ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied to Clipboard!' : 'Copy Embed Code'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Actions - Link Mode Only (Download QR) */}
                {!warning && activeTab === 'link' && (
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleDownloadQR}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isLightMode ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
                        >
                            <Download className="w-4 h-4" />
                            Download QR
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
