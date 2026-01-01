
export interface UniProtFeature {
    type: string;
    description: string;
    begin: string;
    end: string;
}

export interface UniProtData {
    accession: string;
    id: string;
    proteinName: string;
    geneName: string;
    organism: string;
    function: string;
    features: UniProtFeature[];
}

export const fetchUniProtData = async (pdbId: string): Promise<UniProtData | null> => {
    try {
        // 1. Search UniProt for the PDB ID
        const searchUrl = `https://rest.uniprot.org/uniprotkb/search?query=database:(type:pdb ${pdbId})&fields=accession,id,protein_name,gene_names,organism_name,cc_function,ft_act_site,ft_binding,ft_site,ft_mutagen,ft_domain&size=1`;

        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('UniProt API failed');

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        const result = data.results[0];

        // 2. Parse Data
        const features: UniProtFeature[] = [];

        if (result.features) {
            result.features.forEach((ft: any) => {
                features.push({
                    type: ft.type,
                    description: ft.description,
                    begin: ft.location?.start?.value?.toString() || '',
                    end: ft.location?.end?.value?.toString() || ''
                });
            });
        }

        return {
            accession: result.primaryAccession,
            id: result.uniProtkbId,
            proteinName: result.proteinDescription?.recommendedName?.fullName?.value || 'Unknown Protein',
            geneName: result.genes?.[0]?.geneName?.value || 'Unknown Gene',
            organism: result.organism?.scientificName || 'Unknown Organism',
            function: result.comments?.find((c: any) => c.commentType === 'FUNCTION')?.texts?.[0]?.value || 'No function described.',
            features
        };

    } catch (error) {
        console.error("UniProt Fetch Error:", error);
        return null;
    }
};
