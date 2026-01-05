import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libraryPath = path.join(__dirname, '../src/data/library.ts');
let libraryContent = fs.readFileSync(libraryPath, 'utf8');

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
        struct { title }
        exptl { method }
        rcsb_accession_info { deposit_date }
        rcsb_entry_info { resolution_combined }
        polymer_entities {
          rcsb_entity_source_organism { scientific_name }
        }
      }
    }`;

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'data.rcsb.org',
            path: '/graphql',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.data && json.data.entries ? json.data.entries : []);
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
        const results = await fetchMetadata(chunk);
        results.forEach(entry => {
            const id = entry.rcsb_id;
            let title = entry.struct && entry.struct.title ? entry.struct.title.replace(/\s+/g, ' ').trim() : null;
            const method = entry.exptl && entry.exptl[0] ? entry.exptl[0].method : 'Unknown';
            const resolution = entry.rcsb_entry_info && entry.rcsb_entry_info.resolution_combined && entry.rcsb_entry_info.resolution_combined.length > 0
                ? entry.rcsb_entry_info.resolution_combined[0] + ' Å'
                : 'N/A';
            let date = entry.rcsb_accession_info && entry.rcsb_accession_info.deposit_date ? entry.rcsb_accession_info.deposit_date.split('T')[0] : 'Unknown';
            let organism = 'Unknown source';
            if (entry.polymer_entities && entry.polymer_entities.length > 0) {
                for (const entity of entry.polymer_entities) {
                    if (entity.rcsb_entity_source_organism && entity.rcsb_entity_source_organism.length > 0) {
                        organism = entity.rcsb_entity_source_organism[0].scientific_name || 'Unknown source';
                        break;
                    }
                }
            }
            metadataMap[id] = { title, method, resolution, depositionDate: date, organism };
        });
    }

    let newContent = libraryContent;

    // Aggressive cleaning of existing metadata to prevent duplicates
    // Matches: method: '...', (with optional whitespace/newlines)
    newContent = newContent.replace(/,\s*method:\s*'.*?'/g, '');
    newContent = newContent.replace(/,\s*resolution:\s*'.*?'/g, '');
    newContent = newContent.replace(/,\s*organism:\s*'.*?'/g, '');
    newContent = newContent.replace(/,\s*depositionDate:\s*'.*?'/g, '');

    // Also clean if they don't have leading comma (e.g. if I broke syntax before)
    newContent = newContent.replace(/\s+method:\s*'.*?',?/g, '');
    newContent = newContent.replace(/\s+resolution:\s*'.*?',?/g, '');
    newContent = newContent.replace(/\s+organism:\s*'.*?',?/g, '');
    newContent = newContent.replace(/\s+depositionDate:\s*'.*?',?/g, '');

    // Now inject fresh
    for (const id of ids) {
        const meta = metadataMap[id];
        if (!meta) continue;

        let safeOrganism = (meta.organism || 'Unknown source').replace(/'/g, "\\'");
        let safeTitle = meta.title ? meta.title.replace(/'/g, "\\'") : null;

        // 1. Update Title
        if (safeTitle) {
            const titleRegex = new RegExp(`(id:\\s*'${id}',\\s*title:\\s*')((?:[^'\\\\]|\\\\.)*)(')`, 'm');
            if (newContent.match(titleRegex)) {
                newContent = newContent.replace(titleRegex, `$1${safeTitle}$3`);
            }
        }

        // 2. Inject Metadata
        // We look for the END of the details content quote
        // details: '...CONTENT...'
        const detailsRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?details:\\s*'((?:[^'\\\\]|\\\\.)*)')`, 'm');

        const insertion = `,
        method: '${meta.method}',
        resolution: '${meta.resolution}',
        organism: '${safeOrganism}',
        depositionDate: '${meta.depositionDate}'`;

        if (newContent.match(detailsRegex)) {
            newContent = newContent.replace(detailsRegex, `$1${insertion}`);
        }
    }

    fs.writeFileSync(libraryPath, newContent, 'utf8');
    console.log("Library updated successfully!");
}

main();
