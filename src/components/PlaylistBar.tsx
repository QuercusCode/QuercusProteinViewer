import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Hexagon, X } from 'lucide-react';
import clsx from 'clsx';
import type { Playlist, PlaylistTrack } from '../data/playlists';

interface PlaylistBarProps {
    currentPlaylist: Playlist | null;
    currentTrack: PlaylistTrack | null;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onStop: () => void;
}

export const PlaylistBar: React.FC<PlaylistBarProps> = ({
    currentPlaylist,
    currentTrack,
    isPlaying,
    onTogglePlay,
    onNext,
    onPrev,
    onStop
}) => {
    if (!currentPlaylist || !currentTrack) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-gray-900/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl shadow-blue-900/20 flex items-center gap-4 sm:gap-6 relative overflow-hidden group">

                {/* Progress Bar (Fake Visual for MVP) */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                    <div className="h-full bg-blue-500/50 w-full origin-left animate-[progress_15s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                </div>

                {/* Cover/Icon */}
                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white", currentPlaylist.coverColor)}>
                    <Hexagon size={24} className={isPlaying ? "animate-pulse" : ""} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm sm:text-base truncate">{currentTrack.title}</h3>
                    <p className="text-gray-400 text-xs truncate">
                        <span className="text-blue-400 font-medium">{currentPlaylist.title}</span> • {currentTrack.source.toUpperCase()} {currentTrack.id}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <button
                        onClick={onPrev}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <SkipBack size={20} />
                    </button>

                    <button
                        onClick={onTogglePlay}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button
                        onClick={onNext}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <SkipForward size={20} />
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>

                    <button
                        onClick={onStop}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
                        title="Exit Playlist"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
