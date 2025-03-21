# Universal Resume Parser

A comprehensive JavaScript tool that runs all available resume parsers on your resume files, allowing you to compare results and choose the best parser for each resume format.

## Features

- **Multi-Parser Approach**: Runs multiple specialized parsers on each resume file
- **Comprehensive Coverage**: Different parsers excel at different resume formats
- **Comparison Capability**: See which parser performs best for each resume
- **Consolidated Output**: All results saved in the parsed directory with clear naming
- **Content Verification**: Includes verification to ensure no information is missed
- **Parser Statistics**: Generates statistics files comparing parsers for each resume

## Available Parsers

1. **Default Parser**: General-purpose resume parser that works well with most resume formats
2. **Serter Parser**: Specialized parser optimized for the Serter resume format

## Installation

1. Make sure you have set up the main project:

```
git clone https://github.com/jobsearch-works/js-resume-parser.git
cd js-resume-parser
npm install
```

## Usage

1. Place your resume files (PDF format) in the `resumes` folder.

2. Run the universal parser:

```
npm run parse-all
```

or

```
node parseAllResumes.js
```

3. (Optional) Generate comparative statistics:

```
npm run generate-stats
```

or

```
node generateParserStats.js
```

4. The parser will:

   - Detect all resume files in the resumes directory
   - Process each file with all available parsers
   - Display a summary of extracted information for each parser
   - Save the parsed data as JSON files in the 'parsed' directory
   - Perform content verification to ensure comprehensive extraction

5. The statistics generator will:
   - Analyze all parsed results from different parsers
   - Compare parser performance for each resume
   - Score parsers based on extraction quality and coverage
   - Recommend the best parser for each resume format
   - Save detailed statistics to the 'parsed/stats' directory

## Architecture

The Universal Parser system follows a clear separation of concerns:

1. **Parser Modules** - Each parser is responsible only for extracting data:

   - `resumeParser.js` - General purpose parser
   - `serterParser.js` - Specialized parser for Serter format resumes

2. **Universal Parser** - `parseAllResumes.js` coordinates the parsing process:

   - Calls each parser to extract data from resumes
   - Handles saving the results to the appropriate directories
   - Saves verification results for any missing content

3. **Statistics Generator** - `generateParserStats.js` analyzes parser results:

   - Reads parsed outputs from all parsers
   - Compares performance metrics across parsers
   - Generates statistical analysis for each resume
   - Recommends the best parser for each format

4. **Verification Utils** - `verificationUtils.js` provides helper functions:
   - Verifies the completeness of parsed data
   - Helps identify potentially missing content from resumes

This modular architecture makes the system easier to maintain and extend with new parsers.

## Output

For each resume file, the following outputs will be generated:

1. **JSON Output Files** in separate directories:

   - `parsed/default-parser/filename.json`: Results from the default parser
   - `parsed/serter-parser/filename.json`: Results from the Serter format parser

2. **Statistics Files**:

   - `parsed/stats/filename_stats.json`: Comparative statistics across all parsers
   - Includes metrics like field extraction success, field counts, and coverage percentages
   - Recommends the best parser for each resume based on scoring algorithm

3. **Verification Files**:
   - Missing content text files in each parser's directory if content is missed

Each JSON file contains:

- Basic contact information
- Experience entries
- Education details
- Skills and qualifications
- Other data specific to each parser (projects, certifications, etc.)
- Verification results indicating content coverage

## How to Choose the Best Parser

The universal parser outputs basic statistics that can help you determine which parser performed best for a particular resume:

1. **Through Console Output**:

   - Number of experience positions extracted
   - Number of education entries extracted
   - Number of skills identified
   - Content coverage percentage

2. **Through Statistics Files**:
   - Check the `parsed/stats/filename_stats.json` file
   - Look for the `bestParser` field which indicates the recommended parser
   - Compare detailed metrics between parsers in the `parsers` object

Generally, the parser that extracts more information and has higher content coverage is likely the better choice for that specific resume format.

## Extending with New Parsers

To add a new parser:

1. Create a new parser file (e.g., `newFormatParser.js`)
2. Implement the parsing logic and export the main parsing function
3. Update `parseAllResumes.js` to include your new parser

## Dependencies

- [pdf-parse](https://www.npmjs.com/package/pdf-parse): For parsing PDF files

## License

MIT
