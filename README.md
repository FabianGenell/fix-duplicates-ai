# CSV Duplicates Handler

A Node.js utility for detecting and fixing duplicate entries in CSV files by generating unique AI-powered variations. Particularly useful for collection data where duplicate content needs to be unique for SEO purposes.

## Features

- Automatically detects duplicate entries in CSV files
- Generates unique AI-powered variations of duplicate content using Ollama
- Supports batch processing for efficiency
- Preserves original data and marks duplicates
- Specialized prompts for different content types (titles, descriptions, HTML content)
- Detailed logging with progress tracking

## Prerequisites

- Node.js 14 or higher
- Ollama installed and accessible (for AI variation generation)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

Edit the configuration settings at the top of `duplicate-lines.js`:

```javascript
const CONFIG = {
    // Input/Output settings
    inputPath: './smart-collections.csv',           // Path to input CSV file
    outputPath: './found-duplicates.csv',           // Path to output CSV with duplicate markers
    variationsOutputPath: './variations-output.csv', // Path to output CSV with generated variations
    
    // Processing settings
    batchSize: 5,                                   // Number of items to process in parallel
    model: 'gemma3:4b',                             // Ollama model to use
    excludedFields: ['Handle', 'ID', 'Command'],    // Fields to exclude from duplicate checking
    
    // Logging settings
    verbose: true,                                  // Set to false for minimal console output
};
```

## Usage

Run the script:

```bash
npm start
```

The script will:
1. Read the CSV file specified in `inputPath`
2. Identify duplicate entries
3. Generate unique variations for duplicates using AI
4. Write results to the specified output files

## Output

The script produces two output files:

1. `found-duplicates.csv`: Contains all original data with duplicate entries marked
2. `variations-output.csv`: Contains entries with AI-generated variations for the duplicate fields

## Customizing Prompts

Edit the prompt templates in `prompts.js` to customize how variations are generated. The script includes specialized prompts for:

- Collection titles
- Collection descriptions
- HTML content
- General text

## Project Structure

```
├── duplicate-lines.js     # Main script and configuration
├── prompts.js             # AI prompt templates for different content types
├── package.json           # Project dependencies and scripts
├── lib/                   # Modular components
│   ├── ai.js              # AI interaction with Ollama
│   ├── csv.js             # CSV parsing and writing
│   ├── duplicates.js      # Duplicate detection logic
│   ├── logger.js          # Configurable logging utilities
│   └── variations.js      # Batch processing and variation generation
```

### Modules Overview

- **ai.js**: Handles interaction with Ollama API, prompt selection, and response cleaning
- **csv.js**: Provides utilities for parsing, cleaning, and writing CSV files
- **duplicates.js**: Contains logic to identify duplicate entries across multiple fields
- **logger.js**: Offers configurable logging with support for different verbosity levels
- **variations.js**: Manages batch processing and generation of variations for duplicates

## Troubleshooting

- **Performance Issues**: Reduce `batchSize` for less parallel processing if rate limits are hit
- **Excessive Logging**: Set `verbose: false` in the configuration for minimal console output
- **Memory Usage**: For very large files, consider processing in smaller chunks

## License

MIT 