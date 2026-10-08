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
  RefreshCw,
  Copy,
  Edit2,
  Trash2,
} from 'lucide-react';
import { EventItem, EventType, EventStatus } from '../types';
import {
  getGoogleCalendarUrl,
  getWhatsAppUrl,
  maskPhoneNumber,
  formatDisplayDate,
  formatTime12h,
  isClosingSoon,
  getClosingSoonText,
} from '../services/calendarService';

interface EventCardProps {
  event: EventItem;
  isBookmarked: boolean;
  onToggleBookmark: (eventId: string) => void;
  onOpenDetail: (event: EventItem) => void;
  isOwner?: boolean;
  onEdit?: (event: EventItem) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: EventItem) => void;
}

// Clear colors for each event type
export const getEventTypeBadgeClass = (type: EventType) => {
  switch (type) {
    case 'Competition':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Workshop':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Fest':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Talk':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'Other':
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
};

export const getStatusBadgeConfig = (status: EventStatus) => {
  switch (status) {
    case 'Cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-red-500 text-white',
        border: 'border-red-600',
        cardBorder: 'border-red-300 bg-red-50/20',
      };
    case 'Postponed':
      return {
        label: 'Postponed',
        bg: 'bg-orange-500 text-white',
        border: 'border-orange-600',
        cardBorder: 'border-orange-300 bg-orange-50/20',
      };
    case 'Venue Changed':
      return {
        label: 'Venue Changed',
        bg: 'bg-amber-400 text-amber-950 font-bold',
        border: 'border-amber-500',
        cardBorder: 'border-amber-300 bg-amber-50/20',
      };
    case 'Scheduled':
    default:
      return null;
  }
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isBookmarked,
  onToggleBookmark,
  onOpenDetail,
  isOwner,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const statusConfig = getStatusBadgeConfig(event.status);
  const closingSoon = isClosingSoon(event);
  const googleCalUrl = getGoogleCalendarUrl(event);
  const whatsAppUrl = getWhatsAppUrl(event);

  const formattedDate = formatDisplayDate(event.date);
  const timeRange = `${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}`;

  return (
    <article
      className={`group relative rounded-2xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
        statusConfig ? statusConfig.cardBorder : 'border-slate-200 hover:border-emerald-300'
      } ${event.status === 'Cancelled' ? 'opacity-85' : ''}`}
    >
      {/* Top Banner / Poster Thumbnail */}
      <div
        onClick={() => onOpenDetail(event)}
        className="cursor-pointer relative h-40 sm:h-44 w-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 overflow-hidden"
      >
        {event.posterUrl ? (
          <img
            src={event.posterUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={e => {
              // Fallback to placeholder if broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          /* Clean themed graphic placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-tr from-emerald-900/10 via-teal-900/5 to-slate-900/10">
            <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-700 font-bold text-lg mb-2">
              {event.eventType.slice(0, 1)}
            </div>
            <p className="text-xs font-semibold text-slate-700 line-clamp-1">{event.clubName}</p>
            <p className="text-[11px] text-slate-500 font-medium">Sapthagiri NPS University</p>
          </div>
        )}

        {/* Gradient Overlay for badges contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges (Left & Right) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 pointer-events-none">
          {/* Event Type & Status Badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${getEventTypeBadgeClass(
                event.eventType
              )}`}
            >
              {event.eventType}
            </span>

            {statusConfig && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${statusConfig.bg}`}
              >
                {statusConfig.label}
              </span>
            )}
          </div>

          {/* Bookmark Button (Clickable) */}
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleBookmark(event.id);
            }}
            className={`pointer-events-auto p-2 rounded-full transition shadow-md active:scale-90 ${
              isBookmarked
                ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                : 'bg-white/90 text-slate-700 hover:bg-white hover:text-amber-500'
            }`}
            title={isBookmarked ? 'Remove from My Schedule' : 'Add to My Schedule'}
            aria-label="Bookmark event"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-slate-900' : ''}`} />
          </button>
        </div>

        {/* Bottom floating quick chips over image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5 font-medium drop-shadow-md">
            <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            <span>{formattedDate}</span>
          </div>

          {closingSoon && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-bold text-[10px] animate-pulse shadow-md">
              <Flame className="w-3 h-3" />
              {getClosingSoonText(event.registrationDeadline || '')}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Organizer Club Header with Verified checkmark */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
            <span className="font-semibold text-slate-800 hover:text-emerald-700 transition">
              {event.clubName}
            </span>
            {event.isClubVerified && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200"
                title="Verified University Club"
              >
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onOpenDetail(event)}
            className="cursor-pointer font-bold text-base sm:text-lg text-slate-900 leading-snug hover:text-emerald-700 transition line-clamp-2 mb-2"
          >
            {event.title}
          </h3>

          {/* Short Description (max 200 chars) */}
          <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-3 leading-relaxed">
            {event.shortDescription}
          </p>

          {/* Special Status Note Box if Postponed or Venue Changed */}
          {(event.status === 'Postponed' || event.status === 'Venue Changed') && event.statusNote && (
            <div
              className={`mb-3 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                event.status === 'Postponed'
                  ? 'bg-orange-50 border-orange-200 text-orange-900'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold text-[11px] uppercase tracking-wide">
                  Update: {event.status}
                </p>
                <p className="font-medium mt-0.5">{event.statusNote}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Updated: {new Date(event.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Metadata Grid (Time, Venue) */}
          <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium">{timeRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-medium">{event.venue}</span>
            </div>
          </div>

          {/* Badges: Certificate, Prize */}
          <div className="flex flex-wrap gap-1.5 items-center mb-4">
            {event.certificateProvided && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                <Award className="w-3 h-3 text-emerald-600" />
                <span>Certificate</span>
              </span>
            )}

            {event.prize && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                <Trophy className="w-3 h-3 text-amber-600" />
                <span className="truncate max-w-[170px]">{event.prize}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          {/* Student Actions */}
          <div className="grid grid-cols-2 gap-2">
            {/* Google Calendar Link */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
              title="Add to Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Cal</span>
            </a>

            {/* WhatsApp Coordinator Contact Button */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition active:scale-95"
              title={`Ask coordinator via WhatsApp: ${maskPhoneNumber(event.contactWhatsApp)}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Detail View Trigger */}
          <button
            onClick={() => onOpenDetail(event)}
            className="w-full py-1.5 text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center justify-center gap-1"
          >
            <span>View Full Details & Register</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          {/* Club Coordinator Management Tools (when owner) */}
          {isOwner && (
            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-xl">
              <button
                onClick={() => onEdit && onEdit(event)}
                className="py-1 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1"
                title="Edit Event"
              >
                <Edit2 className="w-3 h-3 text-blue-600" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => onDuplicate && onDuplicate(event)}
                className="py-1 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1"
                title="Duplicate event to form"
              >
                <Copy className="w-3 h-3 text-purple-600" />
                <span>Copy</span>
              </button>

              <button
                onClick={() => onDelete && onDelete(event.id)}
                className="py-1 px-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 text-[11px] font-semibold flex items-center justify-center gap-1"
                title="Delete Event"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
