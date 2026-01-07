import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ProteinViewer, type ProteinViewerRef } from './components/ProteinViewer';
import { Controls } from './components/Controls';
import { ContactMap } from './components/ContactMap';
import { AISidebar, type AIAction } from './components/AISidebar';
import { HelpGuide } from './components/HelpGuide';
import { parseURLState, getShareableURL } from './utils/urlManager';
import type { Snapshot, Movie, ColorPalette, ColoringType, ResidueInfo, StructureInfo } from './types';

import LibraryModal from './components/LibraryModal';
import { ShareModal } from './components/ShareModal';
import { SequenceTrack } from './components/SequenceTrack';
import { DragDropOverlay } from './components/DragDropOverlay';
import { CommandPalette, type CommandAction } from './components/CommandPalette';
import { HUD } from './components/HUD';
import { MeasurementPanel } from './components/MeasurementPanel';
import { OFFLINE_LIBRARY } from './data/library';
import { fetchPubChemMetadata } from './utils/pdbUtils';
import type { PDBMetadata, Measurement, MeasurementTextColor } from './types';
import {
  Camera, RefreshCw, Upload,
  Settings, Zap, Activity, Grid3X3, Palette,
  Share2, Save, FolderOpen, Video, Ruler, Maximize2, Star, Undo2, Redo2
} from 'lucide-react';
import { startOnboardingTour } from './components/TourGuide';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { FavoritesPanel } from './components/FavoritesPanel';
import { useFavorites } from './hooks/useFavorites';
import { useHistory } from './hooks/useHistory';
import { useVisualStack, type VisualState } from './hooks/useVisualStack';
import { useStructureController, type StructureController } from './hooks/useStructureController';
import { useStructureMetadata } from './hooks/useStructureMetadata';

