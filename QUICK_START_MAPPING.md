# ⚡ Smart Field Mapping - Quick Start (5 minutes)

## What You Get

✅ Semantic field matching  
✅ CGPA ↔ Percentage conversion  
✅ Confidence scoring (0.0-1.0)  
✅ 7 ready-to-use API endpoints  
✅ Auto-fill capabilities for forms  

---

## 🚀 Getting Started

### Step 1: Start Your Server
```bash
cd backend
npm start
```

Expected output:
```
✅ Initializing Gemini AI for smart field mapping
🚀 Server running on port 5000
```

### Step 2: Get Your Auth Token

Get a Bearer token from your auth system, then save it:
```bash
export TOKEN=your_auth_token_here
```

### Step 3: Test the Service (1 minute)

#### Test A: Map Single Field
```bash
curl -X POST http://localhost:5000/api/field-mapping/map-single \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldLabel": "Father Name",
    "storedData": {
      "father_name": "James Doe"
    }
  }'
```

**Expected Response:**
```json
{
  "data": {
    "form_field": "Father Name",
    "standard_field": "father_name",
    "value": "James Doe",
    "confidence": 0.95,
    "status": "filled"
  }
}
```

#### Test B: Convert CGPA to Percentage
```bash
curl -X POST http://localhost:5000/api/field-mapping/suggest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "standardField": "percentage",
    "storedData": {
      "cgpa": 8.2
    }
  }'
```

**Expected Response:**
```json
{
  "data": {
    "field": "percentage",
    "suggestion": "77.9",
    "confidence": 0.88,
    "status": "converted_from_cgpa"
  }
}
```

#### Test C: Map Multiple Fields
```bash
curl -X POST http://localhost:5000/api/field-mapping/map \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formFields": [
      {"label": "Student Name", "type": "text"},
      {"label": "Father Name", "type": "text"},
      {"label": "Email", "type": "email"},
      {"label": "Percentage", "type": "number"}
    ],
    "useAI": true,
    "storedData": {
      "student_name": "John Doe",
      "father_name": "James Doe",
      "email": "john@example.com",
      "cgpa": 8.2
    }
  }'
```

**Expected Response:**
```json
{
  "data": {
    "mapped_fields": [
      {
        "form_field": "Student Name",
        "standard_field": "student_name",
        "value": "John Doe",
        "confidence": 0.95,
        "status": "filled"
      },
      {
        "form_field": "Father Name",
        "standard_field": "father_name",
        "value": "James Doe",
        "confidence": 0.95,
        "status": "filled"
      },
      {
        "form_field": "Email",
        "standard_field": "email",
        "value": "john@example.com",
        "confidence": 0.95,
        "status": "filled"
      },
      {
        "form_field": "Percentage",
        "standard_field": "percentage",
        "value": "77.9",
        "confidence": 0.88,
        "status": "converted"
      }
    ],
    "summary": {
      "total_fields": 4,
      "mapped_count": 4,
      "missing_count": 0,
      "converted_count": 1,
      "average_confidence": 0.93
    }
  }
}
```

---

## 📚 Available Endpoints

### 1. Map Multiple Fields
```
POST /api/field-mapping/map
```
Map an entire form at once.

### 2. Map Single Field
```
POST /api/field-mapping/map-single
```
Map one field quickly.

### 3. Get Suggestions
```
POST /api/field-mapping/suggest
```
Get suggested values from your vault.

### 4. List Standard Fields
```
GET /api/field-mapping/standard-fields
```
See all 12 standard field definitions.

### 5. Get Field Variations
```
GET /api/field-mapping/variations/{field}
```
See naming variations for a field.

### 6. Validate Mapping
```
POST /api/field-mapping/validate
```
Check if a mapping is confident.

### 7. Batch Map
```
POST /api/field-mapping/batch
```
Map multiple forms at once.

---

## 🎯 Standard Fields

The system recognizes these 12 standard fields:

```
✓ student_name       - Student Name
✓ father_name        - Father's Name
✓ mother_name        - Mother's Names
✓ dob                - Date of Birth
✓ email              - Email Address
✓ phone              - Phone Number
✓ address            - Residential Address
✓ cgpa               - CGPA/GPA
✓ percentage         - Percentage/Marks %
✓ gender             - Gender
✓ aadhaar            - Aadhaar Number
✓ pan                - PAN Card
```

---

## 🔄 Conversion Rules

### CGPA to Percentage
```
percentage = CGPA × 9.5
8.2 CGPA → 77.9%
```

### Percentage to CGPA
```
CGPA = Percentage ÷ 9.5
77.9% → 8.21 CGPA
```

---

## 📊 Confidence Levels

| Confidence | Meaning | Action |
|-----------|---------|--------|
| 0.90-1.00 | Exact match | ✅ Use value |
| 0.75-0.89 | Strong match | 🟢 Good suggestion |
| 0.50-0.74 | Weak match | 🟡 Review |
| <0.50 | Not found | ❌ Ask user |

---

## 🧠 Recognized Field Variations

