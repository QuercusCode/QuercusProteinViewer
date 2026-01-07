import { useEffect, useState } from 'react';
import type { StructureController } from './useStructureController';
import { OFFLINE_LIBRARY } from '../data/library';
import { fetchStructureMetadata } from '../utils/pdbUtils';


export const useStructureMetadata = (controller: StructureController) => {
    const { pdbId, dataSource, file, setPdbMetadata, setProteinTitle } = controller;
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (pdbId) {
            const libraryEntry = OFFLINE_LIBRARY.find(entry => entry.id.toLowerCase() === pdbId.toLowerCase());

            if (libraryEntry && libraryEntry.method) {
                // Use local metadata if available
                setPdbMetadata({
                    method: libraryEntry.method,
                    resolution: libraryEntry.resolution || 'N/A',
                    organism: libraryEntry.organism || 'Unknown source',
                    depositionDate: libraryEntry.depositionDate || 'Unknown',
                    title: libraryEntry.title
                });
                setProteinTitle(libraryEntry.title);
            } else if (!file) {
                // Fallback to generic fetch (PDB or PubChem)
                setIsLoading(true);
                fetchStructureMetadata(pdbId, dataSource).then(data => {
                    if (data) {
                        setPdbMetadata(data);
                        if (data.title) setProteinTitle(data.title);
                    } else {
                        setPdbMetadata(null);
                        setProteinTitle(null);
                    }
                    setIsLoading(false);
                });
            }
        } else {
            setPdbMetadata(null); // Clear/Reset if file uploaded or no ID
        }
    }, [pdbId, dataSource, file, setPdbMetadata, setProteinTitle]);

    return { isLoading };
};
