import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { EventCard } from './components/EventCard';
import { EventDetailModal } from './components/EventDetailModal';
import { EventFormModal } from './components/EventFormModal';
import { MonthCalendarView } from './components/MonthCalendarView';
import { MyScheduleView } from './components/MyScheduleView';
import { AskAiView } from './components/AskAiView';
import { ClubDashboard } from './components/ClubDashboard';
import { ManageClubsView } from './components/ManageClubsView';
import { AdminReportsModal } from './components/AdminReportsModal';
import { TermsPrivacyModal } from './components/TermsPrivacyModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import {
  getAllEvents,
  saveEvent,
  deleteEvent,
  getBookmarkedIds,
  toggleBookmark,
  resetToSampleEvents,
  recordEventView,
} from './services/storageService';
import { EventItem, EventType, QuickFilter, EventStatus } from './types';
import {
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  RotateCcw,
  Bot,
} from 'lucide-react';

function EventraMain() {
  const { currentUser, isClub, isAdmin, clubs } = useAuth();

  // App Navigation Tab
  const [currentTab, setCurrentTab] = useState<'feed' | 'calendar' | 'schedule' | 'ask-ai' | 'club-portal' | 'manage-clubs' | 'admin'>('feed');

  // Guard: Non-admin users must never be able to open manage-clubs
  useEffect(() => {
    if (!isAdmin && currentTab === 'manage-clubs') {
      setCurrentTab('feed');
    }
  }, [isAdmin, currentTab]);

  // Events & Bookmarks Data State
  const [events, setEvents] = useState<EventItem[]>(() => getAllEvents(true));
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getBookmarkedIds());

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Modals State
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'duplicate';
    event: EventItem | null;
  }>({
    isOpen: false,
    mode: 'create',
    event: null,
  });
  const [isAdminReportsOpen, setIsAdminReportsOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Listen for storage events
  useEffect(() => {
    const handleEventsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<EventItem[]>;
      if (customEvent.detail) {
        setEvents(customEvent.detail);
      } else {
        setEvents(getAllEvents(true));
      }
    };

    const handleBookmarksUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) {
        setBookmarkedIds(customEvent.detail);
      } else {
        setBookmarkedIds(getBookmarkedIds());
      }
    };

    window.addEventListener('snpsu-events-updated', handleEventsUpdate);
    window.addEventListener('snpsu-bookmarks-updated', handleBookmarksUpdate);

    return () => {
      window.removeEventListener('snpsu-events-updated', handleEventsUpdate);
      window.removeEventListener('snpsu-bookmarks-updated', handleBookmarksUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleBookmark = (eventId: string) => {
    const nowBookmarked = toggleBookmark(eventId);
    setBookmarkedIds(getBookmarkedIds());
    const ev = events.find(e => e.id === eventId);
    if (nowBookmarked) {
      showToast(`⭐ Added "${ev?.title.slice(0, 24)}..." to My Schedule`);
    } else {
      showToast(`Removed from My Schedule`);
    }
  };

  const handleOpenDetail = (ev: EventItem) => {
    recordEventView(ev.id);
    setDetailModalEvent(ev);
  };

  const handleSaveEvent = (savedEv: EventItem) => {
    const updated = saveEvent(savedEv);
    setEvents(getAllEvents(true));
    showToast(`✅ Successfully saved "${updated.title.slice(0, 24)}..."`);
  };

  const handleDeleteEvent = (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    if (window.confirm(`Are you sure you want to delete "${ev?.title}"?`)) {
      deleteEvent(eventId);
      setEvents(getAllEvents(true));
      showToast(`Deleted event.`);
    }
  };

  const handleDuplicateEvent = (ev: EventItem) => {
    setFormModalState({
      isOpen: true,
      mode: 'duplicate',
      event: ev,
    });
  };

  const handleEditEvent = (ev: EventItem) => {
    setFormModalState({
      isOpen: true,
      mode: 'edit',
      event: ev,
    });
  };

  const handleUpdateStatus = (event: EventItem, newStatus: EventStatus, note?: string) => {
    const updated: EventItem = {
      ...event,
      status: newStatus,
      statusNote: note,
      lastUpdated: new Date().toISOString(),
    };
    saveEvent(updated);
    setEvents(getAllEvents(true));
    showToast(`Status updated to "${newStatus}" for "${event.title.slice(0, 24)}..."`);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Filter & Sort Logic for Student Feed
  const filteredEvents = useMemo(() => {
    // Hidden events never appear to students
    let result = events.filter(e => {
      if (isAdmin) return true;
      return !e.hidden;
    });

    if (!showPastEvents) {
      result = result.filter(e => e.date >= todayStr);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.shortDescription.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.clubName.toLowerCase().includes(q)
      );
    }

    if (selectedType !== 'all') {
      result = result.filter(e => e.eventType === selectedType);
    }

    if (selectedClubId !== 'all') {
      result = result.filter(e => e.clubId === selectedClubId);
    }

    // Quick filters
    if (quickFilter === 'today') {
      result = result.filter(e => e.date === todayStr);
    } else if (quickFilter === 'this_week') {
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
      const y = in7Days.getFullYear();
      const m = String(in7Days.getMonth() + 1).padStart(2, '0');
      const d = String(in7Days.getDate()).padStart(2, '0');
      const weekMaxStr = `${y}-${m}-${d}`;
      result = result.filter(e => e.date >= todayStr && e.date <= weekMaxStr);
    } else if (quickFilter === 'certificate') {
      result = result.filter(e => e.certificateProvided);
    } else if (quickFilter === 'prize') {
      result = result.filter(e => Boolean(e.prize && e.prize.trim()));
    } else if (quickFilter === 'free') {
      // Entry fee is Free
      result = result.filter(e => !e.entryFee || e.entryFee.toLowerCase().includes('free') || e.entryFee === '0');
    }

    // Sort: Non-cancelled first, then ascending date & time
    result.sort((a, b) => {
      const aIsCancelled = a.status === 'Cancelled';
      const bIsCancelled = b.status === 'Cancelled';

      if (aIsCancelled && !bIsCancelled) return 1;
      if (!aIsCancelled && bIsCancelled) return -1;

      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    return result;
  }, [events, isAdmin, showPastEvents, todayStr, searchQuery, selectedType, selectedClubId, quickFilter]);

  const bookmarkedEvents = useMemo(() => {
    return events.filter(e => bookmarkedIds.includes(e.id) && !e.hidden);
  }, [events, bookmarkedIds]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        bookmarkCount={bookmarkedIds.length}
        onOpenNewEventModal={() =>
          setFormModalState({
            isOpen: true,
            mode: 'create',
            event: null,
          })
        }
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
        onOpenAdminReportsModal={() => setIsAdminReportsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* VIEW 1: Events Feed (Default Student View) */}
        {currentTab === 'feed' && (
          <div className="space-y-6">
            {/* Campus Hero Welcome Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-6 sm:p-10 shadow-lg border border-emerald-900/40">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sapthagiri NPS University Campus Live</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  One Unified Hub for Every Campus Event.
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                  Never miss university hackathons, workshops, cultural fests, or guest talks. Real-time updates directly from authorized SNPSU clubs.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setCurrentTab('calendar')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition active:scale-95"
                  >
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>View Calendar</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('ask-ai')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Ask Campus AI</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('schedule')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition backdrop-blur-sm"
                  >
                    <span>My Schedule ({bookmarkedIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            </div>

            {/* Filter and Search Bar */}
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedClubId={selectedClubId}
              setSelectedClubId={setSelectedClubId}
              quickFilter={quickFilter}
              setQuickFilter={setQuickFilter}
              clubs={clubs}
              totalResults={filteredEvents.length}
            />

            {/* Events Grid or Empty State */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  No Matching Campus Events Found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Try clearing your search terms or selecting "All Upcoming" to view all scheduled activities at Sapthagiri NPS University.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                      setSelectedClubId('all');
                      setQuickFilter('all');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isBookmarked={bookmarkedIds.includes(event.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onOpenDetail={handleOpenDetail}
                    isOwner={isClub && currentUser?.id === event.clubId}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onDuplicate={handleDuplicateEvent}
                  />
                ))}
              </div>
            )}

            {/* Bottom utility tools */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-4">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-700">
                <input
                  type="checkbox"
                  checked={showPastEvents}
                  onChange={e => setShowPastEvents(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Include archived past events</span>
              </label>

              <button
                onClick={() => {
                  if (window.confirm('Reset all events and clubs to initial SNPSU sample dataset?')) {
                    resetToSampleEvents();
                    setEvents(getAllEvents(true));
                    showToast('Events reset to initial university samples.');
                  }
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition"
                title="Reset sample events"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Month Calendar View */}
        {currentTab === 'calendar' && (
          <MonthCalendarView
            events={events.filter(e => !e.hidden)}
            onSelectEvent={handleOpenDetail}
          />
        )}

        {/* VIEW 3: My Schedule (Bookmarks) View */}
        {currentTab === 'schedule' && (
          <MyScheduleView
            bookmarkedEvents={bookmarkedEvents}
            onToggleBookmark={handleToggleBookmark}
            onSelectEvent={handleOpenDetail}
            onBrowseFeed={() => setCurrentTab('feed')}
          />
        )}

        {/* VIEW 4: Ask AI View */}
        {currentTab === 'ask-ai' && (
          <AskAiView
            events={events}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {/* VIEW 5: Club Dashboard (My Club Events) */}
        {currentTab === 'club-portal' && (
          <ClubDashboard
            events={events}
            onOpenNewEventModal={() =>
              setFormModalState({
                isOpen: true,
                mode: 'create',
                event: null,
              })
            }
            onEditEvent={handleEditEvent}
            onDuplicateEvent={handleDuplicateEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* VIEW 6: Manage Clubs View (Admin Only) */}
        {currentTab === 'manage-clubs' && isAdmin && (
          <ManageClubsView
            onNotify={showToast}
            onOpenReportsModal={() => setIsAdminReportsOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <EventDetailModal
        event={detailModalEvent}
        isOpen={Boolean(detailModalEvent)}
        onClose={() => setDetailModalEvent(null)}
        isBookmarked={detailModalEvent ? bookmarkedIds.includes(detailModalEvent.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      <EventFormModal
        isOpen={formModalState.isOpen}
        onClose={() => setFormModalState(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveEvent}
        initialEvent={formModalState.event}
        mode={formModalState.mode}
      />

      <AdminReportsModal
        isOpen={isAdminReportsOpen}
        onClose={() => setIsAdminReportsOpen(false)}
        onRefreshEvents={() => setEvents(getAllEvents(true))}
      />

      <TermsPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* University Footer */}
      <Footer
        onOpenTerms={() => setIsTermsOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EventraMain />
    </AuthProvider>
  );
}
