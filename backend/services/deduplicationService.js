import VaultAmbiguity from "../models/VaultAmbiguity.js";
import VaultField from "../models/VaultField.js";

const SIMILARITY_THRESHOLD = 0.85;

export const normalizeValue = (value) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
};

export const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return 1 - matrix[str2.length][str1.length] / maxLength;
};

export const detectDuplicates = (value1, value2) => {
  const norm1 = normalizeValue(value1);
  const norm2 = normalizeValue(value2);
  const similarity = levenshteinDistance(norm1, norm2);
  return similarity > SIMILARITY_THRESHOLD;
};

export const trackAmbiguity = async (userId, fieldName, values, sources) => {
  try {
    const ambiguityData = values.map((value, index) => ({
      value,
      source: sources[index],
      confidence: 85,
    }));

    let ambiguity = await VaultAmbiguity.findOne({ userId, fieldName });

    if (!ambiguity) {
      ambiguity = new VaultAmbiguity({
        userId,
        fieldName,
        values: ambiguityData,
        resolutionStatus: "PENDING",
      });
    } else {
      ambiguity.values = ambiguityData;
      ambiguity.resolutionStatus = "PENDING";
    }

    await ambiguity.save();
    return ambiguity;
  } catch (error) {
    throw new Error("Failed to track ambiguity");
  }
};

export const resolveAmbiguity = async (ambiguityId, resolvedValue, notes) => {
  try {
    const ambiguity = await VaultAmbiguity.findByIdAndUpdate(
      ambiguityId,
      {
        resolutionStatus: "RESOLVED",
        resolvedValue,
        resolutionNotes: notes,
      },
      { new: true },
    );
    return ambiguity;
  } catch (error) {
    throw new Error("Failed to resolve ambiguity");
  }
};

export const getAmbiguities = async (userId, status = "PENDING") => {
  try {
    const ambiguities = await VaultAmbiguity.find({
      userId,
      resolutionStatus: status,
    });
    return ambiguities;
  } catch (error) {
    throw new Error("Failed to get ambiguities");
  }
};

export const checkFieldConflicts = async (userId, fieldName, newValue) => {
  try {
    const existingField = await VaultField.findOne({ userId, fieldName });

    if (existingField) {
      const isDuplicate = detectDuplicates(existingField.fieldValue, newValue);
      if (!isDuplicate) {
        return {
          hasConflict: true,
          existingValue: existingField.fieldValue,
          newValue,
        };
      }
    }

    return { hasConflict: false };
  } catch (error) {
    throw new Error("Failed to check field conflicts");
  }
};
