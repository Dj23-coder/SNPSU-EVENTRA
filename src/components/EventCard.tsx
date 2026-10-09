import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  Trophy,
  ShieldCheck,
  Bookmark,
  MessageCircle,
  ExternalLink,
  Flame,
  AlertTriangle,
  Copy,
  Edit2,
  Trash2,
  Heart,
  Share2,
  Tag,
  CheckCircle,
  Users,
} from 'lucide-react';
import { EventItem, EventType, EventStatus } from '../types';
import {
  getGoogleCalendarUrl,
  getWhatsAppUrl,
  getWhatsAppShareUrl,
  maskPhoneNumber,
  formatDisplayDate,
  formatTime12h,
  isClosingSoon,
  getClosingSoonText,
} from '../services/calendarService';
import {
  isEventInterested,
  toggleInterested,
  recordCalendarClick,
  isUserRegisteredLocally,
  getEventRegistrations,
} from '../services/storageService';

interface EventCardProps {
  event: EventItem;
  isBookmarked: boolean;
  onToggleBookmark: (eventId: string) => void;
  onOpenDetail: (event: EventItem) => void;
  onOpenRegister?: (event: EventItem) => void;
  onOpenParticipants?: (event: EventItem) => void;
  isOwner?: boolean;
  onEdit?: (event: EventItem) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: EventItem) => void;
}

// Consistent readable colors per event type with clear text
export const getEventTypeBadgeClass = (type: EventType) => {
  switch (type) {
    case 'Competition':
      return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
    case 'Workshop':
      return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
    case 'Fest':
      return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    case 'Talk':
      return 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
    case 'Other':
    default:
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
  }
};

export const getStatusBadgeConfig = (status: EventStatus) => {
  switch (status) {
    case 'Cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-red-600 text-white font-extrabold',
        border: 'border-red-600',
        cardBorder: 'border-red-300',
      };
    case 'Postponed':
      return {
        label: 'Postponed',
        bg: 'bg-orange-500 text-white font-bold',
        border: 'border-orange-500',
        cardBorder: 'border-orange-300',
      };
    case 'Venue Changed':
      return {
        label: 'Venue Changed',
        bg: 'bg-amber-400 text-amber-950 font-bold',
        border: 'border-amber-400',
        cardBorder: 'border-amber-300',
      };
    case 'Scheduled':
    default:
      return null;
  }
};

/**
 * Extracts the single day number from a YYYY-MM-DD date string.
 */
export function getDayNumber(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return String(parseInt(parts[2], 10));
  }
  const d = new Date(dateStr);
  return String(d.getDate());
}

/**
 * Breaks the month name into 3 vertical syllables matching the reference editorial typography.
 * E.g., October -> ['Oct', 'ob', 'er'], November -> ['Nov', 'em', 'ber'], December -> ['Dec', 'em', 'ber']
 */
