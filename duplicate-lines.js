import fs from 'fs';
import Papa from 'papaparse';

import { generateVariationsForDuplicates } from './lib/variations.js';
import { parseCSV, writeToCSV } from './lib/csv.js';
import { findDuplicatesInData } from './lib/duplicates.js';
import { configureLogger, log } from './lib/logger.js';

// Configuration
const CONFIG = {
    // Input/Output settings
    inputPath: './smart-collections.csv',
    outputPath: './found-duplicates.csv',
    variationsOutputPath: './variations-output.csv',

    // Processing settings
    batchSize: 5,
    model: 'gemma3:4b',
    excludedFields: ['Handle', 'ID', 'Command'],

    // Logging settings
    verbose: true // Set to false for less console output
};

// Configure logger based on verbosity setting
configureLogger({ verbose: CONFIG.verbose });

/**
 * Main function to run the script
 */
async function main() {
    try {
        log.time('Total execution time');

        // Parse and process the CSV file
        log.time('Parsing CSV');
        const { data } = parseCSV(CONFIG.inputPath);
        log.timeEnd('Parsing CSV');

        // Find duplicates
        log.time('Finding duplicates');
        const { result, duplicates } = findDuplicatesInData(data, CONFIG.excludedFields);
        log.timeEnd('Finding duplicates');

        // Generate variations for duplicates
        log.time('Generating variations');
        const variations = await generateVariationsForDuplicates(
            duplicates,
            CONFIG.model,
            CONFIG.batchSize
        );
        log.timeEnd('Generating variations');

        // Write results
        log.time('Writing results');
        writeToCSV(result, CONFIG.outputPath);
        writeToCSV(variations, CONFIG.variationsOutputPath);
        log.timeEnd('Writing results');

        log.timeEnd('Total execution time');
        log.info(`Done. Output written to ${CONFIG.outputPath}`);
        log.info(`Found ${duplicates.length} rows with duplicates`);
        log.info(
            `Generated ${variations.length} variations and exported to ${CONFIG.variationsOutputPath}`
        );
    } catch (error) {
        log.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch((error) => {
    log.error('Error running script:', error);
    process.exit(1);
});
