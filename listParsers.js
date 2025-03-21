/**
 * Helper script to list all available parsers in the system
 */

const { listParsers } = require("./parsers");

async function displayParsers() {
  console.log("\n=== Available Resume Parsers ===\n");

  const parsers = listParsers();

  if (parsers.length === 0) {
    console.log("No parsers found in the system.");
    return;
  }

  parsers.forEach((parser, index) => {
    console.log(`${index + 1}. ${parser.displayName}`);
    console.log(`   ID: ${parser.name}`);
    console.log(
      `   Description: ${parser.description || "No description available"}`
    );
    console.log("");
  });

  console.log(`Total parsers available: ${parsers.length}`);
  console.log("\nTo use a specific parser:");
  console.log(
    "node parseOneResume.js --parser=<parser-id> --resume=<resume-file-path>"
  );
  console.log("\nExample:");
  console.log(
    "node parseOneResume.js --parser=default --resume=resumes/example.pdf\n"
  );
}

displayParsers();
