import fs from 'fs';
import Papa from 'papaparse';

const inputPath = './matrixify-output.csv';
const outputPath = './found-duplicates.csv';

const csvData = fs.readFileSync(inputPath, 'utf8');

const { data, errors } = Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true
});

if (errors.length) {
    console.error('CSV Parse Errors:', errors);
    process.exit(1);
}

// Step 1: Filter out empty values
const cleaned = data.filter((row) => row['Metafield: description_tag [string]'].trim() !== '');

// Step 2: Count occurrences
const map = new Map();

cleaned.forEach((row) => {
    const val = row['Metafield: description_tag [string]'];
    map.set(val, (map.get(val) || 0) + 1);
});

// Step 3: Build result
const seen = new Set();
const result = cleaned
    .filter(
        (row) =>
            map.get(row['Metafield: description_tag [string]']) > 1 ||
            map.get(row['Metafield: description_tag [string]']) > 1
    )
    .map((row) => {
        const val = row['Metafield: description_tag [string]'];
        if (!seen.has(val)) {
            seen.add(val);
            return { ...row, duplicate: 'false' };
        } else {
            return { ...row, duplicate: 'true' };
        }
    });

const csvOut = Papa.unparse(result);
fs.writeFileSync(outputPath, csvOut, 'utf8');

console.log(`Done. Output written to ${outputPath}`);
