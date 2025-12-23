import { useState, useRef } from 'react';
import { ProteinViewer, type RepresentationType, type ColoringType, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { HelpGuide } from './components/HelpGuide';
import type { ChainInfo, CustomColorRule, StructureInfo } from './types';

function App() {
  const [pdbId, setPdbId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pdb') || '1crn'; // Default to Crambin (stable)
  });
  const [file, setFile] = useState<File | null>(null);
  const [representation, setRepresentation] = useState<RepresentationType>('cartoon');
  const [coloring, setColoring] = useState<ColoringType>('chainid');
  const [resetKey, setResetKey] = useState(0);
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);

  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [customColors, setCustomColors] = useState<CustomColorRule[]>([]);

  const handleResetView = () => {
    setResetKey(prev => prev + 1);
  };

  const handleUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setPdbId(''); // Clear PDB ID when file is uploaded
    setChains([]);
    setCustomColors([]);
  };

  const handlePdbIdChange = (id: string) => {
    setPdbId(id);
    setFile(null); // Clear file when PDB ID is set
    setChains([]);
    setCustomColors([]);
  };

  const viewerRef = useRef<ProteinViewerRef>(null);

  const handleExport = () => {
    viewerRef.current?.captureImage();
  };

  const handleStructureLoaded = (info: StructureInfo) => {
    setChains(info.chains);
  };

  return (
    <main className="w-full h-full relative bg-neutral-950 text-white overflow-hidden">
      <Controls
        pdbId={pdbId}
        setPdbId={handlePdbIdChange}
        onUpload={handleUpload}
        representation={representation}
        setRepresentation={setRepresentation}
        coloring={coloring}
        setColoring={setColoring}
        onResetView={handleResetView}
        chains={chains}
        customColors={customColors}
        setCustomColors={setCustomColors}
        onExport={handleExport}
        isMeasurementMode={isMeasurementMode}
        setIsMeasurementMode={setIsMeasurementMode}
      />

      <ProteinViewer
        ref={viewerRef}
        pdbId={pdbId}
        file={file}
        representation={representation}
        coloring={coloring}
        customColors={customColors}
        onStructureLoaded={handleStructureLoaded}
        resetCamera={resetKey}
        isMeasurementMode={isMeasurementMode}
        className="w-full h-full"
      />

      <HelpGuide />

      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]" />
    </main>
  );
}

export default App;
