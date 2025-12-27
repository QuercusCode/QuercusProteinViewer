import { useState, useRef, useEffect } from 'react';
import { ProteinViewer, type RepresentationType, type ColoringType, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { ContactMap } from './components/ContactMap';
import { HelpGuide } from './components/HelpGuide';
import type { ChainInfo, CustomColorRule, StructureInfo, Snapshot, UniProtFeature } from './types';

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

  // Presentation State
  const [isSpinning, setIsSpinning] = useState(false);
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [showContactMap, setShowContactMap] = useState(false);

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

  // UniProt Data
  const [uniprotFeatures, setUniprotFeatures] = useState<UniProtFeature[]>([]);
  const [activeFeature, setActiveFeature] = useState<UniProtFeature | null>(null);

  useEffect(() => {
    if (!pdbId || pdbId.length < 4) {
      setProteinTitle(null);
      setUniprotFeatures([]);
      setActiveFeature(null);
      return;
    }

    const fetchData = async () => {
      const cleanId = pdbId.trim().toLowerCase();
      console.log(`Fetching data for PDB: ${cleanId}`);

      try {
        // 1. Fetch PDB Info
        const pdbResponse = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${cleanId}`);
        if (!pdbResponse.ok) throw new Error('Failed to fetch PDB metadata');
        const pdbData = await pdbResponse.json();

        if (pdbData.struct && pdbData.struct.title) {
          setProteinTitle(pdbData.struct.title);
        }

        // 2. Find UniProt Accession via RCSB Polymer Entity
        // This is a bit complex as it requires drilling down.
        // Simplified approach: Search UniProt directly via PDB ID cross-ref
        // https://rest.uniprot.org/uniprotkb/search?query=xref:pdb-1crn

        const uniprotResponse = await fetch(`https://rest.uniprot.org/uniprotkb/search?query=xref:pdb-${cleanId}&format=json`);
        const uniprotData = await uniprotResponse.json();

        if (uniprotData.results && uniprotData.results.length > 0) {
          const entry = uniprotData.results[0]; // Take first match
          console.log("UniProt Entry:", entry);

          const features: UniProtFeature[] = [];

          if (entry.features) {
            entry.features.forEach((feat: any) => {
              // Filter for interesting features
              if (['active_site', 'binding_site', 'domain', 'site', 'mutagenesis_site'].includes(feat.type)) {
                features.push({
                  type: feat.type,
                  description: feat.description,
                  start: feat.location.start.value,
                  end: feat.location.end.value,
                  chain: "A" // Assumption: Simplification for now, mapping UniProt to PDB chains is hard
                });
              }
            });
          }
          console.log("Extracted Features:", features);
          setUniprotFeatures(features);
        } else {
          console.log("No UniProt match found.");
          setUniprotFeatures([]);
        }

      } catch (error) {
        console.error("Failed to fetch biology data:", error);
        setProteinTitle(null);
        setUniprotFeatures([]);
      }
    };

    fetchData();
  }, [pdbId]);

  const handleFeatureClick = (feature: UniProtFeature | null) => {
    setActiveFeature(feature);
    if (feature) {
      // Highlight range
      // TODO: Chain mapping is tricky. PDB chain "A" might not map 1:1 to UniProt sequence.
      // For now, we assume simplistic mapping or try to apply to all chains or default "A".
      // Better: Apply to the first chain detected in the viewer or try wildcard.
      // Let's try passing the chain from our assumed data or just "A" for now.
      viewerRef.current?.highlightResidueRange(feature.chain || "A", feature.start, feature.end);
    } else {
      // Clear highlighter
      viewerRef.current?.highlightResidueRange("A", -1, -1);
    }
  };

  const handlePdbIdChange = (id: string) => {
    setPdbId(id);
    setFile(null); // Clear file when PDB ID is set
    setProteinTitle(null); // Reset title while fetching
    setChains([]);
    setCustomColors([]);
    setHighlightedResidue(null);
    setUniprotFeatures([]);
    setActiveFeature(null);
  };

  const viewerRef = useRef<ProteinViewerRef>(null);

  const handleFocusLigands = () => {
    viewerRef.current?.focusLigands();
  };

  const getAtomDataWrapper = async () => {
    if (viewerRef.current) {
      return await viewerRef.current.getAtomCoordinates();
    }
    return [];
  };



  const handlePixelClick = (chainA: string, resA: number, _chainB: string, _resB: number) => {
    // Highlight both residues
    // viewerRef.current?.highlightResiduePair(chainA, resA, chainB, resB); 
    // Current API only highlights one. Let's highlight one or toggle.
    // Or: Highlight A, then small timeout Highlight B?
    // Better: Update ProteinViewer to accept highlightResiduePair?
    // For now, just click A (simplification)
    viewerRef.current?.highlightResidue(chainA, resA);
    // Ideally we want to draw a line between them too...
    // Maybe set MeasurementMode?
  };

  // Session Management
  const handleSaveSession = () => {
    const state = {
      pdbId,
      representation,
      coloring,
      isMeasurementMode,
      isLightMode,
      showSurface,
      showLigands,
      isSpinning,
      customColors,
      chains,
      orientation: viewerRef.current?.getCameraOrientation(),
      savedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${pdbId || 'structure'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSession = async (file: File) => {
    try {
      const text = await file.text();
      const state = JSON.parse(text);

      if (!state.savedAt) console.warn("Session file missing timestamp");

      if (state.pdbId) setPdbId(state.pdbId);
      if (state.representation) setRepresentation(state.representation);
      if (state.coloring) setColoring(state.coloring);
      if (typeof state.isMeasurementMode === 'boolean') setIsMeasurementMode(state.isMeasurementMode);
      if (typeof state.isLightMode === 'boolean') setIsLightMode(state.isLightMode);
      if (typeof state.showSurface === 'boolean') setShowSurface(state.showSurface);
      if (typeof state.showLigands === 'boolean') setShowLigands(state.showLigands);
      if (typeof state.isSpinning === 'boolean') setIsSpinning(state.isSpinning);
      if (state.customColors) setCustomColors(state.customColors);

      if (state.orientation) {
        setTimeout(() => {
          viewerRef.current?.setCameraOrientation(state.orientation);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      alert("Failed to load session file.");
    }
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

  // Hover State
  const [hoveredResidue, setHoveredResidue] = useState<{ chain: string; resNo: number; resName?: string } | null>(null);

  // Debounced effect for 3D highlight (prevent flickering)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hoveredResidue) {
        viewerRef.current?.clearHighlight();
        // Re-apply selection highlight if exists
        if (highlightedResidue) {
          viewerRef.current?.highlightResidue(highlightedResidue.chain, highlightedResidue.resNo);
        }
      } else {
        // We use the same highlight method for now. 
        viewerRef.current?.highlightResidue(hoveredResidue.chain, hoveredResidue.resNo);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [hoveredResidue, highlightedResidue]);

  const handleHover = (info: { chain: string; resNo: number; resName: string } | null) => {
    // Avoid state thrashing
    if (!info) {
      if (hoveredResidue !== null) setHoveredResidue(null);
      return;
    }
    if (hoveredResidue?.chain === info.chain && hoveredResidue?.resNo === info.resNo) return;

    setHoveredResidue({ chain: info.chain, resNo: info.resNo, resName: info.resName });
  };

  const handleSequenceHover = (chain: string, resNo: number | null) => {
    if (resNo === null) {
      if (hoveredResidue !== null) setHoveredResidue(null);
    } else {
      setHoveredResidue({ chain, resNo });
    }
  };

  const handleSequenceResidueClick = (chain: string, resNo: number) => {
    console.log("App: Sequence Clicked", chain, resNo);
    console.log("App: Current Highlight", highlightedResidue);

    if (highlightedResidue &&
      String(highlightedResidue.chain) === String(chain) &&
      Number(highlightedResidue.resNo) === Number(resNo)) {
      console.log("App: Toggling OFF");
      setHighlightedResidue(null);
      viewerRef.current?.clearHighlight();
    } else {
      console.log("App: Selecting NEW");
      setHighlightedResidue({ chain, resNo });
      viewerRef.current?.highlightResidue(chain, resNo);
    }
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
        isMeasurementMode={isMeasurementMode}
        setIsMeasurementMode={setIsMeasurementMode}
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        highlightedResidue={highlightedResidue}
        onResidueClick={handleSequenceResidueClick}
        hoveredResidue={hoveredResidue}
        onResidueHover={handleSequenceHover}
        uniprotFeatures={uniprotFeatures}
        activeFeature={activeFeature}
        onFeatureClick={handleFeatureClick}
        showSurface={showSurface}
        setShowSurface={setShowSurface}
        showLigands={showLigands}
        setShowLigands={setShowLigands}
        onFocusLigands={handleFocusLigands}
        proteinTitle={proteinTitle}
        snapshots={snapshots}
        onSnapshot={handleSnapshot}
        onDownloadSnapshot={handleDownloadSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        isSpinning={isSpinning}
        setIsSpinning={setIsSpinning}
        isCleanMode={isCleanMode}
        setIsCleanMode={setIsCleanMode}
        onSaveSession={handleSaveSession}
        onLoadSession={handleLoadSession}
        onToggleContactMap={() => setShowContactMap(true)}
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
        onAtomHover={handleHover}
        backgroundColor={isLightMode ? "white" : "black"}
        showSurface={showSurface}
        showLigands={showLigands}
        isSpinning={isSpinning}
        className="w-full h-full"
      />

      <ContactMap
        isOpen={showContactMap}
        onClose={() => setShowContactMap(false)}
        chains={chains}
        getContactData={getAtomDataWrapper}
        onPixelClick={handlePixelClick}
        isLightMode={isLightMode}
      />



      <HelpGuide />

      {/* Background Gradient */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-0' : 'opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]'}`} />
    </main>
  );
}

export default App;
