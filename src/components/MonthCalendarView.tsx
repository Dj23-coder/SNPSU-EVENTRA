import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, ExternalLink } from 'lucide-react';
import { EventItem } from '../types';
import { formatDisplayDate, formatTime12h } from '../services/calendarService';
import { getEventTypeBadgeClass, getStatusBadgeConfig } from './EventCard';

interface MonthCalendarViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({ events, onSelectEvent }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayString, setSelectedDayString] = useState<string | null>(() => {
    // Default to today's YYYY-MM-DD
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month (0: Sun, 1: Mon, etc.)
  const firstDay = new Date(year, month, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDayString(`${y}-${m}-${day}`);
  };

  // Group events by YYYY-MM-DD
  const eventsByDate = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, EventItem[]>);

  const selectedDayEvents = selectedDayString ? eventsByDate[selectedDayString] || [] : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
            <span>{monthNames[month]} {year}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select any date to see scheduled campus fests, workshops & competitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            Today
          </button>

          <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 transition"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Calendar on Left, Selected Day Events on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Blank offset tiles */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-xl" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isSelected = selectedDayString === dateStr;
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayString(dateStr)}
                  className={`h-16 sm:h-20 p-1.5 rounded-xl border text-left transition flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : isToday
                      ? 'border-emerald-300 bg-white hover:bg-slate-50'
                      : dayEvents.length > 0
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      : 'border-slate-100 bg-slate-50/30 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event Chips / Dots */}
                  <div className="space-y-0.5 overflow-hidden w-full">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        className="text-[9px] font-semibold truncate px-1 rounded bg-slate-100 text-slate-700 group-hover:bg-white"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] font-bold text-slate-500 text-right">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda View (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Agenda For
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {selectedDayString ? formatDisplayDate(selectedDayString) : 'Select a date'}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {selectedDayEvents.length} Event{selectedDayEvents.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* List of events for selected day */}
            {selectedDayEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">No Events Scheduled</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  No club events are currently scheduled for this date. Check other dates or post a new event!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {selectedDayEvents.map(event => {
                  const statusConfig = getStatusBadgeConfig(event.status);
                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer transition shadow-xs group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getEventTypeBadgeClass(
                            event.eventType
                          )}`}
                        >
                          {event.eventType}
                        </span>

                        {statusConfig && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusConfig.bg}`}
                          >
                            {statusConfig.label}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-2">
                        {event.title}
                      </h4>

                      <p className="text-xs font-medium text-slate-600 mt-1">
                        {event.clubName}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {formatTime12h(event.startTime)} - {formatTime12h(event.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
