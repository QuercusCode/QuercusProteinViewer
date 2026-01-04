import type { PDBMetadata } from '../types';

export const fetchPDBMetadata = async (pdbId: string): Promise<PDBMetadata | null> => {
    if (!pdbId) return null;

    const lowerId = pdbId.toLowerCase();

    try {
        const [entryRes, entityRes] = await Promise.all([
            fetch(`https://data.rcsb.org/rest/v1/core/entry/${lowerId}`),
            fetch(`https://data.rcsb.org/rest/v1/core/polymer_entity/${lowerId}/1`) // Checking entity 1 is usually sufficient for source
        ]);

        if (!entryRes.ok) {
            console.warn(`Failed to fetch entry metadata for ${pdbId}`);
            return null;
        }

        const data = await entryRes.json();
        let entityData: any = {};
        if (entityRes.ok) {
            entityData = await entityRes.json();
        }

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

        // Organism from Entity 1
        let organism = 'Unknown source';
        if (entityData.rcsb_entity_source_organism && entityData.rcsb_entity_source_organism.length > 0) {
            organism = entityData.rcsb_entity_source_organism[0].scientific_name;
        } else if (data.rcsb_entity_source_organism && data.rcsb_entity_source_organism.length > 0) {
            organism = data.rcsb_entity_source_organism[0].scientific_name; // Fallback to entry if present (rare)
        }

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

/**
 * Formats a PDB Ligand ID to Chemical Nomenclature.
 * Specifically converts 1-2 letter codes (Ions) to Title Case (ZN -> Zn).
 * Keeps 3+ letter codes (Molecules) as Uppercase (HEM -> HEM).
 */
export const formatChemicalId = (id: string): string => {
    if (!id) return '';
    if (id.length <= 2) {
        return id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
    }
    return id.toUpperCase();
};
