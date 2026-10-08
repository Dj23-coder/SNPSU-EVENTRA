import { EventItem, ClubUser, ClashResult } from '../types';
import { getInitialEvents, INITIAL_CLUBS } from '../data/sampleData';

const EVENTS_STORAGE_KEY = 'snpsu_eventra_events_v1';
const BOOKMARKS_STORAGE_KEY = 'snpsu_eventra_bookmarks_v1';
const CLUBS_STORAGE_KEY = 'snpsu_eventra_clubs_v1';

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

export function getAllEvents(): EventItem[] {
  const raw = safeGetItem(EVENTS_STORAGE_KEY);
  if (!raw) {
    const initial = getInitialEvents();
    safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse events from storage, resetting to initial sample:', e);
  }
  const initial = getInitialEvents();
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveEvent(event: EventItem): EventItem {
  const events = getAllEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);

  const updatedEvent = {
    ...event,
    lastUpdated: new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    events[existingIndex] = updatedEvent;
  } else {
    events.unshift(updatedEvent);
  }

  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  // Dispatch custom storage event for live UI reactivity across tabs / components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
  }
  return updatedEvent;
}

export function deleteEvent(id: string): void {
  const events = getAllEvents();
  const filtered = events.filter(e => e.id !== id);
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(filtered));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: filtered }));
  }
}

export function getEventById(id: string): EventItem | undefined {
  const events = getAllEvents();
  return events.find(e => e.id === id);
}

export function resetToSampleEvents(): EventItem[] {
  const fresh = getInitialEvents();
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(fresh));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: fresh }));
  }
  return fresh;
}

/* ==================== CLASH DETECTION ==================== */

/**
 * Checks if candidate event clashes in venue and time with any existing event
 * (excluding itself and cancelled events)
 */
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

  const events = getAllEvents();
  const candVenue = candidate.venue.trim().toLowerCase();

  const clashing = events.filter(e => {
    if (e.id === candidate.id) return false;
    if (e.status === 'Cancelled') return false;
    if (e.date !== candidate.date) return false;
    if (e.venue.trim().toLowerCase() !== candVenue) return false;

    // Check time overlap: (StartA < EndB) and (EndA > StartB)
    return candidate.startTime < e.endTime && candidate.endTime > e.startTime;
  });

  return {
    hasClash: clashing.length > 0,
    clashingEvents: clashing,
  };
}

/**
 * Checks schedule overlaps between student bookmarked events
 */
export function findScheduleClashes(events: EventItem[]): Map<string, string[]> {
  const clashMap = new Map<string, string[]>(); // eventId -> clashing event titles

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i];
      const e2 = events[j];

      // Ignore cancelled events in time clash
      if (e1.status === 'Cancelled' || e2.status === 'Cancelled') continue;

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

/* ==================== CLUBS / ADMIN DATA LAYER ==================== */

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
    id: `club-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

  // Also update existing events from this club to reflect verification
  const events = getAllEvents();
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
