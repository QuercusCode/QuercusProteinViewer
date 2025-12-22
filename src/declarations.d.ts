declare module 'ngl' {
    export class Stage {
        constructor(id: string | HTMLElement, params?: any);
        loadFile(path: string | File | Blob, params?: any): Promise<Component>;
        removeAllComponents(): void;
        handleResize(): void;
        dispose(): void;
        autoView(): void;
        setParameters(params: any): void;
        viewer: any;
    }
    export class Component {
        addRepresentation(type: string, params?: any): Representation;
        autoView(): void;
        removeAllRepresentations(): void;
    }
    export class Representation { }
}
