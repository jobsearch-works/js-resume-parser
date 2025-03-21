const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

/**
 * A specialized parser for modern student/recent graduate resumes.
 * Focus on better extracting phone numbers, work experience, projects, and honors.
 * @param {string} resumeFilePath - The path to the resume file to parse.
 * @returns {Object} - An object containing parsed information.
 */
async function parseStudentFormat(resumeFilePath) {
  // Initialize parsed data structure
  const parsedData = {
    name: "",
    title: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    location: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    honors: [],
    references: "",
  };

  try {
    // Read the file content
    const dataBuffer = fs.readFileSync(resumeFilePath);
    console.log(`Successfully read file: ${resumeFilePath}`);

    // Parse PDF content
    const pdfData = await pdfParse(dataBuffer);
    console.log(`Number of pages: ${pdfData.numpages}`);

    // Extract text content
    const text = pdfData.text;
    console.log("Extracted text sample:", text.substring(0, 200) + "...");

    // Parse content based on patterns
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Extract basic information (typically at the top of the resume)
    extractBasicInfo(lines, parsedData);

    // Extract sections from the resume
    const sections = extractSections(lines);

    // Extract summary if available
    if (sections.summary && sections.summary.length > 0) {
      parsedData.summary = sections.summary.join(" ").trim();
    }

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

    // Extract projects
    if (sections.projects) {
      parsedData.projects = extractProjects(sections.projects);
    }

    // Extract honors and awards
    if (sections.honors) {
      parsedData.honors = extractHonors(sections.honors);
    }

    // Extract references
    if (sections.references) {
      parsedData.references = sections.references.join(" ").trim();
    }

    // Ensure all array fields are properly initialized
    parsedData.experience = parsedData.experience || [];
    parsedData.education = parsedData.education || [];
    parsedData.skills = parsedData.skills || [];
    parsedData.projects = parsedData.projects || [];
    parsedData.honors = parsedData.honors || [];
    // Convert references to array if needed by verification
    if (typeof parsedData.references === "string") {
      parsedData.references = parsedData.references
        ? [parsedData.references]
        : [];
    }

    // Note: Verification is now handled separately instead of being included in the parsed data
  } catch (error) {
    console.error(`Error parsing file: ${error.message}`);
  }

  return parsedData;
}

/**
 * Extract basic information from the resume (name, contact info, etc.)
 * @param {string[]} lines - Lines from the resume text
 * @param {Object} parsedData - Object to store the extracted data
 */
function extractBasicInfo(lines, parsedData) {
  // In modern student resumes, the name is typically the first line
  if (lines.length > 0) {
    parsedData.name = lines[0];
  }

  // Extract title/job role (usually second line)
  if (lines.length > 1 && !isContactInfo(lines[1])) {
    parsedData.title = lines[1];
  }

  // Extract contact information from the first 10 lines
  const contactInfoLines = lines.slice(0, 15);

  // Extract email using regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const line of contactInfoLines) {
    const match = line.match(emailRegex);
    if (match) {
      parsedData.email = match[0];
      break;
    }
  }

  // Extract phone number with more flexible pattern matching for international formats
  const phoneRegexes = [
    /(?:\+\d{1,3}[-.\s]?)?\(?(?:\d{1,4})\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // Most formats
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
    /\+\d{2}\s\d{3}\s\d{3}\s\d{3}/g, // European format +XX XXX XXX XXX
    /\+\d{1,3}\s\d{2,3}\s\d{3}\s\d{3,4}/g, // International format
  ];

  for (const line of contactInfoLines) {
    for (const regex of phoneRegexes) {
      const match = line.match(regex);
      if (match) {
        parsedData.phone = match[0];
        break;
      }
    }
    if (parsedData.phone) break;
  }

  // Extract LinkedIn with more flexible pattern matching
  const linkedinRegexes = [
    /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi,
    /linkedin:?\s*[a-zA-Z0-9/-]+/gi,
  ];

  for (const line of contactInfoLines) {
    for (const regex of linkedinRegexes) {
      const match = line.match(regex);
      if (match) {
        parsedData.linkedin = match[0];
        break;
      }
    }
    if (parsedData.linkedin) break;
  }

  // Extract GitHub if available
  const githubRegex = /github\.com\/[a-zA-Z0-9-]+/gi;
  for (const line of contactInfoLines) {
    const match = line.match(githubRegex);
    if (match) {
      parsedData.github = match[0];
      break;
    }
  }

  // Extract location
  const locationKeywords = ["location:", "address:", "based in", "residing in"];
  const cityOrCountry =
    /(?:^|\s)([A-Za-z\s]+,\s*[A-Za-z\s]+|[A-Za-z\s]+)(?:$|\s)/g;

  for (const line of contactInfoLines) {
    const lowerLine = line.toLowerCase();

    // Check if line contains a location keyword
    if (
      locationKeywords.some((keyword) =>
        lowerLine.includes(keyword.toLowerCase())
      )
    ) {
      parsedData.location = line
        .replace(/location:|address:|based in|residing in/gi, "")
        .trim();
      break;
    }

    // Check for city/country patterns if we haven't found a location yet
    if (
      !parsedData.location &&
      !isContactInfo(line) &&
      !lowerLine.includes("university") &&
      !line.includes(parsedData.name)
    ) {
      // Common location patterns like "City, Country" or just "City"
      const match = cityOrCountry.exec(line);
      if (match && match[1].length > 2) {
        // Avoid matching on short words
        parsedData.location = match[1].trim();
        break;
      }
    }
  }
}