function App() {
  // Refs for Multi-View Viewers (supports 1-4 viewports)
  const viewerRefs = [
    useRef<ProteinViewerRef>(null),
    useRef<ProteinViewerRef>(null),
    useRef<ProteinViewerRef>(null),
    useRef<ProteinViewerRef>(null)
  ];

  const { toasts, removeToast, success, error, info } = useToast();
  const { favorites, toggleFavorite, removeFavorite, isFavorite } = useFavorites();
  const { history, addToHistory } = useHistory();

  // Parse Global URL State Once
  const initialUrlState = parseURLState();

  // --- State: Multi-View Controllers (array of 4) ---
  const controllers = [
    useStructureController(initialUrlState), // Viewport 0
    useStructureController({}),              // Viewport 1
    useStructureController({}),              // Viewport 2
    useStructureController({})               // Viewport 3
  ];

  // --- State: View Mode & Active Management ---
  type ViewMode = 'single' | 'dual' | 'triple' | 'quad';
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [activeViewIndex, setActiveViewIndex] = useState(0);

  // Derived Accessors for "Active" Context (Sidebar, Controls, etc operate on this)
  const activeController = controllers[activeViewIndex];
  const viewerRef = viewerRefs[activeViewIndex];

  // Metadata Management for all controllers
  useStructureMetadata(controllers[0]);
  useStructureMetadata(controllers[1]);
  useStructureMetadata(controllers[2]);
  useStructureMetadata(controllers[3]);

  // Destructure Active Controller for UI Consistency
  const {
    pdbId, setPdbId,
    dataSource, setDataSource,
    file, setFile,

    representation, setRepresentation,
    coloring, setColoring,
    isSpinning, setIsSpinning,
    showSurface, setShowSurface,
    showLigands, setShowLigands,
    showIons, setShowIons,
    customColors, setCustomColors,
    customBackgroundColor, setCustomBackgroundColor,
    chains,
    ligands,
    pdbMetadata, setPdbMetadata,
    proteinTitle, setProteinTitle,
    highlightedResidue, setHighlightedResidue,
    measurements, setMeasurements,
    isMeasurementPanelOpen, setIsMeasurementPanelOpen,
    handleUpload,
    handleResetView,

  } = activeController;




  const [hasRestoredState, setHasRestoredState] = useState(!!initialUrlState.orientation);
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);

  useEffect(() => {
    // Store pending orientation for later application
    if (initialUrlState.orientation) {
      (window as any).__pendingOrientation = initialUrlState.orientation;
    }

    // Check for onboarding tour
    const hasSeenTour = localStorage.getItem('hasSeenViewerTour');
    if (!hasSeenTour) {
      // Delay slightly to ensure UI is mounted
      setTimeout(() => {
        startOnboardingTour(() => {
          localStorage.setItem('hasSeenViewerTour', 'true');
        });
      }, 1500);
    }
  }, []);

  // Handle Default Loading on DataSource Switch
  useEffect(() => {
    // Only apply defaults if there's no file loaded (user is exploring via ID)
    if (!file) {
      if (dataSource === 'pubchem') {
        // Switch to PubChem: Load Aspirin (2244) by default if current ID is not a valid CID or is a standard PDB ID
        // Simple heuristic: PDB IDs are length 4, CIDs are usually digits only (though can be stringy in code)
        if (!pdbId || pdbId.length === 4 || isNaN(Number(pdbId))) {
          setPdbId('2244'); // Default to Aspirin
        }
      } else if (dataSource === 'pdb') {
        // Switch to PDB: Load 2B3P by default if current ID looks like a CID (digits)
        if (!pdbId || !isNaN(Number(pdbId))) {
          setPdbId('2b3p');
        }
      }
    }
  }, [dataSource]);



  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  // Presentation State
  // isSpinning extracted to hook
  // Presentation State
  // isSpinning extracted to hook
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [showContactMap, setShowContactMap] = useState(false);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [favoritesTab, setFavoritesTab] = useState<'favorites' | 'history'>('favorites');
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

  // Sidebar Sections State (Lifted from Controls)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'appearance': true,
    'analysis': false,
    'tools': false,
    'motif-search': false
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTourHighlight = (elementId: string) => {
    console.log('Tour highlight:', elementId); // Debug log

    // Close all and open only the target section
    const newSections = {
      'appearance': false,
      'analysis': false,
      'tools': false,
      'motif-search': false
    };

    if (elementId === '#visualization-controls') {
      newSections['appearance'] = true;
    } else if (elementId === '#analysis-tools') {
      newSections['analysis'] = true;
    } else if (elementId === '#export-tools') {
      newSections['tools'] = true;
    } else if (elementId === '#sequence-track') {
      newSections['analysis'] = true;
    } else if (elementId === '#motif-search') {
      newSections['motif-search'] = true;
    }

    setOpenSections(newSections);
  };

  const handleStartTour = () => {
    // Determine context (simple check based on dataSource or explicit logic)
    const isChemical = dataSource === 'pubchem';

    startOnboardingTour(() => {
      localStorage.setItem('hasSeenViewerTour', 'true');
    }, handleTourHighlight, isChemical);
  };

  // Custom Colors need to be initialized too




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

  // Visualization Toggles
  // Tools

  // highlightedResidue, chains, ligands, fileType extracted to hook.



  // handleResetView and handleUpload extracted to hook

  const [isPublicationMode, setIsPublicationMode] = useState(false);

  // Store previous theme to restore after exiting Publication Mode
  const previousThemeRef = useRef(isLightMode);

  const togglePublicationMode = useCallback((shouldBeEnabled?: boolean) => {
    const nextState = shouldBeEnabled !== undefined ? shouldBeEnabled : !isPublicationMode;

    if (nextState === isPublicationMode) return;

    setIsPublicationMode(nextState);

    if (nextState) {
      // Enable
      previousThemeRef.current = isLightMode;
      setRepresentation('cartoon');
      setIsCleanMode(true);
      setColoring('chainid');
      setCustomBackgroundColor('#ffffff'); // White background
      setIsLightMode(true); // Ensure light mode for paper look
    } else {
      // Disable
      setIsCleanMode(false);
      setCustomBackgroundColor(null); // Revert to theme
      setIsLightMode(previousThemeRef.current); // Restore original theme
    }
  }, [isPublicationMode, isLightMode]);




  // ... (fetchTitle logic) ... 

  // Undo/Redo Stack (Moved here to access all state variables)
  const visualState: VisualState = useMemo(() => ({
    representation,
    coloring,
    colorPalette,
    showLigands,
    showIons,
    showSurface,
    customBackgroundColor: customBackgroundColor || '',
    customColors,
    isSpinning,
    isCleanMode,
    showContactMap,
    isPublicationMode,
    highlightedResidue,
    measurements
  }), [representation, coloring, colorPalette, showLigands, showIons, showSurface, customBackgroundColor, customColors, isSpinning, isCleanMode, showContactMap, isPublicationMode, highlightedResidue, measurements]);

  const handleVisualStateChange = useCallback((newState: VisualState) => {
    setRepresentation(newState.representation);
    setColoring(newState.coloring);
    setColorPalette(newState.colorPalette);
    setShowLigands(newState.showLigands);
    setShowIons(newState.showIons);
    setShowSurface(newState.showSurface);
    setCustomBackgroundColor(newState.customBackgroundColor || null);
    setCustomColors(newState.customColors);
    setIsSpinning(newState.isSpinning);
    setIsCleanMode(newState.isCleanMode);
    setShowContactMap(newState.showContactMap);
    setIsPublicationMode(newState.isPublicationMode);
    setHighlightedResidue(newState.highlightedResidue);
    setMeasurements(newState.measurements);
  }, []);

  const { undo, redo, canUndo, canRedo } = useVisualStack({
    state: visualState,
    onChange: handleVisualStateChange,
    resetTrigger: pdbId
  });

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

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

  const handleAtomClick = (
    info: { chain: string; resNo: number; resName: string; atomIndex?: number; position?: { x: number; y: number; z: number } } | null,
    controllerIndex = activeViewIndex
  ) => {
    const ctrl = controllers[controllerIndex];
    const ref = viewerRefs[controllerIndex];

    if (!info) {
      ctrl.setHighlightedResidue(null);
      ref.current?.clearHighlight?.();
    } else {
      if (isMeasurementMode || (highlightedResidue?.chain === info.chain && highlightedResidue?.resNo === info.resNo)) {
        // Ignore if measurement mode or same residue
      } else {
        console.log("App: Atom Clicked", info);
        ctrl.setHighlightedResidue({ chain: info.chain, resNo: info.resNo, resName: info.resName });
        ref.current?.highlightResidue(info.chain, info.resNo);

        // Auto-switch active view if clicking inactive
        if (controllerIndex !== activeViewIndex) {
          setActiveViewIndex(controllerIndex);
        }
      }
    }
  };

  const handleHighlightResidue = (chain: string, resNo: number) => {
    setHighlightedResidue({ chain, resNo, resName: '' });
    viewerRef.current?.highlightResidue(chain, resNo);
  };

  const handleLoad = useCallback((info: StructureInfo, ctrl: StructureController) => {
    ctrl.setChains(info.chains);
    ctrl.setLigands(info.ligands);

    const hasPolymer = info.chains.some(c => c.type === 'protein' || c.type === 'nucleic');
    const totalResidues = info.chains.reduce((acc, c) => acc + c.sequence.length, 0);

    // Smart Representation Switching for small molecules
    if (!hasPolymer || totalResidues < 5) {
      console.log("App: Detected small molecule or non-polymer. Switching to Ball+Stick.");
      ctrl.setRepresentation('ball+stick');
      ctrl.setShowLigands(true);
      if (info.chains.length > 0) ctrl.setShowIons(true);
    }

    // Add to History (using global helper)
    if (ctrl.dataSource === 'pdb' && ctrl.pdbId) {
      addToHistory(ctrl.pdbId, 'pdb');
    } else if (ctrl.dataSource === 'pubchem' && ctrl.pdbId) {
      addToHistory(ctrl.pdbId, 'pubchem');
    }
  }, [addToHistory]);

  const handlePdbIdChange = (id: string) => {
    activeController.setPdbId(id);
    activeController.setFile(null);
    activeController.setProteinTitle(null);
    activeController.setChains([]);
    activeController.setCustomColors([]);
    activeController.setHighlightedResidue(null);
    activeController.setMeasurements([]);
  };


  const [isRecording, setIsRecording] = useState(false);

  const handleRecordMovie = async (duration: number = 4000) => {
    if (viewerRef.current && !isRecording) {
      setIsRecording(true);
      info('Recording movie...');
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
        success('Movie recorded ✓');

      } catch (e: any) {
        console.error("Recording failed", e);
        error(`Recording failed: ${e.message || 'Unknown error'}`);
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
      success('Snapshot captured ✓');
    } else {
      error('Failed to capture snapshot');
    }
  };

  const handleDownloadSnapshot = (id: string) => {
    const snapshot = snapshots.find(s => s.id === id);
    if (snapshot) {
      const link = document.createElement('a');
      link.href = snapshot.url;
      link.download = `snapshot-${pdbId || 'structure'}-${snapshot.id.slice(0, 4)}.png`;
      link.click();
      success('Snapshot downloaded ✓');
    }
  };

  const handleDownloadPDB = () => {
    if (file) {
      // Download local/library file
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } else if (pdbId) {
      // Download from RCSB
      const url = `https://files.rcsb.org/download/${pdbId}.pdb`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdbId}.pdb`;
      a.click();
    }
  };

  const handleDownloadSequence = () => {
    if (chains.length === 0) return;

    let fastaContent = '';
    chains.forEach(chain => {
      // Header: >PDBID|Chain|Name
      const header = `>${pdbId || 'Structure'}|${chain.name}\n`;
      // Split sequence into 80-char lines
      const sequence = chain.sequence.match(/.{1,80}/g)?.join('\n') || '';
      fastaContent += header + sequence + '\n';
    });

    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdbId || 'structure'}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
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
        handleResetView();
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
      const validExtensions = ['.pdb', '.cif', '.ent', '.mol', '.sdf', '.mol2', '.xyz'];
      const fileExt = droppedFile.name.substring(droppedFile.name.lastIndexOf('.')).toLowerCase();

      if (validExtensions.includes(fileExt)) {
        handleUpload(droppedFile); // Reuse existing upload handler
      } else {
        alert("Invalid file type. Please drop a valid structure file (.pdb, .cif, .mol, .sdf, etc.)");
      }
    }
  };

  // --- COMMAND PALETTE LOGIC ---
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // --- HUD STATE ---
  const [hoveredResidue, setHoveredResidue] = useState<ResidueInfo | null>(null);



  const [measurementTextColorMode, setMeasurementTextColorMode] = useState<MeasurementTextColor>('auto');



  const handleUpdateMeasurement = (id: string, updates: Partial<Measurement>) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  // --- GLOBAL SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Exit modes on Escape
      if (e.key === 'Escape') {
        setIsPublicationMode(false);
        setIsMeasurementMode(false);
        setIsCommandPaletteOpen(false);
        setIsLibraryOpen(false);
        setShowContactMap(false);
        return;
      }

      // Only process below shortcuts if no modals are open
      if (isLibraryOpen || isCommandPaletteOpen || showContactMap) return;

      switch (e.key.toLowerCase()) {
        // General
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => console.error(err));
          } else {
            document.exitFullscreen();
          }
          break;
        case 't':
          setIsLightMode(prev => !prev);
          break;

        // View Controls
        case 'r':
          viewerRef.current?.resetCamera();
          break;
        case ' ':
          e.preventDefault(); // Prevent scroll
          setIsSpinning(prev => !prev);
          break;
        case 's':
          // Screenshot
          viewerRef.current?.captureImage();
          break;

        // Tools
        case 'm':
          setIsMeasurementMode(prev => !prev);
          break;
        case 'c':
          setShowContactMap(prev => !prev);
          break;

        // Representations (1-8)
        case '1': setRepresentation('cartoon'); break;
        case '2': setRepresentation('spacefill'); break;
        case '3': setRepresentation('surface'); break;
        case '4': setRepresentation('licorice'); break;
        case '5': setRepresentation('backbone'); break;
        case '6': setRepresentation('ribbon'); break;
        case '7': setRepresentation('ball+stick'); break;
        case '8': setRepresentation('line'); break;

        // Coloring
        case 'q': setColoring('chainid'); break;
        case 'w': setColoring('element' as ColoringType); break;
        case 'e': setColoring('hydrophobicity'); break;
        case 'a': setColoring('bfactor'); break; // pLDDT
        case 'd': setColoring('secondary'); break;
        case 'x': setColoring('residueindex'); break; // Rainbow
        case 'v': setColoring('residue'); break; // Residue Name
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLibraryOpen, isCommandPaletteOpen, showContactMap]);

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
      id: 'view-favorites',
      label: 'View Favorites',
      icon: Star,
      category: 'File',
      perform: () => setIsFavoritesOpen(true)
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
      id: 'undo',
      label: 'Undo',
      icon: Undo2,
      shortcut: 'Cmd/Ctrl+Z',
      category: 'Edit',
      perform: () => { if (canUndo) undo(); }
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: Redo2,
      shortcut: 'Shift+Cmd/Ctrl+Z',
      category: 'Edit',
      perform: () => { if (canRedo) redo(); }
    },
    {
      id: 'toggle-pub-mode',
      label: isPublicationMode ? 'Exit Publication Mode' : 'Enter Publication Mode',
      icon: Camera,
      category: 'View',
      perform: () => togglePublicationMode()
    },
    {
      id: 'take-snapshot',
      label: 'Take Snapshot',
      icon: Camera,
      shortcut: 'S',
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
      shortcut: '1',
      category: 'Appearance',
      perform: () => setRepresentation('cartoon')
    },
    {
      id: 'style-surface',
      label: 'Style: Molecular Surface',
      icon: Grid3X3,
      shortcut: '3',
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
      shortcut: '2',
      category: 'Appearance',
      perform: () => setRepresentation('spacefill')
    },
    {
      id: 'color-chain',
      label: 'Color by Chain',
      icon: Palette,
      shortcut: 'Q',
      category: 'Appearance',
      perform: () => setColoring('chainid')
    },
    {
      id: 'color-hydro',
      label: 'Color by Hydrophobicity',
      icon: Palette,
      shortcut: 'E',
      category: 'Appearance',
      perform: () => setColoring('hydrophobicity')
    },
    {
      id: 'color-bfactor',
      label: 'Color by B-Factor (Mobility)',
      icon: Palette,
      shortcut: 'A',
      category: 'Appearance',
      perform: () => setColoring('bfactor')
    },
    {
      id: 'toggle-spin',
      label: isSpinning ? 'Stop Spinning' : 'Start Spinning',
      icon: RefreshCw,
      shortcut: 'Space',
      category: 'View',
      perform: () => setIsSpinning(prev => !prev)
    },
    {
      id: 'toggle-theme',
      label: isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      icon: Settings,
      shortcut: 'T',
      category: 'View',
      perform: () => setIsLightMode(prev => !prev)
    },

    // --- Additional Representations ---
    {
      id: 'style-licorice',
      label: 'Style: Licorice',
      icon: Activity,
      shortcut: '4',
      category: 'Appearance',
      perform: () => setRepresentation('licorice')
    },
    {
      id: 'style-backbone',
      label: 'Style: Backbone',
      icon: Activity,
      shortcut: '5',
      category: 'Appearance',
      perform: () => setRepresentation('backbone')
    },
    {
      id: 'style-ribbon',
      label: 'Style: Ribbon',
      icon: Activity,
      shortcut: '6',
      category: 'Appearance',
      perform: () => setRepresentation('ribbon')
    },
    {
      id: 'style-ball-stick',
      label: 'Style: Ball + Stick',
      icon: Activity,
      shortcut: '7',
      category: 'Appearance',
      perform: () => setRepresentation('ball+stick')
    },
    {
      id: 'style-line',
      label: 'Style: Line',
      icon: Activity,
      shortcut: '8',
      category: 'Appearance',
      perform: () => setRepresentation('line')
    },

    // --- Additional Coloring ---
    {
      id: 'color-element',
      label: 'Color by Element (CPK)',
      icon: Palette,
      shortcut: 'W',
      category: 'Appearance',
      perform: () => setColoring('element' as ColoringType)
    },
    {
      id: 'color-secondary',
      label: 'Color by Secondary Structure',
      icon: Palette,
      shortcut: 'D',
      category: 'Appearance',
      perform: () => setColoring('secondary')
    },
    {
      id: 'color-rainbow',
      label: 'Color by Rainbow (Residue Index)',
      icon: Palette,
      shortcut: 'X',
      category: 'Appearance',
      perform: () => setColoring('residueindex')
    },
    {
      id: 'color-residue',
      label: 'Color by Residue Name',
      icon: Palette,
      shortcut: 'V',
      category: 'Appearance',
      perform: () => setColoring('residue')
    },

    // --- Tools ---
    {
      id: 'toggle-measurement',
      label: isMeasurementMode ? 'Exit Measurement Mode' : 'Enter Measurement Mode',
      icon: Ruler,
      shortcut: 'M',
      category: 'Tools',
      perform: () => setIsMeasurementMode(prev => !prev)
    },
    {
      id: 'toggle-contact-map',
      label: showContactMap ? 'Hide Contact Map' : 'Show Contact Map',
      icon: Grid3X3,
      shortcut: 'C',
      category: 'Tools',
      perform: () => setShowContactMap(prev => !prev)
    },
    {
      id: 'fullscreen',
      label: 'Toggle Fullscreen',
      icon: Maximize2,
      shortcut: 'F',
      category: 'View',
      perform: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    },
  ], [isPublicationMode, isSpinning, isLightMode, isMeasurementMode, showContactMap, handleSaveSession, handleSnapshot, handleResetView]);


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
          setIsLibraryOpen(false);

          // Handle Chemical Library Selection
          if (url.startsWith('pubchem://')) {
            const cid = url.replace('pubchem://', '');
            if (!cid) return;

            setFile(null); // Clear any local file to force fetch
            setPdbId(cid);
            setDataSource('pubchem');
            setProteinTitle(`Loading Chemical (CID: ${cid})...`);
            setRepresentation('ball+stick'); // Better default for small molecules
            setPdbMetadata(null);

            // Fetch Metadata for Chemical
            fetchPubChemMetadata(cid).then(meta => {
              if (meta) {
                setPdbMetadata(meta);
                setProteinTitle(meta.title || `CID: ${cid}`);
              } else {
                setProteinTitle(`CID: ${cid}`);
              }
            });
            return;
          }

          // Handle Protein Library Selection (Standard PDB)
          // Extract ID from local path models/ID.pdb
          const idMatch = url.match(/models\/([a-zA-Z0-9]+)\.pdb/);
          const id = idMatch ? idMatch[1] : 'Unknown';

          setPdbId(id);
          setDataSource('pdb'); // Ensure we are in PDB mode
          setProteinTitle(`Loading ${id}...`);

          // Find metadata
          const libMeta = OFFLINE_LIBRARY.find(i => i.id === id);
          if (libMeta) {
            setPdbMetadata(libMeta as unknown as PDBMetadata);
          } else {
            setPdbMetadata(null);
          }

          // Fetch local file
          fetch(url)
            .then(res => {
              if (!res.ok) throw new Error("File not found");
              return res.blob();
            })
            .then(blob => {
              const file = new File([blob], `${id}.pdb`, { type: 'chemical/x-pdb' });
              setFile(file);
              // Update title from library metadata if available
              if (libMeta) {
                setProteinTitle(libMeta.title);
              } else {
                setProteinTitle(`Offline: ${id}`);
              }
            })
            .catch(err => {
              console.warn("Local library load failed.", err);
              alert(`Failed to load ${id} from library resources.`);
            });
        }}
      />

      <FavoritesPanel
        favorites={favorites}
        history={history}
        isOpen={isFavoritesOpen}
        initialTab={favoritesTab}
        showTabs={false}
        onClose={() => setIsFavoritesOpen(false)}
        onSelect={(id, dataSource) => {
          setIsFavoritesOpen(false);
          setPdbId(id);
          setDataSource(dataSource);
          setFile(null);
          if (dataSource === 'pubchem') {
            setRepresentation('ball+stick');
          }
        }}
        onRemove={removeFavorite}
        isLightMode={isLightMode}
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
      {/* HUD - Positioned at bottom to avoid viewport interference */}
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
          onClearAll={() => {
            setMeasurements([]);
            viewerRef.current?.clearMeasurements();
          }}
          textColorMode={measurementTextColorMode}
          onSetTextColor={(color) => {
            setMeasurementTextColorMode(color);
          }}
          onClose={() => {
            setIsMeasurementMode(false);
            setIsMeasurementPanelOpen(false);
          }}
          isLightMode={isLightMode}
        />
      )}

      {/* Main Content: Flex Container for Sidebars and Viewports */}
      <div className="flex flex-1 w-full h-full overflow-hidden">

        {/* Logic to determine if we are looking at a Chemical */}
        {(() => {
          const isChemical = dataSource === 'pubchem' ||
            (file && /\.(sdf|mol|cif)$/i.test(file.name));

          return (
            <Controls
              pdbId={pdbId}
              setPdbId={handlePdbIdChange}
              dataSource={dataSource}
              setDataSource={setDataSource}
              isChemical={!!isChemical}
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
              onTogglePublicationMode={togglePublicationMode}
              onClearMeasurements={() => {
                setMeasurements([]);
                viewerRef.current?.clearMeasurements();
              }}
              isLightMode={isLightMode}
              setIsLightMode={setIsLightMode}
              highlightedResidue={highlightedResidue}
              onResidueClick={handleSequenceResidueClick}
              showSurface={showSurface}
              setShowSurface={setShowSurface}
              showLigands={showLigands}
              setShowLigands={setShowLigands}
              showIons={showIons}
              setShowIons={setShowIons}
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
              onDownloadPDB={handleDownloadPDB}
              onDownloadSequence={handleDownloadSequence}
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
              onHighlightRegion={(selection, label) => {
                viewerRef.current?.highlightRegion(selection, label);
              }}
              onStartTour={handleStartTour}
              openSections={openSections}
              onToggleSection={handleToggleSection}
              isMobileSidebarOpen={isMobileSidebarOpen}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onToggleFavorite={() => toggleFavorite(pdbId, dataSource, proteinTitle || undefined)}
              isFavorite={isFavorite(pdbId, dataSource)}
              onOpenFavorites={() => {
                setFavoritesTab('favorites');
                setIsFavoritesOpen(true);
              }}
              onOpenHistory={() => {
                setFavoritesTab('history');
                setIsFavoritesOpen(true);
              }}
              history={history}

              // Undo/Redo
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}

              // Multi-View Mode
              viewMode={viewMode}
              onSetViewMode={setViewMode}
            />
          );
        })()}

        {/* Multi-View Layout */}
        <div className="relative flex-1 flex w-full h-full overflow-hidden bg-black">
          {(() => {
            // Helper: Render single viewport
            const renderViewport = (index: number, extraClasses = '') => {
              const ctrl = controllers[index];
              const ref = viewerRefs[index];
              const isActive = activeViewIndex === index;
              const showHeader = viewMode !== 'single';
              const viewportLabels = ['Viewport 1', 'Viewport 2', 'Viewport 3', 'Viewport 4'];

              return (
                <div key={index} className={`flex flex-col h-full ${extraClasses}`}>
                  {/* Viewport Header */}
                  {showHeader && (
                    <div
                      onClick={() => setActiveViewIndex(index)}
                      className={`shrink-0 h-9 flex items-center justify-between px-3 border-b transition-colors cursor-pointer select-none
                        ${isActive ? 'bg-[#1a1a1a] border-indigo-500/50' : 'bg-black border-[#222] opacity-60 hover:opacity-100'}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm transition-all ${isActive ? 'bg-indigo-500 shadow-indigo-500/50 scale-110' : 'bg-neutral-700'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-neutral-500'}`}>
                          {viewportLabels[index]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
                        <div className="relative group flex-1 min-w-0">
                          <span
                            className="text-[10px] text-neutral-400 font-mono truncate max-w-full block"
                          >
                            {ctrl.proteinTitle || ctrl.pdbId || (ctrl.file ? ctrl.file.name : "No Structure")}
                          </span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-neutral-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-neutral-700">
                            {ctrl.proteinTitle || ctrl.pdbId || (ctrl.file ? ctrl.file.name : "No Structure")}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); ctrl.handleResetView(); }}
                          className="p-1 hover:bg-white/10 rounded text-neutral-500 hover:text-white transition-colors shrink-0"
                          title="Reset Camera"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Viewer */}
                  <div className="relative flex-1 w-full h-full">
                    <ProteinViewer
                      ref={ref}
                      pdbId={ctrl.pdbId}
                      dataSource={ctrl.dataSource}
                      file={ctrl.file || undefined}
                      fileType={ctrl.fileType}
                      isLightMode={isLightMode}
                      isSpinning={ctrl.isSpinning}
                      representation={ctrl.representation}
                      showSurface={ctrl.showSurface}
                      showLigands={ctrl.showLigands}
                      showIons={ctrl.showIons}
                      coloring={ctrl.coloring}
                      palette={colorPalette}
                      backgroundColor={ctrl.customBackgroundColor || (isLightMode ? 'white' : 'black')}
                      measurementTextColor={measurementTextColorMode}
                      enableAmbientOcclusion={true}

                      onStructureLoaded={(info) => handleLoad(info, ctrl)}
                      onAtomClick={(info) => handleAtomClick(info, index)}
                      isMeasurementMode={isMeasurementMode}
                      measurements={ctrl.measurements}
                      onAddMeasurement={(m) => {
                        ctrl.setMeasurements([...ctrl.measurements, m]);
                        setActiveViewIndex(index);
                      }}
                      onHover={setHoveredResidue}

                      quality={isPublicationMode ? 'high' : 'medium'}
                      resetCamera={ctrl.resetKey}
                      customColors={ctrl.customColors}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              );
            };

            // Render layout based on viewMode
            switch (viewMode) {
              case 'single':
                return renderViewport(0, 'w-full');

              case 'dual':
                return (
                  <>
                    {renderViewport(0, 'w-1/2 border-r border-[#333]')}
                    {renderViewport(1, 'w-1/2')}
                  </>
                );

              case 'triple':
                return (
                  <div className="flex flex-col w-full h-full">
                    {renderViewport(0, 'w-full h-1/2 border-b border-[#333]')}
                    <div className="flex h-1/2 w-full">
                      {renderViewport(1, 'w-1/2 border-r border-[#333]')}
                      {renderViewport(2, 'w-1/2')}
                    </div>
                  </div>
                );

              case 'quad':
                return (
                  <div className="flex flex-col w-full h-full">
                    <div className="flex h-1/2 w-full border-b border-[#333]">
                      {renderViewport(0, 'w-1/2 border-r border-[#333]')}
                      {renderViewport(1, 'w-1/2')}
                    </div>
                    <div className="flex h-1/2 w-full">
                      {renderViewport(2, 'w-1/2 border-r border-[#333]')}
                      {renderViewport(3, 'w-1/2')}
                    </div>
                  </div>
                );

              default:
                // Fallback to single view
                return renderViewport(0, 'w-full');
            }
          })()}
        </div>   {/* Right Sidebar: Sequence Track */}
        <SequenceTrack
          id="sequence-track"
          chains={chains}
          highlightedResidue={highlightedResidue}
          onHoverResidue={() => { }}
          onClickResidue={(chain, resNo) => viewerRef.current?.focusResidue(chain, resNo)}
          onClickAtom={(serial) => viewerRef.current?.highlightAtom(serial)}
          isLightMode={isLightMode}
          coloring={coloring}
          colorPalette={colorPalette}
        />
      </div>
      {/* End Main Content Flex Container */}


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
          dataSource,
          orientation: viewerRef.current?.getCameraOrientation()
        })}
        isLightMode={isLightMode}
      />



      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <HelpGuide isVisible={!isMobileSidebarOpen} />

      {/* Background Gradient */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isLightMode ? 'opacity-0' : 'opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,80,0.2),rgba(0,0,0,0))]'}`} />
    </main >
  );
}

export default App;
