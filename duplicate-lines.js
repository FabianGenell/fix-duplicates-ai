import fs from 'fs';
import Papa from 'papaparse';
import Ollama from 'ollama';
import { getBodyPrompt } from './prompts.js';

const ROW_NAME = 'Body HTML';
const ROW_NAME_ALT = '';

const getPrompt = getBodyPrompt;

const inputPath = './matrixify-output.csv';
const outputPath = './found-duplicates.csv';
const variationsOutputPath = './variations-output.csv';
const BATCH_SIZE = 5; // Process 5 items in parallel

/**
 * Parse CSV file with the given settings
 * @param {string} filePath - Path to the CSV file
 * @returns {Object} Parsed data and any errors
 */
function parseCSV(filePath) {
    const csvData = fs.readFileSync(filePath, 'utf8');

    // Parse CSV with more lenient settings
    const { data, errors } = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: 'greedy', // Skip empty lines more aggressively
        dynamicTyping: false, // Keep everything as strings
        quotes: true,
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        newline: '\n',
        transform: (value) => value.trim() // Trim whitespace from values
    });

    if (errors.length) {
        console.warn('CSV Parse Warnings:', errors);
        // Continue execution even with warnings
    }

    return { data, errors };
}

/**
 * Clean the data by filtering out empty values
 * @param {Array} data - Raw CSV data
 * @returns {Array} Cleaned data
 */
function cleanData(data) {
    return data.filter((row) => {
        const fieldValue = getFieldValue(row); // Try both possible column names
        return fieldValue && fieldValue.trim() !== '';
    });
}

/**
 * Get the field value from a row, handling both primary and alternative field names
 * @param {Object} row - The row to extract the field value from
 * @returns {string|null} The field value or null if not found
 */
function getFieldValue(row) {
    // First try the primary field name
    if (row[ROW_NAME] && row[ROW_NAME].trim() !== '') {
        return row[ROW_NAME];
    }

    // Then try the alternative field name if it exists
    if (row[ROW_NAME_ALT] && row[ROW_NAME_ALT].trim() !== '') {
        return row[ROW_NAME_ALT];
    }

    // Return null if neither field exists or has a value
    return null;
}

/**
 * Count occurrences of each value in the specified field
 * @param {Array} data - Cleaned data
 * @returns {Map} Map of values to their occurrence counts
 */
function countOccurrences(data) {
    const map = new Map();

    data.forEach((row) => {
        const val = getFieldValue(row);
        if (val) {
            map.set(val.trim(), (map.get(val.trim()) || 0) + 1);
        }
    });

    return map;
}

/**
 * Find duplicates and mark them in the result
 * @param {Array} data - Cleaned data
 * @param {Map} occurrenceMap - Map of values to their occurrence counts
 * @returns {Object} Result with duplicates marked and array of duplicates
 */
function findDuplicates(data, occurrenceMap) {
    const seen = new Set();
    const duplicates = [];

    const result = data
        .filter((row) => {
            const val = getFieldValue(row);
            return val && occurrenceMap.get(val.trim()) > 1;
        })
        .map((row) => {
            const val = getFieldValue(row);
            if (!seen.has(val.trim())) {
                seen.add(val.trim());
                return { ...row, duplicate: 'false' };
            } else {
                // Add to duplicates array
                duplicates.push(row);
                return { ...row, duplicate: 'true' };
            }
        });

    return { result, duplicates };
}

/**
 * Generate a variation using Ollama
 * @param {string} text - Text to generate a variation for
 * @param {string} handle - Product handle with additional details
 * @returns {Promise<string>} Generated variation
 */
async function generateVariation(text, handle) {
    const PROMPT = getPrompt(text, handle);

    const response = await Ollama.chat({
        model: 'gemma3:4b',
        messages: [{ role: 'user', content: PROMPT }]
    });

    return response.message.content.trim();
}

/**
 * Process a batch of duplicates in parallel
 * @param {Array} batch - Batch of duplicate entries to process
 * @returns {Promise<Array>} Array of processed entries with variations
 */
async function processBatch(batch) {
    const promises = batch.map(async (row) => {
        const originalValue = getFieldValue(row);
        const handle = row.Handle || '';

        try {
            const variation = await generateVariation(originalValue, handle);

            // Create a new row with only the required fields
            return {
                ID: row.ID,
                Handle: row.Handle,
                Command: row.Command,
                [ROW_NAME]: variation,
                original: originalValue,
                duplicate: 'true'
            };
        } catch (error) {
            console.error(`Error generating variation for ID ${row.ID}: ${error.message}`);
            // Return the original row without a variation
            return {
                ID: row.ID,
                Handle: row.Handle,
                Command: row.Command,
                [ROW_NAME]: originalValue,
                original: originalValue,
                duplicate: 'true'
            };
        }
    });

    return Promise.all(promises);
}

/**
 * Generate variations for duplicate entries using batching
 * @param {Array} duplicates - Array of duplicate entries
 * @returns {Promise<Array>} Array of entries with variations
 */
async function generateVariations(duplicates) {
    console.log(
        `Generating variations for ${duplicates.length} duplicates in batches of ${BATCH_SIZE}...`
    );
    const variations = [];

    // Process in batches
    for (let i = 0; i < duplicates.length; i += BATCH_SIZE) {
        const batch = duplicates.slice(i, i + BATCH_SIZE);
        console.log(
            `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
                duplicates.length / BATCH_SIZE
            )}...`
        );

        const batchResults = await processBatch(batch);
        variations.push(...batchResults);

        // Log progress
        const progress = Math.min(100, Math.round(((i + batch.length) / duplicates.length) * 100));
        console.log(`Progress: ${progress}% (${i + batch.length}/${duplicates.length})`);
    }

    return variations;
}

/**
 * Write data to CSV file
 * @param {Array} data - Data to write
 * @param {string} filePath - Path to write to
 */
function writeToCSV(data, filePath) {
    const csvOut = Papa.unparse(data);
    fs.writeFileSync(filePath, csvOut, 'utf8');
}

/**
 * Main function to run the script
 */
async function main() {
    try {
        console.time('Total execution time');

        // Parse CSV
        console.time('Parsing CSV');
        const { data } = parseCSV(inputPath);
        console.timeEnd('Parsing CSV');

        // Clean data
        console.time('Cleaning data');
        const cleaned = cleanData(data);
        console.timeEnd('Cleaning data');

        // Count occurrences
        console.time('Counting occurrences');
        const occurrenceMap = countOccurrences(cleaned);
        console.timeEnd('Counting occurrences');

        // Find duplicates
        console.time('Finding duplicates');
        const { result, duplicates } = findDuplicates(cleaned, occurrenceMap);
        console.timeEnd('Finding duplicates');

        // Generate variations
        console.time('Generating variations');
        const variations = await generateVariations(duplicates);
        console.timeEnd('Generating variations');

        // Write results
        console.time('Writing results');
        writeToCSV(result, outputPath);
        writeToCSV(variations, variationsOutputPath);
        console.timeEnd('Writing results');

        console.timeEnd('Total execution time');
        console.log(`Done. Output written to ${outputPath}`);
        console.log(`Found ${result.length} rows with duplicates`);
        console.log(`Generated ${variations.length} variations and exported to ${variationsOutputPath}`);
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch((error) => {
    console.error('Error running script:', error);
    process.exit(1);
});
