import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

export const documentService = {
  uploadDocument: async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);

    const response = await axios.post(
      `${API_URL}/api/documents/upload`,
      formData,
      {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  processDocument: async (documentId: string) => {
    const response = await axios.post(
      `${API_URL}/api/documents/process`,
      { documentId },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getDocuments: async () => {
    const response = await axios.get(`${API_URL}/api/documents`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getDocument: async (documentId: string) => {
    const response = await axios.get(`${API_URL}/api/documents/${documentId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export const vaultService = {
  getVaultSections: async () => {
    const response = await axios.get(`${API_URL}/api/vault/sections`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getSectionDetails: async (sectionType: string) => {
    const response = await axios.get(
      `${API_URL}/api/vault/section/${sectionType}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  getSectionFields: async (sectionId: string) => {
    const response = await axios.get(
      `${API_URL}/api/vault/fields/${sectionId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  addField: async (
    sectionType: string,
    fieldName: string,
    fieldValue: string,
  ) => {
    const response = await axios.post(
      `${API_URL}/api/vault/fields`,
      { sectionType, fieldName, fieldValue },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  updateField: async (
    fieldId: string,
    fieldValue: string,
    confidence: number,
  ) => {
    const response = await axios.put(
      `${API_URL}/api/vault/fields/${fieldId}`,
      { fieldValue, confidence },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  deleteField: async (fieldId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/vault/fields/${fieldId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  deleteSection: async (sectionId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/vault/section/${sectionId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },
};

export const autofillService = {
  suggestAutofill: async (formFieldName: string, formContext: string) => {
    const response = await axios.post(
      `${API_URL}/api/autofill/suggest`,
      { formFieldName, formContext },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getAlternatives: async (fieldName: string) => {
    const response = await axios.post(
      `${API_URL}/api/autofill/alternatives`,
      { fieldName },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getLearnedFields: async () => {
    const response = await axios.get(`${API_URL}/api/autofill/learned-fields`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  copyWithFormat: async (fieldValue: string, targetFormat: string) => {
    const response = await axios.post(
      `${API_URL}/api/autofill/format`,
      { fieldValue, targetFormat },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },
};

export const ambiguityService = {
  getAmbiguities: async (status: string = "PENDING") => {
    const response = await axios.get(
      `${API_URL}/api/ambiguities?status=${status}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  resolveAmbiguity: async (
    ambiguityId: string,
    resolvedValue: string,
    notes: string,
  ) => {
    const response = await axios.put(
      `${API_URL}/api/ambiguities/${ambiguityId}/resolve`,
      { resolvedValue, resolutionNotes: notes },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  deleteAmbiguity: async (ambiguityId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/ambiguities/${ambiguityId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },
};
