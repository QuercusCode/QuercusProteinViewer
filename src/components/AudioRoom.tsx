import React, { useEffect, useRef } from 'react';

interface AudioRoomProps {
    remoteStreams: Map<string, MediaStream>;
}

export const AudioRoom: React.FC<AudioRoomProps> = ({ remoteStreams }) => {
    return (
        <div style={{ display: 'none' }}>
            {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                <AudioTrack key={peerId} stream={stream} />
            ))}
        </div>
    );
};

const AudioTrack: React.FC<{ stream: MediaStream }> = ({ stream }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);

    return <audio ref={audioRef} autoPlay playsInline controls={false} />;
};
