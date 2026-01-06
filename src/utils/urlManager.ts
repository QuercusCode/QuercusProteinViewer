import type { RepresentationType, ColoringType } from '../types';
import type { CustomColorRule } from '../types';

export interface AppState {
    pdbId: string;
    representation: RepresentationType;
    coloring: ColoringType;
    orientation?: any; // Matrix or Quaternion array
    isSpinning: boolean;
    showLigands: boolean;
    showSurface: boolean;
    customColors?: CustomColorRule[];
    measurements?: { atom1: any, atom2: any, distance: number }[];
    customBackgroundColor?: string | null;
    dataSource?: 'pdb' | 'pubchem'; // Added for chemical structures
}

/**
 * Serializes the current app state into a compact Base64 strings or query params.
 * Using Base64 helps avoid issues with special characters in JSON.
 */
export const getShareableURL = (state: AppState): string => {
    const params = new URLSearchParams();

    // 1. Basic Params
    params.set('pdb', state.pdbId || '');
    params.set('rep', state.representation);
    params.set('color', state.coloring);
    if (state.dataSource && state.dataSource !== 'pdb') {
        params.set('src', state.dataSource); // Only set if non-default
    }

    // 2. Boolean Flags (Compact: 1/0)
    if (state.isSpinning) params.set('spin', '1');
    if (state.showLigands) params.set('lig', '1');
    if (state.showSurface) params.set('surf', '1');

    // 3. Camera Orientation (Encoded JSON)
    if (state.orientation) {
        try {
            const json = JSON.stringify(state.orientation);
            const b64 = btoa(json); // Base64 encode
            params.set('cam', b64);
        } catch (e) {
            console.warn("Failed to serialize camera orientation", e);
        }
    }

    // 4. Custom Colors (Encoded JSON)
    if (state.customColors && state.customColors.length > 0) {
        try {
            const json = JSON.stringify(state.customColors);
            const b64 = btoa(json);
            params.set('cust', b64);
        } catch (e) { console.warn("Failed to serialize custom colors", e); }
    }

    // 5. Measurements (Encoded JSON)
    if (state.measurements && state.measurements.length > 0) {
        try {
            // Simplify measurement data to essential IDs to save space
            const minimalData = state.measurements.map(m => ({
                a1: { c: m.atom1.chain, r: m.atom1.resNo, a: m.atom1.atomName },
                a2: { c: m.atom2.chain, r: m.atom2.resNo, a: m.atom2.atomName }
            }));
            const json = JSON.stringify(minimalData);
            const b64 = btoa(json);
            params.set('meas', b64);
        } catch (e) { console.warn("Failed to serialize measurements", e); }
    }

    // 6. Custom Background
    if (state.customBackgroundColor) {
        params.set('bg', encodeURIComponent(state.customBackgroundColor));
    }

    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
};

/**
 * Parses the current URL search parameters to restore state.
 */
export const parseURLState = (): Partial<AppState> => {
    const params = new URLSearchParams(window.location.search);
    const state: Partial<AppState> = {};

    // 1. Basic Params
    const pdb = params.get('pdb');
    if (pdb) state.pdbId = pdb;

    const rep = params.get('rep');
    if (rep) state.representation = rep as RepresentationType;

    const color = params.get('color');
    if (color) state.coloring = color as ColoringType;

    // Data Source (default to 'pdb' if not specified)
    const src = params.get('src');
    if (src === 'pubchem') state.dataSource = 'pubchem';
    else state.dataSource = 'pdb';

    // 2. Boolean Flags
    if (params.get('spin') === '1') state.isSpinning = true;
    if (params.get('lig') === '1') state.showLigands = true;
    if (params.get('surf') === '1') state.showSurface = true;

    // 3. Camera Orientation
    const cam = params.get('cam');
    if (cam) {
        try {
            const json = atob(cam);
            state.orientation = JSON.parse(json);
        } catch (e) {
            console.warn("Failed to parse camera orientation from URL", e);
        }
    }

    // 4. Custom Colors
    const cust = params.get('cust');
    if (cust) {
        try {
            const json = atob(cust);
            state.customColors = JSON.parse(json);
        } catch (e) { console.warn("Failed to parse custom colors", e); }
    }

    // 5. Measurements
    const meas = params.get('meas');
    if (meas) {
        try {
            const json = atob(meas);
            const minimalData = JSON.parse(json);
            // Rehydrate to expected format (partial)
            state.measurements = minimalData.map((m: any) => ({
                atom1: { chain: m.a1.c, resNo: m.a1.r, atomName: m.a1.a },
                atom2: { chain: m.a2.c, resNo: m.a2.r, atomName: m.a2.a },
                distance: 0 // Will be recalculated by viewer
            }));
        } catch (e) { console.warn("Failed to parse measurements", e); }
    }

    // 6. Custom Background
    const bg = params.get('bg');
    if (bg) {
        state.customBackgroundColor = decodeURIComponent(bg);
    }

    return state;
};
