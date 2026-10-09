import { EventItem, ClubUser, ClashResult, ReportItem, ReportReason } from '../types';
import { getInitialEvents, INITIAL_CLUBS } from '../data/sampleData';

const EVENTS_STORAGE_KEY = 'snpsu_eventra_events_v2';
const BOOKMARKS_STORAGE_KEY = 'snpsu_eventra_bookmarks_v2';
const CLUBS_STORAGE_KEY = 'snpsu_eventra_clubs_v2';
const INTERESTED_STORAGE_KEY = 'snpsu_eventra_interested_v2';
const REPORTS_STORAGE_KEY = 'snpsu_eventra_reports_v2';

// In-memory fallback if localStorage is disabled or throws
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`localStorage getItem failed for key: ${key}`, e);
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`localStorage setItem failed for key: ${key}`, e);
  }
  memoryStore[key] = value;
}

/* ==================== EVENTS DATA LAYER ==================== */

export function getAllEvents(includeHidden = false): EventItem[] {
  const raw = safeGetItem(EVENTS_STORAGE_KEY);
  let eventsList: EventItem[];

  if (!raw) {
    eventsList = getInitialEvents();
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsList));
  } else {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        eventsList = parsed;
      } else {
        eventsList = getInitialEvents();
        safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsList));
      }
    } catch (e) {
      console.error('Failed to parse events, fallback to sample:', e);
      eventsList = getInitialEvents();
      safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsList));
    }
  }

  // Hide hidden events from students
  if (!includeHidden) {
    return eventsList.filter(e => !e.hidden);
  }
  return eventsList;
}

export function saveEvent(event: EventItem): EventItem {
  const events = getAllEvents(true);
  const existingIndex = events.findIndex(e => e.id === event.id);

  const updatedEvent: EventItem = {
    ...event,
    entryFee: event.entryFee?.trim() || 'Free',
    interestedCount: event.interestedCount ?? 0,
    viewsCount: event.viewsCount ?? 1,
    calendarClicksCount: event.calendarClicksCount ?? 0,
    lastUpdated: new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    events[existingIndex] = updatedEvent;
  } else {
    events.unshift(updatedEvent);
  }

  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
  }
  return updatedEvent;
}

export function deleteEvent(id: string): void {
  const events = getAllEvents(true);
  const filtered = events.filter(e => e.id !== id);
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(filtered));

  // Automatically drop bookmarks for deleted event
  cleanDeadBookmarks(filtered);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: filtered }));
  }
}

export function setEventHidden(id: string, hidden: boolean): void {
  const events = getAllEvents(true);
  const ev = events.find(e => e.id === id);
  if (ev) {
    ev.hidden = hidden;
    ev.lastUpdated = new Date().toISOString();
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
    }
  }
}

export function getEventById(id: string, includeHidden = false): EventItem | undefined {
  const events = getAllEvents(includeHidden);
  return events.find(e => e.id === id);
}

export function resetToSampleEvents(): EventItem[] {
  const fresh = getInitialEvents();
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(fresh));
  cleanDeadBookmarks(fresh);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: fresh }));
  }
  return fresh;
}

/* ==================== APPROXIMATE METRICS TRACKING ==================== */

export function recordEventView(eventId: string): void {
  const events = getAllEvents(true);
  const ev = events.find(e => e.id === eventId);
  if (ev) {
    ev.viewsCount = (ev.viewsCount || 0) + 1;
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }
}

export function recordCalendarClick(eventId: string): void {
  const events = getAllEvents(true);
  const ev = events.find(e => e.id === eventId);
  if (ev) {
    ev.calendarClicksCount = (ev.calendarClicksCount || 0) + 1;
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
    }
  }
}

/* ==================== INTERESTED (PER-DEVICE RATE LIMIT) ==================== */

