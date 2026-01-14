// Google Analytics Utility
// This is a lightweight wrapper to support GA4.
// It checks for the existence of the global `gtag` function.

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

// Measurement ID - Replace with actual ID in production or env var
const MEASUREMENT_ID = 'G-XXXXXXXXXX';

export const initGA = () => {
    if (typeof window === 'undefined') return;

    // Inject script if not present
    const scriptId = 'ga-script';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', MEASUREMENT_ID);
    }
};

export const logEvent = (eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
        // console.log(`[Analytics] ${eventName}`, params);
    }
};

export const logPageView = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', MEASUREMENT_ID, {
            page_path: url,
        });
    }
};