/**
 * Check if a line is contact information
 * @param {string} line - Line to check
 * @returns {boolean} - True if the line is contact information
 */
function isContactInfo(line) {
  return (
    line.includes("@") || // Email
    line.includes("linkedin") || // LinkedIn
    line.includes("github") || // GitHub
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) || // Phone
    /\+\d{1,3}\s\d{3}\s\d{3}\s\d{3,4}/.test(line) // International phone
  );
}

/**
 * Extract sections from the resume
 * @param {string[]} lines - Lines from the resume text
 * @returns {Object} - Object with sections
 */
function extractSections(lines) {
  const sections = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    honors: [],
    references: [],
  };

  // Common section headers in modern student resumes
  const sectionHeaders = {
    summary: [
      "summary",
      "profile",
      "objective",
      "about me",
      "professional summary",
    ],
    experience: [
      "experience",
      "work experience",
      "professional experience",
      "employment history",
    ],
    education: ["education", "educational background", "academic background"],
    skills: ["skills", "technical skills", "core competencies", "expertise"],
    projects: [
      "projects",
      "key projects",
      "personal projects",
      "academic projects",
    ],
    honors: [
      "honors",
      "awards",
      "achievements",
      "recognitions",
      "honours and awards",
    ],
    references: ["references", "recommendations"],
  };

  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check if the current line is a section header
    let foundSection = false;
    for (const [section, headers] of Object.entries(sectionHeaders)) {
      if (
        headers.some((header) => {
          // Match full words only, accounting for common formatting
          return (
            line === header ||
            line.includes(header.toUpperCase()) ||
            line.replace(/:/g, "") === header ||
            line.startsWith(header)
          );
        })
      ) {
        currentSection = section;
        foundSection = true;
        break;
      }
    }

    // If not a section header and we're in a section, add to that section
    if (!foundSection && currentSection && i < lines.length - 1) {
      const nextLine = lines[i + 1].toLowerCase();

      // Check if next line is a new section header (indicating end of current section)
      const isNextSectionHeader = Object.values(sectionHeaders).some(
        (headers) =>
          headers.some(
            (header) =>
              nextLine === header ||
              nextLine.includes(header.toUpperCase()) ||
              nextLine.replace(/:/g, "") === header ||
              nextLine.startsWith(header)
          )
      );

      if (!isNextSectionHeader || i === lines.length - 2) {
        sections[currentSection].push(lines[i]);
      } else {
        // Move to the next section
        currentSection = null;
      }
    }
  }

  return sections;
}

/**
 * Extract work experience from the resume
 * @param {string[]} experienceLines - Lines from the experience section
 * @returns {Array} - Array of experience objects
 */
function extractExperience(experienceLines) {
  const experience = [];
  let currentExp = null;

  // Common date formats in resumes
  const datePattern =
    /(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{4}|\d{1,2}\.\d{4}|\d{1,2}\-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{2,4})/i;

  // Pattern for job title/company pair
  const jobTitlePattern = /^[A-Z][A-Za-z0-9\s\-&,\.]+$/;

  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i].trim();

    if (!line) continue;

    // Check if line is a job title (typically starts with capital letter)
    if (jobTitlePattern.test(line) && (i === 0 || line.length < 50)) {
      // This looks like a new job title, start a new experience entry
      if (currentExp) {
        experience.push(currentExp);
      }

      currentExp = {
        title: line,
        company: "",
        location: "",
        period: "",
        responsibilities: [],
      };

      // Check next line for company name or time period
      if (i + 1 < experienceLines.length) {
        const nextLine = experienceLines[i + 1].trim();

        if (datePattern.test(nextLine)) {
          // This line contains dates, extract the period
          currentExp.period = extractDateRange(nextLine);

          // Try to extract location if it's on the same line as the date
          const locationMatch = nextLine.match(/[A-Za-z\s]+,\s*[A-Za-z\s]+/);
          if (locationMatch) {
            currentExp.location = locationMatch[0].trim();
          }
        } else if (!jobTitlePattern.test(nextLine) && nextLine.length < 50) {
          // This is likely the company name
          currentExp.company = nextLine;

          // Check for date in the next line
          if (i + 2 < experienceLines.length) {
            const nextNextLine = experienceLines[i + 2].trim();
            if (datePattern.test(nextNextLine)) {
              currentExp.period = extractDateRange(nextNextLine);

              // Try to extract location if it's on the same line as the date
              const locationMatch = nextNextLine.match(
                /[A-Za-z\s]+,\s*[A-Za-z\s]+/
              );
              if (locationMatch) {
                currentExp.location = locationMatch[0].trim();
              }
            }
          }
        }
      }
    } else if (currentExp) {
      // If we have an active job entry, add this line as a responsibility
      // Skip lines that appear to be dates or have already been recorded
      if (
        !datePattern.test(line) &&
        line !== currentExp.company &&
        line !== currentExp.title &&
        line.length > 3
      ) {
        currentExp.responsibilities.push(line);
      }
    }
  }

  // Add the last job if we have one
  if (currentExp) {
    experience.push(currentExp);
  }

  return experience;
}

