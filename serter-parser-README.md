# Serter Format Resume Parser

A specialized JavaScript tool for parsing resumes in the format similar to Serter_I.pdf, extracting structured information from the resume content.

## Features

- Specialized parser for a specific resume format
- Extracts comprehensive information:
  - Basic Information:
    - Name
    - Professional title
    - Email address
    - Phone number
    - LinkedIn profile
    - Location
  - Professional Experience:
    - Job titles
    - Company names
    - Work periods
    - Locations
    - Responsibilities
  - Education:
    - Institutions
    - Degrees
    - Study periods
    - Additional details
  - Projects:
    - Project names
    - Timeframes
    - Links (e.g., GitHub)
    - Descriptions
  - Skills, Languages, and Certifications
- Uses intelligent section detection and content analysis
- Includes content verification to identify missing information

## Installation

1. Make sure you have set up the main project:

```
git clone https://github.com/jobsearch-works/js-resume-parser.git
cd js-resume-parser
npm install
```

2. The Serter parser uses the same dependencies as the main parser.

## Usage

1. Place your resume files in the `resumes` folder.

2. Run the Serter parser:

```
node serterParser.js
```

3. The parser will process the Serter_I.pdf file and:
   - Extract information from the resume
   - Display a summary of the extracted information
   - Save the parsed data as a JSON file in the 'parsed' directory
   - Verify that all important content is captured
   - Generate a report of any missing content (if needed)

## Output

The parser generates a JSON file with the following structure:

```json
{
  "name": "John Doe",
  "title": "Software Engineer",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "linkedin": "linkedin.com/in/johndoe",
  "location": "New York, NY",
  "summary": "Experienced software engineer with expertise in...",
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Company Inc.",
      "location": "San Francisco, CA",
      "period": "2018 - Present",
      "responsibilities": [
        "Developed scalable backend systems",
        "Led a team of 5 engineers",
        "Implemented CI/CD pipelines"
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Technology",
      "location": "Boston, MA",
      "period": "2014 - 2018",
      "details": ["GPA: 3.8", "Dean's List"]
    }
  ],
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "projects": [
    {
      "name": "Personal Portfolio",
      "timeframe": "2020",
      "link": "https://github.com/johndoe/portfolio",
      "description": ["Responsive personal website built with React"]
    }
  ],
  "certifications": ["AWS Certified Developer"],
  "languages": ["English", "Spanish"],
  "verificationResults": {
    "missingContent": [],
    "coveragePercentage": 98.2
  }
}
```

## Customization

You can modify the `serterParser.js` file to:

- Adjust the patterns used to identify different sections
- Fine-tune the extraction logic for specific fields
- Update the regular expressions for better matching
- Add support for additional resume fields
- Change the verification threshold for content coverage

## How It Works

The parser uses a combination of techniques to extract information:

1. **Initial Basic Information Extraction**: Processes the top portion of the resume to extract name, title, and contact information.

2. **Section Detection**: Identifies different sections like Experience, Education, Skills, etc.

3. **Specialized Section Parsing**: Uses specialized extraction functions for each section type:

   - Experience entries with job titles, companies, periods, and responsibilities
   - Education entries with degrees, institutions, and periods
   - Skills, languages, and certifications lists
   - Project entries with names, timeframes, links, and descriptions

4. **Verification**: Checks that all significant content from the original PDF is represented in the parsed output.

## Dependencies

- [pdf-parse](https://www.npmjs.com/package/pdf-parse): For parsing PDF files

## License

MIT
