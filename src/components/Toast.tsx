import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastProps {
    toast: ToastData;
    onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || 3000;
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration - 300); // Start exit animation 300ms before removal

        const removeTimer = setTimeout(() => {
            onRemove(toast.id);
        }, duration);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [toast.id, toast.duration, onRemove]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-950/90 border-green-500/30';
            case 'error':
                return 'bg-red-950/90 border-red-500/30';
            case 'warning':
                return 'bg-yellow-950/90 border-yellow-500/30';
            case 'info':
            default:
                return 'bg-blue-950/90 border-blue-500/30';
        }
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-2xl transition-all duration-300 ${getBgColor()} ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}
        >
            {getIcon()}
            <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onRemove(toast.id), 300);
                }}
                className="text-white/50 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastData[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
            <div className="flex flex-col gap-2 pointer-events-auto">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onRemove={onRemove} />
                ))}
            </div>
        </div>
    );
};
