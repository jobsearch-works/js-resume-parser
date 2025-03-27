const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

/**
 * A specialized parser for resumes similar to Serter_I.pdf format.
 * This function will take resume text and extract relevant information.
 * @param {string} text - The resume text to parse.
 * @returns {Object} - An object containing parsed information.
 */
async function parseSerterFormat(text) {
  // Initialize parsed data structure
  const parsedData = {
    name: "",
    title: "",
    email: "",
    phone: "",
    linkedin: "",
    location: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  try {
    // Parse content based on patterns
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Extract basic information (typically at the top of the resume)
    extractBasicInfo(lines, parsedData);

    // Extract sections based on Serter format section headers
    const sections = extractSections(lines);

    // Process each section
    if (sections.summary && sections.summary.length > 0) {
      parsedData.summary = sections.summary.join(" ");
    }

    if (sections.experience) {
      parsedData.experience = extractExperience(sections.experience);
    }

    if (sections.education) {
      parsedData.education = extractEducation(sections.education);
    }

    if (sections.skills) {
      parsedData.skills = extractSkills(sections.skills);
    }

    if (sections.projects) {
      parsedData.projects = extractProjects(sections.projects);
    }

    if (sections.certifications) {
      parsedData.certifications = sections.certifications.map((line) => line.trim());
    }

    if (sections.languages) {
      parsedData.languages = sections.languages.map((line) => line.trim());
    }

    // Ensure all array fields are properly initialized
    parsedData.experience = parsedData.experience || [];
    parsedData.education = parsedData.education || [];
    parsedData.skills = parsedData.skills || [];
    parsedData.projects = parsedData.projects || [];
    parsedData.certifications = parsedData.certifications || [];
    parsedData.languages = parsedData.languages || [];

  } catch (error) {
    console.error(`Error parsing text: ${error.message}`);
  }

  return parsedData;
}

/**
 * Extract basic information from the resume (name, contact info, etc.)
 * @param {string[]} lines - Lines from the resume text
 * @param {Object} parsedData - Object to store the extracted data
 */
function extractBasicInfo(lines, parsedData) {
  // In Serter format, the name is typically the first line in larger/bold text
  if (lines.length > 0) {
    parsedData.name = lines[0];
  }

  // Title usually follows the name
  if (lines.length > 1) {
    // If the second line looks like a title (no email/phone/etc.)
    if (
      !lines[1].includes("@") &&
      !lines[1].match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)
    ) {
      parsedData.title = lines[1];
    }
  }

  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const line of lines.slice(0, 10)) {
    // Only check first few lines
    const match = line.match(emailRegex);
    if (match) {
      parsedData.email = match[0];
      break;
    }
  }

  // Extract phone
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  for (const line of lines.slice(0, 10)) {
    const match = line.match(phoneRegex);
    if (match) {
      parsedData.phone = match[0];
      break;
    }
  }

  // Extract LinkedIn
  const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin:)([a-zA-Z0-9-]+)/i;
  for (const line of lines.slice(0, 10)) {
    const match = line.match(linkedinRegex);
    if (match) {
      parsedData.linkedin = match[0];
      break;
    }
  }

  // Extract location (often near contact details)
  const locationIndicators = ["located in", "location:", "address:", "city:"];
  for (const line of lines.slice(0, 15)) {
    const lowerLine = line.toLowerCase();
    if (
      locationIndicators.some((indicator) => lowerLine.includes(indicator)) ||
      (line.includes(",") && /[A-Z]{2}/.test(line))
    ) {
      parsedData.location = line;
      break;
    }
  }
}

/**
 * Extract different sections from the resume based on Serter format
 * @param {string[]} lines - Lines from the resume text
 * @returns {Object} - Object with different sections as properties
 */
