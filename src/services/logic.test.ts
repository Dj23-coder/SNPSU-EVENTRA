import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  validateIndianPhone,
  validateExternalUrl,
  validateGoogleFormUrl,
  validateEventDates,
  validatePosterFile,
  sanitizeText,
} from './validation';
import {
  formatDisplayDate,
  formatDateTimeIST,
  getGoogleCalendarUrl,
  generateIcsFileContent,
} from './calendarService';
import {
  toggleBookmark,
  isEventBookmarked,
  getBookmarkedIds,
  cleanDeadBookmarks,
  findScheduleClashes,
} from './storageService';
import { EventItem } from '../types';

// Mock localStorage for headless Node environment
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => {
    storage[key] = value;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    for (const key in storage) delete storage[key];
  },
};

beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  }
  if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockLocalStorage, dispatchEvent: () => true },
      writable: true,
    });
  }
});

const mockEvent1: EventItem = {
  id: 'ev-test-1',
  title: 'AI Hackathon 2026',
  clubId: 'tech-club',
  clubName: 'Tech Innovations Club',
  isClubVerified: true,
  shortDescription: '24-hour coding challenge at Sapthagiri NPS University.',
  eventType: 'Competition',
  date: '2026-10-15',
  startTime: '10:00',
  endTime: '18:00',
  venue: 'Faraday Hall, Academic Block 2',
  entryFee: 'Free',
  prize: '₹25,000 Cash Prize',
  certificateProvided: true,
  contactName: 'Rahul Sharma',
  contactWhatsApp: '9876543210',
  status: 'Scheduled',
  registrationType: 'external',
  registrationLink: 'https://docs.google.com/forms/d/e/1FAIpQLSc-test/viewform',
  createdAt: '2026-10-01T00:00:00Z',
  lastUpdated: '2026-10-01T00:00:00Z',
};

const mockEvent2: EventItem = {
  id: 'ev-test-2',
  title: 'Robotics Workshop',
  clubId: 'robotics-club',
  clubName: 'Robotics Society',
  isClubVerified: true,
  shortDescription: 'Hands-on microcontrollers workshop.',
  eventType: 'Workshop',
  date: '2026-10-15',
  startTime: '14:00',
  endTime: '17:00',
  venue: 'Robotics Lab 3',
  entryFee: '₹100',
  certificateProvided: true,
  contactName: 'Priya Patel',
  contactWhatsApp: '8765432109',
  status: 'Scheduled',
  registrationType: 'in_app',
  createdAt: '2026-10-02T00:00:00Z',
  lastUpdated: '2026-10-02T00:00:00Z',
};

const mockEvent3: EventItem = {
  id: 'ev-test-3',
  title: 'Cultural Evening 2026',
  clubId: 'cult-club',
  clubName: 'Cultural Committee',
  isClubVerified: false,
  shortDescription: 'Annual fest musical night.',
  eventType: 'Fest',
  date: '2026-10-20',
  startTime: '18:00',
  endTime: '21:00',
  venue: 'Open Air Amphitheatre',
  entryFee: 'Free',
  certificateProvided: false,
  contactName: 'Amit Verma',
  contactWhatsApp: '7654321098',
  status: 'Scheduled',
  registrationType: 'external',
  registrationLink: 'https://forms.gle/xyz123',
  createdAt: '2026-10-03T00:00:00Z',
  lastUpdated: '2026-10-03T00:00:00Z',
};

describe('Input Validation Logic', () => {
  it('validates 10-digit Indian phone numbers', () => {
    expect(validateIndianPhone('9876543210')).toBe(true);
    expect(validateIndianPhone('+91 9876543210')).toBe(true);
    expect(validateIndianPhone('08765432109')).toBe(true);
    expect(validateIndianPhone('6123456789')).toBe(true);
    // Invalid numbers
    expect(validateIndianPhone('1234567890')).toBe(false);
    expect(validateIndianPhone('98765')).toBe(false);
    expect(validateIndianPhone('abcdefghij')).toBe(false);
    expect(validateIndianPhone('')).toBe(false);
  });

  it('validates safe external URLs', () => {
    expect(validateExternalUrl('https://docs.google.com/forms/xyz')).toBe(true);
    expect(validateExternalUrl('http://example.com/test')).toBe(true);
    expect(validateExternalUrl('javascript:alert(1)')).toBe(false);
    expect(validateExternalUrl('not-a-valid-url')).toBe(false);
    expect(validateExternalUrl('')).toBe(false);
  });

  it('validates Google Form URLs strictly', () => {
    expect(validateGoogleFormUrl('https://docs.google.com/forms/d/e/xxx/viewform')).toBe(true);
    expect(validateGoogleFormUrl('https://forms.gle/shortUrl123')).toBe(true);
    expect(validateGoogleFormUrl('https://phishing.com/docs.google.com')).toBe(false);
    expect(validateGoogleFormUrl('https://google.com')).toBe(false);
  });

  it('validates event dates and deadlines', () => {
    expect(validateEventDates('2026-10-15', '2026-10-14').valid).toBe(true);
    expect(validateEventDates('2026-10-15', '2026-10-15').valid).toBe(true);
    // Deadline after event date should fail
    expect(validateEventDates('2026-10-15', '2026-10-16').valid).toBe(false);
    expect(validateEventDates('').valid).toBe(false);
  });

  it('validates poster upload file type and size', () => {
    expect(validatePosterFile({ type: 'image/jpeg', size: 1024 * 1024 }).valid).toBe(true);
    expect(validatePosterFile({ type: 'image/png', size: 500 * 1024 }).valid).toBe(true);
    expect(validatePosterFile({ type: 'image/webp', size: 1.8 * 1024 * 1024 }).valid).toBe(true);
    // PDF or executable should fail
    expect(validatePosterFile({ type: 'application/pdf', size: 1024 }).valid).toBe(false);
    // > 2MB should fail
    expect(validatePosterFile({ type: 'image/jpeg', size: 3 * 1024 * 1024 }).valid).toBe(false);
  });

  it('sanitizes user text removing HTML tags', () => {
    expect(sanitizeText('Hello <script>alert("xss")</script> World')).toBe('Hello alert("xss") World');
    expect(sanitizeText('   <b>Hackathon</b>   ')).toBe('Hackathon');
  });
});

