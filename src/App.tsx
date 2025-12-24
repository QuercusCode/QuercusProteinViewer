import { useState, useRef } from 'react';
import { ProteinViewer, type RepresentationType, type ColoringType, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { HelpGuide } from './components/HelpGuide';
import type { ChainInfo, CustomColorRule, StructureInfo } from './types';

function App() {
  const [pdbId, setPdbId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pdb') || '2b3p'; // Default to 2b3p (more stable)
  });
  const [file, setFile] = useState<File | null>(null);
  const [representation, setRepresentation] = useState<RepresentationType>('cartoon');
  const [coloring, setColoring] = useState<ColoringType>('chainid');
  const [resetKey, setResetKey] = useState(0);
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Interaction State
  const [highlightedResidue, setHighlightedResidue] = useState<{ chain: string; resNo: number; resName?: string } | null>(null);

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
    setHighlightedResidue(null);
  };

  const handlePdbIdChange = (id: string) => {
    setPdbId(id);
    setFile(null); // Clear file when PDB ID is set
    setChains([]);
    setCustomColors([]);
    setHighlightedResidue(null);
  };

  const viewerRef = useRef<ProteinViewerRef>(null);

  const handleExport = () => {
    viewerRef.current?.captureImage();
  };

  const handleStructureLoaded = (info: StructureInfo) => {
    setChains(info.chains);
  };

  const handleAtomClick = (info: { chain: string; resNo: number; resName: string; atomIndex: number } | null) => {
    if (info) {
      console.log("App: Atom Clicked", info);
      setHighlightedResidue({ chain: info.chain, resNo: info.resNo, resName: info.resName });
      // Also modify representation via Viewer Ref
      viewerRef.current?.highlightResidue(info.chain, info.resNo);
    } else {
      setHighlightedResidue(null);
    }
  };

  const handleSequenceResidueClick = (chain: string, resNo: number) => {
    console.log("App: Sequence Clicked", chain, resNo);
    setHighlightedResidue({ chain, resNo });
    viewerRef.current?.highlightResidue(chain, resNo);
  };

  return (
    <main className={`w-full h-full relative overflow-hidden transition-colors duration-300 ${isLightMode ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-950 text-white'}`}>
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
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        highlightedResidue={highlightedResidue}
        onResidueClick={handleSequenceResidueClick}
      />

      <ProteinViewer
        ref={viewerRef}
        pdbId={pdbId}
        file={file || undefined}
        representation={representation}
        coloring={coloring}
        customColors={customColors}
        onStructureLoaded={handleStructureLoaded}
        resetCamera={resetKey}
        isMeasurementMode={isMeasurementMode}
        onAtomClick={handleAtomClick}
        backgroundColor={isLightMode ? "white" : "black"}
        className="w-full h-full"
      />

      <HelpGuide />

      {/* Background Gradient */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-0' : 'opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]'}`} />
    </main>
  );
}

export default App;
