import VaultSection from "../models/VaultSection.js";
import VaultField from "../models/VaultField.js";
import VaultDocument from "../models/VaultDocument.js";

export const routeDocumentToSection = (documentType) => {
  const sectionMap = {
    AADHAAR: "AADHAAR_SECTION",
    PAN: "PAN_SECTION",
    PASSPORT: "PASSPORT_SECTION",
    TENTH: "EDUCATION_10TH",
    INTER: "EDUCATION_INTER",
    DEGREE: "EDUCATION_DEGREE",
  };
  return sectionMap[documentType] || null;
};

export const getOrCreateSection = async (userId, sectionType) => {
  try {
    let section = await VaultSection.findOne({ userId, sectionType });
    if (!section) {
      section = new VaultSection({ userId, sectionType });
      await section.save();
    }
    return section;
  } catch (error) {
    throw new Error("Failed to create/get vault section");
  }
};

export const storeFieldsInSection = async (
  userId,
  sectionId,
  fields,
  documentId,
  confidence,
) => {
  try {
    console.log("🔵 Storing fields:", {
      userId,
      sectionId,
      fieldsCount: fields.length,
      documentId,
      confidence,
    });

    const fieldDocuments = fields.map((field) => ({
      sectionId,
      userId,
      fieldName: field.name,
      fieldValue: field.value,
      confidence: field.confidence || confidence || 85,
      extractedFrom: field.source || "MANUAL",
      metadata: {
        isFamilyData: isFamilyData(field.name),
        documentId,
        rawExtractedText: field.rawText,
      },
    }));

    console.log(
      "🔵 Field documents to insert:",
      JSON.stringify(fieldDocuments, null, 2),
    );

    const savedFields = await VaultField.insertMany(fieldDocuments);
    console.log("✅ Fields saved to database:", savedFields.length);

    return savedFields;
  } catch (error) {
    console.error("❌ Field storage error:", error);
    throw new Error("Failed to store fields in section");
  }
};

export const isFamilyData = (fieldName) => {
  const familyKeywords = [
    "father",
    "mother",
    "spouse",
    "sibling",
    "parent",
    "family",
  ];
  return familyKeywords.some((keyword) =>
    fieldName.toLowerCase().includes(keyword),
  );
};

export const updatePersonalMaster = async (
  userId,
  newFields,
  sourceAuthority,
) => {
  try {
    // Get Personal Master section
    const personalMaster = await getOrCreateSection(userId, "PERSONAL_MASTER");

    // For each field to update, check authority
    for (const field of newFields) {
      const existingField = await VaultField.findOne({
        userId,
        sectionId: personalMaster._id,
        fieldName: field.name,
      });

      if (!existingField || sourceAuthority > 50) {
        // Update logic
        if (existingField) {
          existingField.fieldValue = field.value;
          existingField.confidence = field.confidence;
          await existingField.save();
        } else {
          await storeFieldsInSection(
            userId,
            personalMaster._id,
            [field],
            null,
            field.confidence,
          );
        }
      }
    }

    return personalMaster;
  } catch (error) {
    throw new Error("Failed to update Personal Master");
  }
};

export const getAllVaultSections = async (userId) => {
  try {
    console.log("🔍 Fetching vault sections for user:", userId);
    const sections = await VaultSection.find({ userId });
    console.log("🔍 Found sections:", sections.length);

    const sectionsWithFields = await Promise.all(
      sections.map(async (section) => {
        const fields = await VaultField.find({ sectionId: section._id });
        console.log(
          `🔍 Section ${section.sectionType} has ${fields.length} fields`,
        );
        return { ...section.toObject(), fields };
      }),
    );

    console.log(
      "✅ Returning sections with fields:",
      sectionsWithFields.length,
    );
    return sectionsWithFields;
  } catch (error) {
    console.error("❌ Error getting vault sections:", error);
    throw new Error("Failed to get vault sections");
  }
};

export const getSectionFields = async (userId, sectionType) => {
  try {
    const section = await VaultSection.findOne({ userId, sectionType });
    if (!section) return [];

    const fields = await VaultField.find({ sectionId: section._id });
    return fields;
  } catch (error) {
    throw new Error("Failed to get section fields");
  }
};
