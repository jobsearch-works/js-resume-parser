# JavaScript Resume Parser

A simple JavaScript tool for parsing resume files (PDF format) and extracting structured information.

## Features

- Extracts basic information from resume PDFs:
  - Name
  - Email address
  - Phone number
  - (Future: Experience, Education, Skills)

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

1. Place your resume PDF files in the `resumes` folder.

2. Run the parser:

```
npm start
```

3. The parser will process the resume file and output the extracted information.

## Customization

You can modify the `resumeParser.js` file to:

- Add more sophisticated parsing logic
- Extract additional fields
- Adjust the regular expressions for better matching

## Dependencies

- [pdf-parse](https://www.npmjs.com/package/pdf-parse): For parsing PDF files

## License

MIT
