export type EventType = 'Competition' | 'Workshop' | 'Fest' | 'Talk' | 'Other';

export type EventStatus = 'Scheduled' | 'Cancelled' | 'Postponed' | 'Venue Changed';

export type RegistrationType = 'none' | 'external' | 'in_app';

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
  entryFee?: string; // 'Free', '₹50', '₹100', etc.
  certificateProvided: boolean;
  prize?: string; // e.g. "Cash prize ₹5,000"
  registrationType?: RegistrationType; // 'none' | 'external' | 'in_app'
  registrationLink?: string; // Used when registrationType === 'external'
  registrationDeadline?: string; // YYYY-MM-DD
  maxSeats?: number; // Optional limit for in_app registrations
  seatsBooked?: number; // Current count of confirmed in-app participants
  posterUrl?: string;
  contactName: string;
  contactWhatsApp: string; // 10-digit Indian number
  status: EventStatus;
  statusNote?: string; // Required when Postponed or Venue Changed
  hidden?: boolean; // Hidden by admin moderation or club suspension
  interestedCount?: number;
  viewsCount?: number;
  calendarClicksCount?: number;
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
  logoUrl?: string;
  active: boolean; // false = Suspended by Admin
  createdAt?: string; // ISO string
  createdBy?: string;
}

export interface ClubAccessRequest {
  id: string;
  clubName: string;
  coordinatorName: string;
  email: string;
  phone: string;
  category: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string; // ISO string
}

export type QuickFilter = 'all' | 'today' | 'this_week' | 'free' | 'certificate' | 'prize';

export interface ClashResult {
  hasClash: boolean;
  clashingEvents: EventItem[];
}

export type ReportReason =
  | 'Fake or misleading'
  | 'Inappropriate'
  | 'Wrong details'
  | 'Other';

export interface ReportItem {
  id: string;
  eventId: string;
  eventTitle: string;
  clubName: string;
  reason: ReportReason;
  note?: string;
  reportedAt: string; // ISO
  resolved?: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  clubId: string;
  fullName: string;
  usn: string; // University Seat Number or Roll Number
  email: string;
  phone: string;
  department: string;
  year: string;
  registeredAt: string; // ISO
}

export interface ExtractedEventData {
  title: string;
  type: EventType | 'Other' | '';
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  venue: string;
  deadline: string; // YYYY-MM-DD
  fee: string;
  certificate: string; // 'yes' | 'no' | ''
  prize: string;
  registration_link: string;
  contact_name: string;
  contact: string; // 10 digits
  error?: string;
}
