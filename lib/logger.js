/**
 * Simple logger utility that wraps console methods with emoji indicators
 * and provides consistent formatting
 */

// Default configuration
let config = {
    verbose: true
};

const log = {
    // Core logging methods
    info: (message, ...args) => {
        if (config.verbose) console.log(message, ...args);
    },
    warn: (message, ...args) => console.warn('⚠️ Warning:', message, ...args),
    error: (message, ...args) => console.error('❌ Error:', message, ...args),
    success: (message, ...args) => console.log('✅', message, ...args),
    progress: (message, ...args) => {
        if (config.verbose) console.log('🔄', message, ...args);
    },
    stats: (message, ...args) => {
        if (config.verbose) console.log('📊', message, ...args);
    },

    // Timing methods (always enabled)
    time: (label) => console.time(label),
    timeEnd: (label) => console.timeEnd(label),

    // Log a section header with consistent formatting
    section: (title) => {
        if (config.verbose) console.log(`\n=== ${title} ===`);
    },

    // Log the end of a section with a summary
    sectionEnd: (title) => {
        if (config.verbose) console.log(`\n=== ${title} Complete ===`);
    },

    // Log progress in a batch process
    batchProgress: (current, total, startTime) => {
        // Skip if not verbose or invalid inputs
        if (!config.verbose || current <= 0 || total <= 0 || !startTime) {
            return;
        }

        const progress = Math.min(100, Math.round((current / total) * 100));
        const timeElapsed = (Date.now() - startTime) / 1000; // in seconds

        // Avoid division by zero
        const avgTimePerItem = current > 0 ? timeElapsed / current : 0;
        const remainingItems = total - current;
        const estimatedRemainingTime = remainingItems * avgTimePerItem;

        log.stats('Progress Update:');
        log.info(`Progress: ${progress}% (${current}/${total})`);
        log.info(`Time elapsed: ${timeElapsed.toFixed(1)} seconds`);
        log.info(`Average time per item: ${avgTimePerItem.toFixed(1)} seconds`);
        log.info(`Estimated time remaining: ${estimatedRemainingTime.toFixed(1)} seconds`);
        log.info('----------------------------------------');
    }
};

/**
 * Configure logger with custom settings
 * @param {Object} options - Configuration options
 * @param {boolean} options.verbose - Whether to enable verbose logging
 * @returns {Object} The configured logger
 */
function configureLogger(options = {}) {
    if (typeof options.verbose === 'boolean') {
        config.verbose = options.verbose;
    }
    return log;
}

export { log, configureLogger };
