/**
 * Frontend Integration Examples
 * Smart Form Field Mapping Service
 */

// ============================================
// 1. REACT HOOK FOR FIELD MAPPING
// ============================================

import { useState } from 'react';
import axios from 'axios';

/**
 * Hook: useFormFieldMapping
 * Maps form fields to stored data
 */
export const useFormFieldMapping = () => {
  const [mappings, setMappings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mapFormFields = async (formFields, useAI = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/field-mapping/map', {
        formFields,
        useAI
      });

      setMappings(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Mapping failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const mapSingleField = async (fieldLabel) => {
    try {
      setLoading(true);

      const response = await axios.post('/api/field-mapping/map-single', {
        fieldLabel
      });

      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Mapping failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSuggestion = async (standardField) => {
    try {
      const response = await axios.post('/api/field-mapping/suggest', {
        standardField
      });

      return response.data.data;
    } catch (err) {
      console.error('Suggestion failed:', err);
      return null;
    }
  };

  return {
    mapFormFields,
    mapSingleField,
    getSuggestion,
    mappings,
    loading,
    error
  };
};

// ============================================
// 2. FORM FIELD COMPONENT WITH AUTO-FILL
// ============================================

import React, { useEffect, useState } from 'react';

interface SmartFormFieldProps {
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  onMappingResult?: (result: any) => void;
  autoFillThreshold?: number;  // 0.0 - 1.0
}

/**
 * Component: SmartFormField
 * Individual form field with:
 * - Auto-fill capability
 * - Confidence display
 * - Conversion indicators
 */
export const SmartFormField: React.FC<SmartFormFieldProps> = ({
  label,
  type,
  required,
  placeholder,
  onMappingResult,
  autoFillThreshold = 0.75
}) => {
  const [value, setValue] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState('empty');
  const [hint, setHint] = useState('');
  const { mapSingleField } = useFormFieldMapping();

  // Try to auto-map field on mount
  useEffect(() => {
    const autoMap = async () => {
      try {
        const mapping = await mapSingleField(label);
        
        if (onMappingResult) {
          onMappingResult(mapping);
        }

        setConfidence(mapping.confidence);
        setStatus(mapping.status);

        // Auto-fill if confident and not filled
        if (mapping.confidence >= autoFillThreshold && mapping.value) {
          setValue(mapping.value);

          // Show hint about mapping
          if (mapping.status === 'converted') {
            setHint(`Auto-filled (converted from ${mapping.standard_field})`);
          } else {
            setHint('Auto-filled from vault');
          }
        }
      } catch (error) {
        console.log('Could not auto-fill field:', label);
      }
    };

    autoMap();
  }, [label, mapSingleField, autoFillThreshold, onMappingResult]);

  return (
    <div className="smart-form-field">
      <label htmlFor={label}>
        {label}
        {required && <span className="required">*</span>}
        {confidence > 0 && (
          <span className="confidence-badge" title={`Confidence: ${(confidence * 100).toFixed(0)}%`}>
            ✓ {(confidence * 100).toFixed(0)}%
          </span>
        )}
        {status === 'converted' && (
          <span className="conversion-badge" title="Value was converted">
            🔄 Converted
          </span>
        )}
      </label>

      <input
        id={label}
        type={type}
        placeholder={placeholder || label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`form-input ${status !== 'empty' ? 'auto-filled' : ''}`}
      />

      {hint && <p className="hint">{hint}</p>}
    </div>
  );
};

// ============================================
// 3. FORM WITH BATCH MAPPING
// ============================================

interface SmartFormProps {
  fields: Array<{ label: string; type: string; required?: boolean }>;
  onSubmit: (data: any, mappings: any) => void;
}

/**
 * Component: SmartForm
 * Complete form with:
 * - Batch field mapping
 * - Auto-fill capability
 * - Confidence display
 * - Submission with mapping metadata
 */
export const SmartForm: React.FC<SmartFormProps> = ({ fields, onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);
  const { mapFormFields } = useFormFieldMapping();

  // Load and apply mappings on mount
  useEffect(() => {
    const loadMappings = async () => {
      try {
        setLoading(true);

        const result = await mapFormFields(fields, true);

        setMappings(result.mapped_fields);

        // Auto-fill fields if enabled
        if (autoFillEnabled) {
          const newFormData: any = {};
          result.mapped_fields.forEach((mapping: any) => {
            if (mapping.confidence >= 0.75 && mapping.value) {
              newFormData[mapping.form_field] = mapping.value;
            }
          });
          setFormData(newFormData);
        }
      } catch (error) {
        console.error('Failed to load mappings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMappings();
  }, [fields, mapFormFields, autoFillEnabled]);

  const handleChange = (fieldLabel: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, mappings);
  };

  if (loading) {
    return <div className="loading">Loading form fields...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="smart-form">
      <div className="form-options">
        <label>
          <input
            type="checkbox"
            checked={autoFillEnabled}
            onChange={(e) => setAutoFillEnabled(e.target.checked)}
          />
          Enable Auto-fill
        </label>
      </div>

      <div className="form-fields">
        {fields.map((field) => {
          const mapping = mappings.find(m => m.form_field === field.label);
          const confidence = mapping?.confidence || 0;

          return (
            <div key={field.label} className="form-group">
              <label htmlFor={field.label}>
                {field.label}
                {field.required && <span className="required">*</span>}
                {confidence > 0 && (
                  <span className="confidence-badge">
                    ✓ {(confidence * 100).toFixed(0)}%
                    {mapping?.status === 'converted' && ' (🔄 Converted)'}
                  </span>
                )}
              </label>

              <input
                id={field.label}
                type={field.type}
                value={formData[field.label] || ''}
                onChange={(e) => handleChange(field.label, e.target.value)}
                placeholder={field.label}
                required={field.required}
                className={confidence > 0.75 ? 'auto-filled' : ''}
              />

              {mapping?.status === 'converted' && (
                <small className="hint">
                  Value converted from {mapping.standard_field}
                </small>
              )}
              {mapping?.status === 'missing' && (
                <small className="warning">Field not found in vault</small>
              )}
            </div>
          );
        })}
      </div>

      <button type="submit" className="btn-submit">
        Submit
      </button>

      {mappings.length > 0 && (
        <div className="mapping-summary">
          <h4>Mapping Summary</h4>
          <p>
            Mapped: {mappings.filter(m => m.status !== 'missing').length} / {mappings.length}
            {mappings.some(m => m.status === 'converted') && 
              ` · ${mappings.filter(m => m.status === 'converted').length} converted`}
          </p>
        </div>
      )}
    </form>
  );
};

// ============================================
// 4. FIELD SUGGESTION DROPDOWN
// ============================================

/**
 * Component: FieldSuggestionDropdown
 * Dropdown that shows suggestions for a field
 */
export const FieldSuggestionDropdown = ({ standardField }: { standardField: string }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const { getSuggestion } = useFormFieldMapping();

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        // Get all field variations
        const response = await axios.get(
          `/api/field-mapping/variations/${standardField}`
        );
        setSuggestions(response.data.variations);

        // Get current suggestion
        const suggestion = await getSuggestion(standardField);
        if (suggestion?.suggestion) {
          setSelected(suggestion.suggestion);
        }
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };

    loadSuggestions();
  }, [standardField, getSuggestion]);

  return (
    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
      <option value="">-- Select {standardField} --</option>
      <optgroup label="Known Variations">
        {suggestions.map(suggestion => (
          <option key={suggestion} value={suggestion}>
            {suggestion}
          </option>
        ))}
      </optgroup>
    </select>
  );
};

// ============================================
// 5. MAPPING CONFIDENCE INDICATOR
// ============================================

interface ConfidenceIndicatorProps {
  confidence: number;
  status: 'filled' | 'converted' | 'missing';
  standardField?: string;
}

/**
 * Component: ConfidenceIndicator
 * Visual indicator for mapping confidence
 */
export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  status,
  standardField
}) => {
  const percentage = Math.round(confidence * 100);

  let color = '#ccc';  // Gray for missing
  let icon = '?';

  if (status === 'filled' && confidence >= 0.9) {
    color = '#22c55e';  // Green
    icon = '✓';
  } else if (status === 'filled' && confidence >= 0.75) {
    color = '#3b82f6';  // Blue
    icon = '✓';
  } else if (status === 'converted') {
    color = '#f59e0b';  // Amber
    icon = '🔄';
  } else if (status === 'missing') {
    color = '#ef4444';  // Red
    icon = '✗';
  }

  return (
    <div className="confidence-indicator" style={{ color }}>
      <span className="icon">{icon}</span>
      <span className="percentage">{percentage}%</span>
      {status === 'converted' && standardField && (
        <span className="tooltip" title={`Converted from ${standardField}`}>
          {standardField}
        </span>
      )}
    </div>
  );
};

