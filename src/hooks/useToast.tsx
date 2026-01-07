import { useState, useCallback } from 'react';
import type { ToastData, ToastType } from '../components/Toast';

export function useToast() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: ToastData = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string, duration?: number) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const error = useCallback((message: string, duration?: number) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const info = useCallback((message: string, duration?: number) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    const warning = useCallback((message: string, duration?: number) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
    };
}
