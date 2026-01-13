import { X, Mail, Github, ExternalLink } from 'lucide-react';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLightMode: boolean;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, isLightMode }) => {
    if (!isOpen) return null;

    // TODO: Replace with actual contact details
    const CONTACT_EMAIL = "amir.cheraghali@example.com";
    const GITHUB_REPO = "https://github.com/QuercusCode/QuercusProteinViewer";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 transform transition-all scale-100 ${isLightMode ? 'bg-white text-neutral-900 border border-neutral-200' : 'bg-neutral-900 text-white border border-neutral-800'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Get in Touch</h2>
                        <p className={`text-sm mt-1 ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Questions, suggestions, or feedback?
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isLightMode ? 'hover:bg-neutral-100 text-neutral-500' : 'hover:bg-neutral-800 text-neutral-400'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">

                    {/* Email Option */}
                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${isLightMode
                            ? 'border-neutral-200 hover:border-blue-500 hover:bg-blue-50/50'
                            : 'border-neutral-800 hover:border-blue-500 hover:bg-blue-900/10'
                            }`}
                    >
                        <div className={`p-3 rounded-lg ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'
                            }`}>
                            <Mail className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base">Send an Email</h3>
                            <p className={`text-xs mt-0.5 ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Reach out directly for questions
                            </p>
                        </div>
                        <ExternalLink className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isLightMode ? 'text-blue-500' : 'text-blue-400'
                            }`} />
                    </a>

                    {/* GitHub Option */}
                    <a
                        href={GITHUB_REPO}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${isLightMode
                            ? 'border-neutral-200 hover:border-purple-500 hover:bg-purple-50/50'
                            : 'border-neutral-800 hover:border-purple-500 hover:bg-purple-900/10'
                            }`}
                    >
                        <div className={`p-3 rounded-lg ${isLightMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400'
                            }`}>
                            <Github className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base">GitHub Issues</h3>
                            <p className={`text-xs mt-0.5 ${isLightMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Report bugs or request features
                            </p>
                        </div>
                        <ExternalLink className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isLightMode ? 'text-purple-500' : 'text-purple-400'
                            }`} />
                    </a>

                </div>

                {/* Footer */}
                <div className={`mt-8 pt-6 border-t text-center ${isLightMode ? 'border-neutral-100' : 'border-neutral-800'}`}>
                    <p className={`text-xs font-medium ${isLightMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Quercus Protein Viewer v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};
