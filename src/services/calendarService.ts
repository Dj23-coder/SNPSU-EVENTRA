import { EventItem } from '../types';
import { TIMEZONE } from '../config/constants';

/**
 * Generate a prefilled Google Calendar link in Indian Standard Time (IST).
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  // Format date and time: YYYY-MM-DD and HH:mm
  const cleanDate = event.date.replace(/-/g, '');
  const cleanStartTime = (event.startTime || '09:00').replace(':', '') + '00';
  const cleanEndTime = (event.endTime || '17:00').replace(':', '') + '00';

  // Construct standard dates parameter: YYYYMMDDTHHmm00/YYYYMMDDTHHmm00 in Asia/Kolkata
  const dates = `${cleanDate}T${cleanStartTime}/${cleanDate}T${cleanEndTime}`;

  const details = `${event.shortDescription}\n\nOrganizer: ${event.clubName} (${
    event.isClubVerified ? 'Verified Club' : 'Club'
  })\nEntry Fee: ${event.entryFee || 'Free'}\nContact: ${event.contactName}\n${
    event.registrationLink ? `Register: ${event.registrationLink}\n` : ''
  }${event.prize ? `Prize: ${event.prize}\n` : ''}${
    event.certificateProvided ? 'Certificate: Provided\n' : ''
  }\n(Sapthagiri NPS University • SNPSU EVENTRA)`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} [SNPSU]`,
    dates,
    ctz: TIMEZONE, // Explicit IST
    details,
    location: `${event.venue}, Sapthagiri NPS University, Bengaluru`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an .ics (iCalendar) file with reminders 1 day before and 1 hour before in IST.
 */
export function generateIcsFileContent(event: EventItem): string {
  const cleanDate = event.date.replace(/-/g, '');
  const cleanStartTime = (event.startTime || '09:00').replace(':', '') + '00';
  const cleanEndTime = (event.endTime || '17:00').replace(':', '') + '00';

  const dtStart = `${cleanDate}T${cleanStartTime}`;
  const dtEnd = `${cleanDate}T${cleanEndTime}`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `${event.title} - Sapthagiri NPS University`;
  const description = `${event.shortDescription.replace(/\n/g, '\\n')}\\n\\nOrganizer: ${event.clubName}\\nFee: ${event.entryFee || 'Free'}\\nContact: ${event.contactName}`;
  const location = `${event.venue}, Sapthagiri NPS University, Bengaluru`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SNPSU EVENTRA//Sapthagiri NPS University//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:Asia/Kolkata',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${event.id}-${cleanDate}@eventra.snpsu.edu.in`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
    `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    // Reminder 1: 1 day before (-P1D)
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Event tomorrow at SNPSU',
    'END:VALARM',
    // Reminder 2: 1 hour before (-PT1H)
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Event starts in 1 hour at SNPSU',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Trigger download of .ics calendar file in the browser
 */
export function downloadIcsFile(event: EventItem): void {
  const icsData = generateIcsFileContent(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  link.download = `${sanitizedTitle}_SNPSU.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * WhatsApp Share link with a friend/group with prefilled event details and app link
 */
export function getWhatsAppShareUrl(event: EventItem, currentUrl?: string): string {
  const shareUrl = currentUrl || window.location.href;
  const message = `Check out this event at Sapthagiri NPS University! 🎉\n\n📌 *${event.title}*\n🏛️ Club: ${event.clubName}\n📅 Date: ${formatDisplayDate(event.date)}\n⏰ Time: ${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}\n📍 Venue: ${event.venue}\n🎟️ Fee: ${event.entryFee || 'Free'}${event.prize ? `\n🏆 Prize: ${event.prize}` : ''}\n\nFind details on SNPSU EVENTRA:\n${shareUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * WhatsApp coordinator direct message (wa.me)
 * Prefilled message: "Hi, I have a question about [event title]"
 */
export function getWhatsAppUrl(event: EventItem): string {
  let phone = event.contactWhatsApp.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = `91${phone}`;
  } else if (phone.length > 10) {
    phone = phone.slice(-10);
    phone = `91${phone}`;
  }

  const message = `Hi, I have a question about ${event.title}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Mask phone number on card (e.g. +91 98450 •••••)
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return '+91 ••••• •••••';
  return `+91 ${digits.slice(0, 5)} •••••`;
}

/**
 * Format date for friendly display as "9 Oct 2026" (day, short month, year) in IST
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format updated timestamp as "9 Oct 2026" in IST
 */
export function formatUpdatedDate(timestamp: string | number): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE,
    });
  } catch {
    return String(timestamp);
  }
}

/**
 * Format timestamp as "9 Oct 2026, 3:30 PM" in IST
 */
export function formatDateTimeIST(timestamp: string | number): string {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE,
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TIMEZONE,
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return String(timestamp);
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
 * Check if registration is closing soon (within 3 days)
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
