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
import { RegistrationModal } from './components/RegistrationModal';
import { ParticipantsModal } from './components/ParticipantsModal';
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
  AlertCircle,
  CheckCircle,
  RotateCcw,
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
  const [showAllEventsExpanded, setShowAllEventsExpanded] = useState(false);

  // Modals State
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [registerModalEvent, setRegisterModalEvent] = useState<EventItem | null>(null);
  const [participantsModalEvent, setParticipantsModalEvent] = useState<EventItem | null>(null);
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

  const isFilteringActive = Boolean(
    searchQuery.trim() ||
    selectedType !== 'all' ||
    selectedClubId !== 'all' ||
    quickFilter !== 'all'
  );

  // Group events into Upcoming (first 4) and Secondary/Past (next 4+) to match reference layout
  const upcomingGroup = useMemo(() => {
    if (isFilteringActive) return filteredEvents;
    return filteredEvents.slice(0, 4);
  }, [filteredEvents, isFilteringActive]);

  const secondaryGroup = useMemo(() => {
    if (isFilteringActive) return [];
    return filteredEvents.slice(4);
  }, [filteredEvents, isFilteringActive]);

  const handleTriggerSearchFocus = () => {
    setCurrentTab('feed');
    setTimeout(() => {
      document.getElementById('events-search-input')?.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
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
        onTriggerSearch={handleTriggerSearchFocus}
      />

      {/* Right-edge Vertical Editorial Ribbon Matching Reference UI */}
      <div
        className="hidden 2xl:flex fixed right-0 top-20 bottom-0 w-8 bg-neutral-950 text-white items-center justify-around overflow-hidden z-30 select-none pointer-events-none py-10"
        aria-hidden="true"
      >
        <div className="writing-mode-vertical text-[10px] font-mono tracking-widest uppercase text-neutral-400 whitespace-nowrap rotate-180">
          sapthagiri nps university website. • snpsu eventra portal. • sapthagiri nps university website.
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* VIEW 1: Events Feed (Default Student View Matching Reference Screenshot) */}
        {currentTab === 'feed' && (
          <div className="space-y-10">
            {/* Header Hero Area: Breadcrumb, Main Title, and Giant Outlined 'Events' Typography */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
              <div className="max-w-xl space-y-3">
                {/* Breadcrumb line from reference design */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                  <span
                    className="hover:text-black cursor-pointer transition-colors"
                    onClick={() => setCurrentTab('feed')}
                  >
                    Main page
                  </span>
                  <span>/</span>
                  <span className="text-neutral-900 font-semibold">Events</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-none">
                  Events
                </h1>

                {/* Subtitle paragraph */}
                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed max-w-lg">
                  Sapthagiri NPS University events take place throughout the year, from technical hackathons, workshops, and AI keynotes to cultural fests, exhibitions, and sports championships. Real-time updates directly from authorized SNPSU clubs.
                </p>
              </div>

              {/* Artistic Outlined 'Events' Typography from Reference Design */}
              <div className="hidden md:block select-none pointer-events-none pr-2">
                <span className="text-outline-hero font-extrabold tracking-tighter text-7xl sm:text-8xl lg:text-9xl leading-none">
                  Events
                </span>
              </div>
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

            {/* Event Cards Section */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white border border-neutral-200 p-12 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto rounded-full">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  No Matching Campus Events Found
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  Try clearing your search terms or selecting "All Events" to view all scheduled university activities.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                      setSelectedClubId('all');
                      setQuickFilter('all');
                    }}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white font-semibold text-xs transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            ) : isFilteringActive ? (
              /* Filtered View: Single Unified Grid of Results */
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                  Filtered Results ({filteredEvents.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isBookmarked={bookmarkedIds.includes(event.id)}
                      onToggleBookmark={handleToggleBookmark}
                      onOpenDetail={handleOpenDetail}
                      onOpenRegister={setRegisterModalEvent}
                      onOpenParticipants={setParticipantsModalEvent}
                      isOwner={isAdmin || (isClub && currentUser?.id === event.clubId)}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onDuplicate={handleDuplicateEvent}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Standard Unfiltered View: "Upcoming events" + "Past events" Matching the Reference Screenshot */
              <div className="space-y-14">
                {/* Section 1: Upcoming events (4-column grid) */}
                <section className="space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                    Upcoming events
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {upcomingGroup.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isBookmarked={bookmarkedIds.includes(event.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onOpenDetail={handleOpenDetail}
                        onOpenRegister={setRegisterModalEvent}
                        onOpenParticipants={setParticipantsModalEvent}
                        isOwner={isAdmin || (isClub && currentUser?.id === event.clubId)}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                        onDuplicate={handleDuplicateEvent}
                      />
                    ))}
                  </div>
                </section>

                {/* Section 2: Past events / Additional Campus Events (4-column grid) */}
                {secondaryGroup.length > 0 && (
                  <section className="space-y-6 pt-4 border-t border-neutral-200">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                      Past events
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {(showAllEventsExpanded ? secondaryGroup : secondaryGroup.slice(0, 4)).map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isBookmarked={bookmarkedIds.includes(event.id)}
                          onToggleBookmark={handleToggleBookmark}
                          onOpenDetail={handleOpenDetail}
                          onOpenRegister={setRegisterModalEvent}
                          onOpenParticipants={setParticipantsModalEvent}
                          isOwner={isAdmin || (isClub && currentUser?.id === event.clubId)}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
                          onDuplicate={handleDuplicateEvent}
                        />
                      ))}
                    </div>

                    {/* Clean Outline "See more events" Button Matching Reference UI */}
                    <div className="text-center pt-8">
                      <button
                        onClick={() => setShowAllEventsExpanded(prev => !prev)}
                        className="inline-flex items-center justify-center px-8 py-2.5 border border-neutral-400 text-neutral-800 text-xs font-semibold tracking-wider uppercase hover:border-black hover:bg-neutral-900 hover:text-white transition duration-200"
                      >
                        {showAllEventsExpanded ? 'Show fewer events' : 'See more events'}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Bottom Utility Tools: Past Archives Toggle and Sample Data Reset */}
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-8 border-t border-neutral-200">
              <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-900 select-none">
                <input
                  type="checkbox"
                  checked={showPastEvents}
                  onChange={e => setShowPastEvents(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-black"
                />
                <span>Include archived past events in query</span>
              </label>

              <button
                onClick={() => {
                  if (window.confirm('Reset all events and clubs to initial SNPSU sample dataset?')) {
                    resetToSampleEvents();
                    setEvents(getAllEvents(true));
                    showToast('Events reset to initial university samples.');
                  }
                }}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-900 transition"
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
        onOpenRegister={ev => {
          setDetailModalEvent(null);
          setRegisterModalEvent(ev);
        }}
        onOpenParticipants={ev => {
          setDetailModalEvent(null);
          setParticipantsModalEvent(ev);
        }}
        isOwner={isClub && currentUser?.id === detailModalEvent?.clubId}
        isAdmin={isAdmin}
      />

      <RegistrationModal
        isOpen={Boolean(registerModalEvent)}
        onClose={() => setRegisterModalEvent(null)}
        event={registerModalEvent}
        onRegisteredSuccess={reg => {
          setEvents(getAllEvents(true));
          showToast(`🎉 Seat reserved for ${reg.eventTitle}!`);
        }}
        onSaveToSchedule={eventId => {
          handleToggleBookmark(eventId);
        }}
        isBookmarked={registerModalEvent ? bookmarkedIds.includes(registerModalEvent.id) : false}
      />

      <ParticipantsModal
        isOpen={Boolean(participantsModalEvent)}
        onClose={() => setParticipantsModalEvent(null)}
        event={participantsModalEvent}
        onNotify={showToast}
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

      {/* University Footer Matching Reference Screenshot */}
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
