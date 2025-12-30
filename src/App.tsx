import { useState, useRef, useEffect } from 'react';
import { ProteinViewer, type RepresentationType, type ColoringType, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { ContactMap } from './components/ContactMap';
import { HelpGuide } from './components/HelpGuide';
import { parseURLState, getShareableURL } from './utils/urlManager';
import type { ChainInfo, CustomColorRule, StructureInfo, Snapshot, Movie } from './types';

function App() {
  // Parse Global URL State Once
  const initialUrlState = parseURLState();

  const [pdbId, setPdbId] = useState(() => initialUrlState.pdbId || '2b3p');
  const [file, setFile] = useState<File | null>(null);

  const [representation, setRepresentation] = useState<RepresentationType>(
    initialUrlState.representation || 'cartoon'
  );

  const [coloring, setColoring] = useState<ColoringType>(
    initialUrlState.coloring || 'chainid'
  );

  const [hasRestoredState, setHasRestoredState] = useState(!!initialUrlState.orientation);
  const [resetKey, setResetKey] = useState(0);
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);

  useEffect(() => {
    // Store pending orientation for later application
    if (initialUrlState.orientation) {
      (window as any).__pendingOrientation = initialUrlState.orientation;
    }
  }, []);

  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  // Presentation State
  const [isSpinning, setIsSpinning] = useState(initialUrlState.isSpinning || false);
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [showContactMap, setShowContactMap] = useState(false);

  // Custom Colors need to be initialized too
  const [customColors, setCustomColors] = useState<CustomColorRule[]>(initialUrlState.customColors || []);
  const [showLigands, setShowLigands] = useState(initialUrlState.showLigands || false);
  const [showSurface, setShowSurface] = useState(initialUrlState.showSurface || false);

  // ... (lines 53-343) ...

  const handleStructureLoaded = (info: StructureInfo) => {
    const hasChains = info.chains && info.chains.length > 0;

    if (hasChains) {
      setChains(info.chains);
      setLigands(info.ligands);
      // setCustomColors([]); // REMOVED: Do not clear custom colors if we just restored them! 
      // Actually, we should only clear if not restoring? 
      // If we loaded from URL, customColors are set. 
      // If we upload a file or change PDB manually, we reset customColors in handlePdbIdChange/handleUpload.
      // So here we should NOT clear them.

      // Restore Orientation & Measurements if pending
      if (hasRestoredState && viewerRef.current) {
        try {
          setTimeout(() => {
            if ((window as any).__pendingOrientation) {
              viewerRef.current?.setCameraOrientation((window as any).__pendingOrientation);
              delete (window as any).__pendingOrientation;
            }
            if (initialUrlState.measurements) {
              viewerRef.current?.restoreMeasurements(initialUrlState.measurements);
            }
            setHasRestoredState(false);
          }, 500);
        } catch (e) { console.warn("App: Failed to restore state", e); }
      }
    } else {
      console.warn("App: Loaded structure has no chains?", info);
    }
  };



  // Snapshot Gallery State
  // Snapshot & Movie Gallery State
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);

  // Visualization Toggles

  // Visualization Toggles
  // Tools

  const [highlightedResidue, setHighlightedResidue] = useState<{ chain: string; resNo: number; resName?: string } | null>(null);

  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [ligands, setLigands] = useState<string[]>([]);

  const [fileType, setFileType] = useState<'pdb' | 'mmcif'>('pdb');

  const handleResetView = () => {
    setResetKey(prev => prev + 1);
    setResetKey(prev => prev + 1);
  };

  const handleUpload = (uploadedFile: File, isCif?: boolean) => {
    setFile(uploadedFile);
    setFileType(isCif ? 'mmcif' : 'pdb');
    setPdbId(''); // Clear PDB ID when file is uploaded
    setChains([]);
    setLigands([]);
    setCustomColors([]);

    setHighlightedResidue(null);
  };

  // ... (fetchTitle logic) ... 

  // Need to insert logic into handleAtomClick
  const handleAtomClick = async (info: { chain: string; resNo: number; resName: string; atomIndex: number; position?: { x: number, y: number, z: number } } | null) => {
    if (!info) {
      setHighlightedResidue(null);
      return;
    }



    // Annotation Logic


    if (info) {
      // ... highlight logic ...
      if (highlightedResidue &&
        highlightedResidue.chain === info.chain &&
        highlightedResidue.resNo === info.resNo) {
        // Toggle off (Deselect)
        console.log("App: Deselecting residue", info);
        setHighlightedResidue(null);
        viewerRef.current?.clearHighlight();
      } else {
        if (isMeasurementMode) {
          return; // ProteinViewer handles measurement logic directly
        }

        // Select new
        console.log("App: Atom Clicked", info);
        setHighlightedResidue({ chain: info.chain, resNo: info.resNo, resName: info.resName });
        viewerRef.current?.highlightResidue(info.chain, info.resNo);
      }
    }
  };




  const [proteinTitle, setProteinTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!pdbId || pdbId.length < 4) {
      setProteinTitle(null);
      return;
    }

    const fetchTitle = async () => {
      const cleanId = pdbId.trim().toLowerCase();
      console.log(`Fetching title for PDB: ${cleanId} `);
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

  const [isRecording, setIsRecording] = useState(false);

  const viewerRef = useRef<ProteinViewerRef>(null);

  const handleRecordMovie = async (duration: number = 4000) => {
    if (viewerRef.current && !isRecording) {
      setIsRecording(true);
      try {
        const blob = await viewerRef.current.recordTurntable(duration);

        // Create Movie Object
        const mimeType = blob.type; // e.g. 'video/webm'
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

        const newMovie: Movie = {
          id: crypto.randomUUID(),
          url: URL.createObjectURL(blob),
          blob: blob,
          timestamp: Date.now(),
          duration: duration / 1000,
          format: ext
        };

        setMovies(prev => [newMovie, ...prev]);

        // Auto Download removed per user request: saved to gallery instead.
      } catch (e: any) {
        console.error("Recording failed", e);
        alert(`Recording failed: ${e.message || e.toString() || "Unknown error"}`);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const handleDownloadMovie = (id: string) => {
    const movie = movies.find(m => m.id === id);
    if (movie) {
      const a = document.createElement('a');
      a.href = movie.url;
      a.download = `protein-turntable-${pdbId || 'structure'}-${movie.id.slice(0, 4)}.${movie.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteMovie = (id: string) => {
    const movie = movies.find(m => m.id === id);
    if (movie) {
      URL.revokeObjectURL(movie.url);
      setMovies(prev => prev.filter(m => m.id !== id));
    }
  };



  const handleFocusLigands = () => {
    viewerRef.current?.focusLigands();
  };

  const getAtomDataWrapper = async () => {
    if (viewerRef.current) {
      return await viewerRef.current.getAtomCoordinates();
    }
    return [];
  };



  const handlePixelClick = (chainA: string, resA: number, chainB: string, resB: number) => {
    // 1. Visualize the Contact Line
    viewerRef.current?.visualizeContact(chainA, resA, chainB, resB);

    // 2. Log selection
    console.log(`Contact Map Interaction: ${chainA}:${resA} <-> ${chainB}:${resB}`);
  };

  // Session Management
  // Session Management
  const handleSaveSession = () => {
    try {
      console.log("Starting save session...");



      // 2. Safely get orientation
      let safeOrientation = null;
      try {
        safeOrientation = viewerRef.current?.getCameraOrientation() || null;
      } catch (err) {
        console.warn("Could not get orientation for save:", err);
      }

      // 3. Construct Data safely
      const sessionData = {
        version: 1,
        pdbId: String(pdbId || ""),
        representation: String(representation),
        coloring: String(coloring),
        orientation: safeOrientation,
        timestamp: Date.now()
      };

      console.log("Session data prepared, converting to JSON...");

      // 4. Safe Stringify
      const jsonString = JSON.stringify(sessionData, (key, value) => {
        // Prevent circular references just in case (though we sanitized above)
        if (key === 'viewerRef' || key === 'stageRef' || key === 'structure') return undefined;
        return value;
      }, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-${pdbId || 'structure'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("Save session completed successfully.");
    } catch (e) {
      console.error("CRITICAL SAVE ERROR:", e);
      alert(`Failed to save session: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleLoadSession = async (file: File) => {
    try {
      const text = await file.text();
      const session = JSON.parse(text);

      if (!session.timestamp) console.warn("Session file missing timestamp");

      if (session.pdbId) setPdbId(session.pdbId);
      if (session.representation) setRepresentation(session.representation);
      if (session.coloring) setColoring(session.coloring);

      // Handle boolean flags safely
      if (session.isLightMode !== undefined) setIsLightMode(session.isLightMode);
      if (session.showSurface !== undefined) setShowSurface(session.showSurface);
      if (session.showLigands !== undefined) setShowLigands(session.showLigands);
      if (session.isSpinning !== undefined) setIsSpinning(session.isSpinning);
      if (session.isCleanMode !== undefined) setIsCleanMode(session.isCleanMode);

      if (session.customColors) setCustomColors(session.customColors);
      if (session.snapshots) setSnapshots(session.snapshots);


      if (session.orientation) {
        setTimeout(() => {
          viewerRef.current?.setCameraOrientation(session.orientation);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      alert("Failed to load session file");
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
        ligands={ligands}
        customColors={customColors}
        setCustomColors={setCustomColors}
        isMeasurementMode={isMeasurementMode}
        setIsMeasurementMode={setIsMeasurementMode}
        onClearMeasurements={() => viewerRef.current?.clearMeasurements()}
        isLightMode={isLightMode}
        setIsLightMode={setIsLightMode}
        highlightedResidue={highlightedResidue}
        onResidueClick={handleSequenceResidueClick}
        showSurface={showSurface}
        setShowSurface={setShowSurface}
        showLigands={showLigands}
        setShowLigands={setShowLigands}
        onFocusLigands={handleFocusLigands}
        onRecordMovie={handleRecordMovie}
        isRecording={isRecording}
        proteinTitle={proteinTitle}
        snapshots={snapshots}
        onSnapshot={handleSnapshot}
        onDownloadSnapshot={handleDownloadSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        movies={movies}
        onDownloadMovie={handleDownloadMovie}
        onDeleteMovie={handleDeleteMovie}
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
        fileType={fileType}
        representation={representation}
        coloring={coloring}
        customColors={customColors}
        onStructureLoaded={handleStructureLoaded}
        resetCamera={resetKey}

        onAtomClick={handleAtomClick}
        isMeasurementMode={isMeasurementMode}

        backgroundColor={isLightMode ? "#f3f4f6" : "black"}
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
        proteinName={file ? file.name : pdbId}
        getSnapshot={async () => {
          if (!viewerRef.current) return null;
          const blob = await viewerRef.current.getSnapshotBlob();
          if (!blob) return null;
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }}
        getShareableLink={() => {
          return getShareableURL({
            pdbId,
            representation,
            coloring,
            isSpinning,
            showLigands,
            showSurface,
            customColors,
            orientation: viewerRef.current?.getCameraOrientation()
          });
        }}
      />



      <HelpGuide />

      {/* Background Gradient */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-0' : 'opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]'}`} />
    </main>
  );
}

export default App;
