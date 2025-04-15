import Ollama from 'ollama';
import { log } from './logger.js';
import { getBodyPrompt, getTitlePrompt, getDescriptionPrompt, getGeneralPrompt } from '../prompts.js';

// Prompt types lookup
const PROMPT_TYPES = {
    TITLE: 'title',
    DESCRIPTION: 'description',
    HTML: 'html',
    GENERAL: 'general'
};

/**
 * Determine the prompt type based on the field name
 * @param {string} fieldName - The name of the field
 * @returns {string} The prompt type to use
 */
function getPromptType(fieldName) {
    const lowerFieldName = fieldName.toLowerCase();

    if (lowerFieldName.includes('title')) {
        return PROMPT_TYPES.TITLE;
    } else if (lowerFieldName.includes('description') && !lowerFieldName.includes('html')) {
        return PROMPT_TYPES.DESCRIPTION;
    } else if (lowerFieldName.includes('html')) {
        return PROMPT_TYPES.HTML;
    } else {
        return PROMPT_TYPES.GENERAL;
    }
}

/**
 * Get the appropriate prompt function based on the field type
 * @param {string} fieldName - The name of the field
 * @returns {Function} The prompt function to use
 */
function getPromptFunction(fieldName) {
    const promptType = getPromptType(fieldName);

    switch (promptType) {
        case PROMPT_TYPES.TITLE:
            return getTitlePrompt;
        case PROMPT_TYPES.DESCRIPTION:
            return getDescriptionPrompt;
        case PROMPT_TYPES.HTML:
            return getBodyPrompt;
        case PROMPT_TYPES.GENERAL:
        default:
            return getGeneralPrompt;
    }
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
        log.warn('Generated variation starts with triple quotes - removing them');
        cleaned = cleaned.slice(3);
        wasCleaned = true;
    }

    if (cleaned.endsWith('"""')) {
        log.warn('Generated variation ends with triple quotes - removing them');
        cleaned = cleaned.slice(0, -3);
        wasCleaned = true;
    }

    // Check for code block markers (```html, ```, etc.)
    if (cleaned.startsWith('```')) {
        log.warn('Generated variation starts with code block markers - removing them');
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
        log.warn('Generated variation starts with quotes - removing them');
        cleaned = cleaned.slice(1);
        wasCleaned = true;
    }

    // Check for single or back quotes at the end
    if (cleaned.endsWith('"') || cleaned.endsWith('`')) {
        log.warn('Generated variation ends with quotes - removing them');
        cleaned = cleaned.slice(0, -1);
        wasCleaned = true;
    }

    // Check for HTML comment markers at the beginning
    if (cleaned.startsWith('<!--')) {
        log.warn('Generated variation starts with HTML comment - removing it');
        cleaned = cleaned.substring(cleaned.indexOf('-->') + 3).trim();
        wasCleaned = true;
    }

    // Check for HTML comment markers at the end
    if (cleaned.endsWith('-->')) {
        log.warn('Generated variation ends with HTML comment - removing it');
        cleaned = cleaned.substring(0, cleaned.lastIndexOf('<!--')).trim();
        wasCleaned = true;
    }

    // Check for trailing newlines or whitespace
    if (cleaned.endsWith('\n') || cleaned.endsWith('\r\n')) {
        log.warn('Generated variation ends with newlines - removing them');
        cleaned = cleaned.trim();
        wasCleaned = true;
    }

    return cleaned;
}

/**
 * Generate a variation using Ollama
 * @param {string} text - Text to generate a variation for
 * @param {string} handle - Product handle with additional details
 * @param {string} fieldName - The name of the field being processed
 * @param {string} modelName - The Ollama model to use
 * @returns {Promise<string>} Generated variation
 */
async function generateVariation(text, handle, fieldName, modelName) {
    log.info('\nGenerating variation for:');
    log.info('Field:', fieldName);
    log.info('Original text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    log.info('Handle:', handle);

    // Get the appropriate prompt function based on the field type
    const promptFunction = getPromptFunction(fieldName);
    const promptType = getPromptType(fieldName);

    log.info(`Using ${promptType} prompt for field "${fieldName}"`);

    const prompt = promptFunction(text, handle);
    log.info(`Calling Ollama with ${modelName} model...`);

    const response = await Ollama.chat({
        model: modelName,
        messages: [{ role: 'user', content: prompt }]
    });

    const rawVariation = response.message.content.trim();
    log.info(
        'Generated variation:',
        rawVariation.substring(0, 100) + (rawVariation.length > 100 ? '...' : '')
    );

    // Check if variation starts with triple quotes and throw error if it does
    if (rawVariation.startsWith('"""')) {
        log.error('CRITICAL ERROR: Generated variation starts with triple quotes (""")');
        log.error('This indicates a malformed response from the AI model');
        log.error('Stopping the entire process to prevent data corruption');
        throw new Error('AI response contains triple quotes (""") - stopping process');
    }

    // Clean the variation
    const cleanedVariation = cleanVariation(rawVariation);
    if (cleanedVariation !== rawVariation) {
        log.info(
            'Cleaned variation:',
            cleanedVariation.substring(0, 100) + (cleanedVariation.length > 100 ? '...' : '')
        );
    }

    return cleanedVariation;
}

export { generateVariation, cleanVariation, getPromptType, getPromptFunction, PROMPT_TYPES };
