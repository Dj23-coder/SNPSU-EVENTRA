import React from 'react';
import {
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Info,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import { EventItem } from '../types';
import {
  getGoogleCalendarUrl,
  formatDisplayDate,
  formatTime12h,
} from '../services/calendarService';
import { findScheduleClashes } from '../services/storageService';
import { getEventTypeBadgeClass, getStatusBadgeConfig } from './EventCard';

interface MyScheduleViewProps {
  bookmarkedEvents: EventItem[];
  onToggleBookmark: (eventId: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onBrowseFeed: () => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({
  bookmarkedEvents,
  onToggleBookmark,
  onSelectEvent,
  onBrowseFeed,
}) => {
  // Sort bookmarked events by date and start time (ascending)
  const sortedEvents = [...bookmarkedEvents].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Calculate schedule clashes
  const clashesMap = findScheduleClashes(sortedEvents);
  const hasAnyClash = clashesMap.size > 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Bookmark className="w-5 h-5 fill-amber-800" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                My Schedule & Bookmarks
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Your personalized SNPSU student planner
              </p>
            </div>
          </div>
        </div>

        {/* Device Persistence Notice */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Note:</strong> Bookmarks are saved on this device only.
          </span>
        </div>
      </div>

      {/* Clash Warning Banner if any overlaps detected! */}
      {hasAnyClash && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs animate-in fade-in duration-300">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-900">
              ⚠️ Schedule Overlap Detected!
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              You have bookmarked multiple events occurring at the same time. Check the warning tags below to resolve schedule conflicts before attending!
            </p>
          </div>
        </div>
      )}

      {/* List of Bookmarked Events */}
      {sortedEvents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            No Events Bookmarked Yet
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
            Star interesting hackathons, workshops, and fests from the events feed to construct your personalized semester schedule and detect clashes.
          </p>
          <button
            onClick={onBrowseFeed}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition active:scale-95"
          >
            <span>Browse All Campus Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEvents.map(event => {
            const statusConfig = getStatusBadgeConfig(event.status);
            const clashingTitles = clashesMap.get(event.id);
            const googleCalUrl = getGoogleCalendarUrl(event);
            const formattedDate = formatDisplayDate(event.date);
            const timeRange = `${formatTime12h(event.startTime)} - ${formatTime12h(event.endTime)}`;

            return (
              <div
                key={event.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  clashingTitles
                    ? 'border-amber-300 ring-2 ring-amber-300/40 bg-amber-50/10'
                    : statusConfig
                    ? statusConfig.cardBorder
                    : 'border-slate-200'
                }`}
              >
                {/* Left Information */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getEventTypeBadgeClass(
                        event.eventType
                      )}`}
                    >
                      {event.eventType}
                    </span>

                    {/* Show status badge if cancelled, postponed, or venue changed */}
                    {statusConfig && (
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${statusConfig.bg}`}
                      >
                        {statusConfig.label}
                      </span>
                    )}

                    {/* Clash warning pill on individual event */}
                    {clashingTitles && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-white font-bold text-xs shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Time Clash</span>
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onSelectEvent(event)}
                    className="font-bold text-base sm:text-lg text-slate-900 hover:text-emerald-700 cursor-pointer transition"
                  >
                    {event.title}
                  </h3>

                  <p className="text-xs font-medium text-slate-600">
                    Organized by <strong className="text-slate-800">{event.clubName}</strong>
                  </p>

                  {/* Overlap details notice */}
                  {clashingTitles && (
                    <div className="p-2 rounded-lg bg-amber-100/70 text-amber-900 text-xs font-medium border border-amber-200">
                      ⚠️ Clashes with: <strong>{clashingTitles.join(', ')}</strong>
                    </div>
                  )}

                  {/* Status change note if postponed or venue changed */}
                  {(event.status === 'Postponed' || event.status === 'Venue Changed') && event.statusNote && (
                    <div className="p-2 rounded-lg bg-orange-50 text-orange-900 text-xs font-medium border border-orange-200">
                      <strong>Status Update:</strong> {event.statusNote}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{timeRange}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[200px]">{event.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="w-full md:w-auto flex flex-row md:flex-col items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <a
                    href={googleCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition"
                    title="Add to Google Calendar"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Add to GCal</span>
                  </a>

                  <button
                    onClick={() => onSelectEvent(event)}
                    className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => onToggleBookmark(event.id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                    title="Remove from bookmarks"
                    aria-label="Remove bookmark"
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
  );
};
