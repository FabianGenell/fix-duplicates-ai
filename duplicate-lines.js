import fs from 'fs';
import Papa from 'papaparse';
import Ollama from 'ollama';
import { getBodyPrompt } from './prompts.js';

const ROW_NAME = 'Body HTML';
const ROW_NAME_ALT = '';

const MODEL = 'gemma3:4b';

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
 * Clean the variation by removing unwanted prefixes and suffixes
 * @param {string} variation - The variation to clean
 * @returns {string} The cleaned variation
 */
function cleanVariation(variation) {
    let cleaned = variation;
    let wasCleaned = false;

    // Check for triple quotes (""") and remove them
    if (cleaned.startsWith('"""')) {
        console.warn('⚠️ Warning: Generated variation starts with triple quotes - removing them');
        cleaned = cleaned.slice(3);
        wasCleaned = true;
    }

    if (cleaned.endsWith('"""')) {
        console.warn('⚠️ Warning: Generated variation ends with triple quotes - removing them');
        cleaned = cleaned.slice(0, -3);
        wasCleaned = true;
    }

    // Check for code block markers (```html, ```, etc.)
    if (cleaned.startsWith('```')) {
        console.warn('⚠️ Warning: Generated variation starts with code block markers - removing them');
        // Find the end of the code block
        const endIndex = cleaned.lastIndexOf('```');
        if (endIndex > 0) {
            // Remove the opening ``` and any language identifier (like html)
            cleaned = cleaned.substring(cleaned.indexOf('\n') + 1);
            // Remove the closing ```
            cleaned = cleaned.substring(0, cleaned.lastIndexOf('```')).trim();
        } else {
            // If no closing ``` found, just remove the opening
            cleaned = cleaned.substring(cleaned.indexOf('\n') + 1).trim();
        }
        wasCleaned = true;
    }

    // Check for single or back quotes at the beginning
    if (cleaned.startsWith('"') || cleaned.startsWith('`')) {
        console.warn('⚠️ Warning: Generated variation starts with quotes - removing them');
        cleaned = cleaned.slice(1);
        wasCleaned = true;
    }

    // Check for single or back quotes at the end
    if (cleaned.endsWith('"') || cleaned.endsWith('`')) {
        console.warn('⚠️ Warning: Generated variation ends with quotes - removing them');
        cleaned = cleaned.slice(0, -1);
        wasCleaned = true;
    }

    // Check for HTML comment markers at the beginning
    if (cleaned.startsWith('<!--')) {
        console.warn('⚠️ Warning: Generated variation starts with HTML comment - removing it');
        cleaned = cleaned.substring(cleaned.indexOf('-->') + 3).trim();
        wasCleaned = true;
    }

    // Check for HTML comment markers at the end
    if (cleaned.endsWith('-->')) {
        console.warn('⚠️ Warning: Generated variation ends with HTML comment - removing it');
        cleaned = cleaned.substring(0, cleaned.lastIndexOf('<!--')).trim();
        wasCleaned = true;
    }

    // Check for trailing newlines or whitespace
    if (cleaned.endsWith('\n') || cleaned.endsWith('\r\n')) {
        console.warn('⚠️ Warning: Generated variation ends with newlines - removing them');
        cleaned = cleaned.trim();
        wasCleaned = true;
    }

    return cleaned;
}

/**
 * Generate a variation using Ollama
 * @param {string} text - Text to generate a variation for
 * @param {string} handle - Product handle with additional details
 * @returns {Promise<string>} Generated variation
 */
