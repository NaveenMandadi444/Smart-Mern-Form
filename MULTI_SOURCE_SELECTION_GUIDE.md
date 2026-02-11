# 🔄 Multi-Source Data Selection - Frontend Integration Guide

**Date:** February 11, 2026  
**Feature:** Auto-Fill with Manual Source Override  
**Status:** ✅ Ready

---

## 📋 Overview

Enhanced auto-fill system that:
1. **Auto-fills** form fields with best source (smart selection)
2. **Shows alternatives** - Which documents have this data?
3. **User can override** - Click to switch between different sources
4. **Visual indicators** - See source of each field (Aadhaar, 10th, Inter, BTech, etc)

---

## 🎯 User Experience Flow

```
User Opens Form
     ↓
Click "Auto-Fill"
     ↓
System auto-fills from best sources instantly
     ↓
User sees each field with source indicator
     ↓
If user wants to change source:
  ├─ Click on field
  ├─ See alternatives from other documents
  ├─ Select different variant
  └─ Field updates + tracked for learning
     ↓
Form ready to submit
```

---

## 🔌 NEW API Endpoints

### 1. Auto-Fill WITH Source Selection
```http
POST /api/autofill/with-selection

Headers:
Authorization: Bearer jwt_token
Content-Type: application/json

Body:
{
  "formFields": [
    "Full Name",
    "Date of Birth",
    "10th Percentage",
    "Address",
    "Father Name"
  ]
}

Response:
{
  "success": true,
  "fields": [
    {
      "formField": "Full Name",
      "current": {
        "value": "Naveen Mandadi",
        "source": "AADHAAR",
        "confidence": 0.95
      },
      "alternatives": [
        {
          "value": "Naveen Mandadi",
          "source": "PASSPORT",
          "confidence": 0.92,
          "id": "field_id_1"
        },
        {
          "value": "N. Mandadi",
          "source": "PAN",
          "confidence": 0.88,
          "id": "field_id_2"
        }
      ],
      "totalSources": 3,
      "status": "filled",
      "userCanOverride": true
    },
    {
      "formField": "10th Percentage",
      "current": {
        "value": "90",
        "source": "TENTH",
        "confidence": 0.90
      },
      "alternatives": [],
      "totalSources": 1,
      "status": "filled",
      "userCanOverride": false
    }
  ],
  "summary": {
    "total": 5,
    "filled": 5,
    "missing": 0,
    "fieldsWithAlternatives": 3
  }
}
```

### 2. Get Field Variants (For Single Field)
```http
POST /api/autofill/get-variants

Headers:
Authorization: Bearer jwt_token
Content-Type: application/json

Body:
{
  "fieldName": "Date of Birth"
}

Response:
{
  "success": true,
  "fieldName": "Date of Birth",
  "current": {
    "value": "01/01/1990",
    "source": "AADHAAR",
    "confidence": 0.95,
    "isBest": true
  },
  "alternatives": [
    {
      "value": "01/01/1990",
      "source": "PASSPORT",
      "confidence": 0.92,
      "id": "field_id_1",
      "isBest": false
    },
    {
      "value": "01/01/1990",
      "source": "TENTH",
      "confidence": 0.85,
      "id": "field_id_2",
      "isBest": false
    }
  ],
  "totalSources": 3
}
```

### 3. User Selects a Different Variant
```http
POST /api/autofill/select-variant

Headers:
Authorization: Bearer jwt_token
Content-Type: application/json

Body:
{
  "fieldName": "Date of Birth",
  "selectedValue": "01/01/1990",
  "selectedSource": "PASSPORT"
}

Response:
{
  "success": true,
  "message": "User selection recorded for \"Date of Birth\"",
  "fieldName": "Date of Birth",
  "selectedValue": "01/01/1990",
  "selectedSource": "PASSPORT"
}
```