### Student Name
- Student Name
- Candidate Name
- Applicant Name
- Full Name
- Fullname

### Father Name
- Father Name
- Name of the Father
- Father's Name
- Guardian Name
- Parent Name

### Percentage
- Percentage
- Marks %
- Score %
- Grade Percentage
- Overall Percentage

### CGPA
- CGPA
- GPA
- Grade Point
- Grade Point Average

*See full list in completed guide*

---

## 🐍 Python Example

```python
import requests

token = "your_auth_token"
headers = {"Authorization": f"Bearer {token}"}

# Map fields
response = requests.post(
    "http://localhost:5000/api/field-mapping/map",
    headers=headers,
    json={
        "formFields": [
            {"label": "Student Name", "type": "text"},
            {"label": "Percentage", "type": "number"}
        ],
        "storedData": {
            "student_name": "John",
            "cgpa": 8.2
        }
    }
)

result = response.json()
print(result["data"]["mapped_fields"])
# Output: [
#   {"form_field": "Student Name", "value": "John", "confidence": 0.95, ...},
#   {"form_field": "Percentage", "value": "77.9", "confidence": 0.88, "status": "converted", ...}
# ]
```

---

## JavaScript Example

```javascript
const token = "your_auth_token";

// Map fields
const response = await fetch("http://localhost:5000/api/field-mapping/map", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    formFields: [
      { label: "Student Name", type: "text" },
      { label: "Percentage", type: "number" }
    ],
    storedData: {
      student_name: "John",
      cgpa: 8.2  // Will convert to 77.9%
    }
  })
});

const result = await response.json();
console.log(result.data.mapped_fields);
```

---

## 🎨 React Component (Quick Example)

```jsx
import { useState } from 'react';

function SmartFormField({ label, type }) {
  const [value, setValue] = useState('');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    // Auto-map on mount
    fetch('/api/field-mapping/map-single', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fieldLabel: label })
    })
    .then(r => r.json())
    .then(data => {
      if (data.data.value && data.data.confidence > 0.75) {
        setValue(data.data.value);  // Auto-fill
        setConfidence(data.data.confidence);
      }
    });
  }, [label]);

  return (
    <div>
      <label>{label} {confidence > 0 && `✓ ${(confidence*100).toFixed(0)}%`}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={confidence > 0.75 ? {backgroundColor: '#f0fdf4'} : {}}
      />
    </div>
  );
}
```

---

## ⚙️ Configuration

### Enable/Disable AI Mapping

**With AI (recommended):**
```json
{
  "formFields": [...],
  "useAI": true
}
```

**Local only (faster):**
```json
{
  "formFields": [...],
  "useAI": false
}
```

### Confidence Threshold

**Strict (auto-fill high confidence):**
```javascript
const threshold = 0.90;
```

**Medium (good suggestions):**
```javascript
const threshold = 0.75;
```

**Loose (include weak matches):**
```javascript
const threshold = 0.50;
```

---

## 🐛 Troubleshooting

### Issue: "All fields showing low confidence"

**Solution:** Check field names. Run:
```bash
curl -X GET http://localhost:5000/api/field-mapping/variations/father_name \
  -H "Authorization: Bearer $TOKEN"
```

See if your field name matches a variation.

### Issue: "CGPA not converting to percentage"

**Solution:** Verify stored data has `cgpa` key:
```json
{
  "storedData": {
    "cgpa": 8.2  // Must be a number
  }
}
```

### Issue: "Getting 401 Unauthorized"

**Solution:** Ensure token is valid and in Authorization header:
```bash
-H "Authorization: Bearer your_valid_token"
```

---

## 📖 Full Documentation

For complete details, see:

- **Main Guide:** `SMART_FIELD_MAPPING_GUIDE.md`
- **Testing Guide:** `SMART_FIELD_MAPPING_TESTING.md`
- **Frontend Examples:** `FRONTEND_INTEGRATION_EXAMPLES.tsx`
- **Implementation Summary:** `IMPLEMENTATION_COMPLETE.md`

---

## ✅ Checklist to Get Started

- [x] Backend running on port 5000
- [ ] Get auth token
- [ ] Test "/map-single" endpoint
- [ ] Test CGPA conversion
- [ ] Test "/map" endpoint
- [ ] Get standard fields list
- [ ] Review frontend examples
- [ ] Implement in your app

---

## 🎯 Next Steps

1. **Test all endpoints** (5 mins)
   - Follow examples above
   - Use Postman or curl

2. **Integrate in backend** (10 mins)
   - Already integrated into form submission!
   - Submit a form to see mapping in response

3. **Update frontend** (15 mins)
   - Use provided React components
   - Add auto-fill UI
   - Show confidence badges

4. **Monitor** (ongoing)
   - Check mapping accuracy
   - Monitor confidence scores
   - Collect user feedback

---

## 🎉 You're Ready!

Start using the endpoints immediately. All 7 endpoints are live and tested.

**Questions?** Review the detailed guides above or check the source code comments.

Happy mapping! 🚀
