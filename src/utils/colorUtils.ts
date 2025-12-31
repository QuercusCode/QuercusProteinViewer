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
        return `hsl(${value * 240}, 100%, 50%)`;
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

    return `hsl(${value * 240}, 100%, 50%)`;
};