function extractSections(lines) {
  const sections = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  let currentSection = null;

  // Define section headers typical for Serter format
  const sectionHeaders = {
    summary: [
      "summary",
      "professional summary",
      "profile",
      "about me",
      "about",
    ],
    experience: [
      "experience",
      "work experience",
      "employment history",
      "work history",
      "professional experience",
    ],
    education: [
      "education",
      "academic background",
      "academic history",
      "qualifications",
    ],
    skills: [
      "skills",
      "technical skills",
      "core competencies",
      "competencies",
      "key skills",
      "technical competencies",
    ],
    projects: [
      "projects",
      "key projects",
      "personal projects",
      "professional projects",
    ],
    certifications: [
      "certifications",
      "certificates",
      "credentials",
      "professional certifications",
    ],
    languages: ["languages", "language proficiency", "spoken languages"],
  };

  // Find sections in the text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Check if the current line is a section header
    let foundSection = false;
    for (const [section, headers] of Object.entries(sectionHeaders)) {
      // Section headers in Serter format are often CAPITALIZED or followed by a colon
      if (
        headers.some(
          (header) =>
            line === header ||
            line === header.toUpperCase() ||
            line.startsWith(header + ":") ||
            line.startsWith(header.toUpperCase() + ":") ||
            line === header.charAt(0).toUpperCase() + header.slice(1)
        )
      ) {
        currentSection = section;
        foundSection = true;
        break;
      }
    }

    // If not a section header and we're in a section, add the line
    if (!foundSection && currentSection) {
      // Check if we've hit another section header
      const isNewSectionHeader = Object.values(sectionHeaders).some((headers) =>
        headers.some(
          (header) =>
            line === header ||
            line === header.toUpperCase() ||
            line.startsWith(header + ":") ||
            line.startsWith(header.toUpperCase() + ":") ||
            line === header.charAt(0).toUpperCase() + header.slice(1)
        )
      );

      if (isNewSectionHeader) {
        currentSection = null;
      } else {
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
  const datePattern =
    /(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|—|to)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|—|to)\s*(?:Present|Current|Now)\b|\b\d{4}\s*(?:-|–|—|to)\s*\d{4}\b|\b\d{4}\s*(?:-|–|—|to)\s*(?:Present|Current|Now)\b)/i;

  // For Serter format, job titles are often bold/larger text, followed by company, then dates
  for (let i = 0; i < experienceLines.length; i++) {
    const line = experienceLines[i];

    // Check if this looks like a job title line (often starts with a title)
    if (
      i === 0 ||
      (line.length > 0 &&
        (datePattern.test(line) || // Contains a date range
          /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) || // Proper noun (company name)
          /(?:Senior|Junior|Lead|Principal|Software|Engineer|Developer|Manager|Director|Consultant)/i.test(
            line
          ))) // Job title keywords
    ) {
      // Save previous experience if exists
      if (
        currentExperience &&
        (currentExperience.title || currentExperience.company)
      ) {
        experiences.push(currentExperience);
      }

      // Start a new experience entry
      currentExperience = {
        title: "",
        company: "",
        location: "",
        period: "",
        responsibilities: [],
      };

      // Extract date if present
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        currentExperience.period = dateMatch[0];

        // If we found a date, the rest might be title and/or company
        const remainingText = line.replace(datePattern, "").trim();
        if (remainingText) {
          // Try to separate title from company
          if (remainingText.includes(" at ")) {
            const parts = remainingText.split(" at ");
            currentExperience.title = parts[0].trim();
            currentExperience.company = parts[1].trim();
          } else if (remainingText.includes(" | ")) {
            const parts = remainingText.split(" | ");
            currentExperience.title = parts[0].trim();
            currentExperience.company = parts[1].trim();
          } else if (remainingText.includes(", ")) {
            const parts = remainingText.split(", ");
            currentExperience.title = parts[0].trim();
            currentExperience.company = parts[1].trim();
          } else {
            // Can't easily separate, likely just the title
            currentExperience.title = remainingText;
          }
        }
      } else {
        // No date on this line, might be just title or company
        if (line.includes(" at ")) {
          const parts = line.split(" at ");
          currentExperience.title = parts[0].trim();
          currentExperience.company = parts[1].trim();
        } else if (
          i + 1 < experienceLines.length &&
          datePattern.test(experienceLines[i + 1])
        ) {
          // Next line has the date, so this is likely title/company
          currentExperience.title = line;
        } else {
          // Best guess: first line of new entry is the title
          currentExperience.title = line;
        }
      }
    } else if (currentExperience) {
      // If the current line contains a date but we already have a title, it's likely the company or date
      if (
        datePattern.test(line) &&
        currentExperience.title &&
        !currentExperience.period
      ) {
        const dateMatch = line.match(datePattern);
        currentExperience.period = dateMatch[0];

        // The rest might be the company
        const remainingText = line.replace(datePattern, "").trim();
        if (remainingText && !currentExperience.company) {
          currentExperience.company = remainingText;
        }
      }
      // Look for common location patterns if we don't have one yet
      else if (
        !currentExperience.location &&
        line.includes(", ") &&
        /[A-Z]{2}/.test(line)
      ) {
        currentExperience.location = line;
      }
      // Otherwise it's likely a responsibility bullet
      else if (line.trim().length > 0) {
        // Clean up bullet points for consistency
        const cleanedLine = line.replace(/^[•●■◼︎]/, "").trim();
        if (cleanedLine.length > 0) {
          currentExperience.responsibilities.push(cleanedLine);
        }
      }
    }
  }

  // Add the last experience if there is one
  if (
    currentExperience &&
    (currentExperience.title || currentExperience.company)
  ) {
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
  const datePattern =
    /\b(?:\d{4}(?:\s*-\s*|\s*–\s*|\s*—\s*|\s+to\s+)(?:\d{4}|present|current|now)|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|—|to)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|—|to)\s*(?:Present|Current|Now))\b/i;
  const degreePattern =
    /\b(?:Bachelor|Master|PhD|Ph\.D|Doctorate|MBA|BS|BA|MS|MA|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.E\.|M\.E\.|B\.Tech|M\.Tech)[a-zA-Z\.\s,]*(?:in|of)?\s+[a-zA-Z\s,]+\b/i;

  for (let i = 0; i < educationLines.length; i++) {
    const line = educationLines[i];

    // Check if this looks like a new education entry
    if (
      i === 0 ||
      degreePattern.test(line) ||
      datePattern.test(line) ||
      line.includes("University") ||
      line.includes("College") ||
      line.includes("School") ||
      /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line)
    ) {
      // Proper noun (likely institution name)

      // Save previous education if exists
      if (
        currentEducation &&
        (currentEducation.degree || currentEducation.institution)
      ) {
        education.push(currentEducation);
      }

      // Start a new education entry
      currentEducation = {
        degree: "",
        institution: "",
        location: "",
        period: "",
        details: [],
      };

      // Extract degree if present
      const degreeMatch = line.match(degreePattern);
      if (degreeMatch) {
        currentEducation.degree = degreeMatch[0].trim();
      }

      // Extract date if present
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        currentEducation.period = dateMatch[0];
      }

      // The remaining text might be the institution
      let remainingText = line;
      if (degreeMatch) {
        remainingText = remainingText.replace(degreeMatch[0], "");
      }
      if (dateMatch) {
        remainingText = remainingText.replace(dateMatch[0], "");
      }

      // Clean up remaining text (remove commas, pipe symbols, etc.)
      remainingText = remainingText.replace(/[,|]/g, "").trim();

      if (remainingText) {
        // If it looks like an institution name, use it
        if (
          remainingText.includes("University") ||
          remainingText.includes("College") ||
          remainingText.includes("School") ||
          /^[A-Z][a-z]+ [A-Z][a-z]+/.test(remainingText)
        ) {
          currentEducation.institution = remainingText;
        }
      }
    } else if (currentEducation) {
      // If we already have degree and institution but no date yet
      if (
        currentEducation.degree &&
        currentEducation.institution &&
        !currentEducation.period &&
        datePattern.test(line)
      ) {
        const dateMatch = line.match(datePattern);
        currentEducation.period = dateMatch[0];
      }
      // If we have institution but no degree yet
      else if (
        currentEducation.institution &&
        !currentEducation.degree &&
        degreePattern.test(line)
      ) {
        const degreeMatch = line.match(degreePattern);
        currentEducation.degree = degreeMatch[0].trim();
      }
      // If we have degree but no institution yet
      else if (
        currentEducation.degree &&
        !currentEducation.institution &&
        (line.includes("University") ||
          line.includes("College") ||
          line.includes("School"))
      ) {
        currentEducation.institution = line;
      }
      // Otherwise it might be additional details
      else if (line.trim().length > 0) {
        // Clean up bullet points for consistency
        const cleanedLine = line.replace(/^[•●■◼︎]/, "").trim();
        if (cleanedLine.length > 0) {
          currentEducation.details.push(cleanedLine);
        }
      }
    }
  }

  // Add the last education if there is one
  if (
    currentEducation &&
    (currentEducation.degree || currentEducation.institution)
  ) {
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

  // In Serter format, skills are often presented in a list or separated by commas
  for (const line of skillsLines) {
    // First check if line contains bullet points or commas
    if (
      line.includes("•") ||
      line.includes("●") ||
      line.includes("■") ||
      line.includes("◼︎")
    ) {
      // Split by bullet points
      const bulletRegex = /[•●■◼︎]/g;
      const parts = line.split(bulletRegex);
      for (const part of parts) {
        const skill = part.trim();
        if (skill.length > 0) {
          skills.push(skill);
        }
      }
    } else if (line.includes(",")) {
      // Split by commas
      const parts = line.split(",");
      for (const part of parts) {
        const skill = part.trim();
        if (skill.length > 0) {
          skills.push(skill);
        }
      }
    } else if (line.includes("|")) {
      // Split by pipe symbol
      const parts = line.split("|");
      for (const part of parts) {
        const skill = part.trim();
        if (skill.length > 0) {
          skills.push(skill);
        }
      }
    } else if (line.trim().length > 0) {
      // Just add the whole line as a skill
      skills.push(line.trim());
    }
  }

  return skills;
}

