// resumeParser.js
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { verifyParsedContent } = require("./verificationUtils");

/**
 * A simple parser for resumes.
 * This function will take a resume file path and extract relevant information.
 * @param {string} resumeFilePath - The path to the resume file to parse.
 * @returns {Object} - An object containing parsed information.
 */
async function parseResume(resumeFilePath) {
  // Initialize parsed data structure
  const parsedData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };

  try {
    // Read the file content
    const dataBuffer = fs.readFileSync(resumeFilePath);
    console.log(`Successfully read file: ${resumeFilePath}`);

    // Parse PDF content
    const pdfData = await pdfParse(dataBuffer);
    console.log(`Number of pages: ${pdfData.numpages}`);
    console.log(`PDF version: ${pdfData.info.PDFFormatVersion}`);

    // Extract text content
    const text = pdfData.text;
    console.log("Extracted text sample:", text.substring(0, 200) + "...");

    // Parse content based on patterns
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Extract basic information
    extractBasicInfo(lines, parsedData);

    // Extract sections based on common section headers
    const sections = extractSections(lines);

    // Extract experience information
    if (sections.experience) {
      parsedData.experience = extractExperience(sections.experience);
    }

    // Extract education information
    if (sections.education) {
      parsedData.education = extractEducation(sections.education);
    }

    // Extract skills
    if (sections.skills) {
      parsedData.skills = extractSkills(sections.skills);
    }

    // Extract languages
    if (sections.languages) {
      parsedData.languages = sections.languages.map((line) => line.trim());
    }

    // Extract certifications
    if (sections.certifications) {
      parsedData.certifications = sections.certifications.map((line) =>
        line.trim()
      );
    }

    // Verify that all important content is captured using the verification utility
    const verificationResults = verifyParsedContent(text, parsedData);
    parsedData.verificationResults = verificationResults;
  } catch (error) {
    console.error(`Error parsing file: ${error.message}`);
  }

  return parsedData;
}

/**
 * Extract basic information (name, email, phone, etc.) from resume text
 * @param {string[]} lines - Lines from the resume text
 * @param {Object} parsedData - Object to store the extracted data
 */
function extractBasicInfo(lines, parsedData) {
  // Extract name (typically the first line)
  if (lines.length > 0) {
    parsedData.name = lines[0];
  }

  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const line of lines) {
    const match = line.match(emailRegex);
    if (match) {
      parsedData.email = match[0];
      break;
    }
  }

  // Extract phone
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  for (const line of lines) {
    const match = line.match(phoneRegex);
    if (match) {
      parsedData.phone = match[0];
      break;
    }
  }

  // Extract LinkedIn
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/i;
  for (const line of lines) {
    const match = line.match(linkedinRegex);
    if (match) {
      parsedData.linkedin = match[0];
      break;
    }
  }

  // Extract address (common format indicators)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for lines that look like addresses
    if (
      (line.includes("St") ||
        line.includes("Ave") ||
        line.includes("Road") ||
        line.includes("Blvd") ||
        line.includes("Street") ||
        line.includes("Avenue")) &&
      (/[A-Z]{2}/.test(line) ||
        line.includes("NY") ||
        line.includes("CA") ||
        line.includes("TX")) &&
      /\d{5}/.test(line)
    ) {
      parsedData.address = line;
      break;
    }
  }
}

/**
 * Extract different sections from the resume
 * @param {string[]} lines - Lines from the resume text
 * @returns {Object} - Object with different sections as properties
 */
