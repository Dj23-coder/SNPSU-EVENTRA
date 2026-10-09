import React, { useState } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Building2,
  Share2,
  Eye,
  Heart,
  CalendarPlus,
  Sparkles,
  Check,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { EventItem, EventStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDate, formatTime12h } from '../services/calendarService';
import { generateShareText } from '../services/aiService';
import { getEventTypeBadgeClass, getStatusBadgeConfig } from './EventCard';
import { getEventRegistrations } from '../services/storageService';
import { ParticipantsModal } from './ParticipantsModal';

interface ClubDashboardProps {
  events: EventItem[];
  onOpenNewEventModal: () => void;
  onEditEvent: (event: EventItem) => void;
  onDuplicateEvent: (event: EventItem) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateStatus: (event: EventItem, newStatus: EventStatus, note?: string) => void;
}

export const ClubDashboard: React.FC<ClubDashboardProps> = ({
  events,
  onOpenNewEventModal,
  onEditEvent,
  onDuplicateEvent,
  onDeleteEvent,
  onUpdateStatus,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [statusChangeModalEvent, setStatusChangeModalEvent] = useState<EventItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<EventStatus>('Scheduled');
  const [statusNoteInput, setStatusNoteInput] = useState('');
  const [statusNoteError, setStatusNoteError] = useState('');

  // Share Text Announcement Modal State
  const [shareTextModalEvent, setShareTextModalEvent] = useState<EventItem | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [generatingText, setGeneratingText] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [participantsEvent, setParticipantsEvent] = useState<EventItem | null>(null);

  // Filter ONLY this club's events (or all if admin)
  const myEvents = events.filter(e => {
    if (isAdmin) return true;
    return e.clubId === currentUser?.id;
  });

  const total = myEvents.length;
  const activeCount = myEvents.filter(e => e.status === 'Scheduled').length;
  const changedCount = myEvents.filter(e => e.status === 'Postponed' || e.status === 'Venue Changed').length;
  const cancelledCount = myEvents.filter(e => e.status === 'Cancelled').length;
  const totalRegistrations = myEvents.reduce(
    (acc, ev) => acc + getEventRegistrations(ev.id).length,
    0
  );

  const handleOpenStatusModal = (event: EventItem) => {
    setStatusChangeModalEvent(event);
    setSelectedNewStatus(event.status);
    setStatusNoteInput(event.statusNote || '');
    setStatusNoteError('');
  };

  const handleSaveStatusModal = () => {
    if (!statusChangeModalEvent) return;

    if (
      (selectedNewStatus === 'Postponed' || selectedNewStatus === 'Venue Changed') &&
      !statusNoteInput.trim()
    ) {
      setStatusNoteError(`A short explanation is required when marking an event as ${selectedNewStatus}`);
      return;
    }

    onUpdateStatus(
      statusChangeModalEvent,
      selectedNewStatus,
      statusNoteInput.trim() || undefined
    );
    setStatusChangeModalEvent(null);
  };

  // Generate WhatsApp Announcement via Gemini API
  const handleGenerateAnnouncement = async (event: EventItem) => {
    setShareTextModalEvent(event);
    setGeneratingText(true);
    setCopiedSuccess(false);

    try {
      const text = await generateShareText(event);
      setGeneratedText(text);
    } catch {
      // Offline fallback
      const fallback = `📢 *${event.title}* by ${event.clubName} at Sapthagiri NPS University!\n\n📅 Date: ${event.date}\n⏰ Time: ${event.startTime} - ${event.endTime}\n📍 Venue: ${event.venue}\n🎟️ Fee: ${event.entryFee || 'Free'}\n${event.prize ? `🏆 Prize: ${event.prize}\n` : ''}${event.certificateProvided ? `📜 Certificate: Provided\n` : ''}${event.registrationLink ? `🔗 Register here: ${event.registrationLink}\n` : ''}${event.registrationDeadline ? `⏳ Deadline: ${event.registrationDeadline}\n` : ''}\nCoordinator: ${event.contactName} (+91 ${event.contactWhatsApp})\n\n_Sapthagiri NPS University • SNPSU EVENTRA_`;
      setGeneratedText(fallback);
    } finally {
      setGeneratingText(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const isSuspended = currentUser?.active === false;

  return (
    <div className="space-y-6">
      {/* Suspended Club Notice (Section 5) */}
      {isSuspended && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-300 text-rose-900 shadow-xs flex items-center gap-3.5">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-rose-900">
              Your club access is paused. Contact the Student Affairs Office.
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Publishing, editing, and deleting events are disabled while access is paused. Your current events are hidden from students.
            </p>
          </div>
        </div>
      )}

      {/* Club Profile & Actions Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentUser?.name || 'Club Portal'}
              </h2>
              {currentUser?.isVerified && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"
                  title="Verified University Organization"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Verified Club</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {currentUser?.email} • Coordinator: {currentUser?.coordinatorName || 'Official'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewEventModal}
          disabled={isSuspended}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Events</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Scheduled Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Registrations</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalRegistrations}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Updates / Postponed</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{changedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Cancelled</p>
          <p className="text-2xl font-black text-red-600 mt-1">{cancelledCount}</p>
        </div>
      </div>

      {/* Managed Events List with Approximate Metrics */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              Managed Events ({myEvents.length})
            </h3>
            <p className="text-xs text-slate-500">
              Analytics metrics shown below are approximate counts recorded on campus devices.
            </p>
          </div>
        </div>

        {myEvents.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm">No events created by your club yet.</p>
            <button
              onClick={onOpenNewEventModal}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Event</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map(event => {
              const statusConfig = getStatusBadgeConfig(event.status);

              return (
                <div
                  key={event.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    statusConfig ? statusConfig.cardBorder : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getEventTypeBadgeClass(
                          event.eventType
                        )}`}
                      >
                        {event.eventType}
                      </span>

                      {statusConfig && (
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${statusConfig.bg}`}
                        >
                          {statusConfig.label}
                        </span>
                      )}

                      <span className="text-xs text-slate-400">
                        Updated: {new Date(event.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-base sm:text-lg text-slate-900">
                      {event.title}
                    </h4>

                    {event.statusNote && (
                      <p className="text-xs text-amber-900 font-medium bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <strong>Change Note:</strong> {event.statusNote}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formatDisplayDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {formatTime12h(event.startTime)} - {formatTime12h(event.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{event.venue}</span>
                      </div>
                    </div>

                    {/* APPROXIMATE METRICS BAR (SECTION G.5) */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Approximate Engagement:
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold" title="Approximate views">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{event.viewsCount || 0} views</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-200" title="Approximate interested taps">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        <span>{event.interestedCount || 0} interested</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200" title="Approximate Google Calendar adds">
                        <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>{event.calendarClicksCount || 0} calendar adds</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Participants Button */}
                    <button
                      onClick={() => setParticipantsEvent(event)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition active:scale-95"
                      title="View registered student participants and download CSV"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Participants ({getEventRegistrations(event.id).length})</span>
                    </button>

                    {/* Share Text Announcement Generator */}
                    <button
                      onClick={() => handleGenerateAnnouncement(event)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition active:scale-95"
                      title="Generate WhatsApp Announcement with Gemini"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Announcement</span>
                    </button>

                    {/* Status Changer Button */}
                    <button
                      onClick={() => handleOpenStatusModal(event)}
                      disabled={isSuspended}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSuspended ? 'Access paused' : 'Update event status'}
                    >
                      Status: <strong>{event.status}</strong>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditEvent(event)}
                      disabled={isSuspended}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSuspended ? 'Access paused' : 'Edit event'}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => onDuplicateEvent(event)}
                      disabled={isSuspended}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSuspended ? 'Access paused' : 'Duplicate event to new form'}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      disabled={isSuspended}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSuspended ? 'Access paused' : 'Delete event'}
                      aria-label="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Announcement Share Text Modal */}
      {shareTextModalEvent && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShareTextModalEvent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  WhatsApp Announcement
                </h3>
              </div>
              <button
                onClick={() => setShareTextModalEvent(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Formatted ready to paste and share directly in SNPSU student groups:
            </p>

            {generatingText ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p>Generating friendly announcement with Gemini AI...</p>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  rows={8}
                  readOnly
                  value={generatedText}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-sans focus:outline-none leading-relaxed text-slate-800"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Created strictly from stored event details
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareTextModalEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  onClick={handleCopyText}
                  disabled={generatingText || !generatedText}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Quick Modal */}
      {statusChangeModalEvent && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setStatusChangeModalEvent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-lg text-slate-900">
              Update Event Status
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Event: <strong>{statusChangeModalEvent.title}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Scheduled', 'Postponed', 'Venue Changed', 'Cancelled'] as EventStatus[]).map(
                  st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setSelectedNewStatus(st);
                        setStatusNoteError('');
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-left ${
                        selectedNewStatus === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {(selectedNewStatus === 'Postponed' || selectedNewStatus === 'Venue Changed') && (
              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  What Changed Note * (Required)
                </label>
                <input
                  type="text"
                  value={statusNoteInput}
                  onChange={e => {
                    setStatusNoteInput(e.target.value);
                    setStatusNoteError('');
                  }}
                  placeholder={
                    selectedNewStatus === 'Postponed'
                      ? 'e.g. New date: 20 Oct'
                      : 'e.g. Moved to Auditorium'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {statusNoteError && (
                  <p className="text-xs text-red-600 mt-1">{statusNoteError}</p>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setStatusChangeModalEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatusModal}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Participants Modal */}
      <ParticipantsModal
        isOpen={Boolean(participantsEvent)}
        onClose={() => setParticipantsEvent(null)}
        event={participantsEvent}
      />
    </div>
  );
};
