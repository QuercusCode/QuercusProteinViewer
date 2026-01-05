import { useState, useRef, useEffect, useMemo } from 'react';
import { ProteinViewer, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { ContactMap } from './components/ContactMap';
import { AISidebar, type AIAction } from './components/AISidebar';
import { HelpGuide } from './components/HelpGuide';
import { parseURLState, getShareableURL } from './utils/urlManager';
import type { ChainInfo, CustomColorRule, Snapshot, Movie, ColorPalette, RepresentationType, ColoringType, ResidueInfo, StructureInfo } from './types';

import LibraryModal from './components/LibraryModal';
import { ShareModal } from './components/ShareModal';
import { SequenceTrack } from './components/SequenceTrack';
import { DragDropOverlay } from './components/DragDropOverlay';
import { CommandPalette, type CommandAction } from './components/CommandPalette';
import { HUD } from './components/HUD';
import { MeasurementPanel } from './components/MeasurementPanel';
import { OFFLINE_LIBRARY } from './data/library';
import { fetchPDBMetadata } from './utils/pdbUtils';
import type { PDBMetadata, Measurement } from './types';
import {
  Camera, RefreshCw, Upload,
  Settings, Zap, Activity, Grid3X3, Palette,
  Share2, Save, FolderOpen, Video
} from 'lucide-react';

function App() {
  const viewerRef = useRef<ProteinViewerRef>(null);
  // Parse Global URL State Once
  const initialUrlState = parseURLState();

  const [pdbId, setPdbId] = useState(() => initialUrlState.pdbId || '2b3p');
  const [file, setFile] = useState<File | null>(null);
  const [, setIsLoading] = useState(false);

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
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette>('standard');

  // Accessibility: Dyslexic Font
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);

  useEffect(() => {
    if (isDyslexicFont) {
      document.body.style.fontFamily = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif';
      document.body.style.letterSpacing = '0.05em';
      document.body.style.lineHeight = '1.6';
    } else {
      document.body.style.fontFamily = '';
      document.body.style.letterSpacing = '';
      document.body.style.lineHeight = '';
    }
  }, [isDyslexicFont]);

  // Custom Colors need to be initialized too
  const [customColors, setCustomColors] = useState<CustomColorRule[]>(initialUrlState.customColors || []);
  const [customBackgroundColor, setCustomBackgroundColor] = useState<string | null>(initialUrlState.customBackgroundColor || null);
  const [showLigands, setShowLigands] = useState(initialUrlState.showLigands || false);
  const [showSurface, setShowSurface] = useState(initialUrlState.showSurface || false);

  // ... (lines 53-343) ...

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
        setHasRestoredState(false);
      }, 500);
    } catch (e) { console.warn("App: Failed to restore state", e); }
  }




  // Snapshot Gallery State
  // Snapshot & Movie Gallery State
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);

  // Visualization Toggles

  // Visualization Toggles
  // Tools

  const [highlightedResidue, setHighlightedResidue] = useState<ResidueInfo | null>(null);

  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [ligands, setLigands] = useState<string[]>([]);

  const [fileType, setFileType] = useState<'pdb' | 'mmcif'>('pdb');

  const handleResetView = () => {
    setResetKey(prev => prev + 1);
    setResetKey(prev => prev + 1);
  };

  const handleUpload = (uploadedFile: File, isCif?: boolean, preservePdbId?: boolean) => {
    setFile(uploadedFile);
    setFileType(isCif ? 'mmcif' : 'pdb');
    if (!preservePdbId) {
      setPdbId(''); // Only clear PDB ID if not preserving (i.e., manual upload)
    }
    setChains([]);
    setLigands([]);
    setCustomColors([]);

    // If implementing "Publication Mode", checking if we need to reset it?
    // Probably keep it active if user wants to load many files in high quality.

    setHighlightedResidue(null);
    // Auto-set title from filename (removing extension)
    setProteinTitle(uploadedFile.name.replace(/\.[^/.]+$/, ""));
  };

  const [isPublicationMode, setIsPublicationMode] = useState(false);

  // Effect to apply Publication Mode settings
  // Note: we control these via props to ProteinViewer, not direct state setter here mostly
  // But we might want to override some defaults
  useEffect(() => {
    if (isPublicationMode) {
      // Auto-set High Quality Defaults
      setRepresentation('cartoon'); // or hyperball? Cartoon is standard
      setIsCleanMode(true);
      setColoring('chainid');
      setCustomBackgroundColor('#ffffff'); // White background
      setIsLightMode(true); // Ensure light mode for paper look
    } else {
      // Revert? Hard to store "previous" state easily without complex logic.
      // For now, just turn off "Clean Mode" and maybe set quality back.
      // We won't auto-revert data like coloring as that might be annoying.
      setIsCleanMode(false);
      setCustomBackgroundColor(null); // Revert to theme
    }
  }, [isPublicationMode]);

  // ... (fetchTitle logic) ... 

  // --- DERIVED STATE (Dr. AI V4) ---
  const structureStats = useMemo(() => {
    const chainCount = chains.length;
    const ligandCount = ligands.length;
    let residueCount = 0;

    chains.forEach(chain => {
      if (chain.sequence) {
        residueCount += chain.sequence.length;
      } else if (chain.max && chain.min) {
        residueCount += (chain.max - chain.min + 1);
      }
    });

    return { chainCount, residueCount, ligandCount };
  }, [chains, ligands]);

  // Need to insert logic into handleAtomClick
  const handleAtomClick = async (info: ResidueInfo | null) => {
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

  const handleHighlightResidue = (chain: string, resNo: number) => {
    setHighlightedResidue({ chain, resNo, resName: '' });
    viewerRef.current?.highlightResidue(chain, resNo);
  };

  const handleStructureLoaded = (info: StructureInfo) => {
    setIsLoading(false);
    setChains(info.chains);
    setLigands(info.ligands);

    const hasLigands = info.ligands.length > 0;

    if (hasLigands && !showLigands && !initialUrlState.showLigands) {
      // Optional logic
    }
  };

  const [proteinTitle, setProteinTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!pdbId || pdbId.length < 4) {
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
        // Fallback to ID if fetch fails
        setProteinTitle(pdbId.toUpperCase());
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

  const [pdbMetadata, setPdbMetadata] = useState<PDBMetadata | null>(null);

  // Fetch Metadata when PDB ID changes
  useEffect(() => {
    if (pdbId && !file) { // Only fetch if using PDB ID, not local file
      fetchPDBMetadata(pdbId).then(data => {
        if (data) setPdbMetadata(data);
      });
    } else {
      setPdbMetadata(null); // Clear/Reset if file uploaded or no ID
    }
  }, [pdbId, file]);

  const [isRecording, setIsRecording] = useState(false);

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




  const handleSequenceResidueClick = (chain: string, resNo: number, resName?: string) => {
    console.log("App: Sequence Clicked", chain, resNo, resName);
    console.log("App: Current Highlight", highlightedResidue);

    if (highlightedResidue &&
      String(highlightedResidue.chain) === String(chain) &&
      Number(highlightedResidue.resNo) === Number(resNo)) {
      console.log("App: Toggling OFF");
      setHighlightedResidue(null);
      viewerRef.current?.clearHighlight();
    } else {
      console.log("App: Selecting NEW");
      setHighlightedResidue({ chain, resNo, resName: resName || 'UNK' });
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




  // --- AI ACTION HANDLER (Dr. AI V3) ---
  const handleAIAction = (action: AIAction) => {
    switch (action.type) {
      case 'SET_COLORING':
        setColoring(action.value);
        break;
      case 'SET_REPRESENTATION':
        setRepresentation(action.value);
        break;
      case 'TOGGLE_SURFACE':
        setShowSurface(action.value);
        break;
      case 'RESET_VIEW':
        setResetKey(prev => prev + 1);
        if (viewerRef.current) viewerRef.current.resetCamera();
        break;
      case 'HIGHLIGHT_REGION':
        if (viewerRef.current) {
          viewerRef.current.highlightRegion(action.selection, action.label);
        }
        break;
    }
  };

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };



  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      const validExtensions = ['.pdb', '.cif', '.ent'];
      const fileExt = droppedFile.name.substring(droppedFile.name.lastIndexOf('.')).toLowerCase();

      if (validExtensions.includes(fileExt)) {
        handleUpload(droppedFile); // Reuse existing upload handler
      } else {
        alert("Invalid file type. Please drop a .pdb, .cif, or .ent file.");
      }
    }
  };

  // --- COMMAND PALETTE LOGIC ---
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // --- HUD STATE ---
  const [hoveredResidue, setHoveredResidue] = useState<ResidueInfo | null>(null);

  // --- MEASUREMENT STATE ---
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isMeasurementPanelOpen, setIsMeasurementPanelOpen] = useState(false);

  const handleAddMeasurement = (m: Measurement) => {
    setMeasurements(prev => [...prev, m]);
    setIsMeasurementPanelOpen(true); // Auto-open when adding
  };

  const handleUpdateMeasurement = (id: string, updates: Partial<Measurement>) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  // --- GLOBAL SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commandActions: CommandAction[] = useMemo(() => [
    // --- FILES & LOADING ---
    {
      id: 'load-upload',
      label: 'Upload File',
      icon: Upload,
      category: 'File',
      perform: () => document.getElementById('file-upload-input')?.click() // Indirect trigger if possible, or we need a ref
    },
    {
      id: 'load-library',
      label: 'Open Structure Library',
      icon: FolderOpen,
      category: 'File',
      perform: () => setIsLibraryOpen(true)
    },
    {
      id: 'save-session',
      label: 'Save Session',
      icon: Save,
      category: 'File',
      perform: handleSaveSession
    },

    // --- VIEW & EXPORT ---
    {
      id: 'reset-view',
      label: 'Reset Camera View',
      icon: RefreshCw,
      shortcut: 'R',
      category: 'View',
      perform: handleResetView
    },
    {
      id: 'toggle-pub-mode',
      label: isPublicationMode ? 'Exit Publication Mode' : 'Enter Publication Mode',
      icon: Camera,
      category: 'View',
      perform: () => setIsPublicationMode(prev => !prev)
    },
    {
      id: 'take-snapshot',
      label: 'Take Snapshot',
      icon: Camera,
      category: 'Export',
      perform: handleSnapshot
    },
    {
      id: 'record-movie',
      label: 'Record Turntable Movie',
      icon: Video,
      category: 'Export',
      perform: () => handleRecordMovie()
    },
    {
      id: 'share-link',
      label: 'Share via QR / Link',
      icon: Share2,
      category: 'Export',
      perform: () => setShowShareModal(true)
    },

    // --- APPEARANCE ---
    {
      id: 'style-cartoon',
      label: 'Style: Cartoon',
      icon: Activity,
      category: 'Appearance',
      perform: () => setRepresentation('cartoon')
    },
    {
      id: 'style-surface',
      label: 'Style: Molecular Surface',
      icon: Grid3X3,
      category: 'Appearance',
      perform: () => {
        setRepresentation('cartoon'); // Surface usually adds to cartoon
        setShowSurface(true);
      }
    },
    {
      id: 'style-sphere',
      label: 'Style: Spacefill (Sphere)',
      icon: Zap,
      category: 'Appearance',
      perform: () => setRepresentation('spacefill')
    },
    {
      id: 'color-chain',
      label: 'Color by Chain',
      icon: Palette,
      category: 'Appearance',
      perform: () => setColoring('chainid')
    },
    {
      id: 'color-hydro',
      label: 'Color by Hydrophobicity',
      icon: Palette,
      category: 'Appearance',
      perform: () => setColoring('hydrophobicity')
    },
    {
      id: 'color-bfactor',
      label: 'Color by B-Factor (Mobility)',
      icon: Palette,
      category: 'Appearance',
      perform: () => setColoring('bfactor')
    },
    {
      id: 'toggle-spin',
      label: isSpinning ? 'Stop Spinning' : 'Start Spinning',
      icon: RefreshCw,
      category: 'View',
      perform: () => setIsSpinning(prev => !prev)
    },
    {
      id: 'toggle-theme',
      label: isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      icon: Settings,
      category: 'View',
      perform: () => setIsLightMode(prev => !prev)
    },
  ], [isPublicationMode, isSpinning, isLightMode, handleSaveSession, handleSnapshot, handleResetView]);


  return (
    <main
      className={`w-full h-full relative overflow-hidden transition-colors duration-300 ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-neutral-950 text-white'}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DragDropOverlay isDragging={isDragging} />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={commandActions}
        isLightMode={isLightMode}
      />

      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={(url) => {
          // Extract ID
          const idMatch = url.match(/models\/([a-zA-Z0-9]+)\.pdb/);
          const id = idMatch ? idMatch[1] : 'Unknown';

          setIsLibraryOpen(false);
          setPdbId(id);
          setProteinTitle(`Loading ${id}...`);

          // Fetch and Load
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error("Failed to load local file");
              return res.blob();
            })
            .then(blob => {
              const file = new File([blob], `${id}.pdb`, { type: 'chemical/x-pdb' });
              handleUpload(file, false, true); // preservePdbId = true for library selections

              // Smart Title Lookup
              const libEntry = OFFLINE_LIBRARY.find(e => e.id.toLowerCase() === id.toLowerCase());
              if (libEntry) {
                setProteinTitle(libEntry.title);
              } else {
                setProteinTitle(`Offline: ${id}`);
              }
            })
            .catch(err => {
              console.warn("Local library load failed, falling back to RCSB.", err);
              // Fallback is automatic via setPdbId(id) above
            });
        }}
      />

      <AISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        pdbId={pdbId}
        proteinTitle={proteinTitle}
        highlightedResidue={highlightedResidue}
        stats={structureStats}
        chains={chains}
        onAction={handleAIAction}
      />
      <HUD
        hoveredResidue={hoveredResidue}
        pdbMetadata={pdbMetadata}
        pdbId={pdbId}
        isLightMode={isLightMode}
      />

      {isMeasurementPanelOpen && (
        <MeasurementPanel
          isOpen={isMeasurementPanelOpen}
          measurements={measurements}
          onUpdate={handleUpdateMeasurement}
          onDelete={handleDeleteMeasurement}
          onClose={() => {
            setIsMeasurementMode(false);
            setIsMeasurementPanelOpen(false);
          }}
          isLightMode={isLightMode}
        />
      )}

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
        isPublicationMode={isPublicationMode}
        setIsPublicationMode={setIsPublicationMode}
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
        isSpinning={isSpinning}
        setIsSpinning={setIsSpinning}
        onSaveSession={handleSaveSession}
        onLoadSession={handleLoadSession}
        onToggleContactMap={() => setShowContactMap(!showContactMap)}
        movies={movies}
        onDownloadMovie={handleDownloadMovie}
        onDeleteMovie={handleDeleteMovie}
        isCleanMode={isCleanMode}
        setIsCleanMode={setIsCleanMode}
        onShare={() => setShowShareModal(true)}
        onToggleShare={() => setShowShareModal(true)}
        onToggleLibrary={() => setIsLibraryOpen(!isLibraryOpen)}
        onToggleMeasurement={() => setIsMeasurementMode(!isMeasurementMode)}
        colorPalette={colorPalette}
        setColorPalette={setColorPalette}
        isDyslexicFont={isDyslexicFont}
        setIsDyslexicFont={setIsDyslexicFont}
        customBackgroundColor={customBackgroundColor}
        setCustomBackgroundColor={setCustomBackgroundColor}
        pdbMetadata={pdbMetadata}
      />

      <ProteinViewer
        ref={viewerRef}
        pdbId={pdbId}
        file={file || undefined}
        fileType={fileType}
        isLightMode={isLightMode}
        isSpinning={isSpinning}
        representation={representation}
        showSurface={showSurface}
        coloring={coloring}
        palette={colorPalette}
        backgroundColor={customBackgroundColor || (isLightMode ? 'white' : 'black')}

        onStructureLoaded={handleStructureLoaded}
        onAtomClick={handleAtomClick}
        isMeasurementMode={isMeasurementMode}
        measurements={measurements}
        onAddMeasurement={handleAddMeasurement}
        onHover={setHoveredResidue}

        quality={isPublicationMode ? 'high' : 'medium'}
        enableAmbientOcclusion={isPublicationMode}
        resetCamera={resetKey}
        showLigands={showLigands}
        customColors={customColors}
        className="w-full h-full"
      />

      <ContactMap
        isOpen={showContactMap}
        onClose={() => setShowContactMap(false)}
        chains={chains}
        getContactData={getAtomDataWrapper}
        onHighlightResidue={(chain, resNo) => handleHighlightResidue(chain, resNo)}
        onPixelClick={handlePixelClick}
        isLightMode={isLightMode}
        colorPalette={colorPalette}
        proteinName={proteinTitle || (file ? file.name.replace(/\.[^/.]+$/, "") : pdbId)}
        pdbAccession={pdbId}
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
            customBackgroundColor,
            orientation: viewerRef.current?.getCameraOrientation()
          });
        }}
        pdbMetadata={pdbMetadata}
        getLigandInteractions={async () => {
          if (viewerRef.current) {
            return await viewerRef.current.getLigandInteractions();
          }
          return [];
        }}
      />


      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={getShareableURL({
          pdbId,
          representation,
          coloring,
          isSpinning,
          showLigands,
          showSurface,
          customColors,
          customBackgroundColor,
          orientation: viewerRef.current?.getCameraOrientation()
        })}
        isLightMode={isLightMode}
      />

      <SequenceTrack
        chains={chains}
        highlightedResidue={highlightedResidue}
        onHoverResidue={() => { }} // Hover disabled per user request
        onClickResidue={(chain, resNo) => viewerRef.current?.focusResidue(chain, resNo)}
        isLightMode={isLightMode}
      />

      <HelpGuide />

      {/* Background Gradient */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-0' : 'opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]'}`} />
    </main>
  );
}

export default App;
