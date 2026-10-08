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
  AlertTriangle,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { EventItem, EventStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDate, formatTime12h } from '../services/calendarService';
import { getEventTypeBadgeClass, getStatusBadgeConfig } from './EventCard';

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

  // Filter ONLY this club's events (or all if admin)
  const myEvents = events.filter(e => {
    if (isAdmin) return true;
    return e.clubId === currentUser?.id;
  });

  // Calculate metrics
  const total = myEvents.length;
  const activeCount = myEvents.filter(e => e.status === 'Scheduled').length;
  const changedCount = myEvents.filter(e => e.status === 'Postponed' || e.status === 'Venue Changed').length;
  const cancelledCount = myEvents.filter(e => e.status === 'Cancelled').length;

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

  return (
    <div className="space-y-6">
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Publish New Event</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Events</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Scheduled Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
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

      {/* My Events List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg text-slate-900">
            Managed Events ({myEvents.length})
          </h3>
          <p className="text-xs text-slate-500">
            You can create, edit, cancel, and duplicate events for your club.
          </p>
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
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Status Changer Button */}
                    <button
                      onClick={() => handleOpenStatusModal(event)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                      title="Update event status"
                    >
                      Status: <strong>{event.status}</strong>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEditEvent(event)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 flex items-center gap-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => onDuplicateEvent(event)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 flex items-center gap-1 transition"
                      title="Duplicate event to new form"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteEvent(event.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                      title="Delete event"
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

            {/* Note requirement for Postponed / Venue Changed */}
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
    </div>
  );
};