function extractSections(lines) {
  const sections = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };

  let currentSection = null;

  // Define section headers to look for
  const sectionHeaders = {
    summary: [
      "summary",
      "professional summary",
      "profile",
      "about me",
      "objective",
    ],
    experience: [
      "experience",
      "work experience",
      "employment history",
      "work history",
      "professional experience",
    ],
    education: ["education", "academic background", "academic history"],
    skills: [
      "skills",
      "technical skills",
      "core competencies",
      "competencies",
      "key skills",
    ],
    languages: ["languages", "language proficiency"],
    certifications: [
      "certifications",
      "certificates",
      "professional certifications",
    ],
  };

  // Find sections in the text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check if the current line is a section header
    let foundSection = false;
    for (const [section, headers] of Object.entries(sectionHeaders)) {
      if (
        headers.some(
          (header) =>
            line === header ||
            line.includes(header + ":") ||
            line.includes(header + " ") ||
            line === header.toUpperCase() ||
            line === header.charAt(0).toUpperCase() + header.slice(1)
        )
      ) {
        currentSection = section;
        foundSection = true;
        break;
      }
    }

    // If not a section header and we're in a section, add the line to that section
    if (!foundSection && currentSection) {
      // Check if we've moved to a new section by checking for another section header
      if (
        Object.values(sectionHeaders).some((headers) =>
          headers.some(
            (header) =>
              line === header ||
              line.includes(header + ":") ||
              line.includes(header + " ") ||
              line === header.toUpperCase() ||
              line === header.charAt(0).toUpperCase() + header.slice(1)
          )
        )
      ) {
        // A new section has started
        currentSection = null;
      } else {
        // Still in the current section
        sections[currentSection].push(lines[i]);
      }
    }
  }

  return sections;
}

/**
 * Extract experience information from the experience section
 * @param {string[]} experienceLines - Lines from the experience section
 * @returns {Array} - Array of experience objects
 */
function extractExperience(experienceLines) {
  const experiences = [];
  let currentExperience = null;

  // Date patterns to look for
  const datePattern =
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?(?:\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?|present|current|now))?/i;

  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i];

    // Look for company/position patterns (typically has a date)
    if (datePattern.test(line.toLowerCase())) {
      // If we already have a current experience, save it
      if (currentExperience) {
        experiences.push(currentExperience);
      }

      // Start a new experience entry
      currentExperience = {
        company: "",
        position: "",
        period: "",
        description: [],
      };

      // Extract the date period
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        currentExperience.period = dateMatch[0];
      }

      // The rest is likely the company and/or position
      const remainingInfo = line.replace(datePattern, "").trim();

      // Try to separate company from position
      if (remainingInfo.includes(" at ")) {
        const parts = remainingInfo.split(" at ");
        currentExperience.position = parts[0].trim();
        currentExperience.company = parts[1].trim();
      } else if (
        remainingInfo.includes(" - ") ||
        remainingInfo.includes(" – ")
      ) {
        const parts = remainingInfo.split(/\s+-\s+|\s+–\s+/);
        currentExperience.position = parts[0].trim();
        currentExperience.company = parts[1].trim();
      } else {
        // Just use the whole thing as a company for now
        currentExperience.company = remainingInfo;
      }
    }
    // Otherwise, it's likely a description line for the current experience
    else if (currentExperience) {
      // Add to description if it's not an empty line or another date
      if (line.trim() && !datePattern.test(line.toLowerCase())) {
        currentExperience.description.push(line);
      }
    }
  }

  // Add the last experience if there is one
  if (currentExperience) {
    experiences.push(currentExperience);
  }

  return experiences;
}

/**
 * Extract education information from the education section
 * @param {string[]} educationLines - Lines from the education section
 * @returns {Array} - Array of education objects
 */
