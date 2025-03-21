/**
 * Schema definition for resume parser outputs
 * This ensures consistent output format across all parsers
 */

// Define the expected schema for parsed resume data
const resumeSchema = {
  // Basic profile information
  name: { type: "string", required: true },
  title: { type: "string", required: false },
  email: { type: "string", required: true },
  phone: { type: "string", required: true },
  linkedin: { type: "string", required: false },
  github: { type: "string", required: false },
  address: { type: "string", required: false },
  location: { type: "string", required: false },
  summary: { type: "string", required: false },

  // Experience section
  experience: {
    type: "array",
    required: true,
    itemSchema: {
      title: { type: "string", required: false },
      position: { type: "string", required: false },
      company: { type: "string", required: false },
      location: { type: "string", required: false },
      period: { type: "string", required: false },
      responsibilities: { type: "array", required: true, itemType: "string" },
      description: { type: "array", required: false, itemType: "string" },
    },
  },

  // Education section
  education: {
    type: "array",
    required: true,
    itemSchema: {
      degree: { type: "string", required: false },
      institution: { type: "string", required: false },
      location: { type: "string", required: false },
      period: { type: "string", required: false },
      details: { type: "array", required: true, itemType: "string" },
    },
  },

  // Skills section
  skills: { type: "array", required: true, itemType: "string" },

  // Additional sections
  languages: { type: "array", required: false, itemType: "string" },
  certifications: { type: "array", required: false, itemType: "string" },
  projects: {
    type: "array",
    required: false,
    itemSchema: {
      name: { type: "string", required: true },
      timeframe: { type: "string", required: false },
      link: { type: "string", required: false },
      description: { type: "array", required: true, itemType: "string" },
    },
  },
  honors: {
    type: "array",
    required: false,
    itemSchema: {
      title: { type: "string", required: true },
      date: { type: "string", required: false },
      description: { type: "array", required: true, itemType: "string" },
    },
  },
  references: { type: "array", required: false, itemType: "string" },
};

/**
 * Validate parsed data against the schema and normalize it
 * @param {Object} parsedData - The data returned by a parser
 * @returns {Object} - Normalized data that conforms to the schema
 */
function validateAndNormalize(parsedData) {
  const result = {};

  // Process each field in the schema
  for (const [field, rules] of Object.entries(resumeSchema)) {
    const value = parsedData[field];

    // Handle required fields
    if (rules.required && (value === undefined || value === null)) {
      if (rules.type === "array") {
        result[field] = [];
      } else if (rules.type === "string") {
        result[field] = "";
      } else {
        result[field] = null;
      }
    }
    // Handle arrays
    else if (rules.type === "array") {
      if (!Array.isArray(value)) {
        result[field] = [];
      } else if (rules.itemSchema) {
        // Complex array items (objects)
        result[field] = value.map((item) => {
          const normalizedItem = {};
          for (const [itemField, itemRules] of Object.entries(
            rules.itemSchema
          )) {
            const itemValue = item[itemField];

            // Handle required fields in array items
            if (
              itemRules.required &&
              (itemValue === undefined || itemValue === null)
            ) {
              if (itemRules.type === "array") {
                normalizedItem[itemField] = [];
              } else if (itemRules.type === "string") {
                normalizedItem[itemField] = "";
              } else {
                normalizedItem[itemField] = null;
              }
            }
            // Handle arrays within objects
            else if (itemRules.type === "array") {
              normalizedItem[itemField] = Array.isArray(itemValue)
                ? itemValue
                : itemValue
                ? [itemValue]
                : [];
            }
            // Handle other types
            else {
              normalizedItem[itemField] =
                itemValue !== undefined ? itemValue : "";
            }
          }
          return normalizedItem;
        });
      } else {
        // Simple array items (strings)
        result[field] = value;
      }
    }
    // Handle strings and other simple types
    else {
      result[field] = value !== undefined ? value : "";
    }
  }

  // Handle parser-specific fields that need normalization

  // Ensure responsibilities exists in each experience item
  if (result.experience && Array.isArray(result.experience)) {
    result.experience.forEach((exp) => {
      // Handle different naming conventions between parsers
      if (!exp.responsibilities && exp.description) {
        exp.responsibilities = exp.description;
      } else if (!exp.responsibilities) {
        exp.responsibilities = [];
      }

      // Ensure position exists (some parsers use 'title' instead)
      if (!exp.position && exp.title) {
        exp.position = exp.title;
      } else if (!exp.position) {
        exp.position = "";
      }
    });
  }

  return result;
}

module.exports = {
  resumeSchema,
  validateAndNormalize,
};
