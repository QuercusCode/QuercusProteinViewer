import { useState, useEffect, useRef, useCallback } from 'react';
import { PLAYLISTS, Playlist, PlaylistTrack } from '../data/playlists';

interface UsePlaylistProps {
    onLoadStructure: (id: string, source: 'pdb' | 'pubchem') => void;
}

export const usePlaylist = ({ onLoadStructure }: UsePlaylistProps) => {
    const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0 to 100

    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const durationRef = useRef<number>(10000); // Default 10s per track if TTS fails/shorter

    // --- TTS HELPERS ---
    const speak = useCallback((text: string, onEnd: () => void) => {
        if (!('speechSynthesis' in window)) {
            // Fallback if no TTS
            setTimeout(onEnd, 5000);
            return;
        }

        // Cancel previous
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;

        utterance.onend = () => {
            onEnd();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error", e);
            onEnd(); // Proceed anyway
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // --- PLAYBACK CONTROL ---

    const playTrack = useCallback((index: number) => {
        if (!currentPlaylist) return;

        // Clamp index
        if (index < 0 || index >= currentPlaylist.tracks.length) {
            // End of playlist
            setIsPlaying(false);
            setCurrentPlaylist(null);
            stopSpeaking();
            return;
        }

        const track = currentPlaylist.tracks[index];
        setCurrentIndex(index);

        // LOAD STRUCTURE
        console.log(`Playlist: Loading ${track.title} (${track.id})`);
        onLoadStructure(track.id, track.source);

        // START TTS
        if (isPlaying) {
            speak(track.description, () => {
                // On speech end -> Go to next track after short delay
                setTimeout(() => {
                    playTrack(index + 1);
                }, 2000);
            });
        }
    }, [currentPlaylist, isPlaying, onLoadStructure, speak]);


    // Start a playlist
    const startPlaylist = (playlistId: string) => {
        const pl = PLAYLISTS.find(p => p.id === playlistId);
        if (pl) {
            setCurrentPlaylist(pl);
            setCurrentIndex(0);
            setIsPlaying(true);
        }
    };

    // Toggle Play/Pause
    const togglePlay = () => {
        const newIsPlaying = !isPlaying;
        setIsPlaying(newIsPlaying);

        if (newIsPlaying) {
            // Resume functionality is tricky with TTS. 
            // For MVP: Restart current track's speech or just current track logic
            if (currentPlaylist) {
                // Re-trigger current track logic
                playTrack(currentIndex);
            }
        } else {
            stopSpeaking();
            // Clear any transition timers
            // Note: complex to pause perfectly mid-speech and resume. 
            // Simple approach: Stop speech. Resume will restart speech of current track.
        }
    };

    const nextTrack = () => {
        playTrack(currentIndex + 1);
    };

    const prevTrack = () => {
        playTrack(currentIndex - 1);
    };

    const stopPlaylist = () => {
        setIsPlaying(false);
        setCurrentPlaylist(null);
        stopSpeaking();
    };


    // React to isPlaying changes to trigger initial track if just started
    useEffect(() => {
        if (isPlaying && currentPlaylist && currentIndex === 0 && !speechRef.current) {
            // Initial start trigger
            playTrack(0);
        }
    }, [isPlaying, currentPlaylist]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopSpeaking();
        };
    }, []);

    return {
        currentPlaylist,
        currentTrack: currentPlaylist ? currentPlaylist.tracks[currentIndex] : null,
        isPlaying,
        startPlaylist,
        stopPlaylist,
        togglePlay,
        nextTrack,
        prevTrack,
        progress // Optional: implement progress bar based on speech duration estimate
    };
};
