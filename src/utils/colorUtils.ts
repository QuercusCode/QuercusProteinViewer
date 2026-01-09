import type { ColorPalette } from '../types';

export const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

export const interpolate = (color1: string, color2: string, factor: number) => {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    return `rgb(${r},${g},${b})`;
};

export const getPaletteColor = (value: number, palette: ColorPalette) => {
    if (palette === 'standard') {
        // Original Blue->Red Heatmap
        return hslToRgb(value * 240 / 360, 1.0, 0.5); // Convert to Hex/RGB string
    }

    if (palette === 'viridis') {
        if (value < 0.25) return interpolate('#440154', '#3b528b', value * 4);
        if (value < 0.5) return interpolate('#3b528b', '#21918c', (value - 0.25) * 4);
        if (value < 0.75) return interpolate('#21918c', '#5ec962', (value - 0.5) * 4);
        return interpolate('#5ec962', '#fde725', (value - 0.75) * 4);
    }

    if (palette === 'magma') {
        if (value < 0.25) return interpolate('#000004', '#51127c', value * 4);
        if (value < 0.5) return interpolate('#51127c', '#b73779', (value - 0.25) * 4);
        if (value < 0.75) return interpolate('#b73779', '#fc8961', (value - 0.5) * 4);
        return interpolate('#fc8961', '#fcfdbf', (value - 0.75) * 4);
    }

    if (palette === 'cividis') {
        return interpolate('#002051', '#fdea45', value);
    }

    if (palette === 'plasma') {
        if (value < 0.25) return interpolate('#0d0887', '#7e03a8', value * 4);
        if (value < 0.5) return interpolate('#7e03a8', '#cc4778', (value - 0.25) * 4);
        if (value < 0.75) return interpolate('#cc4778', '#f89540', (value - 0.5) * 4);
        return interpolate('#f89540', '#f0f921', (value - 0.75) * 4);
    }

    if (isNaN(value)) return '#cccccc'; // Fallback for invalid values
    return hslToRgb(value * 240 / 360, 1.0, 0.5);
};


// Helper to convert HSL to Hex/RGB string for NGL compatibility
function hslToRgb(h: number, s: number, l: number): string {
    if (isNaN(h) || isNaN(s) || isNaN(l)) return '#cccccc';

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}