export function getStackedMonth(dateStr: string): string[] {
  if (!dateStr) return ['Mon', 'th'];
  const parts = dateStr.split('-');
  const monthIdx = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : new Date(dateStr).getMonth();

  switch (monthIdx) {
    case 0:
      return ['Jan', 'ua', 'ry'];
    case 1:
      return ['Feb', 'ru', 'ary'];
    case 2:
      return ['Mar', 'ch'];
    case 3:
      return ['Apr', 'il'];
    case 4:
      return ['May'];
    case 5:
      return ['Jun', 'e'];
    case 6:
      return ['Jul', 'y'];
    case 7:
      return ['Aug', 'ust'];
    case 8:
      return ['Sep', 'tem', 'ber'];
    case 9:
      return ['Oct', 'ob', 'er'];
    case 10:
      return ['Nov', 'em', 'ber'];
    case 11:
      return ['Dec', 'em', 'ber'];
    default:
      return ['Mon', 'th'];
  }
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isBookmarked,
  onToggleBookmark,
  onOpenDetail,
  onOpenRegister,
  onOpenParticipants,
  isOwner,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [interested, setInterested] = React.useState(() => isEventInterested(event.id));
  const [interestedCount, setInterestedCount] = React.useState(event.interestedCount || 0);
  const [isRegistered, setIsRegistered] = React.useState(() => isUserRegisteredLocally(event.id));

  React.useEffect(() => {
    setIsRegistered(isUserRegisteredLocally(event.id));
    const handleLocalReg = () => {
      setIsRegistered(isUserRegisteredLocally(event.id));
    };
    window.addEventListener('snpsu-local-registrations-updated', handleLocalReg);
    window.addEventListener('snpsu-registrations-updated', handleLocalReg);
    return () => {
      window.removeEventListener('snpsu-local-registrations-updated', handleLocalReg);
      window.removeEventListener('snpsu-registrations-updated', handleLocalReg);
    };
  }, [event.id]);

  const currentSeats = event.seatsBooked ?? 0;
  const isFull = Boolean(event.maxSeats && currentSeats >= event.maxSeats);
  const isCancelled = event.status === 'Cancelled';
  const isDeadlinePassed = Boolean(
    event.registrationDeadline &&
    new Date().toISOString().split('T')[0] > event.registrationDeadline
  );
  const seatsLeft = event.maxSeats ? Math.max(0, event.maxSeats - currentSeats) : null;

  const statusConfig = getStatusBadgeConfig(event.status);
  const closingSoon = isClosingSoon(event);
  const googleCalUrl = getGoogleCalendarUrl(event);
  const whatsAppUrl = getWhatsAppUrl(event);
  const shareWhatsAppUrl = getWhatsAppShareUrl(event);

  const dayNumber = getDayNumber(event.date);
  const monthParts = getStackedMonth(event.date);
  const timeRange = `${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}`;

  const handleInterestedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleInterested(event.id);
    setInterested(result.isInterested);
    setInterestedCount(result.newCount);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordCalendarClick(event.id);
  };

  return (
    <article
      className={`group relative bg-white border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-lg ${
        statusConfig ? statusConfig.cardBorder : 'border-neutral-200 hover:border-neutral-900'
      } ${event.status === 'Cancelled' ? 'opacity-90' : ''}`}
    >
      {/* Top Section: Title, Badges, Bookmark */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between pb-3">
        <div>
          {/* Header row: Status / Type Pill & Bookmark */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {statusConfig ? (
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs ${statusConfig.bg}`}>
                  {statusConfig.label}
                </span>
              ) : closingSoon ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider animate-pulse">
                  <Flame className="w-2.5 h-2.5" />
                  {getClosingSoonText(event.registrationDeadline || '')}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider text-neutral-500 bg-neutral-100 rounded-xs">
                  {event.eventType}
                </span>
              )}

              {event.isClubVerified && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-xs bg-blue-50 text-blue-700 text-[10px] font-medium"
                  title="Verified Club"
                >
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            {/* Bookmark star / bookmark icon */}
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleBookmark(event.id);
              }}
              className={`p-1.5 rounded-sm transition active:scale-90 ${
                isBookmarked
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-neutral-400 hover:text-neutral-900'
              }`}
              title={isBookmarked ? 'Remove from My Schedule' : 'Save to My Schedule'}
              aria-label="Bookmark event"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Event Title */}
          <h3
            onClick={() => onOpenDetail(event)}
            className="font-medium text-[15px] sm:text-[16px] text-neutral-900 leading-snug hover:text-neutral-600 transition-colors line-clamp-2 min-h-[2.6rem] cursor-pointer"
            title={event.title}
          >
            {event.title}
          </h3>
        </div>

        {/* The Signature Date Block: Giant Day Number + Stacked Month Syllables */}
        <div className="pt-3 pb-2 flex items-baseline gap-2.5 select-none">
          <span className="text-4xl sm:text-[44px] font-extrabold text-neutral-900 tracking-tighter leading-none">
            {dayNumber}
          </span>
          <div className="flex flex-col text-[10px] font-semibold text-neutral-600 uppercase tracking-wider leading-[1.05]">
            {monthParts.map((part, idx) => (
              <span key={idx}>{part}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Section: Event Poster Image */}
      <div
        onClick={() => onOpenDetail(event)}
        className="relative w-full aspect-[16/10] bg-neutral-100 overflow-hidden cursor-pointer"
      >
        {event.posterUrl ? (
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-neutral-900 text-white">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
              Sapthagiri NPS University
            </span>
            <span className="text-sm font-bold mt-1 line-clamp-1 px-4">{event.clubName}</span>
          </div>
        )}

        {/* Free or Fee badge overlay */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-xs text-white rounded-xs">
            {event.entryFee || 'Free'}
          </span>
        </div>

        {/* Seats booked badge for in-app events */}
        {event.maxSeats && event.registrationType === 'in_app' && (
          <div className="absolute bottom-2 right-2 pointer-events-none">
            <span className="px-2 py-0.5 text-[10px] font-medium bg-white/90 backdrop-blur-xs text-neutral-900 rounded-xs">
              {currentSeats}/{event.maxSeats} booked
            </span>
          </div>
        )}
      </div>

      {/* Sleek Dark Action Buttons Bar - Matching the Reference Image */}
      <div className="w-full bg-[#1c1c1c] text-white flex items-stretch border-t border-neutral-800">
        {event.registrationType === 'in_app' ? (
          <>
            {isRegistered ? (
              <div className="flex-1 py-2.5 px-3 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 border-r border-neutral-700">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Registered</span>
              </div>
            ) : isCancelled ? (
              <div className="flex-1 py-2.5 px-3 text-xs font-semibold text-neutral-400 text-center border-r border-neutral-700">
                Cancelled
              </div>
            ) : isDeadlinePassed ? (
              <div className="flex-1 py-2.5 px-3 text-xs font-semibold text-neutral-400 text-center border-r border-neutral-700">
                Closed
              </div>
            ) : isFull ? (
              <div className="flex-1 py-2.5 px-3 text-xs font-semibold text-amber-400 text-center border-r border-neutral-700">
                Full
              </div>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenRegister ? onOpenRegister(event) : onOpenDetail(event);
                }}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-center hover:bg-black transition-colors border-r border-neutral-700 tracking-wide"
              >
                Register
              </button>
            )}

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpenDetail(event);
              }}
              className="flex-1 py-2.5 px-3 text-xs font-medium text-center text-neutral-200 hover:bg-black transition-colors tracking-wide"
            >
              More info
            </button>
          </>
        ) : event.registrationType === 'external' && event.registrationLink ? (
          <>
            <a
              href={event.registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 py-2.5 px-3 text-xs font-semibold text-center hover:bg-black transition-colors border-r border-neutral-700 flex items-center justify-center gap-1 tracking-wide"
            >
              <span>Register</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpenDetail(event);
              }}
              className="flex-1 py-2.5 px-3 text-xs font-medium text-center text-neutral-200 hover:bg-black transition-colors tracking-wide"
            >
              More info
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onOpenDetail(event);
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold text-center text-white hover:bg-black transition-colors tracking-wide"
          >
            More info
          </button>
        )}
      </div>

      {/* Subtle Bottom Metadata Row: Organizer, Time & Venue */}
      <div className="px-4 py-2.5 bg-neutral-50/80 border-t border-neutral-100 text-[11px] text-neutral-600 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-neutral-800 truncate" title={event.clubName}>
            {event.clubName}
          </span>
          <span className="text-neutral-500 shrink-0">{timeRange}</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-neutral-500">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0 text-neutral-400" />
            <span className="truncate">{event.venue}</span>
          </div>

          {/* Quick social / calendar actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInterestedToggle}
              className={`p-1 rounded transition hover:text-rose-600 ${
                interested ? 'text-rose-600 font-bold' : 'text-neutral-400'
              }`}
              title={interested ? 'Marked interested' : 'Mark interested'}
            >
              <Heart className={`w-3 h-3 ${interested ? 'fill-current' : ''}`} />
            </button>

            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCalendarClick}
              className="p-1 text-neutral-400 hover:text-blue-600 transition"
              title="Add to Google Calendar"
            >
              <Calendar className="w-3 h-3" />
            </a>

            <a
              href={shareWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 text-neutral-400 hover:text-emerald-600 transition"
              title="Share on WhatsApp"
            >
              <Share2 className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Club Coordinator Management Tools (when owner) */}
        {isOwner && (
          <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between gap-1 text-[11px]">
            {event.registrationType === 'in_app' && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenParticipants && onOpenParticipants(event);
                }}
                className="py-1 px-2 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 font-semibold flex items-center gap-1"
                title="View registered students"
              >
                <Users className="w-3 h-3" />
                <span>({getEventRegistrations(event.id).length})</span>
              </button>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit && onEdit(event);
                }}
                className="py-1 px-2 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                title="Edit Event"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onDuplicate && onDuplicate(event);
                }}
                className="py-1 px-2 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                title="Duplicate event"
              >
                <Copy className="w-3 h-3 text-purple-600" />
              </button>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete && onDelete(event.id);
                }}
                className="py-1 px-2 rounded bg-white border border-red-200 hover:bg-red-50 text-red-600"
                title="Delete Event"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
