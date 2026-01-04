import React, { useEffect, useState } from 'react';
import { X, Copy, Download, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    isLightMode: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, isLightMode }) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Generate QR Code
    useEffect(() => {
        if (isOpen && shareUrl) {
            QRCode.toDataURL(shareUrl, {
                margin: 2,
                width: 300,
                errorCorrectionLevel: 'M',
                color: {
                    dark: isLightMode ? '#000000' : '#FFFFFF',
                    light: isLightMode ? '#FFFFFF' : '#171717'
                }
            })
                .then(url => setQrCodeDataUrl(url))
                .catch(err => console.error('Failed to generate QR code', err));
        }
    }, [isOpen, shareUrl, isLightMode]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownloadQR = () => {
        if (!qrCodeDataUrl) return;
        const link = document.createElement('a');
        link.href = qrCodeDataUrl;
        link.download = 'protein-viewer-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className={`relative w-full max-w-md rounded-xl shadow-2xl p-6 ${isLightMode ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}`}>
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

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    {qrCodeDataUrl ? (
                        <div className={`p-4 rounded-lg border-2 ${isLightMode ? 'bg-white border-neutral-200' : 'bg-neutral-950 border-neutral-700'}`}>
                            <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
                        </div>
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                        </div>
                    )}
                    <p className={`text-sm text-center ${isLightMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        Scan to view this visualization
                    </p>
                </div>

                {/* Link */}
                <div className="space-y-3">
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

                {/* Actions */}
                <div className="flex gap-2 mt-6">
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
            </div>
        </div>
    );
};
