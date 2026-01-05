import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const libraryPath = path.join(__dirname, '../src/data/library.ts');
let content = fs.readFileSync(libraryPath, 'utf8');

// Find the OFFLINE_LIBRARY array content
const startMarker = 'export const OFFLINE_LIBRARY: LibraryEntry[] = [';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.error('Could not find OFFLINE_LIBRARY start');
    process.exit(1);
}

const listStart = startIndex + startMarker.length;
const listContent = content.substring(listStart);

// We want to process the list items.
// We can use a regex to match each object content.
// A block generally starts with `{` and ends with `},` or `}` (last one)
// But formatting varies. 
// Safest is to iterate and match `id: 'XXXX'`.

// Map to track seen IDs
const seenIds = new Set();
const duplicateIds = new Set();

// Regex to find IDs and their positions
const idRegex = /id:\s*'([A-Z0-9]{4})'/g;
let match;
const matches = [];

while ((match = idRegex.exec(content)) !== null) {
    const id = match[1];
    matches.push({ id, index: match.index });
    if (seenIds.has(id)) {
        duplicateIds.add(id);
    } else {
        seenIds.add(id);
    }
}

console.log(`Found ${matches.length} entries.`);
console.log(`Found ${duplicateIds.size} duplicates:`, Array.from(duplicateIds).join(', '));

if (duplicateIds.size === 0) {
    console.log('No duplicates found.');
    process.exit(0);
}

// We need to remove the BLOCKS for the second occurrences.
// This is tricky with regex/string manipulation because we need the full block boundaries.
// But we know my duplicates are in the newly appended section at the end.
// So for each unique ID, we keep the FIRST occurrence (matches[0]) and remove subsequent ones.
// But deleting from string invalidates indices.
// We should build a new list.

// Let's rewrite the logic to:
// 1. Read the file into lines.
// 2. State machine to find blocks.
// 3. If block has ID seen before, skip it.

const lines = content.split('\n');
const newLines = [];
const seenIdsInLines = new Set();
let insideBlock = false;
let currentBlock = [];
let currentBlockId = null;

// Before the list starts, just copy.
// We can assume lines before 'export const OFFLINE_LIBRARY' are header.
// But let's just parse blocks loosely.

// Assuming generated file format is fairly consistent?
// My appended blocks look like `{ id: ... },` or multiple lines.

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of a block
    // It usually has `id: '...'` on the first line or second.
    // Or starts with `{`.

    // Simplification: The file is messy.
    // But duplicate blocks are structurally consistent (start with `{ id: ...` or `{` then `id: ...`).

    // Let's rely on `id: 'XXXX'` being the key identifier.
    // If we see a line with `id: 'XXXX'`, we check if seen.
    // If seen, we must have entered a duplicate block.
    // We need to discard this block.
    // A block ends at `},` or `}`.

    if (line.includes("id: '")) {
        // Extract ID
        const m = line.match(/id:\s*'([A-Z0-9]{4})'/);
        if (m) {
            const id = m[1];
            if (seenIdsInLines.has(id)) {
                // DUPLICATE DETECTED
                console.log(`Removing duplicate block for ${id} around line ${i + 1}`);
                // We need to NOT add the current block.
                // But we might have already added `{` if it was on previous line.
                // Assuming standard formatting:
                // Case 1: `{ id: '...', ... },` (One line) -> Skip this line.
                // Case 2: `    {` (prev line) \n `        id: '...'` (this line) -> Remove prev line too?

                // This line-by-line is fragile.
                // Better: Use the fact that duplicates are at the END.
                // We know the duplicates are in the "New Additions" section.
                // Let's manually identify the cut-off or just use the Matches array.
            } else {
                seenIdsInLines.add(id);
            }
        }
    }
}

// Okay, re-reading the list of MATCHES.
// We can find the start/end of the duplicate blocks in the string.
// For every match beyond the first for an ID:
// Find the `{` preceding it.
// Find the `},` or `}` following it.
// Cut it out.

// Reverse order deletion to preserve indices.
const matchesToDel = [];
const seen = new Set();

// Re-scan to identify second occurrences
let tempMatches = [];
let tempRegex = /id:\s*'([A-Z0-9]{4})'/g;
while ((match = tempRegex.exec(content)) !== null) {
    if (seen.has(match[1])) {
        matchesToDel.push({ id: match[1], index: match.index });
    } else {
        seen.add(match[1]);
    }
}

// Sort matchesToDel by index descending
matchesToDel.sort((a, b) => b.index - a.index);

let processedContent = content;

for (const m of matchesToDel) {
    // Find matching `{` backwards from m.index
    const openBrace = processedContent.lastIndexOf('{', m.index);
    // Find matching `}` forwards from m.index
    // We need to handle nested braces? Library entries have metadata, so no nested braces usually.
    // `details` string might contain braces? Unlikely.
    const closeBrace = processedContent.indexOf('}', m.index);

    // Check for comma after closeBrace
    let endCut = closeBrace + 1;
    if (processedContent[endCut] === ',') endCut++;

    // Check for newline/whitespace cleanup?
    // We cut from openBrace to endCut.

    console.log(`Cutting duplicate ${m.id} at index ${m.index} (range ${openBrace}-${endCut})`);
    processedContent = processedContent.substring(0, openBrace) + processedContent.substring(endCut);
}

// Fix double commas or empty lines if any?
// The cut might leave `, \n \n    `
processedContent = processedContent.replace(/,\s*,/g, ',');
// processedContent = processedContent.replace(/\n\s*\n/g, '\n');

fs.writeFileSync(libraryPath, processedContent, 'utf8');
console.log('Duplicates removed.');
