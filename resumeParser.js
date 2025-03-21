// resumeParser.js
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

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
    experience: [],
    education: [],
    skills: [],
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

    // Extract email using regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      parsedData.email = emails[0];
    }

    // Extract phone number using regex
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      parsedData.phone = phones[0];
    }

    // Try to extract name (this is challenging and may need refinement)
    // Assuming name is at the beginning of the resume
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length > 0) {
      // Assume the first non-empty line is the name
      parsedData.name = lines[0].trim();
    }

    // TODO: Add more sophisticated parsing for experience, education, skills
  } catch (error) {
    console.error(`Error parsing file: ${error.message}`);
  }

  return parsedData;
}

// Example usage
const resumeFilePath = path.join(
  __dirname,
  "resumes",
  "2024 _Alexandra_Makagon_Resume.docx.pdf"
);

// Since parseResume is now async, we need to use promises or async/await
parseResume(resumeFilePath)
  .then((result) => {
    console.log("Parsed result:", result);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
