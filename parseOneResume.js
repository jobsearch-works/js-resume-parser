const fs = require("fs");
const path = require("path");
const { parseResume, listParsers } = require("./parsers");
const {
  verifyParsedContent,
  saveVerificationResults,
} = require("./verificationUtils");

/**
 * Process a single resume with all available parsers
 * @param {string} resumeFilePath - Path to the resume file to process
 */
async function parseOneResume(resumeFilePath) {
  try {
    // Verify the file exists
    if (!fs.existsSync(resumeFilePath)) {
      console.error(`Error: File "${resumeFilePath}" does not exist`);
      return;
    }

    // Verify file extension is supported
    const ext = path.extname(resumeFilePath).toLowerCase();
    if (ext !== ".pdf" && !resumeFilePath.toLowerCase().endsWith(".docx.pdf")) {
      console.error(`Error: Only PDF files are supported, got "${ext}"`);
      return;
    }

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

    const fileName = path.basename(resumeFilePath);
    const baseName = path.basename(
      resumeFilePath,
      path.extname(resumeFilePath)
    );

    console.log(`\nProcessing: ${fileName}`);
    console.log("--------------------------------------------------");

    // Get the original text content for verification
    let originalText = "";
    try {
      const dataBuffer = fs.readFileSync(resumeFilePath);
      const pdfData = await require("pdf-parse")(dataBuffer);
      originalText = pdfData.text;
    } catch (error) {
      console.error(`Error reading original text: ${error.message}`);
      return;
    }

    // Process with each parser
    for (const parser of availableParsers) {
      try {
        console.log(`\n[${parser.displayName.toUpperCase()}]`);

        // Get parser result (no file saving in the parser)
        const result = await parseResume(resumeFilePath, parser.name);

        // Verify content
        const verificationResults = verifyParsedContent(originalText, result);

        // Create the parser directory path
        const parserDir = path.join(parsedDir, `${parser.name}-parser`);

        // Save JSON output
        const outputPath = path.join(parserDir, `${baseName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`${parser.displayName} result saved to: ${outputPath}`);

        // Save verification results separately
        saveVerificationResults(verificationResults, parserDir, baseName);

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

// Check if run directly (node parseOneResume.js <path-to-resume>)
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: Please provide a path to a resume file");
    console.log("Usage: node parseOneResume.js <path-to-resume-file>");
    process.exit(1);
  }

  const resumeFilePath = path.resolve(args[0]);
  parseOneResume(resumeFilePath).catch((error) => {
    console.error("Error:", error);
  });
}

// Export the function for use in other modules
module.exports = { parseOneResume };