describe('Date Formatting and Calendar Exports', () => {
  it('formats dates in Indian Standard Time (IST)', () => {
    const formatted = formatDisplayDate('2026-10-15');
    expect(formatted).toContain('15');
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('2026');
  });

  it('formats timestamp with IST timezone', () => {
    const formatted = formatDateTimeIST('2026-10-15T09:00:00Z');
    expect(formatted).toContain('15 Oct 2026');
  });

  it('generates a valid Google Calendar URL with IST timezone', () => {
    const url = getGoogleCalendarUrl(mockEvent1);
    expect(url).toContain('calendar.google.com');
    expect(url).toContain('ctz=Asia%2FKolkata');
    expect(url).toContain('20261015T100000%2F20261015T180000');
    expect(url).toContain('Faraday+Hall');
  });

  it('generates a standard RFC 5545 .ics iCalendar file', () => {
    const ics = generateIcsFileContent(mockEvent1);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('SUMMARY:AI Hackathon 2026 - Sapthagiri NPS University');
    expect(ics).toContain('DTSTART;TZID=Asia/Kolkata:20261015T100000');
    expect(ics).toContain('DTEND;TZID=Asia/Kolkata:20261015T180000');
  });
});

describe('Schedule, Bookmark Storage, and Clashes', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('adds and removes bookmarks in persistent storage', () => {
    expect(isEventBookmarked(mockEvent1.id)).toBe(false);

    // Toggle on
    const added = toggleBookmark(mockEvent1.id);
    expect(added).toBe(true);
    expect(isEventBookmarked(mockEvent1.id)).toBe(true);

    const savedBookmarks = getBookmarkedIds();
    expect(savedBookmarks.length).toBe(1);
    expect(savedBookmarks[0]).toBe(mockEvent1.id);

    // Toggle off
    const removed = toggleBookmark(mockEvent1.id);
    expect(removed).toBe(false);
    expect(isEventBookmarked(mockEvent1.id)).toBe(false);
  });

  it('cleans dead bookmarks when an event is deleted from database', () => {
    toggleBookmark(mockEvent1.id);
    toggleBookmark('deleted-event-999');

    // Only mockEvent1 is alive
    const cleaned = cleanDeadBookmarks([mockEvent1]);
    expect(cleaned).toContain(mockEvent1.id);
    expect(isEventBookmarked('deleted-event-999')).toBe(false);
    expect(isEventBookmarked(mockEvent1.id)).toBe(true);
  });

  it('detects schedule time clashes for overlapping events', () => {
    // mockEvent1: 10:00 - 18:00
    // mockEvent2: 14:00 - 17:00 (overlaps with mockEvent1 on same date)
    // mockEvent3: 2026-10-20 (different date, no clash)
    const clashes = findScheduleClashes([mockEvent1, mockEvent2, mockEvent3]);
    expect(clashes.size).toBeGreaterThan(0);
    expect(clashes.has(mockEvent1.id)).toBe(true);
    expect(clashes.get(mockEvent1.id)).toContain(mockEvent2.title);
  });
});

describe('Event Sorting and Filtering Logic', () => {
  const events = [mockEvent3, mockEvent1, mockEvent2]; // unsorted

  it('sorts events chronologically by date and startTime', () => {
    const sorted = [...events].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });

    expect(sorted[0].id).toBe(mockEvent1.id); // Oct 15 10:00
    expect(sorted[1].id).toBe(mockEvent2.id); // Oct 15 14:00
    expect(sorted[2].id).toBe(mockEvent3.id); // Oct 20 18:00
  });

  it('filters events by category / eventType', () => {
    const workshops = events.filter(e => e.eventType === 'Workshop');
    expect(workshops.length).toBe(1);
    expect(workshops[0].id).toBe(mockEvent2.id);

    const competitions = events.filter(e => e.eventType === 'Competition');
    expect(competitions.length).toBe(1);
    expect(competitions[0].id).toBe(mockEvent1.id);
  });

  it('filters events by certificate provided and cash prize', () => {
    const withCert = events.filter(e => e.certificateProvided);
    expect(withCert.length).toBe(2);

    const withPrize = events.filter(e => !!e.prize && e.prize.trim() !== '');
    expect(withPrize.length).toBe(1);
    expect(withPrize[0].id).toBe(mockEvent1.id);
  });
});