### 4. Get Form Source Summary
```http
POST /api/autofill/form-sources

Headers:
Authorization: Bearer jwt_token
Content-Type: application/json

Body:
{
  "formFields": [
    "Full Name",
    "Date of Birth",
    "Address",
    "10th Percentage"
  ]
}

Response:
{
  "success": true,
  "sources": ["AADHAAR", "TENTH"],
  "sourceContribution": {
    "AADHAAR": 3,
    "PAN": 0,
    "PASSPORT": 0,
    "TENTH": 1,
    "INTER": 0,
    "DEGREE": 0
  },
  "fieldsBySource": {
    "AADHAAR": ["Full Name", "Date of Birth", "Address"],
    "TENTH": ["10th Percentage"]
  },
  "message": "Form uses data from 2 document sources"
}
```

---

## 💻 Frontend Implementation Example (React)

### Component 1: Form with Multi-Source Selection

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export function FormWithSourceSelection() {
  const [formFields, setFormFields] = useState([
    "Full Name",
    "Date of Birth",
    "Address",
    "10th Percentage",
    "Father Name"
  ]);

  const [fieldsData, setFieldsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState({});

  // 1️⃣ AUTO-FILL WITH ALTERNATIVES
  useEffect(() => {
    autoFillWithSelection();
  }, []);

  async function autoFillWithSelection() {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/autofill/with-selection',
        { formFields },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('✅ Auto-fill complete with alternatives');
      setFieldsData(response.data.fields);
      
      // Initialize selected variant with current values
      const initial = {};
      response.data.fields.forEach(field => {
        if (field.current) {
          initial[field.formField] = {
            value: field.current.value,
            source: field.current.source
          };
        }
      });
      setSelectedVariant(initial);
    } catch (error) {
      console.error('❌ Auto-fill error:', error);
    } finally {
      setLoading(false);
    }
  }

  // 2️⃣ USER CLICKS TO CHANGE SOURCE
  async function showVariants(fieldName) {
    try {
      const response = await axios.post(
        '/api/autofill/get-variants',
        { fieldName },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Show modal/dropdown with alternatives
      return response.data;
    } catch (error) {
      console.error('Error getting variants:', error);
    }
  }

  // 3️⃣ USER SELECTS DIFFERENT VARIANT
  async function changeFieldSource(fieldName, newValue, newSource) {
    try {
      // Track this selection
      await axios.post(
        '/api/autofill/select-variant',
        {
          fieldName,
          selectedValue: newValue,
          selectedSource: newSource
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Update UI
      setSelectedVariant(prev => ({
        ...prev,
        [fieldName]: {
          value: newValue,
          source: newSource
        }
      }));

      console.log(`✅ Changed ${fieldName} to ${newSource}`);
    } catch (error) {
      console.error('Error changing source:', error);
    }
  }

  return (
    <div className="form-container">
      <h1>Student Form</h1>

      {loading && <p>Auto-filling from vault...</p>}

      {fieldsData.map((field) => (
        <FieldWithSourceSelection
          key={field.formField}
          field={field}
          currentValue={selectedVariant[field.formField]}
          onShowVariants={() => showVariants(field.formField)}
          onChangeVariant={(value, source) =>
            changeFieldSource(field.formField, value, source)
          }
        />
      ))}

      <button onClick={() => {/* Submit */}}>Submit Form</button>
    </div>
  );
}

// Component 2: Individual Field with Source Selector
function FieldWithSourceSelection({
  field,
  currentValue,
  onShowVariants,
  onChangeVariant
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!currentValue) {
    return (
      <div className="form-field empty">
        <label>{field.formField}</label>
        <input type="text" placeholder="Not auto-filled" />
        <span className="status">Missing from vault</span>
      </div>
    );
  }

  return (
    <div className="form-field with-source">
      <label>{field.formField}</label>

      <div className="field-wrapper">
        <input
          type="text"
          value={currentValue.value}
          readOnly
          className="field-input"
        />

        {/* Source Indicator */}
        <div className="source-indicator">
          <svg className="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span className="source-label">{currentValue.source}</span>
        </div>

        {/* Change Source Button - only if alternatives exist */}
        {field.alternatives && field.alternatives.length > 0 && (
          <button
            className="change-source-btn"
            onClick={() => setShowAlternatives(!showAlternatives)}
            title="Click to see alternatives from other documents"
          >
            📄 {field.alternatives.length} other source{field.alternatives.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Show Alternatives */}
      {showAlternatives && field.alternatives && field.alternatives.length > 0 && (
        <AlternativesDropdown
          alternatives={field.alternatives}
          currentSource={currentValue.source}
          onSelect={(value, source) => {
            onChangeVariant(value, source);
            setShowAlternatives(false);
          }}
        />
      )}
    </div>
  );
}

// Component 3: Shows alternatives dropdown
function AlternativesDropdown({ alternatives, currentSource, onSelect }) {
  return (
    <div className="alternatives-dropdown">
      <p className="alternatives-title">📄 Switch document source:</p>
      {alternatives.map((alt, idx) => (
        <button
          key={idx}
          className={`alternative-option ${
            alt.source === currentSource ? 'current' : ''
          }`}
          onClick={() => onSelect(alt.value, alt.source)}
        >
          <div className="option-source">
            <strong>{alt.source}</strong>
            <span className="confidence">
              {Math.round(alt.confidence * 100)}% confidence
            </span>
          </div>
          <div className="option-value">{alt.value}</div>
        </button>
      ))}
    </div>
  );
}
```

### CSS Styling

```css
.form-field {
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.form-field.empty {
  opacity: 0.6;
}

.form-field.with-source {
  background: #f0f8ff;
  border-color: #4CAF50;
  border-left: 4px solid #4CAF50;
}

.field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.field-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.source-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.checkmark {
  width: 16px;
  height: 16px;
  stroke-width: 3;
}

.change-source-btn {
  padding: 0.5rem 1rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.change-source-btn:hover {
  background: #1976D2;
}

.alternatives-dropdown {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #2196F3;
  border-radius: 4px;
}

.alternatives-title {
  margin: 0 0 0.5rem 0;
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.alternative-option {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  text-align: left;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.alternative-option:hover {
  background: #e3f2fd;
  border-color: #2196F3;
}

.alternative-option.current {
  background: #e8f5e9;
  border-color: #4CAF50;
  font-weight: bold;
}

.option-source {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.confidence {
  color: #999;
  font-size: 11px;
}

.option-value {
  margin-top: 0.3rem;
  font-weight: bold;
  color: #333;
}
```

---

## 🎨 Visual Design for UI

### Form Field with Source Indicator

```
┌─────────────────────────────────────────────────────────┐
│ Full Name                                               │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ ┌────────────┐ │
│ │ Naveen Mandadi                      │ │ ✓ AADHAAR  │ │
│ └─────────────────────────────────────┘ └────────────┘ │
│                                          ┌──────────────┐ │
│                                          │ 📄 2 other   │ │
│                                          │   sources    │ │
│                                          └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓
              User clicks "2 other sources"
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Switch document source:                                 │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │ PASSPORT                           92% confidence   │ │
│ │ Naveen Mandadi                                       │ │
│ └──────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ PAN                                88% confidence   │ │
│ │ N. Mandadi                                           │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓
              User clicks "PAN"
                        ↓
        Field value updates to "N. Mandadi"
        Source indicator changes to "PAN"
        Selection tracked for learning
```

---

## 📊 Data Flow

### Step 1: Initial Auto-Fill
```javascript
Frontend → POST /api/autofill/with-selection
         ↓
Backend runs 3-layer decision engine
         ↓
Returns auto-filled value + alternatives
         ↓
Frontend displays field + source badge + alternative count
```

### Step 2: User Sees Alternatives
```javascript
User clicks "2 other sources"
         ↓
Frontend shows dropdown with alternatives
         ↓
Each alternative shows:
  - Source document (AADHAAR, 10th, etc)
  - Value
  - Confidence score
  - Formatted clearly
```

### Step 3: User Selects Different Source
```javascript
User clicks alternative variant
         ↓
Frontend → POST /api/autofill/select-variant
         ↓
Backend tracks user's choice for learning
         ↓
Frontend updates field value + source indicator
         ↓
User sees form with new source
```

---

## 🔍 Source Indicators (Visual)

```
AADHAAR    → 🟢 Green  (Official ID, highest trust)
PASSPORT   → 🔵 Blue   (Government document)
PAN        → 🟣 Purple (Tax document)
TENTH      → 🟡 Yellow (School cert)
INTER      → 🟠 Orange (College cert)
DEGREE     → 🟤 Brown  (University cert)
```

---

## 📊 UI Component States

### Field States

```
1. LOADING STATE
   ├─ Field disabled
   ├─ Show spinner
   └─ Text: "Auto-filling..."

2. FILLED STATE
   ├─ Green border on left
   ├─ Value displayed
   ├─ Source badge shown
   ├─ Change button visible if alternatives exist
   └─ Ready to submit

3. MISSING STATE
   ├─ Gray background
   ├─ Placeholder: "Not in vault"
   ├─ User can enter manually
   └─ No source indicator

4. ERROR STATE
   ├─ Red border
   ├─ Error message shown
   └─ User can retry or enter manually
```

---

## ✨ Key Features

### ✅ Auto-Fill on Load
- Form auto-fills when opened
- No user interaction needed
- Instant population from vault

### ✅ Source Visibility
- Each field shows which document it came from
- Color-coded badges
- Confidence score displayed

### ✅ Easy Source Change
- Click button to see alternatives
- Beautiful dropdown menu
- Shows confidence for each option

### ✅ Learning System
- Tracks which source user prefers
- Next time same field appears → suggests preferred source
- Improves over time

### ✅ Smart Fallbacks
- If no data in field → show empty
- If low confidence → show warning
- If multiple sources → show best first

---

## 🎯 Success Metrics

```
Track these in analytics:
├─ Auto-fill success rate (% fields filled)
├─ Override rate (% users change source)
├─ Most common overrides (which sources changed to)
├─ Form completion time
├─ Source preference patterns
└─ User satisfaction
```

---

## 🚀 Implementation Checklist

- [ ] Install multiSourceSelector.js on backend
- [ ] Update autofillController.js with new endpoints
- [ ] Update autofillRoutes.js
- [ ] Create FormWithSourceSelection React component
- [ ] Create FieldWithSourceSelection component
- [ ] Create AlternativesDropdown component
- [ ] Add CSS styling
- [ ] Test with sample forms
- [ ] Test with multiple document sources
- [ ] Deploy to production
- [ ] Monitor usage and learn from patterns

---

## 💡 Pro Tips

1. **Prioritize for Performance**
   - Cache alternatives for 5 minutes
   - Lazy load alternatives (only fetch when clicked)

2. **UX Best Practices**
   - Show source badge always
   - Make "change source" button obvious but not intrusive
   - Display confidence % for trust
   - Confirm before overriding

3. **Learning Integration**
   - Store user preferences
   - Build confidence in selections over time
   - Next time suggest user's preferred source

4. **Error Handling**
   - If alternatives fail to load → show message
   - If network error → retry with exponential backoff
   - Always allow manual entry fallback

---

## 📞 Support

For issues with multi-source selection:
1. Check multiSourceSelector.js service
2. Verify autofillRoutes.js endpoints
3. Check network requests in DevTools
4. Review console logs for errors
5. Test with sample data first

---

**Status: ✅ READY TO IMPLEMENT**

This feature makes your form even more user-friendly and intelligent! 🎉
