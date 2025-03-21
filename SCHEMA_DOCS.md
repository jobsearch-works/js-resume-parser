# Resume Parser Schema Documentation

## Overview

This document describes the standardized output schema for all resume parsers in this system. Using a schema ensures that all parsers produce output in a consistent format, making it easier to work with parsed data regardless of which parser was used.

## Schema Structure

The resume parser output follows this general structure:

```javascript
{
  // Basic Information
  "name": "John Doe",
  "title": "Software Engineer",
  "email": "john@example.com",
  "phone": "+1234567890",
  "linkedin": "linkedin.com/in/johndoe",
  "github": "github.com/johndoe",
  "address": "123 Main St, City, Country",
  "location": "City, Country",
  "summary": "Experienced software engineer...",

  // Experience Section
  "experience": [
    {
      "title": "Software Engineer",
      "position": "Senior Developer",
      "company": "Tech Company",
      "location": "City, Country",
      "period": "Jan 2020 - Present",
      "responsibilities": ["Developed...", "Implemented..."]
    }
  ],

  // Education Section
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "location": "City, Country",
      "period": "2016 - 2020",
      "details": ["GPA: 3.8", "Relevant coursework: ..."]
    }
  ],

  // Skills Section
  "skills": ["JavaScript", "React", "Node.js"],

  // Additional Sections
  "languages": ["English (Native)", "Spanish (Intermediate)"],
  "certifications": ["AWS Certified Developer", "Google Cloud Professional"],
  "projects": [
    {
      "name": "Project Name",
      "timeframe": "2020",
      "link": "https://github.com/example/project",
      "description": ["Built a web app...", "Implemented features..."]
    }
  ],
  "honors": [
    {
      "title": "Award Name",
      "date": "2019",
      "description": ["Recognized for excellence in..."]
    }
  ],
  "references": ["Available upon request"]
}
```

## Field Descriptions

### Basic Information

- `name` (string, required): The person's full name
- `title` (string, optional): Job title or professional designation
- `email` (string, required): Email address
- `phone` (string, required): Phone number in any format
- `linkedin` (string, optional): LinkedIn profile URL or handle
- `github` (string, optional): GitHub profile URL or handle
- `address` (string, optional): Full address or partial address
- `location` (string, optional): City, state, country
- `summary` (string, optional): Professional summary or objective

### Experience Section

- `experience` (array, required): List of work experiences
  - `title` (string, optional): Job title
  - `position` (string, optional): Alternative to title
  - `company` (string, optional): Company name
  - `location` (string, optional): Job location
  - `period` (string, optional): Employment period
  - `responsibilities` (array, required): List of job responsibilities
  - `description` (array, optional): Alternative to responsibilities

### Education Section

- `education` (array, required): List of educational backgrounds
  - `degree` (string, optional): Degree earned
  - `institution` (string, optional): School/university name
  - `location` (string, optional): Institution location
  - `period` (string, optional): Period of study
  - `details` (array, required): Additional education details

### Skills and Additional Sections

- `skills` (array, required): List of skills
- `languages` (array, optional): List of languages
- `certifications` (array, optional): List of certifications
- `projects` (array, optional): List of projects
  - `name` (string, required): Project name
  - `timeframe` (string, optional): Project timeframe
  - `link` (string, optional): Link to project
  - `description` (array, required): Project description
- `honors` (array, optional): List of awards and honors
  - `title` (string, required): Award name
  - `date` (string, optional): Award date
  - `description` (array, required): Award description
- `references` (array, optional): List of references

## How Validation Works

1. Each parser implements its own logic to extract information from resumes.
2. The parser output is passed through the `validateAndNormalize` function in `parsers/schema.js`.
3. This function validates the data against the schema and normalizes the output.
4. Missing required fields are populated with default values.
5. Field names are standardized across parsers.

## Adding a New Parser

When creating a new parser, you don't need to worry about matching the exact output structure during development. Just focus on extracting as much information as possible from the resume format you're targeting.

Your parser should:

1. Export a `name`, `displayName`, and `description`
2. Export a `parse` function that takes a resume file path and returns an object with extracted data
3. Be registered in `parsers/index.js`

The schema validation system will handle normalizing your parser's output to match the standardized format.

## Example Parser Integration

```javascript
// my-custom-parser.js
async function parseMyFormat(resumeFilePath) {
  // Your parsing logic here
  return extractedData;
}

module.exports = {
  name: "custom",
  displayName: "My Custom Parser",
  description: "Parser for XYZ resume format",
  parse: parseMyFormat,
};

// Then register in parsers/index.js
const customParser = require("./my-custom-parser");
const parsers = {
  // ...existing parsers
  custom: customParser,
};
```

The standardized output structure ensures that all parsers can be used interchangeably, and downstream applications can rely on a consistent data format.
