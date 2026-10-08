export type EventType = 'Competition' | 'Workshop' | 'Fest' | 'Talk' | 'Other';

export type EventStatus = 'Scheduled' | 'Cancelled' | 'Postponed' | 'Venue Changed';

export interface EventItem {
  id: string;
  title: string;
  clubId: string;
  clubName: string;
  isClubVerified: boolean;
  shortDescription: string; // Max 200 chars
  eventType: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  certificateProvided: boolean;
  prize?: string; // e.g. "Cash prize ₹5,000"
  registrationLink?: string;
  registrationDeadline?: string; // YYYY-MM-DD
  posterUrl?: string;
  contactName: string;
  contactWhatsApp: string; // 10-digit Indian number
  status: EventStatus;
  statusNote?: string; // Required when Postponed or Venue Changed
  lastUpdated: string; // ISO string
  createdAt: string; // ISO string
}

export interface ClubUser {
  id: string;
  name: string;
  email: string;
  category: string;
  isVerified: boolean;
  role: 'club' | 'admin';
  coordinatorName?: string;
  contactPhone?: string;
}

export type QuickFilter = 'all' | 'today' | 'this_week' | 'free' | 'certificate' | 'prize';

export interface ClashResult {
  hasClash: boolean;
  clashingEvents: EventItem[];
}
