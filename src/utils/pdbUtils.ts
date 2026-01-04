import type { PDBMetadata } from '../types';

export const fetchPDBMetadata = async (pdbId: string): Promise<PDBMetadata | null> => {
    if (!pdbId) return null;

    try {
        const response = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId.toLowerCase()}`);
        if (!response.ok) {
            console.warn(`Failed to fetch metadata for ${pdbId}`);
            return null;
        }

        const data = await response.json();

        // Extract fields
        const method = data.exptl?.[0]?.method || 'Unknown';

        let resolution = 'N/A';
        if (data.rcsb_entry_info?.resolution_combined && data.rcsb_entry_info.resolution_combined.length > 0) {
            resolution = `${data.rcsb_entry_info.resolution_combined[0].toFixed(2)} Å`;
        } else if (data.refine?.[0]?.ls_d_res_high) {
            resolution = `${data.refine[0].ls_d_res_high.toFixed(2)} Å`;
        } else if (method.includes('NMR')) {
            resolution = 'N/A (NMR)';
        }

        const organism = data.rcsb_entity_source_organism?.[0]?.scientific_name || 'Unknown source';

        // Date format: "2010-02-28T00:00:00Z" -> "2010-02-28"
        let date = data.rcsb_accession_info?.deposit_date || 'Unknown date';
        if (date.includes('T')) {
            date = date.split('T')[0];
        }

        const title = data.struct?.title || '';

        return {
            method,
            resolution,
            organism,
            depositionDate: date,
            title
        };

    } catch (error) {
        console.error("Error fetching PDB metadata:", error);
        return null;
    }
};
