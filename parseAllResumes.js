const fs = require("fs");
const path = require("path");
const resumeParser = require("./resumeParser");
const serterParser = require("./serterParser");
const { saveVerificationResults } = require("./verificationUtils");

/**
 * Main function to process all resumes with all available parsers
 */
async function parseAllResumes() {
  try {
    // Create the output directories
    const parsedDir = path.join(__dirname, "parsed");
    if (!fs.existsSync(parsedDir)) {
      fs.mkdirSync(parsedDir);
    }

    const defaultParserDir = path.join(parsedDir, "default-parser");
    const serterParserDir = path.join(parsedDir, "serter-parser");

    // Create parser directories if they don't exist
    if (!fs.existsSync(defaultParserDir)) {
      fs.mkdirSync(defaultParserDir);
    }

    if (!fs.existsSync(serterParserDir)) {
      fs.mkdirSync(serterParserDir);
    }

    // Get all resume files from the resumes directory
    const resumesDir = path.join(__dirname, "resumes");
    const files = fs.readdirSync(resumesDir);
    const pdfFiles = files.filter(
      (file) =>
        path.extname(file).toLowerCase() === ".pdf" ||
        file.toLowerCase().endsWith(".docx.pdf")
    );

    console.log(`Found ${pdfFiles.length} resume files to process`);
    console.log("--------------------------------------------------");

    // Process each resume file
    for (const file of pdfFiles) {
      const filePath = path.join(resumesDir, file);
      const fileName = path.basename(file, path.extname(file));

      console.log(`\nProcessing: ${file}`);
      console.log("--------------------------------------------------");

      // Process with default parser
      try {
        console.log("\n[DEFAULT PARSER]");

        // Get parser result (no file saving in the parser)
        const defaultResult = await resumeParser.parseResume(filePath);

        // Save JSON output
        const defaultOutputPath = path.join(
          defaultParserDir,
          `${fileName}.json`
        );
        fs.writeFileSync(
          defaultOutputPath,
          JSON.stringify(defaultResult, null, 2)
        );
        console.log(`Default parser result saved to: ${defaultOutputPath}`);

        // Save verification results if any
        if (
          defaultResult.verificationResults &&
          defaultResult.verificationResults.missingContent &&
          defaultResult.verificationResults.missingContent.length > 0
        ) {
          saveVerificationResults(
            defaultResult.verificationResults,
            defaultParserDir,
            fileName
          );
        }

        // Log results
        console.log("Default parser extracted:");
        logParserResults(defaultResult);
      } catch (error) {
        console.error(`Error with default parser: ${error.message}`);
      }

      // Process with Serter parser
      try {
        console.log("\n[SERTER PARSER]");

        // Get parser result (no file saving in the parser)
        const serterResult = await serterParser.parseSerterFormat(filePath);

        // Save JSON output
        const serterOutputPath = path.join(serterParserDir, `${fileName}.json`);
        fs.writeFileSync(
          serterOutputPath,
          JSON.stringify(serterResult, null, 2)
        );
        console.log(`Serter parser result saved to: ${serterOutputPath}`);

        // Save verification results if any
        if (
          serterResult.verificationResults &&
          serterResult.verificationResults.missingContent &&
          serterResult.verificationResults.missingContent.length > 0
        ) {
          saveVerificationResults(
            serterResult.verificationResults,
            serterParserDir,
            fileName
          );
        }

        // Log results
        console.log("Serter parser extracted:");
        logParserResults(serterResult);
      } catch (error) {
        console.error(`Error with Serter parser: ${error.message}`);
      }

      console.log("--------------------------------------------------");
    }

    console.log(
      `\nAll results have been saved to separate folders in the 'parsed' directory:`
    );
    console.log(`- Default parser results: parsed/default-parser/`);
    console.log(`- Serter parser results: parsed/serter-parser/`);
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
 */
function logParserResults(result) {
  console.log(`• Name: ${result.name || "Not found"}`);

  if (result.title) {
    console.log(`• Title: ${result.title}`);
  }

  console.log(`• Email: ${result.email || "Not found"}`);
  console.log(`• Phone: ${result.phone || "Not found"}`);

  if (result.linkedin) {
    console.log(`• LinkedIn: ${result.linkedin}`);
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

  if (result.verificationResults) {
    console.log(
      `• Content coverage: ${result.verificationResults.coveragePercentage.toFixed(
        2
      )}%`
    );
    console.log(
      `• Missing content chunks: ${
        result.verificationResults.missingContent?.length || 0
      }`
    );
  }
}

// Run the main function
parseAllResumes().catch((error) => {
  console.error("Error:", error);
});
