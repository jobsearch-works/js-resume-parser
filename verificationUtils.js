// verificationUtils.js
const fs = require("fs");
const path = require("path");

/**
 * Verify that all important content from the PDF is captured in the parsed data
 * @param {string} originalText - The full text content from the PDF
 * @param {Object} parsedData - The structured data extracted from the PDF
 * @returns {Object} - Object containing verification results
 */
function verifyParsedContent(originalText, parsedData) {
  const results = {
    missingContent: [],
    coveragePercentage: 0,
  };

  // Normalize text (remove excess whitespace, lowercase, etc.)
  const normalizeText = (text) => {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  };

  // Get all text from the parsed data as a single string
  let parsedTextContent = "";

  // Add basic information
  parsedTextContent += parsedData.name + " ";
  parsedTextContent += parsedData.email + " ";
  parsedTextContent += parsedData.phone + " ";
  parsedTextContent += parsedData.address + " ";
  parsedTextContent += parsedData.linkedin + " ";
  parsedTextContent += parsedData.summary + " ";

  // Add experience information
  parsedData.experience.forEach((exp) => {
    parsedTextContent += exp.company + " ";
    parsedTextContent += exp.position + " ";
    parsedTextContent += exp.period + " ";
    exp.description.forEach((desc) => {
      parsedTextContent += desc + " ";
    });
  });

  // Add education information
  parsedData.education.forEach((edu) => {
    parsedTextContent += edu.institution + " ";
    parsedTextContent += edu.degree + " ";
    parsedTextContent += edu.period + " ";
    edu.details.forEach((detail) => {
      parsedTextContent += detail + " ";
    });
  });

  // Add skills, languages, and certifications
  parsedData.skills.forEach((skill) => {
    parsedTextContent += skill + " ";
  });
  parsedData.languages.forEach((lang) => {
    parsedTextContent += lang + " ";
  });
  parsedData.certifications.forEach((cert) => {
    parsedTextContent += cert + " ";
  });

  // Normalize the concatenated parsed content
  const normalizedParsedContent = normalizeText(parsedTextContent);

  // Split the original text into meaningful chunks (paragraphs or sentences)
  const originalTextChunks = originalText
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 10); // Ignore very short chunks

  // Check each chunk to see if it's represented in the parsed content
  let missingChunks = [];
  let totalChunks = originalTextChunks.length;
  let capturedChunks = 0;

  originalTextChunks.forEach((chunk) => {
    // Normalize the chunk
    const normalizedChunk = normalizeText(chunk);

    // Check if this chunk or a significant portion of it is in the parsed content
    // We use a fuzzy approach - check if at least 70% of the words in the chunk are found
    const chunkWords = normalizedChunk
      .split(" ")
      .filter((word) => word.length > 3);
    let wordsCaptured = 0;

    chunkWords.forEach((word) => {
      if (normalizedParsedContent.includes(word)) {
        wordsCaptured++;
      }
    });

    const wordCaptureRatio =
      chunkWords.length > 0 ? wordsCaptured / chunkWords.length : 0;

    if (wordCaptureRatio < 0.7 && chunkWords.length > 3) {
      missingChunks.push(chunk);
    } else {
      capturedChunks++;
    }
  });

  // Calculate coverage percentage
  results.coveragePercentage =
    totalChunks > 0 ? (capturedChunks / totalChunks) * 100 : 100;
  results.missingContent = missingChunks;

  return results;
}

/**
 * Save verification results to a file
 * @param {Object} verificationResults - The verification results
 * @param {string} outputPath - Base path for saving verification results
 * @param {string} fileName - The name to use for the output file
 * @returns {string} The path to the saved file, or null if no content to save
 */
function saveVerificationResults(verificationResults, outputPath, fileName) {
  // Ensure the output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  if (
    verificationResults.missingContent &&
    verificationResults.missingContent.length > 0
  ) {
    console.log("\nPotentially missing content detected:");
    verificationResults.missingContent.forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.substring(0, 100)}${
          item.length > 100 ? "..." : ""
        }`
      );
    });

    // Save missing content to a separate file for review
    const missingContentPath = path.join(
      outputPath,
      `${fileName}_missing_content.txt`
    );
    fs.writeFileSync(
      missingContentPath,
      verificationResults.missingContent.join("\n\n---\n\n")
    );
    console.log(`Missing content details saved to: ${missingContentPath}`);
    return missingContentPath;
  } else {
    console.log("\nVerification complete: All content appears to be captured");
    return null;
  }
}

module.exports = {
  verifyParsedContent,
  saveVerificationResults,
};
