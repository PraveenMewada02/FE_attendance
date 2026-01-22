/**
 * Date utility functions for formatting and validation
 */

/**
 * Validates date format DD/MM/YYYY
 */
export function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const [, day, month, year] = dateString.match(dateRegex) || [];
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  // Check if month is valid (1-12)
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  // Check if day is valid for the month
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  if (dayNum < 1 || dayNum > daysInMonth) {
    return false;
  }

  return true;
}

/**
 * Formats date to DD/MM/YYYY format
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Validates and normalizes date string
 * Returns the date in DD/MM/YYYY format or null if invalid
 */
export function normalizeDate(dateString: string): string | null {
  // Remove any whitespace
  const cleaned = dateString.trim();
  
  // Check if it's already in DD/MM/YYYY format
  if (isValidDateFormat(cleaned)) {
    return cleaned;
  }

  // Try to parse other formats
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
  } catch (e) {
    // Invalid date
  }

  return null;
}

