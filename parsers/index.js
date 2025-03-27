/**
 * Parser Registry
 * This file serves as a central registry for all available resume parsers
 */

// Import all parsers
const defaultParser = require("./default-parser");
const serterParser = require("./serter-parser");
const studentParser = require("./student-parser");
const { validateAndNormalize } = require("./schema");

// Registry of available parsers
const parsers = {
  default: defaultParser,
  serter: serterParser,
  student: studentParser,
};

/**
 * Get a specific parser by name
 * @param {string} name - The name of the parser to get
 * @returns {Object} - The parser object or null if not found
 */
function getParser(name) {
  return parsers[name] || null;
}

/**
 * Get a list of all available parsers
 * @returns {Array} - Array of parser objects
 */
function listParsers() {
  return Object.values(parsers);
}

/**
 * Parse resume text using the specified parser or all available parsers
 * @param {string} text - The resume text to parse
 * @param {string} [parserName] - Optional name of specific parser to use
 * @returns {Promise<Object>} - Parsed resume data
 */
async function parseResume(text, parserName = null) {
  if (!text) {
    throw new Error("Resume text is required");
  }

  if (parserName) {
    const parser = getParser(parserName);
    if (!parser) {
      throw new Error(`Parser "${parserName}" not found`);
    }
    return await parser.parse(text);
  }

  // If no specific parser requested, try all parsers and return the best result
  const results = await Promise.all(
    Object.values(parsers).map(async (parser) => {
      try {
        return await parser.parse(text);
      } catch (error) {
        console.error(`Error with ${parser.displayName}: ${error.message}`);
        return null;
      }
    })
  );

  // Filter out failed results and return the first successful one
  const validResults = results.filter((result) => result !== null);
  if (validResults.length === 0) {
    throw new Error("All parsers failed to parse the resume");
  }

  return validResults[0];
}

module.exports = {
  parsers,
  getParser,
  listParsers,
  parseResume,
};
