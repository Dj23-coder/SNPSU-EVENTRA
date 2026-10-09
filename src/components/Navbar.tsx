import React, { useState } from 'react';
import {
  Calendar,
  Bookmark,
  ShieldCheck,
  User,
  LogOut,
  PlusCircle,
  Building2,
  ChevronDown,
  Bot,
  Search,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'feed' | 'calendar' | 'schedule' | 'ask-ai' | 'club-portal' | 'manage-clubs' | 'admin';
  setCurrentTab: (tab: 'feed' | 'calendar' | 'schedule' | 'ask-ai' | 'club-portal' | 'manage-clubs' | 'admin') => void;
  bookmarkCount: number;
  onOpenNewEventModal: () => void;
  onOpenLoginModal: () => void;
  onOpenAdminReportsModal: () => void;
  onTriggerSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  bookmarkCount,
  onOpenNewEventModal,
  onOpenLoginModal,
  onTriggerSearch,
}) => {
  const { currentUser, isClub, isAdmin, logout, quickLoginAs, clubs } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'Eng' | 'Kan'>('Eng');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Top University Brand Bar & Utility Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: University Name Typography Matching the Reference Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('feed')}
              className="text-left group flex flex-col"
              title="Sapthagiri NPS University Events Portal"
            >
              <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-neutral-900 group-hover:text-neutral-700 transition-colors leading-tight">
                Sapthagiri University
              </span>
              <span className="text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
                SNPSU EVENTRA • Campus Portal
              </span>
            </button>
          </div>

          {/* Center / Right: Editorial Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-700">
            {/* Primary Portal Navigation */}
            <button
              onClick={() => setCurrentTab('feed')}
              className={`hover:text-black transition-colors ${
                currentTab === 'feed' ? 'font-bold text-black border-b-2 border-black pb-0.5' : ''
              }`}
            >
              Events
            </button>

            <button
              onClick={() => setCurrentTab('calendar')}
              className={`hover:text-black transition-colors ${
                currentTab === 'calendar' ? 'font-bold text-black border-b-2 border-black pb-0.5' : ''
              }`}
            >
              Calendar
            </button>

            <button
              onClick={() => setCurrentTab('schedule')}
              className={`hover:text-black transition-colors flex items-center gap-1 ${
                currentTab === 'schedule' ? 'font-bold text-black border-b-2 border-black pb-0.5' : ''
              }`}
            >
              <span>My Schedule</span>
              {bookmarkCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-900 text-white">
                  {bookmarkCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('ask-ai')}
              className={`hover:text-black transition-colors flex items-center gap-1 ${
                currentTab === 'ask-ai' ? 'font-bold text-black border-b-2 border-black pb-0.5' : ''
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-neutral-600" />
              <span>Ask AI</span>
            </button>

            {isClub && (
              <button
                onClick={() => setCurrentTab('club-portal')}
                className={`hover:text-black transition-colors flex items-center gap-1 ${
                  currentTab === 'club-portal' ? 'font-bold text-black border-b-2 border-black pb-0.5' : ''
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>My Club</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('manage-clubs')}
                className={`hover:text-black transition-colors flex items-center gap-1 ${
                  currentTab === 'manage-clubs' ? 'font-bold text-black border-b-2 border-black pb-0.5' : ''
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Manage Clubs</span>
              </button>
            )}

            {/* University Static Links (From Reference Design) */}
            <span className="h-4 w-px bg-neutral-200" />

            <span className="text-neutral-400 cursor-default hidden xl:inline">Education</span>
            <span className="text-neutral-400 cursor-default hidden xl:inline">Admission</span>
            <span className="text-neutral-400 cursor-default hidden xl:inline">Research</span>
            <span className="text-neutral-400 cursor-default hidden xl:inline">About us</span>
          </nav>

          {/* Right Controls: Search, Lang, Role Selector, Login */}
          <div className="flex items-center gap-3">
            {/* Quick search icon trigger */}
            {onTriggerSearch && (
              <button
                onClick={onTriggerSearch}
                className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-full transition"
                title="Search campus events"
                aria-label="Search events"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Language Switcher pill like in reference design: 'Eng v' */}
            <button
              onClick={() => setCurrentLang(prev => (prev === 'Eng' ? 'Kan' : 'Eng'))}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-sm transition"
              title="Switch language"
            >
              <span>{currentLang}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* Post Event button for Club Leads */}
            {isClub && (
              <button
                onClick={onOpenNewEventModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white hover:bg-black font-semibold text-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Event</span>
              </button>
            )}

            {/* Role Demo Switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="text-xs bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-sm text-neutral-800 flex items-center gap-1 transition font-medium"
                title="Switch demo role for evaluation"
              >
                <span>Role:</span>
                <span className="font-bold text-neutral-900 truncate max-w-[100px] sm:max-w-[140px]">
                  {currentUser ? currentUser.name : 'Student'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white text-neutral-900 rounded-md shadow-xl border border-neutral-200 py-2 z-50 text-xs"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">
                    Role Evaluation Switcher
                  </div>
                  <button
                    onClick={() => logout()}
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-100 flex items-center justify-between ${
                      !currentUser ? 'text-black font-bold bg-neutral-50' : 'text-neutral-700'
                    }`}
                  >
                    <span>Student View (Default)</span>
                    {!currentUser && <span className="text-black font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => quickLoginAs('admin')}
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-100 flex items-center justify-between ${
                      isAdmin ? 'text-black font-bold bg-neutral-50' : 'text-neutral-700'
                    }`}
                  >
                    <span>University Admin</span>
                    {isAdmin && <span className="text-black font-bold">✓</span>}
                  </button>
                  <div className="border-t border-neutral-100 my-1"></div>
                  <div className="px-3 py-1 font-semibold text-neutral-400 text-[10px] uppercase tracking-wider">
                    Authorized Club Leads
                  </div>
                  {clubs.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => quickLoginAs(c.id)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between truncate ${
                        currentUser?.id === c.id ? 'text-black font-bold bg-neutral-50' : 'text-neutral-700'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {currentUser?.id === c.id && <span className="text-black font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout / Login button */}
            {currentUser ? (
              <button
                onClick={logout}
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-sm transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-300 text-neutral-800 hover:border-black font-semibold text-xs transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Hamburger menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-800 hover:bg-neutral-100 rounded-sm transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
            <button
              onClick={() => {
                setCurrentTab('feed');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-sm text-left ${
                currentTab === 'feed' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
              }`}
            >
              Events Feed
            </button>
            <button
              onClick={() => {
                setCurrentTab('calendar');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-sm text-left ${
                currentTab === 'calendar' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => {
                setCurrentTab('schedule');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-sm text-left ${
                currentTab === 'schedule' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
              }`}
            >
              My Schedule ({bookmarkCount})
            </button>
            <button
              onClick={() => {
                setCurrentTab('ask-ai');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-sm text-left ${
                currentTab === 'ask-ai' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
              }`}
            >
              Ask AI
            </button>
          </div>

          {isClub && (
            <button
              onClick={() => {
                setCurrentTab('club-portal');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 text-left font-semibold text-sm bg-neutral-100 rounded-sm"
            >
              Club Management Portal
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setCurrentTab('manage-clubs');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 text-left font-semibold text-sm bg-purple-50 text-purple-900 rounded-sm"
            >
              Manage Clubs (Admin)
            </button>
          )}
        </div>
      )}
    </header>
  );
};
