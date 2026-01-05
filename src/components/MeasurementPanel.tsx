
import React, { useState } from 'react';
import { Ruler, Trash2, Download, Edit2, Check, X } from 'lucide-react';
import type { Measurement } from '../types';

interface MeasurementPanelProps {
    measurements: Measurement[];
    onUpdate: (id: string, updates: Partial<Measurement>) => void;
    onDelete: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
    isLightMode: boolean;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ measurements, onUpdate, onDelete, isOpen, onClose }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    if (!isOpen) return null;

    const startEditing = (m: Measurement) => {
        setEditingId(m.id);
        setEditName(m.name);
    };

    const saveEditing = (id: string) => {
        if (editName.trim()) {
            onUpdate(id, { name: editName.trim() });
        }
        setEditingId(null);
    };

    const handleExport = () => {
        const headers = ["ID", "Name", "Distance (A)", "Atom 1 Chain", "Atom 1 Res", "Atom 1 Name", "Atom 2 Chain", "Atom 2 Res", "Atom 2 Name"];
        const rows = measurements.map(m => [
            m.id,
            m.name,
            m.distance.toFixed(2),
            m.atom1.chain,
            m.atom1.resNo,
            m.atom1.resName,
            m.atom2.chain,
            m.atom2.resNo,
            m.atom2.resName
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "measurements.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="absolute top-20 right-4 md:right-32 z-20 w-80 bg-black/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
                <div className="flex items-center gap-2 text-white">
                    <Ruler className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-sm">Measurements</span>
                    <span className="bg-neutral-800 text-xs px-2 py-0.5 rounded-full text-neutral-400">
                        {measurements.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={measurements.length === 0}
                        className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Export CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                {measurements.length === 0 ? (
                    <div className="text-center py-8 opacity-40 text-sm italic">
                        No measurements yet.<br />
                        Click two atoms to measure distance.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {measurements.map(m => (
                            <div key={m.id} className="group bg-neutral-900/50 hover:bg-neutral-800 rounded-lg p-3 border border-neutral-800 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1 min-w-0 mr-2">
                                        {editingId === m.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    autoFocus
                                                    className="w-full bg-black/50 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEditing(m.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                />
                                                <button onClick={() => saveEditing(m.id)} className="text-green-400 p-0.5"><Check className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group/title">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shrink-0 cursor-pointer border border-white/10 hover:border-white/50 transition-colors"
                                                    style={{ backgroundColor: m.color }}
                                                    onClick={() => {
                                                        // Cycle colors simply for now
                                                        const colors = ['#22c55e', '#ef4444', '#3b82f6', '#eab308', '#ec4899'];
                                                        const currentIdx = colors.indexOf(m.color);
                                                        const nextColor = colors[(currentIdx + 1) % colors.length];
                                                        onUpdate(m.id, { color: nextColor });
                                                    }}
                                                    title="Click to cycle color"
                                                />
                                                <span className="text-sm font-medium truncate text-neutral-200" title={m.name}>
                                                    {m.name}
                                                </span>
                                                <button
                                                    onClick={() => startEditing(m)}
                                                    className="opacity-0 group-hover/title:opacity-100 text-neutral-500 hover:text-white transition-opacity"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-cyan-400 font-bold text-sm">
                                            {m.distance.toFixed(2)}Å
                                        </span>
                                        <button
                                            onClick={() => onDelete(m.id)}
                                            className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-wide px-1">
                                    <span>{m.atom1.resName} {m.atom1.resNo} ({m.atom1.chain})</span>
                                    <span className="opacity-30 mx-1">↔</span>
                                    <span>{m.atom2.resName} {m.atom2.resNo} ({m.atom2.chain})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
