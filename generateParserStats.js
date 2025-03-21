const fs = require("fs");
const path = require("path");

/**
 * Main function to generate statistics for all parsed resume files
 */
async function generateParserStats() {
  try {
    const parsedDir = path.join(__dirname, "parsed");
    if (!fs.existsSync(parsedDir)) {
      console.error(
        "Error: The 'parsed' directory does not exist. Run the parsers first."
      );
      return;
    }

    // Create the stats directory if it doesn't exist
    const statsDir = path.join(parsedDir, "stats");
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir);
    }

    // Get parser directories
    const defaultParserDir = path.join(parsedDir, "default-parser");
    const serterParserDir = path.join(parsedDir, "serter-parser");

    if (!fs.existsSync(defaultParserDir) && !fs.existsSync(serterParserDir)) {
      console.error(
        "Error: No parser output directories found. Run the parsers first."
      );
      return;
    }

    console.log("Generating statistics for parsed resume files...");
    console.log("--------------------------------------------------");

    // Get all parsed files from default parser
    const defaultParsedFiles = fs.existsSync(defaultParserDir)
      ? fs
          .readdirSync(defaultParserDir)
          .filter((file) => file.endsWith(".json"))
      : [];

    // Get all parsed files from Serter parser
    const serterParsedFiles = fs.existsSync(serterParserDir)
      ? fs.readdirSync(serterParserDir).filter((file) => file.endsWith(".json"))
      : [];

    // Get unique resume filenames from both parsers
    const allFilenames = new Set([
      ...defaultParsedFiles.map((file) => file.replace(".json", "")),
      ...serterParsedFiles.map((file) => file.replace(".json", "")),
    ]);

    console.log(`Found ${allFilenames.size} parsed resume files to analyze`);

    // Process each resume file
    let processedCount = 0;
    for (const fileName of allFilenames) {
      console.log(`\nAnalyzing: ${fileName}`);

      // Initialize stats for this resume
      const resumeStats = {
        fileName: fileName,
        parsers: {},
      };

      // Get the original file size if possible
      const resumePath = path.join(__dirname, "resumes", `${fileName}.pdf`);
      if (fs.existsSync(resumePath)) {
        resumeStats.fileSize = getFileSizeInKB(resumePath);
      }

      // Process default parser results
      const defaultJsonPath = path.join(defaultParserDir, `${fileName}.json`);
      if (fs.existsSync(defaultJsonPath)) {
        try {
          const defaultResult = JSON.parse(
            fs.readFileSync(defaultJsonPath, "utf8")
          );
          console.log("Default parser results found");
          resumeStats.parsers["default"] = collectParserStats(defaultResult);
        } catch (error) {
          console.error(
            `Error reading default parser results: ${error.message}`
          );
          resumeStats.parsers["default"] = { error: error.message };
        }
      } else {
        console.log("No default parser results found");
        resumeStats.parsers["default"] = { error: "No results available" };
      }

      // Process Serter parser results
      const serterJsonPath = path.join(serterParserDir, `${fileName}.json`);
      if (fs.existsSync(serterJsonPath)) {
        try {
          const serterResult = JSON.parse(
            fs.readFileSync(serterJsonPath, "utf8")
          );
          console.log("Serter parser results found");
          resumeStats.parsers["serter"] = collectParserStats(serterResult);
        } catch (error) {
          console.error(
            `Error reading Serter parser results: ${error.message}`
          );
          resumeStats.parsers["serter"] = { error: error.message };
        }
      } else {
        console.log("No Serter parser results found");
        resumeStats.parsers["serter"] = { error: "No results available" };
      }

      // Save the comparative stats to the stats directory
      saveResumeStats(resumeStats, statsDir);
      processedCount++;
    }

    console.log(`\nStatistics generation complete.`);
    console.log(`Processed ${processedCount} resume files.`);
    console.log(`All statistics have been saved to: parsed/stats/`);
  } catch (error) {
    console.error(`Error generating statistics: ${error.message}`);
  }
}

/**
 * Collect statistics from parser results
 * @param {Object} result - Parser result object
 * @returns {Object} - Statistics object
 */
function collectParserStats(result) {
  if (!result) return { error: "No result available" };

  return {
    name: result.name ? true : false,
    email: result.email ? true : false,
    phone: result.phone ? true : false,
    linkedin: result.linkedin ? true : false,
    location: result.location || result.address ? true : false,
    experienceCount: result.experience?.length || 0,
    educationCount: result.education?.length || 0,
    skillsCount: result.skills?.length || 0,
    projectsCount: result.projects?.length || 0,
    languagesCount: result.languages?.length || 0,
    certificationsCount: result.certifications?.length || 0,
    coveragePercentage: result.verificationResults?.coveragePercentage || 0,
    missingContentCount:
      result.verificationResults?.missingContent?.length || 0,
  };
}

/**
 * Save resume statistics to a JSON file
 * @param {Object} stats - The statistics object
 * @param {string} outputDir - The directory to save the stats
 */
function saveResumeStats(stats, outputDir) {
  if (!stats || !stats.fileName) return;

  const outputPath = path.join(outputDir, `${stats.fileName}_stats.json`);

  // Add a timestamp
  stats.timestamp = new Date().toISOString();

  // Compare parsers and determine best match
  stats.bestParser = determineBestParser(stats.parsers);

  // Save the stats
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));
  console.log(`Statistics saved to: ${outputPath}`);
}

/**
 * Determine which parser provided the best results
 * @param {Object} parsers - Object containing parser results
 * @returns {string} - The name of the best parser
 */
function determineBestParser(parsers) {
  if (!parsers) return "unknown";

  // If only one parser has results, it's the best by default
  const availableParsers = Object.keys(parsers).filter(
    (parser) => !parsers[parser].error
  );

  if (availableParsers.length === 0) return "none";
  if (availableParsers.length === 1) return availableParsers[0];

  // Create a scoring system (higher is better)
  const scores = {};

  for (const parser of availableParsers) {
    const stats = parsers[parser];
    if (!stats || stats.error) {
      scores[parser] = 0;
      continue;
    }

    // Calculate score based on quantity and coverage
    let score = 0;

    // Basic info points (1 point each)
    if (stats.name) score += 1;
    if (stats.email) score += 1;
    if (stats.phone) score += 1;
    if (stats.linkedin) score += 1;
    if (stats.location) score += 1;

    // Content count points (0.5 points each)
    score += stats.experienceCount * 0.5;
    score += stats.educationCount * 0.5;
    score += stats.skillsCount * 0.25;
    score += stats.projectsCount * 0.5;
    score += stats.languagesCount * 0.25;
    score += stats.certificationsCount * 0.25;

    // Coverage percentage (most important factor)
    score += stats.coveragePercentage / 5; // Up to 20 points for 100% coverage

    // Penalty for missing content
    score -= stats.missingContentCount * 0.5;

    scores[parser] = score;
  }

  // Find the parser with the highest score
  let bestParser = availableParsers[0];
  for (const parser of availableParsers) {
    if (scores[parser] > scores[bestParser]) {
      bestParser = parser;
    }
  }

  return bestParser;
}

/**
 * Get file size in KB
 * @param {string} filePath - Path to the file
 * @returns {number} - Size in KB
 */
function getFileSizeInKB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024);
  } catch (error) {
    return 0;
  }
}

// Run the main function if called directly
if (require.main === module) {
  generateParserStats().catch((error) => {
    console.error("Error:", error);
  });
} else {
  // Export the function for use as a module
  module.exports = { generateParserStats };
}
