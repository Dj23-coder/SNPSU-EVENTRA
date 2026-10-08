import { EventItem } from '../types';

/**
 * Generate a prefilled Google Calendar link.
 * Format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  // Format date and time: YYYY-MM-DD and HH:mm
  const cleanDate = event.date.replace(/-/g, '');
  const cleanStartTime = (event.startTime || '09:00').replace(':', '') + '00';
  const cleanEndTime = (event.endTime || '17:00').replace(':', '') + '00';

  // Construct standard dates parameter: YYYYMMDDTHHmm00/YYYYMMDDTHHmm00
  const dates = `${cleanDate}T${cleanStartTime}/${cleanDate}T${cleanEndTime}`;

  const details = `${event.shortDescription}\n\nOrganizer: ${event.clubName} (${event.isClubVerified ? 'Verified Club' : 'Club'})\nContact: ${event.contactName}\n${
    event.registrationLink ? `Register: ${event.registrationLink}\n` : ''
  }${event.prize ? `Prize: ${event.prize}\n` : ''}${
    event.certificateProvided ? 'Certificate: Provided\n' : ''
  }\n(SNPSU EVENTRA - Sapthagiri NPS University)`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} [SNPSU]`,
    dates,
    details,
    location: `${event.venue}, Sapthagiri NPS University, Bengaluru`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate a WhatsApp message link (wa.me) with a prefilled question.
 * Requirement: opens wa.me with prefilled message "Hi, I have a question about [event title]"
 */
export function getWhatsAppUrl(event: EventItem): string {
  // Extract 10-digit number
  let phone = event.contactWhatsApp.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = `91${phone}`;
  } else if (phone.length === 12 && phone.startsWith('91')) {
    // Already has 91 country code
  } else if (phone.length > 10) {
    phone = phone.slice(-10);
    phone = `91${phone}`;
  }

  const message = `Hi, I have a question about "${event.title}" organised by ${event.clubName} at Sapthagiri NPS University.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Masks phone number for card display (e.g. +91 98450 •••••)
 * Requirement: Do not show full number as plain text on the card.
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return '+91 ••••• •••••';
  return `+91 ${digits.slice(0, 5)} •••••`;
}

/**
 * Format date for friendly display (e.g., Sat, 10 Oct 2026)
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format 24-hr time to 12-hr with AM/PM
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const minStr = String(m).padStart(2, '0');
    return `${hour12}:${minStr} ${period}`;
  } catch {
    return timeStr;
  }
}

/**
 * Check if registration is closing soon (within 3 days from now)
 */
export function isClosingSoon(event: EventItem): boolean {
  if (event.status === 'Cancelled' || !event.registrationDeadline) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = event.registrationDeadline.split('-').map(Number);
    const deadline = new Date(y, m - 1, d);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 3;
  } catch {
    return false;
  }
}

/**
 * Format relative deadline warning text (e.g., "Closes tomorrow!", "Closes today!")
 */
export function getClosingSoonText(deadlineStr: string): string {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = deadlineStr.split('-').map(Number);
    const deadline = new Date(y, m - 1, d);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Closes today!';
    if (diffDays === 1) return 'Closes tomorrow!';
    return `Closes in ${diffDays} days`;
  } catch {
    return 'Closing soon';
  }
}
