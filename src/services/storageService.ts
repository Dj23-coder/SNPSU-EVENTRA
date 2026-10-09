import { EventItem, ClubUser, ClashResult, ReportItem, ReportReason, EventRegistration, ClubAccessRequest } from '../types';
import { getInitialEvents, INITIAL_CLUBS, getInitialRegistrations, INITIAL_ACCESS_REQUESTS } from '../data/sampleData';

const EVENTS_STORAGE_KEY = 'snpsu_eventra_events_v3';
const BOOKMARKS_STORAGE_KEY = 'snpsu_eventra_bookmarks_v3';
const CLUBS_STORAGE_KEY = 'snpsu_eventra_clubs_v3';
const INTERESTED_STORAGE_KEY = 'snpsu_eventra_interested_v3';
const REPORTS_STORAGE_KEY = 'snpsu_eventra_reports_v3';
const REGISTRATIONS_STORAGE_KEY = 'snpsu_eventra_registrations_v3';
const ACCESS_REQUESTS_STORAGE_KEY = 'snpsu_eventra_access_requests_v3';

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
    } catch {
      eventsList = getInitialEvents();
      safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(eventsList));
    }
  }

  // Authoritative sync: Always keep isClubVerified in lockstep with the club's verified flag
  const clubs = getAllClubs();
  const clubsMap = new Map<string, ClubUser>(clubs.map(c => [c.id, c]));

  eventsList.forEach(e => {
    const club = clubsMap.get(e.clubId);
    if (club) {
      e.isClubVerified = club.isVerified;
    }
  });

  // Hide hidden events and events of suspended clubs from students
  if (!includeHidden) {
    return eventsList.filter(e => {
      if (e.hidden) return false;
      const club = clubsMap.get(e.clubId);
      if (club && club.active === false) return false;
      return true;
    });
  }
  return eventsList;
}

export function saveEvent(event: EventItem): EventItem {
  const events = getAllEvents(true);
  const existingIndex = events.findIndex(e => e.id === event.id);

  const updatedEvent: EventItem = {
    ...event,
    entryFee: event.entryFee?.trim() || 'Free',
    registrationType: event.registrationType || 'none',
    seatsBooked: event.seatsBooked ?? 0,
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
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(INITIAL_CLUBS));
  safeSetItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(getInitialRegistrations()));
  cleanDeadBookmarks(fresh);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: fresh }));
  }
  return fresh;
}

/* ==================== IN-APP REGISTRATIONS SYSTEM ==================== */

export function getAllRegistrations(): EventRegistration[] {
  const raw = safeGetItem(REGISTRATIONS_STORAGE_KEY);
  if (!raw) {
    const init = getInitialRegistrations();
    safeSetItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getEventRegistrations(eventId: string): EventRegistration[] {
  const all = getAllRegistrations();
  return all.filter(r => r.eventId === eventId);
}

export function isUserRegisteredForEvent(eventId: string, email: string): boolean {
  const all = getAllRegistrations();
  const cleanEmail = email.trim().toLowerCase();
  return all.some(r => r.eventId === eventId && r.email.toLowerCase() === cleanEmail);
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  registration?: EventRegistration;
}

export function registerForEvent(data: {
  eventId: string;
  fullName: string;
  usn: string;
  email: string;
  phone: string;
  department: string;
  year: string;
}): RegisterResult {
  const events = getAllEvents(true);
  const ev = events.find(e => e.id === data.eventId);

  if (!ev) {
    return { success: false, message: 'Event not found.' };
  }

  if (ev.status === 'Cancelled') {
    return { success: false, message: 'This event has been cancelled and is no longer accepting registrations.' };
  }

  // Check deadline
  if (ev.registrationDeadline) {
    const today = new Date().toISOString().split('T')[0];
    if (today > ev.registrationDeadline) {
      return { success: false, message: 'Registration has closed for this event.' };
    }
  }

  // Check capacity limit
  const currentCount = ev.seatsBooked ?? 0;
  if (ev.maxSeats && currentCount >= ev.maxSeats) {
    return { success: false, message: 'Registrations are full for this event.' };
  }

  // Prevent duplicate: one per email per event
  if (isUserRegisteredForEvent(data.eventId, data.email)) {
    return {
      success: false,
      message: `A registration with the email "${data.email}" already exists for this event.`,
    };
  }

  const newReg: EventRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventId: ev.id,
    eventTitle: ev.title,
    clubId: ev.clubId,
    fullName: data.fullName.trim(),
    usn: data.usn.trim().toUpperCase(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    department: data.department.trim(),
    year: data.year.trim(),
    registeredAt: new Date().toISOString(),
  };

  const allRegs = getAllRegistrations();
  allRegs.unshift(newReg);
  safeSetItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(allRegs));

  // Increment event seatsBooked count
  ev.seatsBooked = currentCount + 1;
  saveEvent(ev);

  return { success: true, registration: newReg };
}

export function downloadRegistrationsCsv(eventId: string, eventTitle: string): void {
  const regs = getEventRegistrations(eventId);
  if (regs.length === 0) {
    alert('No participant registrations yet for this event.');
    return;
  }

  const headers = ['Full Name', 'USN/Roll No', 'College Email', 'Phone', 'Department', 'Year', 'Registration Date'];
  const rows = regs.map(r => [
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.usn.replace(/"/g, '""')}"`,
    `"${r.email.replace(/"/g, '""')}"`,
    `"${r.phone.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    `"${r.year.replace(/"/g, '""')}"`,
    `"${new Date(r.registeredAt).toLocaleString('en-IN')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);
  link.download = `Participants_${cleanTitle}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ==================== CLUBS & ADMIN MANAGEMENT LAYER ==================== */

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
  } catch {
    // fallback
  }
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(INITIAL_CLUBS));
  return INITIAL_CLUBS;
}

