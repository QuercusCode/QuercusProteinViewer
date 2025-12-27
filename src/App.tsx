import { useState, useRef, useEffect } from 'react';
import { ProteinViewer, type RepresentationType, type ColoringType, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { HelpGuide } from './components/HelpGuide';
import type { ChainInfo, CustomColorRule, StructureInfo, Snapshot } from './types';

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

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  // Snapshot Gallery State
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  // Visualization Toggles
  const [showSurface, setShowSurface] = useState(false);
  const [showLigands, setShowLigands] = useState(false);

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

  const [proteinTitle, setProteinTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!pdbId || pdbId.length < 4) {
      setProteinTitle(null);
      return;
    }

    const fetchTitle = async () => {
      const cleanId = pdbId.trim().toLowerCase();
      console.log(`Fetching title for PDB: ${cleanId}`);
      try {
        const response = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${cleanId}`);
        if (!response.ok) {
          console.error(`Fetch failed with status: ${response.status}`);
          throw new Error('Failed to fetch metadata');
        }
        const data = await response.json();
        console.log("Fetched structure data:", data);
        if (data.struct && data.struct.title) {
          console.log("Setting protein title:", data.struct.title);
          setProteinTitle(data.struct.title);
        } else {
          console.warn("No struct.title found in response");
          setProteinTitle(null);
        }
      } catch (error) {
        console.error("Failed to fetch protein title:", error);
        setProteinTitle(null);
      }
    };

    fetchTitle();
  }, [pdbId]);

  const handlePdbIdChange = (id: string) => {
    setPdbId(id);
    setFile(null); // Clear file when PDB ID is set
    setProteinTitle(null); // Reset title while fetching
    setChains([]);
    setCustomColors([]);
    setHighlightedResidue(null);
  };

  const viewerRef = useRef<ProteinViewerRef>(null);

  const handleFocusLigands = () => {
    viewerRef.current?.focusLigands();
  };

  const handleStructureLoaded = (info: StructureInfo) => {
    setChains(info.chains);
  };

  const handleAtomClick = (info: { chain: string; resNo: number; resName: string; atomIndex: number } | null) => {
    if (info) {
      if (highlightedResidue &&
        highlightedResidue.chain === info.chain &&
        highlightedResidue.resNo === info.resNo) {
        // Toggle off (Deselect)
        console.log("App: Deselecting residue", info);
        setHighlightedResidue(null);
        viewerRef.current?.clearHighlight();
      } else {
        // Select new
        console.log("App: Atom Clicked", info);
        setHighlightedResidue({ chain: info.chain, resNo: info.resNo, resName: info.resName });
        viewerRef.current?.highlightResidue(info.chain, info.resNo);
      }
    } else {
      // Background click
      setHighlightedResidue(null);
      viewerRef.current?.clearHighlight();
    }
  };

  const handleSequenceResidueClick = (chain: string, resNo: number) => {
    console.log("App: Sequence Clicked", chain, resNo);
    setHighlightedResidue({ chain, resNo });
    viewerRef.current?.highlightResidue(chain, resNo);
  };

  // Snapshot Handlers
  const handleSnapshot = async () => {
    if (!viewerRef.current) return;
    const blob = await viewerRef.current.getSnapshotBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const newSnapshot: Snapshot = {
        id: crypto.randomUUID(),
        url,
        timestamp: Date.now()
      };
      setSnapshots(prev => [newSnapshot, ...prev]);
    }
  };

  const handleDownloadSnapshot = (id: string) => {
    const snapshot = snapshots.find(s => s.id === id);
    if (snapshot) {
      const link = document.createElement('a');
      link.href = snapshot.url;
      link.download = `snapshot-${pdbId || 'structure'}-${snapshot.id.slice(0, 4)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const snapshot = snapshots.find(s => s.id === id);
    if (snapshot) {
      URL.revokeObjectURL(snapshot.url);
      setSnapshots(prev => prev.filter(s => s.id !== id));
    }
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
        // Snapshots
        snapshots={snapshots}
        onSnapshot={handleSnapshot}
        onDownloadSnapshot={handleDownloadSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        isMeasurementMode={isMeasurementMode}
        setIsMeasurementMode={setIsMeasurementMode}
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        highlightedResidue={highlightedResidue}
        onResidueClick={handleSequenceResidueClick}
        showSurface={showSurface}
        setShowSurface={setShowSurface}
        showLigands={showLigands}
        setShowLigands={setShowLigands}
        onFocusLigands={handleFocusLigands}
        proteinTitle={proteinTitle}
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
        showSurface={showSurface}
        showLigands={showLigands}
        className="w-full h-full"
      />

      <HelpGuide />

      {/* Background Gradient */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-0' : 'opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]'}`} />
    </main>
  );
}

export default App;