/**
 * Extract education information from the resume
 * @param {string[]} educationLines - Lines from the education section
 * @returns {Array} - Array of education objects
 */
function extractEducation(educationLines) {
  const education = [];
  let currentEdu = null;

  const degreePattern =
    /(?:Bachelor|Master|PhD|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|M\.B\.A\.|Ph\.D|Diploma|Certificate|Degree)/i;
  const datePattern =
    /(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{4}|\d{1,2}\.\d{4}|\d{1,2}\-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{2,4})/i;

  for (let i = 0; i < educationLines.length; i++) {
    const line = educationLines[i].trim();

    if (!line) continue;

    // Check if line contains a degree
    if (degreePattern.test(line) || (i === 0 && line.length < 50)) {
      // Start a new education entry
      if (currentEdu) {
        education.push(currentEdu);
      }

      currentEdu = {
        degree: line,
        institution: "",
        location: "",
        period: "",
        details: [],
      };

      // Check next line for institution name or time period
      if (i + 1 < educationLines.length) {
        const nextLine = educationLines[i + 1].trim();

        if (datePattern.test(nextLine)) {
          // This line contains dates
          currentEdu.period = extractDateRange(nextLine);

          // Try to extract location if it's on the same line as the date
          const locationMatch = nextLine.match(/[A-Za-z\s]+,\s*[A-Za-z\s]+/);
          if (locationMatch) {
            currentEdu.location = locationMatch[0].trim();
          }
        } else {
          // This is likely the institution name
          currentEdu.institution = nextLine;

          // Check for date in the next line
          if (i + 2 < educationLines.length) {
            const nextNextLine = educationLines[i + 2].trim();
            if (datePattern.test(nextNextLine)) {
              currentEdu.period = extractDateRange(nextNextLine);

              // Try to extract location if it's on the same line as the date
              const locationMatch = nextNextLine.match(
                /[A-Za-z\s]+,\s*[A-Za-z\s]+/
              );
              if (locationMatch) {
                currentEdu.location = locationMatch[0].trim();
              }
            }
          }
        }
      }
    } else if (currentEdu) {
      // If we have an active education entry, add this line as a detail
      // Skip lines that appear to be dates or have already been recorded
      if (
        !datePattern.test(line) &&
        line !== currentEdu.institution &&
        line !== currentEdu.degree &&
        line.length > 3
      ) {
        currentEdu.details.push(line);
      }
    }
  }

  // Add the last education if we have one
  if (currentEdu) {
    education.push(currentEdu);
  }

  return education;
}

/**
 * Extract skills from the resume
 * @param {string[]} skillsLines - Lines from the skills section
 * @returns {Array} - Array of skills
 */
function extractSkills(skillsLines) {
  const skills = [];

  // Process each line
  for (const line of skillsLines) {
    // If line has commas, split by commas
    if (line.includes(",")) {
      const splitSkills = line.split(",").map((skill) => skill.trim());
      skills.push(...splitSkills);
    }
    // If line has bullet points, split by bullet points
    else if (line.includes("•")) {
      const splitSkills = line
        .split("•")
        .map((skill) => skill.trim())
        .filter((skill) => skill);
      skills.push(...splitSkills);
    }
    // Otherwise, add the whole line as one skill or try to split by whitespace
    else {
      // Check if this is a list of short skills separated by spaces
      const words = line.split(/\s+/);
      if (words.length > 3 && words.every((word) => word.length < 20)) {
        // This might be a list of technologies/tools
        skills.push(line);
      } else {
        skills.push(line);
      }
    }
  }

  return skills;
}

/**
 * Extract projects from the resume
 * @param {string[]} projectLines - Lines from the projects section
 * @returns {Array} - Array of project objects
 */
