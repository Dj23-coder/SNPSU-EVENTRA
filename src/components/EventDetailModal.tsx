import React, { useState } from 'react';
import {
  X,
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
  User,
  Share2,
  Download,
  Flag,
  Heart,
  Tag,
  ShieldAlert,
  Building2,
  CheckCircle,
  Users,
} from 'lucide-react';
import { EventItem } from '../types';
import {
  getGoogleCalendarUrl,
  getWhatsAppUrl,
  getWhatsAppShareUrl,
  downloadIcsFile,
  formatDisplayDate,
  formatTime12h,
  isClosingSoon,
  getClosingSoonText,
  maskPhoneNumber,
} from '../services/calendarService';
import {
  isEventInterested,
  toggleInterested,
  recordCalendarClick,
  isUserRegisteredLocally,
  getEventRegistrations,
} from '../services/storageService';
import { getEventTypeBadgeClass, getStatusBadgeConfig } from './EventCard';
import { ReportModal } from './ReportModal';

interface EventDetailModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (eventId: string) => void;
  onOpenRegister?: (event: EventItem) => void;
  onOpenParticipants?: (event: EventItem) => void;
  isOwner?: boolean;
  isAdmin?: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onOpenRegister,
  onOpenParticipants,
  isOwner,
  isAdmin,
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [interested, setInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);

  // Sync state when event changes
  React.useEffect(() => {
    if (event) {
      setInterested(isEventInterested(event.id));
      setInterestedCount(event.interestedCount || 0);
      setIsRegistered(isUserRegisteredLocally(event.id));
    }
  }, [event]);

  React.useEffect(() => {
    if (!event) return;
    const handleLocalReg = () => {
      setIsRegistered(isUserRegisteredLocally(event.id));
    };
    window.addEventListener('snpsu-local-registrations-updated', handleLocalReg);
    window.addEventListener('snpsu-registrations-updated', handleLocalReg);
    return () => {
      window.removeEventListener('snpsu-local-registrations-updated', handleLocalReg);
      window.removeEventListener('snpsu-registrations-updated', handleLocalReg);
    };
  }, [event?.id]);

  if (!isOpen || !event) return null;

  const statusConfig = getStatusBadgeConfig(event.status);
  const closingSoon = isClosingSoon(event);
  const googleCalUrl = getGoogleCalendarUrl(event);
  const whatsAppUrl = getWhatsAppUrl(event);
  const shareWhatsAppUrl = getWhatsAppShareUrl(event);
  const formattedDate = formatDisplayDate(event.date);
  const timeRange = `${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}`;

  // Safe registration link check
  const isHttpsLink = event.registrationLink?.startsWith('https://');

  const handleInterestedToggle = () => {
    const res = toggleInterested(event.id);
    setInterested(res.isInterested);
    setInterestedCount(res.newCount);
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(event);
    recordCalendarClick(event.id);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button Floating */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition backdrop-blur-xs shadow-md"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Poster / Visual Banner */}
          <div className="relative h-56 sm:h-72 w-full bg-slate-900 shrink-0 overflow-hidden">
            {event.posterUrl ? (
              <img
                src={event.posterUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 text-white">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-extrabold text-emerald-400 mb-3 shadow-inner">
                  {event.eventType.slice(0, 1)}
                </div>
                <p className="text-sm font-semibold text-emerald-200 uppercase tracking-widest">
                  Sapthagiri NPS University
                </p>
                <p className="text-xl font-bold mt-1 max-w-md line-clamp-2">{event.title}</p>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Floating Badges over banner */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${getEventTypeBadgeClass(
                    event.eventType
                  )}`}
                >
                  {event.eventType}
                </span>

                {statusConfig && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${statusConfig.bg}`}
                  >
                    {statusConfig.label}
                  </span>
                )}

                {closingSoon && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white font-bold text-xs shadow-md animate-pulse">
                    <Flame className="w-3.5 h-3.5" />
                    {getClosingSoonText(event.registrationDeadline || '')}
                  </span>
                )}
              </div>

              {/* Bookmark Toggle */}
              <button
                onClick={() => onToggleBookmark(event.id)}
                className={`p-2.5 rounded-full shadow-lg transition active:scale-90 flex items-center gap-1.5 text-xs font-bold ${
                  isBookmarked
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    : 'bg-white/90 text-slate-900 hover:bg-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-slate-950' : ''}`} />
                <span>{isBookmarked ? 'Saved to Schedule' : 'Bookmark'}</span>
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
            {/* Status Alert if Postponed or Venue Changed */}
            {(event.status === 'Postponed' || event.status === 'Venue Changed') && event.statusNote && (
              <div
                className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                  event.status === 'Postponed'
                    ? 'bg-orange-50 border-orange-200 text-orange-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider">
                    Important Notice: Event {event.status}
                  </p>
                  <p className="font-semibold text-base mt-0.5">{event.statusNote}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Last updated by club coordinator on{' '}
                    {new Date(event.lastUpdated).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Organizer Club Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {event.clubName}
                    </span>
                    {event.isClubVerified && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Verified Club</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Official Student Organization • Sapthagiri NPS University</p>
                </div>
              </div>

              {/* Interested Counter Toggle & WhatsApp Share */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInterestedToggle}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                    interested
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${interested ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{interestedCount} Interested</span>
                </button>

                <a
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
                  title="Share event on WhatsApp"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                </a>
              </div>
            </div>

            {/* Title & Short Description rendered as plain text */}
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {event.title}
              </h2>
              <p className="text-slate-700 text-sm sm:text-base mt-2.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {event.shortDescription}
              </p>
            </div>

            {/* Key Schedule & Venue Grid in IST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Event Date & Time (IST)</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formattedDate}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{timeRange}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Venue</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{event.venue}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Sapthagiri NPS University Campus</p>
                </div>
              </div>
            </div>

            {/* Perks, Entry Fee & Awards */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Event Perks & Requirements
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-600">Entry Fee:</span>
                  <span className="font-bold text-slate-900">
                    {event.entryFee || 'Free'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Award
                    className={`w-4 h-4 ${
                      event.certificateProvided ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-slate-600">Certificate:</span>
                  <span className="font-semibold text-slate-900">
                    {event.certificateProvided ? 'Official Certificate Provided' : 'Not Applicable'}
                  </span>
                </div>

                {event.prize && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-slate-600">Prizes:</span>
                    <span className="font-semibold text-slate-900">{event.prize}</span>
                  </div>
                )}

                {event.registrationType === 'in_app' && event.maxSeats && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-600">Capacity:</span>
                    <span className="font-semibold text-slate-900">
                      {event.maxSeats} total seats ({Math.max(0, event.maxSeats - (event.seatsBooked || 0))} seats left)
                    </span>
                  </div>
                )}

                {event.registrationDeadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-slate-600">Registration Deadline:</span>
                    <span className="font-semibold text-slate-900">
                      {formatDisplayDate(event.registrationDeadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact & WhatsApp Coordinator Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Event Coordinator</p>
                  <p className="text-sm font-bold text-slate-900">{event.contactName}</p>
                  <p className="text-xs text-slate-600">
                    WhatsApp: {maskPhoneNumber(event.contactWhatsApp)} (Tap button to chat)
                  </p>
                </div>
              </div>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </a>
            </div>

            {/* Report Event Link */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 font-medium transition"
              >
                <Flag className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                <span>Report this event</span>
              </button>
              <span className="text-[11px] text-slate-400">
                SNPSU EVENTRA does not guarantee prizes or schedules
              </span>
            </div>
          </div>

          {/* Modal Footer with Calendar buttons & Registration */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="w-full sm:w-auto flex items-center gap-2">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Google Cal</span>
              </a>

              <button
                onClick={handleDownloadIcs}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs"
                title="Download .ics file with 1-day and 1-hour reminders (IST)"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Download .ics</span>
              </button>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              {/* Coordinator & Admin Participants Button */}
              {(isOwner || isAdmin) && event.registrationType === 'in_app' && (
                <button
                  type="button"
                  onClick={() => onOpenParticipants && onOpenParticipants(event)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold transition active:scale-95 shadow-2xs"
                  title="View registered student participants and download CSV"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Participants ({getEventRegistrations(event.id).length})</span>
                </button>
              )}

              {/* In-app registration actions */}
              {event.registrationType === 'in_app' && (
                <>
                  {isRegistered ? (
                    <div className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-2xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Registered on this device</span>
                    </div>
                  ) : event.status === 'Cancelled' ? (
                    <div className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs sm:text-sm font-semibold flex items-center justify-center">
                      <span>Event Cancelled</span>
                    </div>
                  ) : event.registrationDeadline && new Date().toISOString().split('T')[0] > event.registrationDeadline ? (
                    <div className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs sm:text-sm font-semibold flex items-center justify-center">
                      <span>Registration Closed</span>
                    </div>
                  ) : event.maxSeats && (event.seatsBooked || 0) >= event.maxSeats ? (
                    <div className="px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center justify-center">
                      <span>Registrations full</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenRegister && onOpenRegister(event)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F1B2D] hover:bg-[#1A2B44] text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 btn-press"
                    >
                      <span>Register</span>
                      {event.maxSeats && (
                        <span className="text-xs font-semibold text-[#C59A3F] bg-white/10 px-2 py-0.5 rounded-md">
                          {Math.max(0, event.maxSeats - (event.seatsBooked || 0))} seats left
                        </span>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* External Registration */}
              {event.registrationType === 'external' && event.registrationLink && (
                <div className="flex flex-col items-end gap-1">
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
                  >
                    <span>Register (External)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <span className="text-[10px] text-slate-400">
                    ↗ Opens external registration ({isHttpsLink ? 'https verified' : 'external link'})
                  </span>
                </div>
              )}

              {/* None Registration */}
              {event.registrationType === 'none' && (
                <span className="text-xs text-slate-500 italic px-2 py-1">
                  Walk-in event (No registration required)
                </span>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs sm:text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
        clubName={event.clubName}
      />
    </>
  );
};
