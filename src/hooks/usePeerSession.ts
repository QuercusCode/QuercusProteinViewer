import { useEffect, useState, useRef, useCallback } from 'react';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export interface SessionState {
    pdbId: string;
    representation: string;
    coloring: string;
    customColors: any[];
    measurements?: any[];
    customBackgroundColor?: string | null;
    orientation?: any[];
    isSpinning?: boolean;
    highlightedResidue?: any;
    hoveredResidue?: any;
    controllerId?: string | null; // ID of the peer who has control (defaults to Host if null)
    annotations?: any[]; // Array of Annotation objects
}

export interface PeerSession {
    peerId: string | null;
    isConnected: boolean;
    isHost: boolean;
    connections: DataConnection[];
    connectToPeer: (remotePeerId: string) => void;
    broadcastState: (state: Partial<SessionState>) => void;
    broadcastCamera: (orientation: any[]) => void;
    broadcastName: (name: string) => void;
    grantControl: (targetPeerId: string | null) => void; // Host only
    lastReceivedState: Partial<SessionState> | null;
    lastReceivedCamera: any[] | null;
    lastReceivedName: string | null;
    peerNames: Record<string, string>; // Map of Peer ID -> Name
    error: string | null;
}

export const usePeerSession = (initialState?: Partial<SessionState>): PeerSession => {
    const [peerId, setPeerId] = useState<string | null>(null);
    const [connections, setConnections] = useState<DataConnection[]>([]);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [lastReceivedState, setLastReceivedState] = useState<Partial<SessionState> | null>(null);
    const [lastReceivedCamera, setLastReceivedCamera] = useState<any[] | null>(null);
    const [lastReceivedName, setLastReceivedName] = useState<string | null>(null);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});

    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<DataConnection[]>([]);

    // Initialize Peer
    useEffect(() => {
        const peer = new Peer();

        peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            setPeerId(id);
            setError(null);
        });

        peer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);
            setupConnection(conn);
            setIsHost(true); // If someone connects to me, I'm effectively a host (or just a peer)
        });

        peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            setError(err.type === 'peer-unavailable' ? 'Peer not found' : 'Connection error');
        });

        peerRef.current = peer;

        return () => {
            peer.destroy();
        };
    }, []);

    const setupConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            console.log('Connected to:', conn.peer);

            // Check for duplicate connection
            const exists = connectionsRef.current.some(c => c.peer === conn.peer);
            if (!exists) {
                connectionsRef.current = [...connectionsRef.current, conn];
                setConnections([...connectionsRef.current]);
            } else {
                console.warn('Duplicate connection ignored:', conn.peer);
            }

            // If I have initial state, send it to the new peer
            if (initialState) {
                conn.send({ type: 'SYNC_STATE', payload: initialState });
            }
        });

        conn.on('data', (data: any) => {
            handleData(data, conn);
        });

        conn.on('close', () => {
            // Remove connection
            connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
            setConnections([...connectionsRef.current]);
        });
    };

    const handleData = (data: any, sender: DataConnection) => {
        if (data.type === 'SYNC_STATE') {
            setLastReceivedState(data.payload);
        } else if (data.type === 'SYNC_CAMERA') {
            setLastReceivedCamera(data.payload);
        } else if (data.type === 'SYNC_NAME') {
            setLastReceivedName(data.payload);
            // Update name map
            setPeerNames(prev => ({
                ...prev,
                [sender.peer]: data.payload
            }));
        }
    };

    const connectToPeer = useCallback((remotePeerId: string) => {
        if (!peerRef.current) return;
        const conn = peerRef.current.connect(remotePeerId);
        setupConnection(conn);
        setIsHost(false); // I am joining
    }, []);

    const broadcastState = useCallback((state: Partial<SessionState>) => {
        connectionsRef.current.forEach(conn => {
            if (conn.open) {
                conn.send({ type: 'SYNC_STATE', payload: state });
            }
        });
    }, []);

    // Throttle camera updates to avoid flooding
    const lastBroadcastTime = useRef(0);
    const broadcastCamera = useCallback((orientation: any[]) => {
        const now = Date.now();
        if (now - lastBroadcastTime.current > 50) { // Max 20fps
            connectionsRef.current.forEach(conn => {
                if (conn.open) {
                    conn.send({ type: 'SYNC_CAMERA', payload: orientation });
                }
            });
            lastBroadcastTime.current = now;
        }
    }, []);

    const broadcastName = useCallback((name: string) => {
        connectionsRef.current.forEach(conn => {
            if (conn.open) {
                conn.send({ type: 'SYNC_NAME', payload: name });
            }
        });
    }, []);

    const grantControl = useCallback((targetPeerId: string | null) => {
        // Only Host controls this
        if (!isHost) return;

        // Broadcast the new controller ID to everyone
        // If targetPeerId is null, it means Host is taking back control
        broadcastState({ controllerId: targetPeerId });
    }, [isHost, broadcastState]);

    return {
        peerId,
        isConnected: connections.length > 0,
        isHost,
        connections,
        connectToPeer,
        broadcastState,
        broadcastCamera,
        broadcastName,
        grantControl,
        lastReceivedState,
        lastReceivedCamera,
        lastReceivedName,
        peerNames,
        error
    };
};
