/**
 * Validation utilities for SNPSU EVENTRA
 */

/**
 * Validates a 10-digit Indian mobile number (optionally with +91 or leading 0).
 * Valid numbers begin with digits 6, 7, 8, or 9.
 */
export function validateIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') 
    ? digits.slice(2) 
    : digits.length === 11 && digits.startsWith('0')
    ? digits.slice(1)
    : digits;
  return /^[6-9]\d{9}$/.test(tenDigits);
}

/**
 * Validates safe HTTP/HTTPS URLs.
 */
export function validateExternalUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates Google Form links.
 */
export function validateGoogleFormUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://docs.google.com/forms') ||
    trimmed.startsWith('https://forms.gle')
  );
}

/**
 * Validates that registration deadline is not after the event date.
 */
export function validateEventDates(
  eventDate: string,
  deadline?: string
): { valid: boolean; error?: string } {
  if (!eventDate) return { valid: false, error: 'Event date is required' };
  if (deadline && deadline > eventDate) {
    return { valid: false, error: 'Registration deadline must be on or before the event date' };
  }
  return { valid: true };
}

/**
 * Validates poster image files: JPG, PNG, WebP only, max 2MB.
 */
export function validatePosterFile(file: { type: string; size: number }): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max allowed size is 2MB.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes user text by stripping dangerous characters/scripts.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .trim();
}
