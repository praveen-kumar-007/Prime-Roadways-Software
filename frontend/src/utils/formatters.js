/**
 * Converts text to ALL CAPS. 
 * Use for Cities, Company Names, Vehicle Numbers.
 */
export const formatAllCaps = (value) => {
  if (!value) return "";
  return value.toUpperCase();
};

/**
 * Converts text to Title Case (First Letter Capitalized for each word).
 * Use for Person Names (Contact person, Driver Name).
 */
export const formatTitleCase = (value) => {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Strips all non-numeric characters and limits length to 10 digits.
 * Use for Phone Numbers.
 */
export const formatPhoneNumber = (value) => {
  if (!value) return "";
  // Strip non-digits
  const digitsOnly = value.replace(/\D/g, "");
  // Limit to 10 digits
  return digitsOnly.slice(0, 10);
};

/**
 * Formats date to DD-MM-YYYY format globally.
 * Handles string formats (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY), Date objects, and timestamps.
 */
export const formatDate = (dateValue) => {
  if (!dateValue || dateValue === "-" || dateValue === "") return "-";
  
  if (typeof dateValue === 'string') {
    // Check if already in DD-MM-YYYY or DD/MM/YYYY format
    const ddMMyyyyMatch = dateValue.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (ddMMyyyyMatch) {
      const day = ddMMyyyyMatch[1].padStart(2, '0');
      const month = ddMMyyyyMatch[2].padStart(2, '0');
      const year = ddMMyyyyMatch[3];
      return `${day}-${month}-${year}`;
    }
    // Check if in YYYY-MM-DD format
    const yyyyMMddMatch = dateValue.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (yyyyMMddMatch) {
      const year = yyyyMMddMatch[1];
      const month = yyyyMMddMatch[2].padStart(2, '0');
      const day = yyyyMMddMatch[3].padStart(2, '0');
      return `${day}-${month}-${year}`;
    }
  }

  // Handle Firestore/MongoDB timestamps (seconds)
  if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
    dateValue = dateValue.seconds * 1000;
  }

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return typeof dateValue === 'string' ? dateValue : "-";
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Converts any date (DD-MM-YYYY, YYYY-MM-DD, Date object) to YYYY-MM-DD
 * Specifically needed for HTML5 <input type="date" /> elements.
 */
export const formatDateForInput = (dateValue) => {
  if (!dateValue || dateValue === "-" || dateValue === "") return "";
  if (typeof dateValue === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.split("T")[0];
    }
    const match = dateValue.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
  }
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Standardizes a date value for saving into the database as DD-MM-YYYY
 */
export const formatDateForSave = (dateValue) => {
  const formatted = formatDate(dateValue);
  return formatted === "-" ? "" : formatted;
};

/**
 * Parses any date string (including DD-MM-YYYY) into a valid Date object.
 */
export const parseDate = (dateValue) => {
  if (!dateValue || dateValue === "-" || dateValue === "") return new Date(NaN);
  if (typeof dateValue === 'string') {
    const match = dateValue.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }
  return new Date(dateValue);
};

