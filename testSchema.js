/**
 * Test script for the resume parser schema validation
 *
 * This script parses the same resume with different parsers
 * and shows how the schema validation standardizes the output.
 */

const fs = require("fs");
const path = require("path");
const { parseResume, listParsers } = require("./parsers");

// Resume to test with
const RESUME_FILE = "resumes/Serter_I.pdf";

// Function to extract subset of data for comparison
function getComparisonData(data) {
  return {
    basicInfo: {
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
    counts: {
      experience: data.experience?.length || 0,
      education: data.education?.length || 0,
      skills: data.skills?.length || 0,
      projects: data.projects?.length || 0,
    },
    structure: {
      hasResponsibilities:
        data.experience &&
        data.experience.length > 0 &&
        Array.isArray(data.experience[0].responsibilities),
      hasDetails:
        data.education &&
        data.education.length > 0 &&
        Array.isArray(data.education[0].details),
    },
  };
}

async function runTest() {
  console.log("Testing schema validation with multiple parsers...\n");

  // Get all available parsers
  const parsers = listParsers();
  console.log(`Found ${parsers.length} parsers to test with:\n`);

  // Create output directory for test results
  const testOutputDir = path.join(__dirname, "test-output");
  if (!fs.existsSync(testOutputDir)) {
    fs.mkdirSync(testOutputDir);
  }

  // Parse with each parser and compare results
  const results = {};

  for (const parser of parsers) {
    console.log(`Parsing with: ${parser.displayName}`);

    try {
      // Parse the resume with this parser
      const parsedData = await parseResume(RESUME_FILE, parser.name);

      // Save the full parsed data to a file
      const outputFile = path.join(
        testOutputDir,
        `${parser.name}-results.json`
      );
      fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
      console.log(`  Full results saved to: ${outputFile}`);

      // Store comparison data
      results[parser.name] = getComparisonData(parsedData);
    } catch (error) {
      console.error(`  Error with ${parser.displayName}: ${error.message}`);
    }
  }

  // Compare results between parsers
  console.log("\nComparison of parser results after schema validation:");
  console.log(JSON.stringify(results, null, 2));

  // Verify that key structure elements are consistent
  const allParsers = Object.keys(results);
  let isConsistent = true;

  if (allParsers.length > 1) {
    const firstParser = allParsers[0];
    const firstResults = results[firstParser];

    for (let i = 1; i < allParsers.length; i++) {
      const parserName = allParsers[i];
      const parserResults = results[parserName];

      // Check if the structure is consistent
      if (
        parserResults.structure.hasResponsibilities !==
          firstResults.structure.hasResponsibilities ||
        parserResults.structure.hasDetails !== firstResults.structure.hasDetails
      ) {
        console.log(
          `\nInconsistency found between ${firstParser} and ${parserName}:`
        );
        console.log(
          `  - ${firstParser} hasResponsibilities: ${firstResults.structure.hasResponsibilities}`
        );
        console.log(
          `  - ${parserName} hasResponsibilities: ${parserResults.structure.hasResponsibilities}`
        );
        console.log(
          `  - ${firstParser} hasDetails: ${firstResults.structure.hasDetails}`
        );
        console.log(
          `  - ${parserName} hasDetails: ${parserResults.structure.hasDetails}`
        );
        isConsistent = false;
      }
    }
  }

  if (isConsistent) {
    console.log(
      "\n✅ All parsers have consistent output structure after schema validation!"
    );
  } else {
    console.log(
      "\n❌ Inconsistencies found between parser outputs. Check the schema validation."
    );
  }
}

// Run the test
runTest().catch((error) => {
  console.error("Test error:", error);
});
