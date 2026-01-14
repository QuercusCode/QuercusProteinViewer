import type { LibraryEntry } from '../data/library';

const SEARCH_API_URL = 'https://search.rcsb.org/rcsbsearch/v2/query';
const DATA_API_URL = 'https://data.rcsb.org/graphql';

interface RcsbSearchResult {
    identifier: string;
    score: number;
}

interface RcsbSearchResponse {
    result_set: RcsbSearchResult[];
    total_count: number;
}

/**
 * Searches the Protein Data Bank using the RCSB Search API (Full Text)
 */
export async function searchPdb(query: string): Promise<string[]> {
    if (!query || query.length < 3) return [];

    const searchParams = {
        query: {
            type: "group",
            logical_operator: "and",
            nodes: [
                {
                    type: "terminal",
                    service: "full_text",
                    parameters: {
                        value: query
                    }
                },
                {
                    type: "terminal",
                    service: "text",
                    parameters: {
                        attribute: "rcsb_entry_info.structure_determination_methodology",
                        operator: "exact_match",
                        value: "experimental" // Prefer experimental structures over theoretical models if possible, though 'computational' is also valid
                    }
                }
            ]
        },
        return_type: "entry",
        request_options: {
            pager: {
                start: 0,
                rows: 10 // Limit results for performance
            },
            scoring_strategy: "combined",
            sort: [
                {
                    sort_by: "score",
                    direction: "desc"
                }
            ]
        }
    };

    try {
        const response = await fetch(SEARCH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchParams)
        });

        if (!response.ok) {
            console.warn("RCSB Search failed:", response.statusText);
            return [];
        }

        const data: RcsbSearchResponse = await response.json();
        return data.result_set?.map(r => r.identifier) || [];

    } catch (error) {
        console.error("Error searching PDB:", error);
        return [];
    }
}

/**
 * Fetches display metadata for a list of PDB IDs using GraphQL
 */
export async function fetchPdbMetadata(ids: string[]): Promise<LibraryEntry[]> {
    if (ids.length === 0) return [];

    const query = `
    query structure($ids: [String!]!) {
      entries(entry_ids: $ids) {
        rcsb_id
        struct {
          title
          pdbx_descriptor
        }
        rcsb_primary_citation {
            title
        }
        struct_keywords {
          pdbx_keywords
        }
        exptl {
          method
        }
        rcsb_entry_info {
           resolution_combined
           deposition_date
        }
      }
    }
    `;

    try {
        const response = await fetch(DATA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { ids } })
        });

        const json = await response.json();
        const entries = json.data?.entries || [];

        return entries.map((entry: any) => ({
            id: entry.rcsb_id,
            title: entry.struct?.title || entry.rcsb_primary_citation?.title || "Untitled Structure",
            category: mapKeywordToCategory(entry.struct_keywords?.pdbx_keywords),
            description: entry.struct?.pdbx_descriptor || entry.struct_keywords?.pdbx_keywords || "No description available.",
            details: `Resolution: ${entry.rcsb_entry_info?.resolution_combined?.[0] || 'N/A'} Å. Method: ${entry.exptl?.[0]?.method || 'Unknown'}.`,
            method: entry.exptl?.[0]?.method,
            resolution: entry.rcsb_entry_info?.resolution_combined?.[0] ? `${entry.rcsb_entry_info?.resolution_combined?.[0]} Å` : undefined,
            depositionDate: entry.rcsb_entry_info?.deposition_date,
            organism: "External Database" // Simplified for now
        }));

    } catch (error) {
        console.error("Error fetching PDB metadata:", error);
        return [];
    }
}

/**
 * Heuristic to map PDB keywords to our app's simplified categories
 */
function mapKeywordToCategory(keyword: string): LibraryEntry['category'] {
    if (!keyword) return 'Structural';
    const k = keyword.toLowerCase();

    if (k.includes('enzyme') || k.includes('hydrolase') || k.includes('kinase') || k.includes('protease')) return 'Enzymes';
    if (k.includes('dna') || k.includes('rna') || k.includes('ribosome')) return 'DNA/RNA';
    if (k.includes('transport') || k.includes('channel') || k.includes('pump')) return 'Transport';
    if (k.includes('immune') || k.includes('antibody') || k.includes('antigen')) return 'Immune';
    if (k.includes('virus') || k.includes('viral') || k.includes('capsid')) return 'Viral';
    if (k.includes('signal') || k.includes('receptor')) return 'Signaling';
    if (k.includes('toxin') || k.includes('venom')) return 'Toxins';

    return 'Structural'; // Default fallback
}
