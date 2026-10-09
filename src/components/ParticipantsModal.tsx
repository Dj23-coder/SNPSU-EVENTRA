import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  Download,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Clock,
  Building2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { EventItem, EventRegistration } from '../types';
import { getEventRegistrations, downloadRegistrationsCsv } from '../services/storageService';
import { formatDisplayDate, formatTime12h } from '../services/calendarService';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onNotify?: (message: string) => void;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  event,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !event) return null;

  const registrations: EventRegistration[] = getEventRegistrations(event.id);

  const filteredRegistrations = registrations.filter(r => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.usn.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.year.toLowerCase().includes(q)
    );
  });

  const handleDownloadCsv = () => {
    if (registrations.length === 0) {
      if (onNotify) onNotify('No participant registrations to export yet.');
      return;
    }
    const ok = downloadRegistrationsCsv(event.id, event.title);
    if (ok && onNotify) {
      onNotify(`📥 Downloaded ${registrations.length} registrations to CSV.`);
    }
  };

  const totalSeats = event.maxSeats;
  const isFull = Boolean(totalSeats && registrations.length >= totalSeats);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#0F1B2D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/15">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-lg text-white">
                  Event Participants
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  {registrations.length} {registrations.length === 1 ? 'Registered' : 'Registered'}
                </span>
                {totalSeats && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isFull ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-700 text-slate-300'
                  }`}>
                    Limit: {totalSeats} seats
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {event.title} • {event.clubName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by participant name, USN, email, department, or phone..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Download CSV Button */}
          <button
            onClick={handleDownloadCsv}
            disabled={registrations.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F1B2D] hover:bg-[#1A2B44] text-white text-xs sm:text-sm font-semibold transition btn-press disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0"
            title="Download CSV spreadsheet of participants"
          >
            <Download className="w-4 h-4 text-[#C59A3F]" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Participants Table / List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {registrations.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-heading font-bold text-base text-slate-800">
                No Participants Registered Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Students can sign up using the &ldquo;Register&rdquo; button on the event card and details page. As participants register, their details appear here in real-time.
              </p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">No participants matching &ldquo;{searchTerm}&rdquo;</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3.5">#</th>
                    <th className="py-3 px-3.5">Participant</th>
                    <th className="py-3 px-3.5">USN / Roll No</th>
                    <th className="py-3 px-3.5">College Email</th>
                    <th className="py-3 px-3.5">Phone</th>
                    <th className="py-3 px-3.5">Department & Year</th>
                    <th className="py-3 px-3.5">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRegistrations.map((reg, idx) => (
                    <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {reg.fullName}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {reg.usn}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-700">
                        <a
                          href={`mailto:${reg.email}`}
                          className="text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{reg.email}</span>
                        </a>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700">
                        <a
                          href={`tel:+91${reg.phone}`}
                          className="hover:text-slate-900 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>+91 {reg.phone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <p className="font-medium text-slate-800">{reg.department}</p>
                        <p className="text-[10px] text-slate-500">{reg.year}</p>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(reg.registeredAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Privacy & Compliance Footer */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Participant contact and roll numbers are confidential university records shared solely for event execution. Only the organizing club coordinator and the Student Affairs Administration may view or export this list.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredRegistrations.length} of {registrations.length} total participants
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