/**
 * Extract projects from the projects section
 * @param {string[]} projectLines - Lines from the projects section
 * @returns {Array} - Array of project objects
 */
function extractProjects(projectLines) {
  const projects = [];
  let currentProject = null;

  for (let i = 0; i < projectLines.length; i++) {
    const line = projectLines[i];

    // Project names typically start with a title, sometimes followed by a timeframe
    // They often have link indicators like (GitHub) or [Link]
    if (
      i === 0 ||
      (line.length > 0 &&
        (line.includes("https://") ||
          line.includes("http://") ||
          line.includes("GitHub:") ||
          line.includes("(GitHub)") ||
          line.includes("[GitHub]") ||
          line.includes("github.com") ||
          /^[A-Z][ A-Za-z-]+/.test(line) || // Project names usually start with capital letter
          line.trim().endsWith(":"))) // Project name followed by colon
    ) {
      // Save previous project if exists
      if (currentProject && currentProject.name) {
        projects.push(currentProject);
      }

      // Start a new project entry
      currentProject = {
        name: "",
        timeframe: "",
        link: "",
        description: [],
      };

      // Extract link if present
      const linkMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (linkMatch) {
        currentProject.link = linkMatch[0];
      }

      // Extract the project name
      let projectName = line;

      // Remove link from name
      if (linkMatch) {
        projectName = projectName.replace(linkMatch[0], "");
      }

      // Look for timeframe in parentheses or square brackets
      const timeframeMatch = projectName.match(/\(([^)]+)\)|\[([^\]]+)\]/);
      if (timeframeMatch) {
        const timeframe = timeframeMatch[1] || timeframeMatch[2];
        // If looks like a timeframe (contains dates or duration)
        if (
          /\d{4}|month|year|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(
            timeframe
          )
        ) {
          currentProject.timeframe = timeframe;
          // Remove timeframe from name
          projectName = projectName.replace(timeframeMatch[0], "");
        }
      }

      // Clean up name
      currentProject.name = projectName.replace(/[:•●■◼︎]/g, "").trim();
    } else if (currentProject) {
      // If it's a continuation of the current project, add to description
      const cleanedLine = line.replace(/^[•●■◼︎]/, "").trim();
      if (cleanedLine.length > 0) {
        currentProject.description.push(cleanedLine);
      }
    }
  }

  // Add the last project if there is one
  if (currentProject && currentProject.name) {
    projects.push(currentProject);
  }

  return projects;
}

// Export the parser with a descriptive name and metadata
module.exports = {
  name: "serter",
  displayName: "Serter Format Parser",
  description:
    "Specialized parser for Serter resume format with structured sections",
  parse: parseSerterFormat,
};
