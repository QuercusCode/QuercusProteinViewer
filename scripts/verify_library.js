
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
        if (stats.size < 500) { // Increased threshold
            empty.push(`${id} (Tail: ${stats.size}b)`);
        } else {
            // Content Check
            const buffer = Buffer.alloc(100);
            const fd = fs.openSync(filePath, 'r');
            fs.readSync(fd, buffer, 0, 100, 0);
            fs.closeSync(fd);

            const header = buffer.toString();
            if (header.includes('<!DOCTYPE') || header.includes('<html') || header.includes('404 Not Found')) {
                empty.push(`${id} (Invalid Content: HTML/404)`);
            } else {
                // Deep Check: Does it have atoms?
                const fullContent = fs.readFileSync(filePath, 'utf-8');
                if (!fullContent.includes('ATOM') && !fullContent.includes('HETATM')) {
                    empty.push(`${id} (No ATOM records)`);
                }
            }
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
