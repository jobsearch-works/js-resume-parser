# JavaScript Resume Parser

A JavaScript tool for parsing resume files (PDF format) and extracting structured information.

## Features

- Extracts comprehensive information from resume PDFs:
  - Basic Information:
    - Name
    - Email address
    - Phone number
    - LinkedIn profile
    - Address
  - Professional Experience:
    - Company names
    - Job titles
    - Work periods
    - Job descriptions
  - Education:
    - Institutions
    - Degrees
    - Study periods
    - Academic details
  - Skills & Qualifications:
    - Technical skills
    - Languages
    - Certifications
- Multiple specialized parsers for different resume formats:
  - General-purpose parser
  - Serter format parser
  - Universal parser that runs all parsers on all resumes
- Automatically processes all PDF files in the 'resumes' directory
- Saves parsed results as JSON files in the 'parsed' directory
- Intelligent section detection using common section headers
- Handles various resume formats and layouts
- **Verification System**: Identifies and reports content from the PDF that might be missing in the parsed output

## Architecture

The system follows a modular architecture with a clear separation of concerns:

1. **Parser Modules**:

   - Each parser (`resumeParser.js`, `serterParser.js`) is responsible only for extracting and structuring data
   - Parsers implement specialized logic for different resume formats
   - Parsers return structured JSON data without writing to disk

2. **Universal Parser**:

   - The `parseAllResumes.js` script orchestrates the entire process
   - Calls multiple parsers on each resume
   - Handles file I/O operations (saving JSON results and verification files)
   - Organizes output into appropriate directories

3. **Verification System**:
   - The `verificationUtils.js` module provides content verification
   - Identifies missing or incomplete parsing results
   - Helps improve parser accuracy

This architecture makes the system easy to extend with new parsers and maintain existing ones.

## Installation

1. Clone the repository:

```
git clone https://github.com/jobsearch-works/js-resume-parser.git
cd js-resume-parser
```

2. Install dependencies:

```
npm install
```

## Usage

You can choose to run a specific parser or the universal parser:

### General-purpose Parser

```
npm start
```

or

```
node resumeParser.js
```

### Serter Format Parser

```
npm run serter
```

or

```
node serterParser.js
```

### Universal Parser (Recommended)

Runs all available parsers on all resumes:

```
npm run parse-all
```

or

```
node parseAllResumes.js
```

### Generate Statistics (Optional)

After running the parsers, you can generate comparative statistics:

```
npm run generate-stats
```

or

```
node generateParserStats.js
```

The parsers will:

- Process all resume files in the 'resumes' folder
- Display a summary of extracted information in the console
- Save detailed results as JSON files in the 'parsed' folder
- Verify completeness and identify potentially missing content
- Generate missing content reports when needed

The statistics generator will:

- Analyze all parsed results across different parsers
- Compare parser performance for each resume
- Recommend the best parser for each resume format
- Generate detailed statistics files in the 'parsed/stats' folder

## Output

The parsers generate the following files in separate directories:

1. **JSON files** with structured resume data:

   - `parsed/default-parser/`: Results from the general-purpose parser
   - `parsed/serter-parser/`: Results from the Serter format parser

2. **Statistics files** with parser comparisons:

   - `parsed/stats/`: JSON files comparing parser performance for each resume
   - Each file includes metrics like coverage percentage, field extraction success rate,
     and a recommendation for which parser works best for that resume

3. If any content cannot be parsed properly, **missing content files** will be created in the same directories containing text from the resume that wasn't captured in the structured output.

## Verification System

The verification system analyzes the parsed output against the original PDF text to ensure completeness:

- Breaks the PDF text into meaningful chunks
- Checks if each chunk is represented in the parsed output
- Calculates a coverage percentage to measure parsing completeness
- Identifies and reports potentially missing content for review
- Saves missing content to separate files in the respective parser's directory for manual inspection

This helps identify edge cases, unusual formatting, or sections that the parser might have missed, allowing you to improve the parsing accuracy.

## How It Works

The parsers use several techniques to extract information:

1. **Section Detection**: Identifies common resume sections (experience, education, skills, etc.)
2. **Pattern Matching**: Uses regular expressions to identify dates, emails, phone numbers, etc.
3. **Contextual Analysis**: Analyzes the position and context of text to determine its meaning
4. **Verification**: Compares the original text with parsed output to ensure completeness

## Customization

You can modify the parser files to:

- Add more sophisticated parsing logic
- Adjust the section headers to match specific resume formats
- Fine-tune the regular expressions for better matching
- Add additional fields or sections to extract
- Customize the verification threshold for content coverage

## Dependencies

- [pdf-parse](https://www.npmjs.com/package/pdf-parse): For parsing PDF files

## License

MIT
