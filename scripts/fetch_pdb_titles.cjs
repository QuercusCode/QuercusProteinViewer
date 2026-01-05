const fs = require('fs');
const https = require('https');
const path = require('path');

const libraryPath = path.join(__dirname, '../src/data/library.ts');

function fetchPDBTitle(id) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'data.rcsb.org',
            path: `/rest/v1/core/entry/${id}`,
            method: 'GET',
            headers: {
                'User-Agent': 'ProteinViewer/1.0'
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                resolve(null);
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // struct.title is the standard field
                    const title = json.struct && json.struct.title;
                    resolve(title || null);
                } catch (e) {
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            resolve(null);
        });
        req.end();
    });
}

function escapeTitle(title) {
    return title.replace(/'/g, "\\'");
}

async function main() {
    console.log('Reading library.ts...');
    let content = fs.readFileSync(libraryPath, 'utf8');

    const idRegex = /id:\s*['"](\w{4})['"]/g;
    let match;
    const ids = [];

    while ((match = idRegex.exec(content)) !== null) {
        ids.push(match[1]);
    }

    console.log(`Found ${ids.length} entries. Fetching titles...`);

    const chunkSize = 5;
    let updatedCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const promises = chunk.map(async (id) => {
            const officialTitle = await fetchPDBTitle(id);
            if (officialTitle) {
                // Regex: id: 'ID' ... title: 'OLD_TITLE'
                const entryRegex = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?title:\\s*)(['"])(?:(?!\\2).)*\\2`, 'i');

                if (entryRegex.test(content)) {
                    const safeTitle = escapeTitle(officialTitle);
                    content = content.replace(entryRegex, (match, prefix, quote) => {
                        return `${prefix}'${safeTitle}'`;
                    });
                    process.stdout.write('.');
                    updatedCount++;
                } else {
                    // console.warn(`\nCould not match title pattern for ID: ${id}`);
                }
            } else {
                notFoundCount++;
                process.stdout.write('x');
            }
        });

        await Promise.all(promises);
        await new Promise(r => setTimeout(r, 100)); // Rate limit niceness
    }

    console.log('\n\nUpdate complete.');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Not Found/Error: ${notFoundCount}`);

    fs.writeFileSync(libraryPath, content, 'utf8');
    console.log('Wrote updates to library.ts');
}

main().catch(console.error);
