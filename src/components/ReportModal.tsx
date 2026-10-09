import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ReportReason } from '../types';
import { submitReport } from '../services/storageService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  clubName: string;
}

const REPORT_REASONS: ReportReason[] = [
  'Fake or misleading',
  'Inappropriate',
  'Wrong details',
  'Other',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  clubName,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('Fake or misleading');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport({
      eventId,
      eventTitle,
      clubName,
      reason: selectedReason,
      note: note.trim() || undefined,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNote('');
      onClose();
    }, 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-200" />
            <h3 className="font-extrabold text-lg tracking-tight">Report Event</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="font-bold text-slate-900 text-base">Report Submitted</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Thank you for keeping Sapthagiri NPS University campus safe. Student Affairs moderators will review this notice.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Reporting event:</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                  {eventTitle}
                </p>
                <p className="text-xs text-slate-600 font-medium">by {clubName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Reason for reporting *
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map(r => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition ${
                        selectedReason === r
                          ? 'border-red-500 bg-red-50/50 text-red-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === r}
                        onChange={() => setSelectedReason(r)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Explain why this notice violates university guidelines..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition"
                >
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
