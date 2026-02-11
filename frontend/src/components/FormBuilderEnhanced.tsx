import React, { useState } from 'react';
import axios from 'axios';
import { ChevronDown, Check, AlertCircle, Loader } from 'lucide-react';

interface FormFieldData {
  label: string;
  value: string;
  file?: File | null;  // Add file support
  source?: string;
  confidence?: number;
  alternatives?: Array<{
    value: string;
    source: string;
    confidence: number;
    id: string;
  }>;
}

interface FormBuilderEnhancedProps {
  initialFormFields?: Array<{
    label: string;
    type: string;
    required: boolean;
  }>;
  onSubmit?: (data: Record<string, any>) => void;
}

export default function FormBuilderEnhanced({
  initialFormFields = [],
  onSubmit,
}: FormBuilderEnhancedProps) {
  const [formFields, setFormFields] = useState<Record<string, FormFieldData>>(
    {}
  );
  const [showAlternatives, setShowAlternatives] = useState<
    Record<string, boolean>
  >({});
  const [loadingVariants, setLoadingVariants] = useState<Record<string, boolean>>(
    {}
  );
  const [variants, setVariants] = useState<Record<string, any>>({});
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);

  // 1️⃣ AUTO-FILL FORM
  async function handleAutoFill() {
    setAutoFillLoading(true);
    setAutoFillError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAutoFillError('❌ Authentication failed. Please login again.');
        setAutoFillLoading(false);
        return;
      }

      const fieldNames = initialFormFields.map((f) => f.label);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/autofill/with-selection`,
        { formFields: fieldNames },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Auto-fill response:', response.data);

      // Map API response to form fields
      const newFormFields: Record<string, FormFieldData> = {};
      response.data.fields.forEach((field: any) => {
        newFormFields[field.formField] = {
          label: field.formField,
          value: field.current?.value || '',
          source: field.current?.source || 'MANUAL',
          confidence: field.current?.confidence || 0,
          alternatives: field.alternatives || [],
        };
      });

      setFormFields(newFormFields);
    } catch (err: any) {
      console.error('❌ Auto-fill error:', err);
      setAutoFillError(
        err.response?.data?.error || 'Failed to auto-fill form'
      );
    } finally {
      setAutoFillLoading(false);
    }
  }

  // 2️⃣ GET VARIANTS FOR A FIELD
  async function fetchVariants(fieldLabel: string) {
    if (variants[fieldLabel]) {
      // Toggle if already loaded
      setShowAlternatives((prev) => ({
        ...prev,
        [fieldLabel]: !prev[fieldLabel],
      }));
      return;
    }

    setLoadingVariants((prev) => ({ ...prev, [fieldLabel]: true }));

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoadingVariants((prev) => ({ ...prev, [fieldLabel]: false }));
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/autofill/get-variants`,
        { fieldName: fieldLabel },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setVariants((prev) => ({
        ...prev,
        [fieldLabel]: response.data,
      }));

      setShowAlternatives((prev) => ({
        ...prev,
        [fieldLabel]: true,
      }));
    } catch (err) {
      console.error('Error fetching variants:', err);
    } finally {
      setLoadingVariants((prev) => ({ ...prev, [fieldLabel]: false }));
    }
  }

  // 3️⃣ USER SELECTS DIFFERENT SOURCE
  async function handleSelectVariant(
    fieldLabel: string,
    newValue: string,
    newSource: string
  ) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }

      // Track selection in backend
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/autofill/select-variant`,
        {
          fieldName: fieldLabel,
          selectedValue: newValue,
          selectedSource: newSource,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update field
      setFormFields((prev) => ({
        ...prev,
        [fieldLabel]: {
          ...prev[fieldLabel],
          value: newValue,
          source: newSource,
        },
      }));

      setShowAlternatives((prev) => ({
        ...prev,
        [fieldLabel]: false,
      }));

      console.log(`✅ Changed ${fieldLabel} to ${newSource}`);
    } catch (err) {
      console.error('Error changing variant:', err);
    }
  }

  // 4️⃣ HANDLE MANUAL FIELD CHANGE (including file uploads)
  function handleFieldChange(fieldLabel: string, value: string, file?: File | null) {
    setFormFields((prev) => ({
      ...prev,
      [fieldLabel]: {
        ...prev[fieldLabel],
        label: fieldLabel,
        value,
        file: file !== undefined ? file : prev[fieldLabel]?.file,  // Update file if provided
        source: 'MANUAL',
      },
    }));
  }

  // 5️⃣ GET SOURCE BADGE COLOR
  function getSourceColor(source: string): string {
    const colors: Record<string, string> = {
      AADHAAR: 'bg-green-100 text-green-800 border-green-300',
      PASSPORT: 'bg-blue-100 text-blue-800 border-blue-300',
      PAN: 'bg-purple-100 text-purple-800 border-purple-300',
      TENTH: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      INTER: 'bg-orange-100 text-orange-800 border-orange-300',
      DEGREE: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      MANUAL: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[source] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  // 6️⃣ HANDLE FORM SUBMIT (with files)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const submittedData: Record<string, any> = {};
    const files: Record<string, File> = {};
    
    Object.entries(formFields).forEach(([key, field]) => {
      submittedData[key] = field.value;
      if (field.file) {
        files[key] = field.file;  // Collect files separately
      }
    });

    console.log('📤 Submitted:', submittedData);
    console.log('📎 Files:', Object.keys(files));
    
    if (onSubmit) {
      // Pass both data and files
      onSubmit({ ...submittedData, __files: files });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📋 Smart Form Builder
          </h1>
          <p className="text-gray-600">
            Auto-fill your form with data from your vault. Click on any field to
            see alternatives from other documents.
          </p>
        </div>

        {/* AUTO-FILL BUTTON */}
        <button
          onClick={handleAutoFill}
          disabled={autoFillLoading}
          className="mb-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200 flex items-center gap-2"
        >
          {autoFillLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Auto-filling Form...
            </>
          ) : (
            <>
              ⚡ Auto-Fill from Vault
            </>
          )}
        </button>

        {/* ERROR ALERT */}
        {autoFillError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{autoFillError}</p>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {initialFormFields.map((field) => (
            <FormFieldWithSourceSelection
              key={field.label}
              field={field}
              fieldData={formFields[field.label]}
              showAlternatives={showAlternatives[field.label] || false}
              loadingVariants={loadingVariants[field.label] || false}
              variants={variants[field.label]}
              getSourceColor={getSourceColor}
              onFieldChange={(value, file) => handleFieldChange(field.label, value, file)}
              onShowAlternatives={() => fetchVariants(field.label)}
              onSelectVariant={(value, source) =>
                handleSelectVariant(field.label, value, source)
              }
            />
          ))}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
          >
            ✓ Submit Form
          </button>
        </form>
      </div>
    </div>
  );
}

// Individual Field Component
interface FormFieldWithSourceSelectionProps {
  field: {
    label: string;
    type: string;
    required: boolean;
  };
  fieldData?: FormFieldData;
  showAlternatives: boolean;
  loadingVariants: boolean;
  variants?: any;
  getSourceColor: (source: string) => string;
  onFieldChange: (value: string, file?: File | null) => void;
  onShowAlternatives: () => void;
  onSelectVariant: (value: string, source: string) => void;
}

function FormFieldWithSourceSelection({
  field,
  fieldData,
  showAlternatives,
  loadingVariants,
  variants,
  getSourceColor,
  onFieldChange,
  onShowAlternatives,
  onSelectVariant,
}: FormFieldWithSourceSelectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* INPUT WITH SOURCE BADGE */}
      <div className="flex items-center gap-2">
        {field.type === 'file' ? (
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              onFieldChange(file?.name || '', file);
            }}
            accept="image/*,.pdf,.doc,.docx"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        ) : (
          <input
            type={field.type}
            value={fieldData?.value || ''}
            onChange={(e) => onFieldChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
              fieldData?.value
                ? 'border-green-300 bg-blue-50 focus:ring-green-500'
                : 'border-gray-300 focus:ring-indigo-500'
            }`}
          />
        )}

        {/* SOURCE BADGE */}
        {fieldData?.source && (
          <div
            className={`px-3 py-2 rounded-lg border font-semibold text-sm whitespace-nowrap flex items-center gap-1 ${getSourceColor(
              fieldData.source
            )}`}
          >
            {fieldData.source !== 'MANUAL' && (
              <Check className="w-4 h-4" />
            )}
            {fieldData.source}
          </div>
        )}

        {/* CHANGE SOURCE BUTTON */}
        {fieldData?.alternatives && fieldData.alternatives.length > 0 && (
          <button
            type="button"
            onClick={onShowAlternatives}
            disabled={loadingVariants}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-1 font-medium transition-colors whitespace-nowrap text-sm"
          >
            {loadingVariants ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>📄 {fieldData.alternatives.length}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showAlternatives ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </button>
        )}
      </div>

      {/* CONFIDENCE BAR */}
      {fieldData?.confidence && fieldData.confidence > 0 && (
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Confidence</span>
            <span className="text-xs font-semibold text-green-600">
              {Math.round(fieldData.confidence * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ width: `${fieldData.confidence * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* ALTERNATIVES DROPDOWN */}
      {showAlternatives && variants?.alternatives && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            📄 Switch document source:
          </p>

          <div className="space-y-2">
            {variants.alternatives.map((alt: any, idx: number) => (
              <button
                key={alt.id || idx}
                onClick={() => onSelectVariant(alt.value, alt.source)}
                type="button"
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  alt.source === fieldData?.source
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {alt.source === fieldData?.source ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{alt.source}</p>
                    <p className="text-gray-600 text-sm break-words">
                      {alt.value}
                    </p>
                  </div>

                  <span className="text-right flex-shrink-0 text-xs font-semibold bg-white px-2 py-1 rounded">
                    {Math.round(alt.confidence * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
