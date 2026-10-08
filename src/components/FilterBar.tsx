import React from 'react';
import { Search, X, Filter, Sparkles, Award, Trophy, Calendar, Check } from 'lucide-react';
import { EventType, QuickFilter, ClubUser } from '../types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedType: EventType | 'all';
  setSelectedType: (type: EventType | 'all') => void;
  selectedClubId: string;
  setSelectedClubId: (clubId: string) => void;
  quickFilter: QuickFilter;
  setQuickFilter: (filter: QuickFilter) => void;
  clubs: ClubUser[];
  totalResults: number;
}

const EVENT_TYPES: (EventType | 'all')[] = ['all', 'Competition', 'Workshop', 'Fest', 'Talk', 'Other'];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedClubId,
  setSelectedClubId,
  quickFilter,
  setQuickFilter,
  clubs,
  totalResults,
}) => {
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedClubId !== 'all' ||
    quickFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedClubId('all');
    setQuickFilter('all');
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-6 space-y-3.5">
      {/* Search & Dropdown Selectors Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search input (6 cols) */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events by title, keyword, venue, or club..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Event Type Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as EventType | 'all')}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          >
            <option value="all">All Event Types</option>
            <option value="Competition">Competitions</option>
            <option value="Workshop">Workshops</option>
            <option value="Fest">Fests</option>
            <option value="Talk">Talks & Keynotes</option>
            <option value="Other">Other Events</option>
          </select>
        </div>

        {/* Club Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={selectedClubId}
            onChange={e => setSelectedClubId(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition truncate"
          >
            <option value="all">All Student Clubs</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.isVerified ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Pills Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Quick:
          </span>

          <button
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              quickFilter === 'all'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Upcoming
          </button>

          <button
            onClick={() => setQuickFilter('today')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
              quickFilter === 'today'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Today</span>
          </button>

          <button
            onClick={() => setQuickFilter('this_week')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
              quickFilter === 'this_week'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
            }`}
          >
            <span>This Week</span>
          </button>

          <button
            onClick={() => setQuickFilter('certificate')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
              quickFilter === 'certificate'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>Has Certificate</span>
          </button>

          <button
            onClick={() => setQuickFilter('prize')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
              quickFilter === 'prize'
                ? 'bg-amber-500 text-white font-bold shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>Has Prize</span>
          </button>

          <button
            onClick={() => setQuickFilter('free')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
              quickFilter === 'free'
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Free Entry</span>
          </button>
        </div>

        {/* Clear Filters / Count */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{totalResults}</strong> event{totalResults === 1 ? '' : 's'}
          </span>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
