export const DOCUMENT_ROUTES = {
  AADHAAR: "AADHAAR_SECTION",
  PAN: "PAN_SECTION",
  PASSPORT: "PASSPORT_SECTION",
  TENTH: "EDUCATION_10TH",
  INTER: "EDUCATION_INTER",
  DEGREE: "EDUCATION_DEGREE",
};

export const AUTHORITY_HIERARCHY = {
  PERSONAL_MASTER: 100,
  AADHAAR_SECTION: 95,
  PASSPORT_SECTION: 90,
  PAN_SECTION: 85,
  EDUCATION_DEGREE: 70,
  EDUCATION_INTER: 70,
  EDUCATION_10TH: 70,
};

export const FAMILY_DATA_KEYWORDS = [
  "father",
  "mother",
  "spouse",
  "sibling",
  "parent",
  "family",
  "guardian",
];

export const SIMILARITY_THRESHOLD = 0.85;

export const EXCLUDE_PATTERNS = [
  "subject",
  "marks",
  "roll_number",
  "rank",
  "position",
  "percentage",
  "grade_point",
];

export const INCLUDE_PATTERNS = [
  "name",
  "date",
  "father",
  "mother",
  "address",
  "number",
  "id",
];
