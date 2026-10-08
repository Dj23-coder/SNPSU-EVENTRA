import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  PlusCircle,
  UserCheck,
  CheckCircle2,
  Phone,
  Mail,
  User,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const { clubs, createClub, toggleVerifiedStatus } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubEmail, setNewClubEmail] = useState('');
  const [newCategory, setNewCategory] = useState('Technical');
  const [newCoordinator, setNewCoordinator] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newClubName.trim() || !newClubEmail.trim() || !newCoordinator.trim() || !newPhone.trim()) {
      setError('All fields are required to provision an official university club account.');
      return;
    }

    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must be a 10-digit Indian mobile number.');
      return;
    }

    // Check duplicate email
    if (clubs.some(c => c.email.toLowerCase() === newClubEmail.trim().toLowerCase())) {
      setError('A club account with this official email already exists.');
      return;
    }

    createClub({
      name: newClubName.trim(),
      email: newClubEmail.trim().toLowerCase(),
      category: newCategory,
      coordinatorName: newCoordinator.trim(),
      contactPhone: cleanPhone,
      isVerified,
    });

    setSuccessMsg(`Club "${newClubName}" created successfully! Coordinator can now log in.`);
    setNewClubName('');
    setNewClubEmail('');
    setNewCoordinator('');
    setNewPhone('');
    setShowAddForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-800 text-purple-200">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
                Student Affairs Admin Portal
              </h3>
              <p className="text-xs text-purple-200">
                Manage Registered Clubs & Verification Status (SNPSU)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Information box */}
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">University Access Governance</p>
              <p className="mt-0.5 text-purple-800">
                Clubs cannot self-register to maintain official event authenticity. All club accounts are created and verified here by the Student Affairs Office.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Registered Clubs ({clubs.length})
            </h4>

            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setError('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : 'Register New Club'}</span>
            </button>
          </div>

          {/* Add Club Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateClub}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in duration-200"
            >
              <h5 className="font-bold text-sm text-slate-800">
                Provision New Club Account
              </h5>

              {error && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg border border-red-200">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Club Name *
                  </label>
                  <input
                    type="text"
                    value={newClubName}
                    onChange={e => setNewClubName(e.target.value)}
                    placeholder="e.g. SNPSU Robotics Society"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Login Email *
                  </label>
                  <input
                    type="email"
                    value={newClubEmail}
                    onChange={e => setNewClubEmail(e.target.value)}
                    placeholder="robotics@snpsu.edu.in"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Media">Media & Arts</option>
                    <option value="Social">Social / NSS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coordinator Name *
                  </label>
                  <input
                    type="text"
                    value={newCoordinator}
                    onChange={e => setNewCoordinator(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact WhatsApp (10 digits) *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845012345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="verifiedCheck"
                    checked={isVerified}
                    onChange={e => setIsVerified(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <label htmlFor="verifiedCheck" className="text-xs font-bold text-slate-800">
                    Mark as "Verified Club" immediately
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
                >
                  Create Club Account
                </button>
              </div>
            </form>
          )}

          {/* Clubs Table / List */}
          <div className="space-y-3">
            {clubs.map(club => (
              <div
                key={club.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{club.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {club.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {club.email}
                    </span>
                    {club.coordinatorName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {club.coordinatorName}
                      </span>
                    )}
                    {club.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        +91 {club.contactPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Verification Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVerifiedStatus(club.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      club.isVerified
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck
                      className={`w-4 h-4 ${club.isVerified ? 'text-blue-600' : 'text-slate-400'}`}
                    />
                    <span>{club.isVerified ? 'Verified Club' : 'Unverified'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
