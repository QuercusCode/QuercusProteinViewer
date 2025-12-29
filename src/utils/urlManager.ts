import type { RepresentationType, ColoringType } from '../components/ProteinViewer';

export interface AppState {
    pdbId: string;
    representation: RepresentationType;
    coloring: ColoringType;
    orientation?: any; // Matrix or Quaternion array
    isSpinning: boolean;
    showLigands: boolean;
    showSurface: boolean;
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

    return state;
};
