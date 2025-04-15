import { cleanCSVData } from './csv.js';
import { log } from './logger.js';

/**
 * Get all field values from a row, excluding specified fields
 * @param {Object} row - The row to extract field values from
 * @param {Array} excludedFields - Fields to exclude
 * @returns {Object} Map of field names to their values
 */
function getFieldValues(row, excludedFields = []) {
    const values = {};

    Object.keys(row).forEach((key) => {
        if (!excludedFields.includes(key) && row[key] && row[key].trim() !== '') {
            values[key] = row[key].trim();
        }
    });

    return values;
}

/**
 * Count occurrences of each value in all fields
 * @param {Array} data - Cleaned data
 * @param {Array} excludedFields - Fields to exclude from counting
 * @returns {Map} Map of values to their occurrence counts
 */
function countOccurrences(data, excludedFields = []) {
    const map = new Map();

    data.forEach((row) => {
        const fieldValues = getFieldValues(row, excludedFields);

        Object.entries(fieldValues).forEach(([field, value]) => {
            const key = `${field}:${value}`;
            map.set(key, (map.get(key) || 0) + 1);
        });
    });

    return map;
}

/**
 * Find duplicates and mark them in the result
 * @param {Array} data - Cleaned data
 * @param {Map} occurrenceMap - Map of values to their occurrence counts
 * @param {Array} excludedFields - Fields to exclude from duplicate checking
 * @returns {Object} Result with duplicates marked and array of duplicates
 */
function findDuplicates(data, occurrenceMap, excludedFields = []) {
    const seen = new Map(); // Map to track seen values by field
    const duplicates = [];

    const result = data.map((row) => {
        const fieldValues = getFieldValues(row, excludedFields);
        let isDuplicate = false;
        const duplicateFields = [];

        // Check each field for duplicates
        Object.entries(fieldValues).forEach(([field, value]) => {
            const key = `${field}:${value}`;
            if (occurrenceMap.get(key) > 1) {
                if (!seen.has(key)) {
                    seen.set(key, true);
                } else {
                    isDuplicate = true;
                    duplicateFields.push(field);
                }
            }
        });

        // Add to duplicates array if any field is a duplicate
        if (isDuplicate) {
            duplicates.push({
                ...row,
                duplicateFields: duplicateFields.join(',')
            });
            return { ...row, duplicate: 'true', duplicateFields: duplicateFields.join(',') };
        } else {
            return { ...row, duplicate: 'false', duplicateFields: '' };
        }
    });

    return { result, duplicates };
}

/**
 * Complete process to find duplicates in data
 * @param {Array} data - Raw CSV data
 * @param {Array} excludedFields - Fields to exclude from duplicate checking
 * @returns {Object} Result with duplicates marked and array of duplicates
 */
function findDuplicatesInData(data, excludedFields = []) {
    log.time('Cleaning data');
    const cleaned = cleanCSVData(data, excludedFields);
    log.timeEnd('Cleaning data');

    log.time('Counting occurrences');
    const occurrenceMap = countOccurrences(cleaned, excludedFields);
    log.timeEnd('Counting occurrences');

    return findDuplicates(cleaned, occurrenceMap, excludedFields);
}

export { findDuplicatesInData, getFieldValues, countOccurrences, findDuplicates };
