
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Hack to read the TS file without compiling it fully (Quick & Dirty for script)
// Actually, better to just copy the IDs here or use a regex to read the file.
// Let's read the file and extract IDs using regex to avoid TS complexity in a simple script.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIBRARY_PATH = path.join(__dirname, '../src/data/library.ts');
const OUTPUT_DIR = path.join(__dirname, '../public/models');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Regex to find "id: 'XXXX'"
const content = fs.readFileSync(LIBRARY_PATH, 'utf-8');
const idMatch = content.matchAll(/id:\s*'([a-zA-Z0-9]{4})'/g);
const ids = Array.from(idMatch).map(m => m[1]);

console.log(`FOUND ${ids.length} PROTEINS IN LIBRARY.`);

const downloadFile = (id) => {
    const url = `https://files.rcsb.org/download/${id}.pdb`;
    const dest = path.join(OUTPUT_DIR, `${id}.pdb`);

    if (fs.existsSync(dest)) {
        console.log(`[SKIP] ${id} already exists.`);
        return;
    }

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`[OK] Downloaded ${id}`);
            });
        } else {
            console.error(`[FAIL] ${id} - HTTP ${response.statusCode}`);
            fs.unlink(dest, () => { }); // Delete partial file
        }
    }).on('error', (err) => {
        fs.unlink(dest, () => { });
        console.error(`[ERR] ${id} - ${err.message}`);
    });
};

// Rate limit slightly to be nice to RCSB
let index = 0;
const interval = setInterval(() => {
    if (index >= ids.length) {
        clearInterval(interval);
        console.log("DONE.");
        return;
    }
    const id = ids[index];
    downloadFile(id);
    index++;
}, 200); // 5 requests per second