async function generateVariation(text, handle) {
    console.log('\nGenerating variation for:');
    console.log('Original text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    console.log('Handle:', handle);

    const PROMPT = getPrompt(text, handle);
    console.log(`Calling Ollama with ${MODEL} model...`);

    const response = await Ollama.chat({
        model: MODEL,
        messages: [{ role: 'user', content: PROMPT }]
    });

    const rawVariation = response.message.content.trim();
    console.log(
        'Generated variation:',
        rawVariation.substring(0, 100) + (rawVariation.length > 100 ? '...' : '')
    );

    // Check if variation starts with triple quotes and throw error if it does
    if (rawVariation.startsWith('"""')) {
        console.error('❌ CRITICAL ERROR: Generated variation starts with triple quotes (""")');
        console.error('This indicates a malformed response from the AI model');
        console.error('Stopping the entire process to prevent data corruption');
        throw new Error('AI response contains triple quotes (""") - stopping process');
    }

    // Clean the variation
    const cleanedVariation = cleanVariation(rawVariation);
    if (cleanedVariation !== rawVariation) {
        console.log(
            'Cleaned variation:',
            cleanedVariation.substring(0, 100) + (cleanedVariation.length > 100 ? '...' : '')
        );
    }

    return cleanedVariation;
}

/**
 * Process a batch of duplicates in parallel
 * @param {Array} batch - Batch of duplicate entries to process
 * @returns {Promise<Array>} Array of processed entries with variations
 */
async function processBatch(batch) {
    console.log(`\nStarting batch processing for ${batch.length} items:`);
    console.log('Batch IDs:', batch.map((row) => row.ID).join(', '));

    const promises = batch.map(async (row) => {
        console.log(`\nProcessing item ID: ${row.ID}`);
        const originalValue = getFieldValue(row);
        const handle = row.Handle || '';

        try {
            console.time(`Generation time for ID ${row.ID}`);
            const variation = await generateVariation(originalValue, handle);
            console.timeEnd(`Generation time for ID ${row.ID}`);

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
            console.error(`❌ Error generating variation for ID ${row.ID}:`);
            console.error(`   Error details: ${error.message}`);
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

    const results = await Promise.all(promises);
    console.log(`\n✅ Batch processing completed for ${batch.length} items`);
    return results;
}

/**
 * Generate variations for duplicate entries using batching
 * @param {Array} duplicates - Array of duplicate entries
 * @returns {Promise<Array>} Array of entries with variations
 */
async function generateVariations(duplicates) {
    console.log('\n=== Starting Variation Generation ===');
    console.log(`Total duplicates to process: ${duplicates.length}`);
    console.log(`Batch size: ${BATCH_SIZE}`);
    console.log(`Expected number of batches: ${Math.ceil(duplicates.length / BATCH_SIZE)}`);
    console.log('=====================================\n');

    const variations = [];
    const startTime = Date.now();

    // Process in batches
    for (let i = 0; i < duplicates.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(duplicates.length / BATCH_SIZE);
        const batch = duplicates.slice(i, i + BATCH_SIZE);

        console.log(`\n🔄 Processing Batch ${batchNumber}/${totalBatches}`);
        console.log('----------------------------------------');

        const batchResults = await processBatch(batch);
        variations.push(...batchResults);

        // Calculate and log progress
        const progress = Math.min(100, Math.round(((i + batch.length) / duplicates.length) * 100));
        const timeElapsed = (Date.now() - startTime) / 1000; // in seconds
        const itemsProcessed = i + batch.length;
        const avgTimePerItem = timeElapsed / itemsProcessed;
        const remainingItems = duplicates.length - itemsProcessed;
        const estimatedRemainingTime = remainingItems * avgTimePerItem;

        console.log('\n📊 Progress Update:');
        console.log(`Progress: ${progress}% (${itemsProcessed}/${duplicates.length})`);
        console.log(`Time elapsed: ${timeElapsed.toFixed(1)} seconds`);
        console.log(`Average time per item: ${avgTimePerItem.toFixed(1)} seconds`);
        console.log(`Estimated time remaining: ${estimatedRemainingTime.toFixed(1)} seconds`);
        console.log('----------------------------------------');
    }

    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n=== Variation Generation Complete ===');
    console.log(`Total time taken: ${totalTime.toFixed(1)} seconds`);
    console.log(`Average time per item: ${(totalTime / duplicates.length).toFixed(1)} seconds`);
    console.log('=====================================\n');

    return variations;
}

/**
 * Write data to CSV file
 * @param {Array} data - Data to write
 * @param {string} filePath - Path to write to
 */
function writeToCSV(data, filePath) {
    console.log(`\nWriting ${data.length} rows to ${filePath}...`);
    const csvOut = Papa.unparse(data);
    fs.writeFileSync(filePath, csvOut, 'utf8');
    console.log(`✅ Successfully wrote data to ${filePath}`);
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
