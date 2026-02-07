import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_KEY_FILE,
});

export const performOCR = async (imagePath) => {
  try {
    const request = {
      image: { source: { imageUri: imagePath } },
    };

    const [result] = await client.documentTextDetection(request);
    const fullTextAnnotation = result.fullTextAnnotation || {};
    return fullTextAnnotation.text || "";
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to perform OCR");
  }
};

export const extractTextFromImage = async (imageData) => {
  try {
    const request = {
      image: {
        content: imageData, // base64 encoded image
      },
    };

    const [result] = await client.textDetection(request);
    const textAnnotations = result.textAnnotations || [];
    return textAnnotations.length > 0 ? textAnnotations[0].description : "";
  } catch (error) {
    console.error("Text extraction error:", error);
    throw new Error("Failed to extract text from image");
  }
};
