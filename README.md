# Fix Duplicates AI

A Node.js tool for identifying duplicate entries in CSV files and generating unique variations using AI. Designed to work seamlessly with Matrixify for Shopify data export and import.

## Overview

This tool processes CSV files exported from Matrixify, identifies duplicate entries based on specific fields (like title tags or body HTML), and uses AI to generate unique variations for those duplicates. It's particularly useful for e-commerce platforms where duplicate content can negatively impact SEO. The generated variations can be imported back into Shopify using Matrixify.

## Features

- **Matrixify Integration**: Works with CSV files exported from Matrixify and produces output ready for import
- **Duplicate Detection**: Identifies duplicate entries in CSV files based on specified fields
- **AI-Powered Variations**: Generates unique variations for duplicate entries using any Ollama model
- **Batch Processing**: Processes items in configurable batches for optimal performance
- **Comprehensive Logging**: Provides detailed progress information and error handling
- **Clean Output**: Produces two CSV files - one with duplicate markers and one with AI-generated variations

## Prerequisites

- Node.js (v14 or higher)
- Ollama installed and running locally with any model of your choice

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/fix-duplicates-ai.git
   cd fix-duplicates-ai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Ensure Ollama is installed and running with your preferred model:
   ```
   ollama pull gemma3:4b  # or any other model you prefer
   ```

## Configuration

The main configuration is in `duplicate-lines.js`:

- `ROW_NAME`: The field to check for duplicates (default: 'Body HTML')
- `ROW_NAME_ALT`: Alternative field name (if needed)
- `MODEL`: The Ollama model to use (default: 'gemma3:4b', but can be changed to any model)
- `BATCH_SIZE`: Number of items to process in parallel (default: 5)

## Usage

1. Export your Shopify data using Matrixify to a CSV file (default: `matrixify-output.csv`)

2. Run the script:
   ```
   node duplicate-lines.js
   ```

3. The script will:
   - Parse the input CSV
   - Identify duplicate entries
   - Generate AI variations for duplicates
   - Output two files:
     - `found-duplicates.csv`: Original data with duplicate markers
     - `variations-output.csv`: Duplicate entries with AI-generated variations

4. Import the `variations-output.csv` file back into Shopify using Matrixify

## Output Format

The variations output file contains:
- ID
- Handle
- Command
- The modified field (e.g., Body HTML)
- Original value
- Duplicate flag

This format is compatible with Matrixify's import structure, allowing for seamless data transfer back to Shopify.

## Customization

### Changing the Field to Check

To check for duplicates in a different field, modify the `ROW_NAME` constant in `duplicate-lines.js`:

```javascript
const ROW_NAME = 'Title Tag'; // Change to your desired field
```

### Changing the AI Model

To use a different Ollama model, modify the `MODEL` constant in `duplicate-lines.js`:

```javascript
const MODEL = 'llama3:8b'; // Change to any model you have installed
```

### Adjusting AI Prompts

The AI prompts are defined in `prompts.js`. You can modify these to change how variations are generated.

## Troubleshooting

- **Ollama Connection Issues**: Ensure Ollama is running and the specified model is available
- **CSV Parsing Errors**: Check that your input CSV is properly formatted
- **AI Generation Failures**: The script includes error handling to continue processing even if some variations fail
- **Matrixify Import Issues**: Ensure the output CSV structure matches what Matrixify expects

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 