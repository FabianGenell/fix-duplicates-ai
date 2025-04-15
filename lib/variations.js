import { log } from './logger.js';
import { generateVariation } from './ai.js';

/**
 * Process a batch of duplicates in parallel
 * @param {Array} batch - Batch of duplicate entries to process
 * @param {string} modelName - The model name to use for generation
 * @returns {Promise<Array>} Array of processed entries with variations
 */
async function processBatch(batch, modelName) {
    log.info(`\nStarting batch processing for ${batch.length} items:`);
    log.info('Batch IDs:', batch.map((row) => row.ID).join(', '));

    const promises = batch.map(async (row) => {
        log.info(`\nProcessing item ID: ${row.ID}`);

        // Get the duplicate fields for this row
        const duplicateFields = row.duplicateFields ? row.duplicateFields.split(',') : [];

        // Create a new row with the original values
        const newRow = {
            ID: row.ID,
            Handle: row.Handle,
            Command: row.Command,
            duplicate: 'true',
            duplicateFields: row.duplicateFields
        };

        // Generate variations for each duplicate field
        for (const field of duplicateFields) {
            const originalValue = row[field];
            const handle = row.Handle || '';

            try {
                log.time(`Generation time for ID ${row.ID} - ${field}`);
                const variation = await generateVariation(originalValue, handle, field, modelName);
                log.timeEnd(`Generation time for ID ${row.ID} - ${field}`);

                // Add the variation to the new row
                newRow[field] = variation;
                newRow[`original_${field}`] = originalValue;
            } catch (error) {
                log.error(`Error generating variation for ID ${row.ID} - ${field}:`);
                log.error(`Error details: ${error.message}`);
                // Keep the original value if variation generation fails
                newRow[field] = originalValue;
                newRow[`original_${field}`] = originalValue;
            }
        }

        return newRow;
    });

    const results = await Promise.all(promises);
    log.success(`Batch processing completed for ${batch.length} items`);
    return results;
}

/**
 * Generate variations for duplicate entries using batching
 * @param {Array} duplicates - Array of duplicate entries
 * @param {string} modelName - The model name to use for generation
 * @param {number} batchSize - Number of items to process in parallel
 * @returns {Promise<Array>} Array of entries with variations
 */
async function generateVariationsForDuplicates(duplicates, modelName, batchSize = 5) {
    // Handle empty duplicates array
    if (!duplicates || duplicates.length === 0) {
        log.info('No duplicates to process');
        return [];
    }

    log.section('Starting Variation Generation');
    log.info(`Total duplicates to process: ${duplicates.length}`);
    log.info(`Batch size: ${batchSize}`);
    log.info(`Expected number of batches: ${Math.ceil(duplicates.length / batchSize)}`);
    log.info('=====================================\n');

    const variations = [];
    const startTime = Date.now();

    // Process in batches
    for (let i = 0; i < duplicates.length; i += batchSize) {
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(duplicates.length / batchSize);
        const batch = duplicates.slice(i, i + batchSize);

        log.progress(`Processing Batch ${batchNumber}/${totalBatches}`);
        log.info('----------------------------------------');

        const batchResults = await processBatch(batch, modelName);
        variations.push(...batchResults);

        // Calculate and log progress
        const itemsProcessed = i + batch.length;
        if (itemsProcessed > 0) {
            log.batchProgress(itemsProcessed, duplicates.length, startTime);
        }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    log.sectionEnd('Variation Generation');

    // Avoid division by zero
    if (duplicates.length > 0) {
        log.info(`Total time taken: ${totalTime.toFixed(1)} seconds`);
        log.info(`Average time per item: ${(totalTime / duplicates.length).toFixed(1)} seconds`);
    } else {
        log.info(`Total time taken: ${totalTime.toFixed(1)} seconds`);
    }

    log.info('=====================================\n');

    return variations;
}

export { generateVariationsForDuplicates, processBatch };
