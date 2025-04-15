import fs from 'fs';
import Papa from 'papaparse';
import { log } from './logger.js';

/**
 * Parse CSV file with configurable settings
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - Optional parsing configuration
 * @returns {Object} Parsed data and any errors
 */
function parseCSV(filePath, options = {}) {
    const csvData = fs.readFileSync(filePath, 'utf8');

    // Default parse options with overrides
    const parseOptions = {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        quotes: true,
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        newline: '\n',
        transform: (value) => value.trim(),
        ...options
    };

    const { data, errors } = Papa.parse(csvData, parseOptions);

    if (errors.length) {
        log.warn('CSV Parse Warnings:', errors);
    }

    return { data, errors };
}

/**
 * Write data to a CSV file
 * @param {Array} data - Data to write
 * @param {string} filePath - Path to write to
 * @param {Object} options - Optional Papa.unparse options
 */
function writeToCSV(data, filePath, options = {}) {
    log.info(`Writing ${data.length} rows to ${filePath}...`);
    const csvOut = Papa.unparse(data, options);
    fs.writeFileSync(filePath, csvOut, 'utf8');
    log.success(`Successfully wrote data to ${filePath}`);
}

/**
 * Clean CSV data by filtering out empty rows
 * @param {Array} data - Data to clean
 * @param {Array} excludedFields - Fields to exclude from empty check
 * @returns {Array} Cleaned data
 */
function cleanCSVData(data, excludedFields = []) {
    return data.filter((row) => {
        return Object.keys(row).some((key) => {
            if (!excludedFields.includes(key)) {
                return row[key] && row[key].trim() !== '';
            }
            return false;
        });
    });
}

export { parseCSV, writeToCSV, cleanCSVData };
