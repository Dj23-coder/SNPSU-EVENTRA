import React, { useState } from 'react';
import {
  Calendar,
  Bookmark,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  PlusCircle,
  LayoutGrid,
  Building2,
  ChevronDown,
  ShieldAlert,
  Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface NavbarProps {
  currentTab: 'feed' | 'calendar' | 'schedule' | 'ask-ai' | 'club-portal' | 'admin';
  setCurrentTab: (tab: 'feed' | 'calendar' | 'schedule' | 'ask-ai' | 'club-portal' | 'admin') => void;
  bookmarkCount: number;
  onOpenNewEventModal: () => void;
  onOpenLoginModal: () => void;
  onOpenAdminReportsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  bookmarkCount,
  onOpenNewEventModal,
  onOpenLoginModal,
  onOpenAdminReportsModal,
}) => {
  const { currentUser, isClub, isAdmin, logout, quickLoginAs, clubs } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top University Brand Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-slate-100 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 tracking-wide">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-emerald-200">SAPTHAGIRI NPS UNIVERSITY • BENGALURU</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-300 text-[11px]">Official Student Events Portal</span>

          {/* Quick Role Switcher for Testing / Evaluation */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-lg text-emerald-200 hover:text-white flex items-center gap-1 transition"
              title="Switch demo role for evaluation"
            >
              Role: <span className="font-bold text-white">{currentUser ? currentUser.name.slice(0, 16) : 'Student'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showRoleMenu && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 py-2 z-50 text-xs"
                onClick={() => setShowRoleMenu(false)}
              >
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  Select User Role (Demo Testing)
                </div>
                <button
                  onClick={() => logout()}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                    !currentUser ? 'text-emerald-400 font-bold' : 'text-slate-200'
                  }`}
                >
                  <span>Student (No Login)</span>
                  {!currentUser && <span>✓</span>}
                </button>
                <button
                  onClick={() => quickLoginAs('admin')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                    isAdmin ? 'text-emerald-400 font-bold' : 'text-slate-200'
                  }`}
                >
                  <span>University Admin</span>
                  {isAdmin && <span>✓</span>}
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  Club Coordinators
                </div>
                {clubs.slice(0, 5).map(c => (
                  <button
                    key={c.id}
                    onClick={() => quickLoginAs(c.id)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between truncate ${
                      currentUser?.id === c.id ? 'text-emerald-400 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {currentUser?.id === c.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo on Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('feed')}
              className="flex items-center gap-2.5 text-left group"
              title="SNPSU EVENTRA Home"
            >
              <Logo size="md" />
            </button>
          </div>

          {/* Navigation Links: Events, Calendar, My Schedule, Ask AI */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('feed')}
              className={`px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition ${
                currentTab === 'feed'
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Events</span>
            </button>

            <button
              onClick={() => setCurrentTab('calendar')}
              className={`px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition ${
                currentTab === 'calendar'
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setCurrentTab('schedule')}
              className={`px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition relative ${
                currentTab === 'schedule'
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>My Schedule</span>
              {bookmarkCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-emerald-600 text-white">
                  {bookmarkCount}
                </span>
              )}
            </button>

            {/* ASK AI Link (Section F.4) */}
            <button
              onClick={() => setCurrentTab('ask-ai')}
              className={`px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition ${
                currentTab === 'ask-ai'
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Ask AI</span>
            </button>

            {isClub && (
              <button
                onClick={() => setCurrentTab('club-portal')}
                className={`px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition ${
                  currentTab === 'club-portal'
                    ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>My Club</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={onOpenAdminReportsModal}
                className="px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 bg-purple-50 text-purple-800 hover:bg-purple-100 transition"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Moderation Reports</span>
              </button>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isClub && (
              <button
                onClick={onOpenNewEventModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Event</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1 font-bold text-xs text-slate-800">
                    <span className="truncate max-w-[140px]">{currentUser.name}</span>
                    {currentUser.isVerified && (
                      <span title="Verified Club">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {isAdmin ? 'University Admin' : `${currentUser.category} Club`}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition shadow-2xs"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Club Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden border-t border-slate-200 bg-white px-2 py-1 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setCurrentTab('feed')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-[10px] ${
            currentTab === 'feed' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Events</span>
        </button>

        <button
          onClick={() => setCurrentTab('calendar')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-[10px] ${
            currentTab === 'calendar' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => setCurrentTab('schedule')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-[10px] relative ${
            currentTab === 'schedule' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Schedule</span>
          {bookmarkCount > 0 && (
            <span className="absolute top-1 right-4 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-600 text-white">
              {bookmarkCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('ask-ai')}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-[10px] ${
            currentTab === 'ask-ai' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI</span>
        </button>

        {isClub ? (
          <button
            onClick={() => setCurrentTab('club-portal')}
            className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-[10px] ${
              currentTab === 'club-portal' ? 'text-emerald-700 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>My Club</span>
          </button>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-lg text-[10px] text-slate-500 font-medium"
          >
            <User className="w-4 h-4" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
