
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIBRARY_PATH = path.join(__dirname, '../src/data/library.ts');
const MODELS_DIR = path.join(__dirname, '../public/models');

// Extract IDs from library.ts
const content = fs.readFileSync(LIBRARY_PATH, 'utf-8');
const idMatch = content.matchAll(/id:\s*'([a-zA-Z0-9]{4})'/g);
const expectedIds = Array.from(idMatch).map(m => m[1]);

console.log(`Checking ${expectedIds.length} expected proteins...`);

const missing = [];
const empty = [];

expectedIds.forEach(id => {
    const filePath = path.join(MODELS_DIR, `${id}.pdb`);

    if (!fs.existsSync(filePath)) {
        missing.push(id);
    } else {
        const stats = fs.statSync(filePath);
        if (stats.size < 100) { // arbitrary small size for failed/empty file
            empty.push(id);
        }
    }
});

console.log('--- REPORT ---');
if (missing.length > 0) {
    console.log(`MISSING (${missing.length}):`, missing.join(', '));
} else {
    console.log('No missing files.');
}

if (empty.length > 0) {
    console.log(`EMPTY/CORRUPT (${empty.length}):`, empty.join(', '));
} else {
    console.log('No empty files.');
}

if (missing.length === 0 && empty.length === 0) {
    console.log('✅ ALL OK.');
}
