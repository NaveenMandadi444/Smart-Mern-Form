import VaultDocument from "../models/VaultDocument.js";
import VaultSection from "../models/VaultSection.js";
import VaultField from "../models/VaultField.js";
import {
  extractFieldsWithGemini,
  classifyDocumentType,
} from "../services/geminiService.js";
import {
  routeDocumentToSection,
  getOrCreateSection,
  storeFieldsInSection,
  updatePersonalMaster,
} from "../services/documentVaultService.js";
import { trackAmbiguity } from "../services/deduplicationService.js";
import fs from "fs";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.userId;
    const { documentType } = req.body;

    // Save document metadata with image preview
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const document = new VaultDocument({
      userId,
      documentType: documentType || "UNKNOWN",
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      status: "PROCESSING",
      imageUrl,
      previewUrl: imageUrl,
    });

    await document.save();

    res.json({
      message: "Document uploaded successfully",
      document: {
        id: document._id,
        fileName: document.fileName,
        imageUrl: document.imageUrl,
        previewUrl: document.previewUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

export const processDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { documentId } = req.body;

    console.log("🔄 Processing document:", documentId);

    const document = await VaultDocument.findById(documentId);
    if (!document || document.userId.toString() !== userId) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Read image file
    const imageBuffer = fs.readFileSync(document.filePath);
    const base64Image = imageBuffer.toString("base64");

    // Classify document
    console.log("🔍 Starting document classification...");
    let classification;
    try {
      classification = await classifyDocumentType(base64Image);
      console.log("✓ Classification:", classification);

      if (!classification || !classification.documentType) {
        console.warn(
          "⚠️ Classification returned no document type, using uploaded type",
        );
        classification = {
          documentType: document.documentType,
          confidence: 50,
        };
      }
    } catch (err) {
      console.error("❌ Classification FAILED:", err.message);
      // Use the document type provided during upload
      classification = {
        documentType: document.documentType,
        confidence: 50,
      };
      console.log("Using uploaded document type:", document.documentType);
    }

    const documentType = classification?.documentType || document.documentType;

    // Extract fields using Gemini
    console.log("🔍 Starting field extraction with Gemini AI...");
    let extractedData;
    try {
      extractedData = await extractFieldsWithGemini(base64Image, documentType);
      console.log(
        "✓ Fields extracted:",
        Object.keys(extractedData.fields || {}).length,
      );

      if (
        !extractedData ||
        !extractedData.fields ||
        Object.keys(extractedData.fields).length === 0
      ) {
        throw new Error("No fields were extracted from the document");
      }
    } catch (err) {
      console.error("❌ Field extraction FAILED:", err.message);

      // Update document status to failed
      document.status = "FAILED";
      document.processingError = `Extraction failed: ${err.message}`;
      await document.save();

      return res.status(500).json({
        message: "Field extraction failed",
        error: err.message,
        hint: "Please check if your Gemini API key is valid and has sufficient quota",
      });
    }

    // Route to appropriate section
    const sectionType = routeDocumentToSection(documentType);
    const section = await getOrCreateSection(userId, sectionType);

    // Prepare fields for storage
    const fieldsToStore = extractedData.fields
      ? Object.entries(extractedData.fields).map(([name, data]) => ({
          name,
          value: data.value || data,
          confidence: data.confidence || 50,
          source: documentType,
          rawText: data.value || data,
        }))
      : [];

    console.log("📦 Fields to store:", fieldsToStore.length);

    // Store fields in section
    let storedFields = [];
    try {
      storedFields = await storeFieldsInSection(
        userId,
        section._id,
        fieldsToStore,
        documentId,
        classification?.confidence || 70,
      );
    } catch (err) {
      console.warn("⚠️ Field storage failed:", err.message);
    }

    // Update Personal Master only for high-confidence extractions
    if ((classification?.confidence || 70) > 80 && storedFields.length > 0) {
      try {
        await updatePersonalMaster(userId, storedFields, section.authority);
      } catch (err) {
        console.warn("⚠️ Personal master update failed:", err.message);
      }
    }

    // Update document status
    document.status = "COMPLETED";
    document.extractedFieldsCount = storedFields.length;
    document.confidence = classification?.confidence || 70;
    await document.save();

    console.log("✅ Document processed successfully");

    res.json({
      message: "Document processed successfully",
      document: {
        id: document._id,
        documentType,
        extractedFieldsCount: storedFields.length,
        confidence: document.confidence,
        imageUrl: document.imageUrl,
      },
      fields: storedFields.map((f) => ({
        fieldName: f.fieldName || f.name,
        fieldValue: f.fieldValue || f.value,
        confidence: f.confidence,
      })),
    });
  } catch (error) {
    console.error("❌ Processing error:", error);
    const document = await VaultDocument.findById(req.body.documentId);
    if (document) {
      document.status = "FAILED";
      document.processingError = error.message;
      await document.save();
    }

    res
      .status(500)
      .json({ message: "Processing failed", error: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { documentId } = req.params;

    const document = await VaultDocument.findById(documentId);
    if (!document || document.userId.toString() !== userId) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Get fields associated with this document
    const fields = await VaultField.find({ "metadata.documentId": documentId });

    res.json({
      document,
      fields,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get document", error: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.userId;
    const documents = await VaultDocument.find({ userId }).sort({
      uploadedAt: -1,
    });

    res.json({
      count: documents.length,
      documents,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get documents", error: error.message });
  }
};