function extractProjects(projectLines) {
  const projects = [];
  let currentProject = null;

  const projectNamePattern = /^[A-Z][A-Za-z0-9\s\-&,\.]+$/;
  const datePattern =
    /\(?\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{4}\)?|\(?\d{1,2}\/\d{4}\s*-\s*(?:present|current|now)\)?|\(\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{4}\)/i;

  for (let i = 0; i < projectLines.length; i++) {
    const line = projectLines[i].trim();

    if (!line) continue;

    // Skip if this line is a section header like "HONORS AND AWARDS"
    if (line.toUpperCase() === line && line.length > 10 && i > 0) {
      break;
    }

    // Check if line is a project name (typically starts with capital letter)
    // Or if it contains a date range in parentheses
    if (projectNamePattern.test(line) || datePattern.test(line)) {
      // This looks like a new project title, start a new project entry
      if (currentProject) {
        projects.push(currentProject);
      }

      currentProject = {
        name: "",
        timeframe: "",
        description: [],
      };

      // Extract project name and timeframe
      const timeframeMatch = line.match(datePattern);
      if (timeframeMatch) {
        // The line contains a timeframe
        currentProject.timeframe = timeframeMatch[0]
          .replace(/[()]/g, "")
          .trim();

        // The project name is likely the text before the timeframe
        const nameEndIndex = line.indexOf(timeframeMatch[0]);
        if (nameEndIndex > 0) {
          currentProject.name = line.substring(0, nameEndIndex).trim();
        } else {
          currentProject.name = line.replace(timeframeMatch[0], "").trim();
        }
      } else {
        // No timeframe in this line, it's just the project name
        currentProject.name = line;
      }
    } else if (currentProject) {
      // If we have an active project entry, add this line as a description
      currentProject.description.push(line);
    }
  }

  // Add the last project if we have one
  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

/**
 * Extract honors and awards from the resume
 * @param {string[]} honorsLines - Lines from the honors and awards section
 * @returns {Array} - Array of honor objects
 */
function extractHonors(honorsLines) {
  const honors = [];
  let currentHonor = null;

  const datePattern = /\(?\d{1,2}\/\d{4}\)?|\(?\d{2}\)?/i;

  for (let i = 0; i < honorsLines.length; i++) {
    const line = honorsLines[i].trim();

    if (!line) continue;

    // Check if line contains a date (often awards have dates)
    if (
      datePattern.test(line) ||
      i === 0 ||
      (line.charAt(0) === line.charAt(0).toUpperCase() && line.length < 50)
    ) {
      // This looks like a new honor/award, start a new entry
      if (currentHonor) {
        honors.push(currentHonor);
      }

      currentHonor = {
        title: "",
        date: "",
        description: [],
      };

      // Extract title and date
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        // The line contains a date
        currentHonor.date = dateMatch[0].replace(/[()]/g, "").trim();

        // The title is likely the text before the date
        const titleEndIndex = line.indexOf(dateMatch[0]);
        if (titleEndIndex > 0) {
          currentHonor.title = line.substring(0, titleEndIndex).trim();
        } else {
          currentHonor.title = line.replace(dateMatch[0], "").trim();
        }
      } else {
        // No date in this line, it's just the title
        currentHonor.title = line;
      }
    } else if (currentHonor) {
      // If we have an active honor entry, add this line as a description
      currentHonor.description.push(line);
    }
  }

  // Add the last honor if we have one
  if (currentHonor) {
    honors.push(currentHonor);
  }

  return honors;
}

/**
 * Helper function to extract date ranges from text
 * @param {string} text - Text that may contain a date range
 * @returns {string} - The extracted date range
 */
function extractDateRange(text) {
  // Match various date formats with hyphens, en-dashes, or "to" in between
  const dateRangePattern =
    /(?:\d{1,2}\/\d{2,4}|\d{1,2}\.\d{4}|\d{1,2}\-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{2,4})(?:[\s-–—]+(?:to|until|present|current|now)[\s-]+|\s*[-–—]\s*|\s+to\s+)(?:\d{1,2}\/\d{2,4}|\d{1,2}\.\d{4}|\d{1,2}\-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{2,4}|(?:present|current|now))/i;

  const match = text.match(dateRangePattern);
  if (match) {
    return match[0].trim();
  }

  // If a full range wasn't found, look for a single date which might imply "to present"
  const singleDatePattern =
    /(?:\d{1,2}\/\d{2,4}|\d{1,2}\.\d{4}|\d{1,2}\-\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s./-]+\d{2,4})/i;
  const singleMatch = text.match(singleDatePattern);
  if (singleMatch) {
    return singleMatch[0].trim();
  }

  return text.trim();
}

// Export the parser with a descriptive name and metadata
module.exports = {
  name: "student",
  displayName: "Modern Student Format Parser",
  description:
    "Specialized parser for modern student and recent graduate resume formats",
  parse: parseStudentFormat,
};