export function addClub(club: {
  name: string;
  email: string;
  coordinatorName: string;
  contactPhone: string;
  category?: string;
  logoUrl?: string;
  isVerified?: boolean;
}): ClubUser {
  const clubs = getAllClubs();
  const newClub: ClubUser = {
    id: `club-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: club.name.trim(),
    email: club.email.trim().toLowerCase(),
    coordinatorName: club.coordinatorName.trim(),
    contactPhone: club.contactPhone.replace(/\D/g, '').slice(-10),
    category: club.category || 'Technical',
    logoUrl: club.logoUrl?.trim() || undefined,
    isVerified: club.isVerified ?? false,
    role: 'club',
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: 'admin-snpsu',
  };

  clubs.push(newClub);
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-clubs-updated', { detail: clubs }));
  }
  return newClub;
}

export function updateClub(clubId: string, updates: Partial<ClubUser>): ClubUser | null {
  const clubs = getAllClubs();
  const index = clubs.findIndex(c => c.id === clubId);
  if (index < 0) return null;

  const current = clubs[index];
  const updated: ClubUser = {
    ...current,
    ...updates,
    id: current.id, // prevent changing id
    role: current.role,
  };

  clubs[index] = updated;
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));

  // If club name changed, propagate to all events for this club
  if (updates.name && updates.name.trim() !== current.name) {
    const events = getAllEvents(true);
    let modified = false;
    events.forEach(ev => {
      if (ev.clubId === clubId) {
        ev.clubName = updates.name!.trim();
        modified = true;
      }
    });
    if (modified) {
      safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-clubs-updated', { detail: clubs }));
  }
  return updated;
}

export function getEventsCountForClub(clubId: string): number {
  const events = getAllEvents(true);
  return events.filter(e => e.clubId === clubId).length;
}

export function toggleClubVerified(clubId: string): ClubUser | null {
  const clubs = getAllClubs();
  const club = clubs.find(c => c.id === clubId);
  if (!club) return null;

  club.isVerified = !club.isVerified;
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));

  const events = getAllEvents(true);
  events.forEach(ev => {
    if (ev.clubId === clubId) {
      ev.isClubVerified = club.isVerified;
    }
  });
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
    window.dispatchEvent(new CustomEvent('snpsu-clubs-updated', { detail: clubs }));
  }

  return club;
}

/**
 * Suspend or reactivate club:
 * Suspended clubs cannot log in and their events are hidden from the student feed.
 */
export function toggleClubActive(clubId: string): ClubUser | null {
  const clubs = getAllClubs();
  const club = clubs.find(c => c.id === clubId);
  if (!club) return null;

  club.active = !club.active;
  safeSetItem(CLUBS_STORAGE_KEY, JSON.stringify(clubs));

  // Cascade event visibility
  const events = getAllEvents(true);
  events.forEach(ev => {
    if (ev.clubId === clubId) {
      ev.hidden = !club.active;
    }
  });
  safeSetItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-events-updated', { detail: events }));
    window.dispatchEvent(new CustomEvent('snpsu-clubs-updated', { detail: clubs }));
  }

  return club;
}

export function resetClubAccess(clubId: string): { success: boolean; message: string } {
  const clubs = getAllClubs();
  const club = clubs.find(c => c.id === clubId);
  if (!club) {
    return { success: false, message: 'Club not found.' };
  }

  return {
    success: true,
    message: `Password setup and access verification link dispatched to ${club.email}. Raw passwords are never transmitted or displayed.`,
  };
}

/* ==================== ACCESS REQUESTS LAYER ==================== */

export function getAllAccessRequests(): ClubAccessRequest[] {
  const raw = safeGetItem(ACCESS_REQUESTS_STORAGE_KEY);
  if (!raw) {
    safeSetItem(ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCESS_REQUESTS));
    return INITIAL_ACCESS_REQUESTS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fallback
  }
  safeSetItem(ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCESS_REQUESTS));
  return INITIAL_ACCESS_REQUESTS;
}

export function saveAccessRequest(req: Omit<ClubAccessRequest, 'id' | 'status' | 'requestedAt'>): ClubAccessRequest {
  const requests = getAllAccessRequests();
  const newReq: ClubAccessRequest = {
    ...req,
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  requests.unshift(newReq);
  safeSetItem(ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-requests-updated', { detail: requests }));
  }
  return newReq;
}

export function updateAccessRequestStatus(requestId: string, status: 'approved' | 'rejected'): ClubAccessRequest | null {
  const requests = getAllAccessRequests();
  const req = requests.find(r => r.id === requestId);
  if (!req) return null;

  req.status = status;
  safeSetItem(ACCESS_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('snpsu-requests-updated', { detail: requests }));
  }
  return req;
}

export function getAdminMetrics(): {
  clubsCount: number;
  activeClubsCount: number;
  eventsCount: number;
  registrationsCount: number;
  reportsCount: number;
} {
  const clubs = getAllClubs();
  const events = getAllEvents(true);
  const regs = getAllRegistrations();
  const reps = getAllReports();

  return {
    clubsCount: clubs.length,
    activeClubsCount: clubs.filter(c => c.active).length,
    eventsCount: events.length,
    registrationsCount: regs.length,
    reportsCount: reps.filter(r => !r.resolved).length,
  };
}

/* ==================== BOOKMARKS / MY SCHEDULE ==================== */

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

/* ==================== METRICS & INTERESTED ==================== */

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

/* ==================== REPORTS SYSTEM ==================== */

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
