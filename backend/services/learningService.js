import LearnedField from "../models/LearnedField.js";

export const trackFieldUsage = async (
  userId,
  fieldName,
  fieldValue,
  formType,
) => {
  try {
    let learnedField = await LearnedField.findOne({ userId, fieldName });

    if (!learnedField) {
      learnedField = new LearnedField({
        userId,
        fieldName,
        usageCount: 1,
        extractedValues: [{ value: fieldValue, frequency: 1 }],
        formTypes: [formType],
      });
    } else {
      learnedField.usageCount += 1;
      learnedField.lastUsed = new Date();

      if (!learnedField.formTypes.includes(formType)) {
        learnedField.formTypes.push(formType);
      }

      const existingValue = learnedField.extractedValues.find(
        (v) => v.value === fieldValue,
      );
      if (existingValue) {
        existingValue.frequency += 1;
      } else {
        learnedField.extractedValues.push({ value: fieldValue, frequency: 1 });
      }
    }

    await learnedField.save();
    return learnedField;
  } catch (error) {
    throw new Error("Failed to track field usage");
  }
};

export const getLearnedFields = async (userId) => {
  try {
    const fields = await LearnedField.find({ userId })
      .sort({ usageCount: -1 })
      .limit(50);
    return fields;
  } catch (error) {
    throw new Error("Failed to get learned fields");
  }
};

export const getMostFrequentValues = async (userId, fieldName) => {
  try {
    const learnedField = await LearnedField.findOne({ userId, fieldName });

    if (!learnedField) return [];

    return learnedField.extractedValues
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  } catch (error) {
    throw new Error("Failed to get frequent values");
  }
};
