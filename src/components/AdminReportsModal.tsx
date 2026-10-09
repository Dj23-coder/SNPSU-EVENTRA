import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, EyeOff, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import { ReportItem, EventItem } from '../types';
import { getAllReports, resolveReport, setEventHidden, getAllEvents } from '../services/storageService';

interface AdminReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshEvents: () => void;
}

export const AdminReportsModal: React.FC<AdminReportsModalProps> = ({
  isOpen,
  onClose,
  onRefreshEvents,
}) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setReports(getAllReports());
      setEvents(getAllEvents(true));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleHide = (eventId: string, currentHidden: boolean) => {
    setEventHidden(eventId, !currentHidden);
    setEvents(getAllEvents(true));
    onRefreshEvents();
  };

  const handleResolve = (reportId: string) => {
    resolveReport(reportId);
    setReports(getAllReports());
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-purple-300" />
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Reported Events & Moderation</h3>
              <p className="text-xs text-purple-200">Admin Action Center • Sapthagiri NPS University</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">No Pending Reports</p>
              <p className="text-xs text-slate-500 mt-0.5">All campus events are in good standing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => {
                const targetEvent = events.find(e => e.id === rep.eventId);
                const isHidden = targetEvent?.hidden ?? false;

                return (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-[10px]">
                            {rep.reason}
                          </span>
                          <span className="text-slate-400">
                            {new Date(rep.reportedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {rep.eventTitle}
                        </h4>
                        <p className="text-slate-500">Club: {rep.clubName}</p>
                      </div>

                      {/* Admin Quick Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        {targetEvent ? (
                          <button
                            onClick={() => handleToggleHide(targetEvent.id, isHidden)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                              isHidden
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-xs'
                            }`}
                          >
                            {isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Unhide Event</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide Event</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Event deleted</span>
                        )}

                        {!rep.resolved && (
                          <button
                            onClick={() => handleResolve(rep.id)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-200 text-slate-600"
                            title="Mark Resolved"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {rep.note && (
                      <p className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 italic">
                        "{rep.note}"
                      </p>
                    )}

                    {isHidden && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>This event is currently hidden from the public student feed.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
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