// ============================================
// 6. USAGE EXAMPLE IN A PAGE
// ============================================

/**
 * Example Page: ApplicationForm
 * Complete implementation with all features
 */
export const ApplicationForm = () => {
  const formFields = [
    { label: 'Student Name', type: 'text', required: true },
    { label: 'Father Name', type: 'text', required: false },
    { label: 'Mother Name', type: 'text', required: false },
    { label: 'Date of Birth', type: 'date', required: false },
    { label: 'Email', type: 'email', required: true },
    { label: 'Phone', type: 'tel', required: false },
    { label: 'Percentage', type: 'number', required: false },
  ];

  const handleSubmit = async (data: any, mappings: any) => {
    try {
      const response = await axios.post('/api/forms/form123/submit', {
        submittedData: data,
        notes: `Submitted with ${mappings.filter((m: any) => m.status !== 'missing').length} auto-filled fields`
      });

      console.log('Form submitted:', response.data);
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit form');
    }
  };

  return (
    <div className="application-form-page">
      <h1>Smart Application Form</h1>
      <p>Form fields will auto-fill from your vault with confidence indicators</p>

      <SmartForm
        fields={formFields}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

// ============================================
// 7. CSS STYLES (Tailwind/Custom)
// ============================================

const styles = `
/* Confidence Badge */
.confidence-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  margin-left: 8px;
  font-weight: 500;
}

.confidence-badge.high {
  background: #dcfce7;
  color: #166534;
}

.confidence-badge.converted {
  background: #fef3c7;
  color: #b45309;
}

/* Conversion Badge */
.conversion-badge {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  margin-left: 4px;
  font-weight: 500;
}

/* Auto-filled Field */
.form-input.auto-filled {
  background-color: #f0fdf4;
  border-color: #86efac;
}

/* Hint Text */
.hint {
  font-size: 0.85em;
  color: #6b7280;
  margin-top: 4px;
}

/* Warning Text */
.warning {
  font-size: 0.85em;
  color: #dc2626;
  margin-top: 4px;
}

/* Smart Form */
.smart-form {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.form-options {
  margin-bottom: 20px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group input {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1em;
}

.form-group input.auto-filled {
  background-color: #f0fdf4;
  border-color: #86efac;
}

.btn-submit {
  margin-top: 20px;
  padding: 10px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-submit:hover {
  background: #2563eb;
}

/* Mapping Summary */
.mapping-summary {
  margin-top: 16px;
  padding: 12px;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 4px;
}

.mapping-summary h4 {
  margin: 0 0 8px 0;
  color: #1e40af;
}

.mapping-summary p {
  margin: 0;
  color: #1e3a8a;
  font-size: 0.95em;
}

/* Confidence Indicator */
.confidence-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
}
`;

export default ApplicationForm;
