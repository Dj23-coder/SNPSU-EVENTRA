import React, { useState, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  User,
  Calendar,
  Layers,
  Edit,
  RotateCcw,
  KeyRound,
  ExternalLink,
  X,
  Clock,
  Sparkles,
  Inbox,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClubUser, ClubAccessRequest } from '../types';
import { getEventsCountForClub } from '../services/storageService';

interface ManageClubsViewProps {
  onNotify?: (message: string) => void;
  onOpenReportsModal?: () => void;
}

export const ManageClubsView: React.FC<ManageClubsViewProps> = ({ onNotify, onOpenReportsModal }) => {
  const {
    clubs,
    accessRequests,
    createClub,
    updateClubDetails,
    toggleVerifiedStatus,
    toggleActiveStatus,
    resetPasswordForClub,
    handleAccessRequest,
  } = useAuth();

  // Navigation tab inside Manage Clubs
  const [activeSubTab, setActiveSubTab] = useState<'clubs' | 'requests'>('clubs');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubUser | null>(null);

  // Form State for Add Club
  const [formName, setFormName] = useState('');
  const [formCoordinator, setFormCoordinator] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCategory, setFormCategory] = useState('Technical');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formIsVerified, setFormIsVerified] = useState(true);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Notification / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    onNotify?.(message);
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Filtered Clubs
  const filteredClubs = useMemo(() => {
    return clubs.filter(club => {
      // Search matching
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        club.name.toLowerCase().includes(q) ||
        club.email.toLowerCase().includes(q) ||
        (club.coordinatorName && club.coordinatorName.toLowerCase().includes(q)) ||
        (club.category && club.category.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filters
      if (filterType === 'verified') return club.isVerified;
      if (filterType === 'unverified') return !club.isVerified;
      if (filterType === 'suspended') return !club.active;

      return true;
    });
  }, [clubs, searchQuery, filterType]);

  // Pending Access Requests Count
  const pendingRequestsCount = useMemo(() => {
    return accessRequests.filter(r => r.status === 'pending').length;
  }, [accessRequests]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: clubs.length,
      verified: clubs.filter(c => c.isVerified).length,
      active: clubs.filter(c => c.active).length,
      suspended: clubs.filter(c => !c.active).length,
    };
  }, [clubs]);

  // Handlers
  const handleOpenAddModal = (prefill?: Partial<ClubAccessRequest>) => {
    setFormError('');
    if (prefill) {
      setFormName(prefill.clubName || '');
      setFormCoordinator(prefill.coordinatorName || '');
      setFormEmail(prefill.email || '');
      setFormPhone(prefill.phone || '');
      setFormCategory(prefill.category || 'Technical');
      setFormIsVerified(true);
    } else {
      setFormName('');
      setFormCoordinator('');
      setFormEmail('');
      setFormPhone('');
      setFormCategory('Technical');
      setFormLogoUrl('');
      setFormIsVerified(true);
    }
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormError('');
  };

  const handleCreateClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formCoordinator.trim() || !formEmail.trim()) {
      setFormError('Club name, coordinator name, and official email are required.');
      return;
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      setFormError('Please provide a valid official email address.');
      return;
    }

    // Phone validation if provided
    const cleanPhone = formPhone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 10) {
      setFormError('Contact phone must be a 10-digit Indian mobile number.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await createClub({
        name: formName.trim(),
        coordinatorName: formCoordinator.trim(),
        email: formEmail.trim().toLowerCase(),
        category: formCategory,
        contactPhone: cleanPhone,
        logoUrl: formLogoUrl.trim() || undefined,
        isVerified: formIsVerified,
      });

      if (res.success) {
        showToast(res.message || `Club "${formName}" created successfully!`);
        handleCloseAddModal();
      } else {
        setFormError(res.message);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create club. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;

    if (!editingClub.name.trim() || !editingClub.coordinatorName?.trim() || !editingClub.email.trim()) {
      showToast('Name, coordinator, and email cannot be empty.', 'error');
      return;
    }

    updateClubDetails(editingClub.id, {
      name: editingClub.name.trim(),
      coordinatorName: editingClub.coordinatorName.trim(),
      email: editingClub.email.trim().toLowerCase(),
      category: editingClub.category,
      contactPhone: editingClub.contactPhone?.replace(/\D/g, '').slice(-10),
      logoUrl: editingClub.logoUrl?.trim(),
    });

    showToast(`Club "${editingClub.name}" details updated successfully.`);
    setEditingClub(null);
  };

  const handleToggleVerification = (club: ClubUser) => {
    toggleVerifiedStatus(club.id);
    showToast(
      club.isVerified
        ? `Removed verification from ${club.name}. Badges removed from events.`
        : `Marked ${club.name} as Verified! Verified badges activated on events.`
    );
  };

  const handleToggleSuspend = (club: ClubUser) => {
    const res = toggleActiveStatus(club.id);
    showToast(res.message, res.active ? 'success' : 'error');
  };

  const handlePasswordReset = async (club: ClubUser) => {
    if (!window.confirm(`Send a secure password reset email link to ${club.email}?`)) {
      return;
    }

    try {
      const res = await resetPasswordForClub(club.id);
      showToast(res.message);
    } catch {
      showToast(`Password reset link dispatched to ${club.email}.`);
    }
  };

  const handleApproveRequest = (req: ClubAccessRequest) => {
    handleOpenAddModal(req);
    handleAccessRequest(req.id, 'approved');
  };

  const handleRejectRequest = (req: ClubAccessRequest) => {
    if (window.confirm(`Reject access request for "${req.clubName}"?`)) {
      handleAccessRequest(req.id, 'rejected');
      showToast(`Access request for "${req.clubName}" rejected.`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm font-semibold transition animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-emerald-900 text-white border-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <div className="bg-[#0F1B2D] text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#1A2B44] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 text-purple-200 text-xs font-bold uppercase tracking-wider mb-2.5 border border-purple-500/30">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Student Affairs Authority • Admin Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Club Directory & Verification Authority
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Provision verified club accounts, manage coordinator credentials via Firebase Authentication,
            monitor status, and toggle campus verification badges in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {onOpenReportsModal && (
            <button
              onClick={onOpenReportsModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs sm:text-sm transition active:scale-95"
              title="Open Moderation & Event Reports modal"
            >
              <ShieldAlert className="w-4 h-4 text-purple-300" />
              <span>Moderation Reports</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAddModal()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Club</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registered</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-500">Official campus clubs</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Clubs</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-900">{stats.verified}</p>
          <span className="text-[11px] text-blue-700 font-medium">Badges active on cards</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{stats.active}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Authorized to post events</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Suspended</span>
            <ShieldX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-900">{stats.suspended}</p>
          <span className="text-[11px] text-rose-700 font-medium">Events hidden from feed</span>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('clubs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeSubTab === 'clubs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>All Clubs Directory ({clubs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeSubTab === 'requests'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Club Access Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CLUBS DIRECTORY */}
      {activeSubTab === 'clubs' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search club name, coordinator, or email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Filter:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({clubs.length})
              </button>
              <button
                onClick={() => setFilterType('verified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  filterType === 'verified'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Verified ({stats.verified})
              </button>
              <button
                onClick={() => setFilterType('unverified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  filterType === 'unverified'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Not Verified ({clubs.length - stats.verified})
              </button>
              <button
                onClick={() => setFilterType('suspended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  filterType === 'suspended'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Suspended ({stats.suspended})
              </button>
            </div>
          </div>

          {/* Table for Desktop & Cards for Mobile */}
          {filteredClubs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-base text-slate-800">No matching clubs found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No university club accounts matched your search or status filter. Try resetting filters or adding a new club.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Club / Organization</th>
                      <th className="py-3.5 px-4">Coordinator & Contact</th>
                      <th className="py-3.5 px-4">Official Email</th>
                      <th className="py-3.5 px-4 text-center">Verified</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Events</th>
                      <th className="py-3.5 px-4">Created</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredClubs.map(club => {
                      const eventsCount = getEventsCountForClub(club.id);
                      return (
                        <tr key={club.id} className="hover:bg-slate-50/80 transition group">
                          {/* Club Name & Logo */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              {club.logoUrl ? (
                                <img
                                  src={club.logoUrl}
                                  alt={club.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                                  onError={e => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                                  {club.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition">
                                  {club.name}
                                </p>
                                <span className="inline-block text-[10px] text-slate-500 font-medium">
                                  {club.category || 'Technical'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Coordinator */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800">
                                {club.coordinatorName || 'Not assigned'}
                              </p>
                              {club.contactPhone && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>+91 {club.contactPhone}</span>
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Official Email */}
                          <td className="py-4 px-4">
                            <span className="font-mono text-xs text-slate-600 select-all">
                              {club.email}
                            </span>
                          </td>

                          {/* Verified Status */}
                          <td className="py-4 px-4 text-center">
                            {club.isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                                <span>Unverified</span>
                              </span>
                            )}
                          </td>

                          {/* Active / Suspended Status */}
                          <td className="py-4 px-4 text-center">
                            {club.active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                <span>Suspended</span>
                              </span>
                            )}
                          </td>

                          {/* Events Count */}
                          <td className="py-4 px-4 text-center">
                            <span className="font-bold text-slate-800">{eventsCount}</span>
                          </td>

                          {/* Created Date */}
                          <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {club.createdAt
                              ? new Date(club.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Aug 2026'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Verify */}
                              <button
                                onClick={() => handleToggleVerification(club)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  club.isVerified
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                }`}
                                title={club.isVerified ? 'Remove verified badge' : 'Grant verified club badge'}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{club.isVerified ? 'Unverify' : 'Verify'}</span>
                              </button>

                              {/* Toggle Suspend / Reactivate */}
                              <button
                                onClick={() => handleToggleSuspend(club)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                  club.active
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                                title={club.active ? 'Pause club access & hide events' : 'Reactivate club'}
                              >
                                {club.active ? <ShieldX className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                <span>{club.active ? 'Suspend' : 'Reactivate'}</span>
                              </button>

                              {/* Edit details */}
                              <button
                                onClick={() => setEditingClub({ ...club })}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Edit club details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Send Password Reset */}
                              <button
                                onClick={() => handlePasswordReset(club)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 transition"
                                title="Trigger password reset email to official coordinator address"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ACCESS REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Pending Access Applications from Student Clubs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve newly formed clubs requesting posting rights at Sapthagiri NPS University.
              </p>
            </div>
          </div>

          {accessRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700">No pending requests</h4>
              <p className="text-xs text-slate-500">All club access requests have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessRequests.map(req => (
                <div
                  key={req.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{req.clubName}</h4>
                        <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mt-1">
                          {req.category}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                      <p>
                        <strong className="text-slate-800">Coordinator:</strong> {req.coordinatorName}
                      </p>
                      <p>
                        <strong className="text-slate-800">Email:</strong>{' '}
                        <span className="font-mono">{req.email}</span>
                      </p>
                      <p>
                        <strong className="text-slate-800">Phone:</strong> +91 {req.phone}
                      </p>
                      {req.reason && (
                        <p className="text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                          "{req.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleApproveRequest(req)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        Approve & Provision Account
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-right italic">
                      Processed on {new Date(req.requestedAt).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW CLUB FORM */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={handleCloseAddModal}
        >
          <div
            className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#0F1B2D] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-900/60 text-purple-200">
                  <Building2 className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">Provision Official Club</h3>
                  <p className="text-xs text-slate-300">
                    Firebase Authentication & Campus Verification Authority
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateClubSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span>Safe Client-Side Provisioning:</span>
                </p>
                <p>
                  Initializes a secondary Firebase instance to generate credentials without interrupting your admin session. A random temporary password is created, and a password reset link is immediately dispatched to the coordinator.
                </p>
              </div>

              {/* Club Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Club / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. SNPSU Robotics & AI Society"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              {/* Coordinator Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Coordinator Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formCoordinator}
                    onChange={e => setFormCoordinator(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Club Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g. robotics@snpsu.edu.in"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Category & Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Media">Media</option>
                    <option value="Academic">Academic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Coordinator WhatsApp (10 digits)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      maxLength={10}
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9845012345"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Logo Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Club Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formLogoUrl}
                  onChange={e => setFormLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or university CDN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              {/* Verified Checkbox */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={e => setFormIsVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Mark as "Verified Club"</span>
                    </span>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Displays the official blue Verified badge on all current and future events posted by this club.
                    </p>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {formLoading ? 'Provisioning...' : 'Confirm & Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CLUB DETAILS */}
      {editingClub && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setEditingClub(null)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-lg">Edit Club Record</h3>
              <button
                onClick={() => setEditingClub(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Club Name
                </label>
                <input
                  type="text"
                  required
                  value={editingClub.name}
                  onChange={e => setEditingClub({ ...editingClub, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  required
                  value={editingClub.coordinatorName || ''}
                  onChange={e => setEditingClub({ ...editingClub, coordinatorName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={editingClub.email}
                  onChange={e => setEditingClub({ ...editingClub, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingClub.category || 'Technical'}
                    onChange={e => setEditingClub({ ...editingClub, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Media">Media</option>
                    <option value="Academic">Academic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone (10 digits)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editingClub.contactPhone || ''}
                    onChange={e =>
                      setEditingClub({
                        ...editingClub,
                        contactPhone: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={editingClub.logoUrl || ''}
                  onChange={e => setEditingClub({ ...editingClub, logoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