function extractEducation(educationLines) {
  const education = [];
  let currentEducation = null;

  // Date patterns to look for
  const datePattern =
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?(?:\s*[-–—]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?|present|current|now))|\d{4}(?:\s*[-–—]\s*(?:\d{4}|present|current|now))?/i;

  // Degree patterns
  const degreePattern =
    /(?:bachelor|master|phd|ph\.d|doctorate|mba|bs|ba|ms|ma|associate)[^\n]*/i;

  for (let i = 0; i < educationLines.length; i++) {
    const line = educationLines[i];

    // Look for institution/degree patterns (typically has a date or degree mention)
    if (
      datePattern.test(line.toLowerCase()) ||
      degreePattern.test(line.toLowerCase())
    ) {
      // If we already have a current education, save it
      if (currentEducation) {
        education.push(currentEducation);
      }

      // Start a new education entry
      currentEducation = {
        institution: "",
        degree: "",
        period: "",
        details: [],
      };

      // Extract the date period
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        currentEducation.period = dateMatch[0];
      }

      // Extract degree information
      const degreeMatch = line.match(degreePattern);
      if (degreeMatch) {
        currentEducation.degree = degreeMatch[0];
      }

      // The rest is likely the institution
      let remainingInfo = line;
      if (dateMatch) {
        remainingInfo = remainingInfo.replace(dateMatch[0], "");
      }
      if (degreeMatch) {
        remainingInfo = remainingInfo.replace(degreeMatch[0], "");
      }

      currentEducation.institution = remainingInfo.replace(/,|;/g, "").trim();
    }
    // Otherwise, it's likely a details line for the current education
    else if (currentEducation) {
      // Add to details if it's not an empty line or another date
      if (line.trim() && !datePattern.test(line.toLowerCase())) {
        currentEducation.details.push(line);
      }
    }
  }

  // Add the last education if there is one
  if (currentEducation) {
    education.push(currentEducation);
  }

  return education;
}

/**
 * Extract skills from the skills section
 * @param {string[]} skillsLines - Lines from the skills section
 * @returns {Array} - Array of skill strings
 */
function extractSkills(skillsLines) {
  const skills = [];

  for (const line of skillsLines) {
    // Split line by common delimiters
    const skillsInLine = line.split(/[,|•·;]/);

    for (const skill of skillsInLine) {
      const trimmedSkill = skill.trim();
      if (trimmedSkill && trimmedSkill.length > 1) {
        skills.push(trimmedSkill);
      }
    }
  }

  return skills;
}

/**
 * Processes all resume files in the resumes directory
 */
async function processAllResumes() {
  const resumesDir = path.join(__dirname, "resumes");

  try {
    // Make sure the parsed directory exists
    const parsedDir = path.join(__dirname, "parsed", "default-parser");
    if (!fs.existsSync(parsedDir)) {
      fs.mkdirSync(parsedDir, { recursive: true });
    }

    // Get all files in the resumes directory
    const files = fs.readdirSync(resumesDir);
    const pdfFiles = files.filter(
      (file) =>
        path.extname(file).toLowerCase() === ".pdf" ||
        file.toLowerCase().endsWith(".docx.pdf")
    );

    console.log(`Found ${pdfFiles.length} resume files to process`);

    // Process each resume file
    const results = [];
    for (const file of pdfFiles) {
      const filePath = path.join(resumesDir, file);
      console.log(`Processing: ${file}`);

      const result = await parseResume(filePath);

      // Save the parsed data to a JSON file
      const fileName = path.basename(file, path.extname(file));
      const outputPath = path.join(parsedDir, `${fileName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`Parsed data saved to: ${outputPath}`);

      results.push({
        file,
        result,
      });
    }

    // Output summary
    console.log("\nParsing Summary:");
    results.forEach((item) => {
      console.log(`\nFile: ${item.file}`);
      console.log(`Name: ${item.result.name}`);
      console.log(`Email: ${item.result.email}`);
      console.log(`Phone: ${item.result.phone}`);
      console.log(`LinkedIn: ${item.result.linkedin || "Not found"}`);
      console.log(`Experience: ${item.result.experience.length} positions`);
      console.log(`Education: ${item.result.education.length} entries`);
      console.log(`Skills: ${item.result.skills.length} skills`);
      if (item.result.verificationResults) {
        console.log(
          `Content coverage: ${item.result.verificationResults.coveragePercentage.toFixed(
            2
          )}%`
        );
        console.log(
          `Missing content chunks: ${item.result.verificationResults.missingContent.length}`
        );
      }
    });

    console.log(
      `\nAll results have been saved to the 'parsed/default-parser' directory`
    );
  } catch (error) {
    console.error(`Error processing resumes: ${error.message}`);
  }
}

// Run the processor
processAllResumes().catch((error) => {
  console.error("Error:", error);
});

// Export the parseResume function for use in other files
module.exports = {
  parseResume,
};