export function getInterestedEventIds(): string[] {
  const raw = safeGetItem(INTERESTED_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isEventInterested(eventId: string): boolean {
  return getInterestedEventIds().includes(eventId);
}

export function toggleInterested(eventId: string): { isInterested: boolean; newCount: number } {
  const interested = getInterestedEventIds();
  const isAlready = interested.includes(eventId);
  let updatedIds: string[];

  const events = getAllEvents(true);
  const ev = events.find(e => e.id === eventId);
  let newCount = ev?.interestedCount || 0;

  if (isAlready) {
    updatedIds = interested.filter(id => id !== eventId);
    newCount = Math.max(0, newCount - 1);
  } else {
    updatedIds = [...interested, eventId];
    newCount = newCount + 1;
  }

  if (ev) {
    ev.interestedCount = newCount;
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }
  safeSetItem(INTERESTED_STORAGE_KEY, JSON.stringify(updatedIds));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
  }

  return { isInterested: !isAlready, newCount };
}

/* ==================== CLASH DETECTION ==================== */

export function checkVenueClash(candidate: {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
}): ClashResult {
  if (!candidate.date || !candidate.startTime || !candidate.endTime || !candidate.venue) {
    return { hasClash: false, clashingEvents: [] };
  }

  const events = getAllEvents(true);
  const candVenue = candidate.venue.trim().toLowerCase();

  const clashing = events.filter(e => {
    if (e.id === candidate.id) return false;
    if (e.status === 'Cancelled' || e.hidden) return false;
    if (e.date !== candidate.date) return false;
    if (e.venue.trim().toLowerCase() !== candVenue) return false;

    // Time overlap
    return candidate.startTime < e.endTime && candidate.endTime > e.startTime;
  });

  return {
    hasClash: clashing.length > 0,
    clashingEvents: clashing,
  };
}

export function findScheduleClashes(events: EventItem[]): Map<string, string[]> {
  const clashMap = new Map<string, string[]>();

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i];
      const e2 = events[j];

      if (e1.status === 'Cancelled' || e2.status === 'Cancelled' || e1.hidden || e2.hidden) continue;

      if (e1.date === e2.date) {
        if (e1.startTime < e2.endTime && e1.endTime > e2.startTime) {
          const e1List = clashMap.get(e1.id) || [];
          e1List.push(e2.title);
          clashMap.set(e1.id, e1List);

          const e2List = clashMap.get(e2.id) || [];
          e2List.push(e1.title);
          clashMap.set(e2.id, e2List);
        }
      }
    }
  }

  return clashMap;
}

/* ==================== BOOKMARKS / MY SCHEDULE ==================== */

/**
 * Drop bookmark IDs for events that no longer exist
 */
function cleanDeadBookmarks(existingEvents: EventItem[]): string[] {
  const validIds = new Set(existingEvents.map(e => e.id));
  const current = getBookmarkedIds();
  const cleaned = current.filter(id => validIds.has(id));
  if (cleaned.length !== current.length) {
    safeSetItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function getBookmarkedIds(): string[] {
  const raw = safeGetItem(BOOKMARKS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse bookmarks from storage', e);
    return [];
  }
}

export function toggleBookmark(eventId: string): boolean {
  const current = getBookmarkedIds();
  let updated: string[];
  const isBookmarked = current.includes(eventId);

  if (isBookmarked) {
    updated = current.filter(id => id !== eventId);
  } else {
    updated = [...current, eventId];
  }

  safeSetItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-bookmarks-updated', { detail: updated }));
  }
  return !isBookmarked;
}

export function isEventBookmarked(eventId: string): boolean {
  const ids = getBookmarkedIds();
  return ids.includes(eventId);
}

/* ==================== REPORTS SYSTEM (ADMIN MODERATION) ==================== */

export function getAllReports(): ReportItem[] {
  const raw = safeGetItem(REPORTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function submitReport(report: {
  eventId: string;
  eventTitle: string;
  clubName: string;
  reason: ReportReason;
  note?: string;
}): ReportItem {
  const reports = getAllReports();
  const newReport: ReportItem = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...report,
    reportedAt: new Date().toISOString(),
    resolved: false,
  };
  reports.unshift(newReport);
  safeSetItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  return newReport;
}

export function resolveReport(reportId: string): void {
  const reports = getAllReports();
  const rep = reports.find(r => r.id === reportId);
  if (rep) {
    rep.resolved = true;
    safeSetItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  }
}

/* ==================== CLUBS DATA LAYER ==================== */

export function getAllClubs(): ClubUser[] {
  const raw = safeGetItem(CLUBS_STORAGE_KEY);
  if (!raw) {
    safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(INITIAL_CLUBS));
    return INITIAL_CLUBS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse clubs from storage', e);
  }
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(INITIAL_CLUBS));
  return INITIAL_CLUBS;
}

export function addClub(club: Omit<ClubUser, 'id'>): ClubUser {
  const clubs = getAllClubs();
  const newClub: ClubUser = {
    ...club,
    id: `club-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  clubs.push(newClub);
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));
  return newClub;
}

export function toggleClubVerified(clubId: string): ClubUser | null {
  const clubs = getAllClubs();
  const club = clubs.find(c => c.id === clubId);
  if (!club) return null;

  club.isVerified = !club.isVerified;
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));

  const events = getAllEvents(true);
  let updatedEvents = false;
  events.forEach(ev => {
    if (ev.clubId === clubId) {
      ev.isClubVerified = club.isVerified;
      updatedEvents = true;
    }
  });
  if (updatedEvents) {
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
    }
  }

  return club;
}
