/**
 * Parser Registry
 * This file serves as a central registry for all available resume parsers
 */

// Import all parsers
const defaultParser = require("./default-parser");
const serterParser = require("./serter-parser");
const studentParser = require("./student-parser");

// Create a registry object with all available parsers
const parsers = {
  // Default parser - general purpose resume parser
  default: defaultParser,

  // Specialized parsers for specific resume formats
  serter: serterParser,
  student: studentParser,
};

/**
 * Get a specific parser by name
 * @param {string} parserName - The name of the parser to retrieve
 * @returns {Object} - The requested parser or the default parser if not found
 */
function getParser(parserName) {
  return parsers[parserName] || parsers.default;
}

/**
 * Get a list of all available parsers
 * @returns {Array} - Array of parser objects with name, displayName and description
 */
function listParsers() {
  return Object.values(parsers).map((parser) => ({
    name: parser.name,
    displayName: parser.displayName,
    description: parser.description,
  }));
}

/**
 * Parse a resume with a specific parser
 * @param {string} resumeFilePath - Path to the resume file
 * @param {string} parserName - Name of the parser to use (optional, uses default if not specified)
 * @returns {Promise<Object>} - The parsed resume data
 */
async function parseResume(resumeFilePath, parserName = "default") {
  const parser = getParser(parserName);
  return await parser.parse(resumeFilePath);
}

module.exports = {
  parsers,
  getParser,
  listParsers,
  parseResume,
};
