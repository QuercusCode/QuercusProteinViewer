import { useState } from 'react';
import { ProteinViewer, type RepresentationType, type ColoringType } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import type { ChainInfo, CustomColorRule, StructureInfo } from './types';

function App() {
  const [pdbId, setPdbId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pdb') || '4hhb'; // Default to Hemoglobin
  });
  const [file, setFile] = useState<File | null>(null);
  const [representation, setRepresentation] = useState<RepresentationType>('cartoon');
  const [coloring, setColoring] = useState<ColoringType>('chainid');
  const [resetKey, setResetKey] = useState(0);

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
      />

      <ProteinViewer
        pdbId={pdbId}
        file={file}
        representation={representation}
        coloring={coloring}
        customColors={customColors}
        onStructureLoaded={handleStructureLoaded}
        resetCamera={resetKey}
        className="w-full h-full"
      />

      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]" />
    </main>
  );
}

export default App;
