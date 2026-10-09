import React from 'react';
import { Search, X, Calendar, Award, Trophy, Sparkles } from 'lucide-react';
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
    <div className="bg-white border border-neutral-200 p-4 sm:p-5 mb-8 space-y-4">
      {/* Search & Dropdown Selectors Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search input (6 cols) */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            id="events-search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events by title, keyword, venue, or club..."
            className="w-full pl-10 pr-9 py-2.5 border border-neutral-200 bg-neutral-50/50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-0.5"
              aria-label="Clear search"
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
            className="w-full py-2.5 px-3 border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-800 font-medium focus:outline-none focus:border-black transition"
          >
            <option value="all">All Categories</option>
            <option value="Competition">Competitions & Hackathons</option>
            <option value="Workshop">Workshops & Bootcamps</option>
            <option value="Fest">Cultural Fests</option>
            <option value="Talk">Talks & Keynotes</option>
            <option value="Other">Exhibitions & Sports</option>
          </select>
        </div>

        {/* Club Filter (3 cols) */}
        <div className="md:col-span-3">
          <select
            value={selectedClubId}
            onChange={e => setSelectedClubId(e.target.value)}
            className="w-full py-2.5 px-3 border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-800 font-medium focus:outline-none focus:border-black transition truncate"
          >
            <option value="all">All University Clubs</option>
            {clubs.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.isVerified ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Pills Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[11px] mr-1 hidden sm:inline">
            Filters:
          </span>

          <button
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1 text-xs font-semibold tracking-wide transition ${
              quickFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All Events
          </button>

          <button
            onClick={() => setQuickFilter('today')}
            className={`px-3 py-1 text-xs font-semibold tracking-wide transition flex items-center gap-1 ${
              quickFilter === 'today'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Today</span>
          </button>

          <button
            onClick={() => setQuickFilter('this_week')}
            className={`px-3 py-1 text-xs font-semibold tracking-wide transition ${
              quickFilter === 'this_week'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            This Week
          </button>

          <button
            onClick={() => setQuickFilter('certificate')}
            className={`px-3 py-1 text-xs font-semibold tracking-wide transition flex items-center gap-1 ${
              quickFilter === 'certificate'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>Certificate</span>
          </button>

          <button
            onClick={() => setQuickFilter('prize')}
            className={`px-3 py-1 text-xs font-semibold tracking-wide transition flex items-center gap-1 ${
              quickFilter === 'prize'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>Cash Prizes</span>
          </button>

          <button
            onClick={() => setQuickFilter('free')}
            className={`px-3 py-1 text-xs font-semibold tracking-wide transition flex items-center gap-1 ${
              quickFilter === 'free'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Free Entry</span>
          </button>
        </div>

        {/* Clear Filters / Count */}
        <div className="flex items-center gap-3 text-neutral-500">
          <span>
            Showing <strong className="text-neutral-900 font-bold">{totalResults}</strong> listings
          </span>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="text-neutral-900 hover:text-black font-semibold flex items-center gap-1 underline underline-offset-2"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
