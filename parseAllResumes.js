const fs = require("fs");
const path = require("path");
const { parseResume, listParsers } = require("./parsers");
const {
  verifyParsedContent,
  saveVerificationResults,
} = require("./verificationUtils");

/**
 * Main function to process resume text with all available parsers
 * @param {string} text - The resume text to process
 * @param {string} [fileName] - Optional name to use for output files
 */
async function parseAllResumes(text, fileName = "resume") {
  try {
    // Create the output directories
    const parsedDir = path.join(__dirname, "parsed");
    if (!fs.existsSync(parsedDir)) {
      fs.mkdirSync(parsedDir);
    }

    // Get list of all available parsers
    const availableParsers = listParsers();
    console.log(`Found ${availableParsers.length} parsers:`);
    availableParsers.forEach((parser) => {
      console.log(`- ${parser.displayName}: ${parser.description}`);
    });

    // Create directories for each parser if they don't exist
    for (const parser of availableParsers) {
      const parserDir = path.join(parsedDir, `${parser.name}-parser`);
      if (!fs.existsSync(parserDir)) {
        fs.mkdirSync(parserDir);
      }
    }

    console.log(`\nProcessing resume text`);
    console.log("--------------------------------------------------");

    // Process with each parser
    for (const parser of availableParsers) {
      try {
        console.log(`\n[${parser.displayName.toUpperCase()}]`);

        // Get parser result
        const result = await parseResume(text, parser.name);

        // Verify content
        const verificationResults = verifyParsedContent(text, result);

        // Create the parser directory path
        const parserDir = path.join(parsedDir, `${parser.name}-parser`);

        // Save JSON output
        const outputPath = path.join(parserDir, `${fileName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`${parser.displayName} result saved to: ${outputPath}`);

        // Save verification results separately
        saveVerificationResults(verificationResults, parserDir, fileName);

        // Log results
        console.log(`${parser.displayName} extracted:`);
        logParserResults(result, verificationResults);
      } catch (error) {
        console.error(`Error with ${parser.displayName}: ${error.message}`);
      }
    }

    console.log("--------------------------------------------------");
    console.log(
      `\nAll results have been saved to separate folders in the 'parsed' directory:`
    );

    availableParsers.forEach((parser) => {
      console.log(
        `- ${parser.displayName} results: parsed/${parser.name}-parser/`
      );
    });

    console.log(
      `\nRun 'npm run generate-stats' to analyze parser performance and generate statistics.`
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

/**
 * Log parser results in a consistent format
 * @param {Object} result - The parser result object
 * @param {Object} verificationResults - The verification results
 */
function logParserResults(result, verificationResults) {
  console.log(`• Name: ${result.name || "Not found"}`);

  if (result.title) {
    console.log(`• Title: ${result.title}`);
  }

  console.log(`• Email: ${result.email || "Not found"}`);
  console.log(`• Phone: ${result.phone || "Not found"}`);

  if (result.linkedin) {
    console.log(`• LinkedIn: ${result.linkedin}`);
  }

  if (result.github) {
    console.log(`• GitHub: ${result.github}`);
  }

  if (result.location || result.address) {
    console.log(`• Location: ${result.location || result.address}`);
  }

  console.log(`• Experience: ${result.experience?.length || 0} positions`);
  console.log(`• Education: ${result.education?.length || 0} entries`);
  console.log(`• Skills: ${result.skills?.length || 0} skills`);

  if (result.projects) {
    console.log(`• Projects: ${result.projects.length} projects`);
  }

  if (result.certifications) {
    console.log(`• Certifications: ${result.certifications.length} entries`);
  }

  if (result.languages) {
    console.log(`• Languages: ${result.languages.length} entries`);
  }

  if (result.honors) {
    console.log(`• Honors/Awards: ${result.honors.length} entries`);
  }

  // Include verification results that are now calculated separately
  if (verificationResults) {
    console.log(
      `• Content coverage: ${verificationResults.coveragePercentage.toFixed(
        2
      )}%`
    );
    console.log(
      `• Missing content chunks: ${
        verificationResults.missingContent?.length || 0
      }`
    );
  }
}

// Parse command line arguments
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const result = {
    text: null,
    fileName: "resume",
  };

  for (const arg of args) {
    if (arg.startsWith("--text=")) {
      result.text = arg.substring("--text=".length);
    } else if (arg.startsWith("--file=")) {
      result.fileName = arg.substring("--file=".length);
    } else if (!arg.startsWith("--")) {
      // If not a flag and no text is set yet, assume it's the text
      if (!result.text) {
        result.text = arg;
      }
    }
  }

  return result;
}

// Run the main function if called directly
if (require.main === module) {
  const args = parseCommandLineArgs();

  if (!args.text) {
    console.error("Error: Please provide text to process");
    console.log(
      "Usage: node parseAllResumes.js --text=<text-to-process> [--file=<output-file-name>]"
    );
    process.exit(1);
  }

  const text = args.text;
  parseAllResumes(text, args.fileName).catch((error) => {
    console.error("Error:", error);
  });
}

module.exports = {
  parseAllResumes,
};
