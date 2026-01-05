import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current library file to get existing entries
const libraryPath = path.join(__dirname, '../src/data/library.ts');
let libraryContent = fs.readFileSync(libraryPath, 'utf8');

// Regex to extract all IDs
const idRegex = /id:\s*'([A-Z0-9]{4})'/g;
let match;
const ids = [];
while ((match = idRegex.exec(libraryContent)) !== null) {
    if (!ids.includes(match[1])) {
        ids.push(match[1]);
    }
}

console.log(`Found ${ids.length} unique PDB IDs.`);

const CHUNK_SIZE = 50;
const chunks = [];
for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
}

async function fetchMetadata(idList) {
    const query = `{
      entries(entry_ids: ${JSON.stringify(idList)}) {
        rcsb_id
        exptl {
          method
        }
        rcsb_accession_info {
          deposit_date
        }
        rcsb_entry_info {
          resolution_combined
        }
        polymer_entities {
          rcsb_entity_source_organism {
            scientific_name
          }
        }
      }
    }`;

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'data.rcsb.org',
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.entries) {
                        resolve(json.data.entries);
                    } else {
                        console.error('API Error:', JSON.stringify(json.errors, null, 2));
                        resolve([]);
                    }
                } catch (e) {
                    console.error('Parse Error', e);
                    resolve([]);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify({ query }));
        req.end();
    });
}

async function main() {
    const metadataMap = {};

    for (const chunk of chunks) {
        console.log(`Fetching chunk... (${chunk.length} IDs)`);
        try {
            const results = await fetchMetadata(chunk);
            results.forEach(entry => {
                const id = entry.rcsb_id;
                const method = entry.exptl && entry.exptl[0] ? entry.exptl[0].method : 'Unknown';

                const resolution = entry.rcsb_entry_info && entry.rcsb_entry_info.resolution_combined && entry.rcsb_entry_info.resolution_combined.length > 0
                    ? entry.rcsb_entry_info.resolution_combined[0] + ' Å'
                    : 'N/A';

                let date = 'Unknown';
                if (entry.rcsb_accession_info && entry.rcsb_accession_info.deposit_date) {
                    date = entry.rcsb_accession_info.deposit_date.split('T')[0];
                }

                let organism = 'Unknown source';
                if (entry.polymer_entities && entry.polymer_entities.length > 0) {
                    for (const entity of entry.polymer_entities) {
                        if (entity.rcsb_entity_source_organism && entity.rcsb_entity_source_organism.length > 0) {
                            organism = entity.rcsb_entity_source_organism[0].scientific_name || 'Unknown source';
                            break;
                        }
                    }
                }

                metadataMap[id] = { method, resolution, depositionDate: date, organism };
            });
        } catch (err) {
            console.error("Failed chunk", err);
        }
    }

    let newContent = libraryContent;

    // Update Interface
    const interfaceBlock = `export interface LibraryEntry {
    id: string;
    title: string;
    category: 'Enzymes' | 'Structural' | 'Transport' | 'Signaling' | 'Viral' | 'DNA/RNA' | 'Toxins' | 'Synthetic' | 'Immune' | 'Chaperone' | 'Energy';
    description: string;
    details: string; // Rich context for Dr. AI
    method?: string;
    resolution?: string;
    organism?: string;
    depositionDate?: string;
}`;

    newContent = newContent.replace(/export interface LibraryEntry \{[\s\S]*?\}/, interfaceBlock);

    for (const id of ids) {
        // Fallback for missing ID in API results
        const meta = metadataMap[id] || { method: 'Unknown', resolution: 'N/A', depositionDate: 'Unknown', organism: 'Unknown source' };

        let safeOrganism = meta.organism || 'Unknown source';
        // Double check it's a string
        if (typeof safeOrganism !== 'string') safeOrganism = 'Unknown source';

        const insertion = `,
        method: '${meta.method}',
        resolution: '${meta.resolution}',
        organism: '${safeOrganism.replace(/'/g, "\\'")}',
        depositionDate: '${meta.depositionDate}'`;

        // Updated regex ensures we match the full string even if it has escaped quotes
        const specificRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?details:\\s*'((?:[^'\\\\]|\\\\.)*)')`, 'm');

        if (newContent.match(specificRegex)) {
            newContent = newContent.replace(specificRegex, `$1${insertion}`);
        }
    }

    fs.writeFileSync(libraryPath, newContent, 'utf8');
    console.log("Library updated successfully!");
}

main();
