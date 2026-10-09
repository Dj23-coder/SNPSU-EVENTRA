import React from 'react';
import { ShieldCheck, Info, Mail, AlertTriangle, FileText } from 'lucide-react';
import { GRIEVANCE_EMAIL, UNIVERSITY_NAME, APP_NAME } from '../config/constants';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenReportIssue?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenReportIssue }) => {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Line 1: Mandatory Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-slate-700">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-900">
            Always verify important details with the official notice.
          </span>
        </div>

        {/* Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
          <button
            onClick={onOpenTerms}
            className="hover:text-emerald-700 flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Terms & Privacy</span>
          </button>

          {onOpenReportIssue ? (
            <button
              onClick={onOpenReportIssue}
              className="hover:text-red-600 flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              <span>Report an issue</span>
            </button>
          ) : (
            <a
              href={`mailto:${GRIEVANCE_EMAIL}?subject=EVENTRA%20Issue%20Report`}
              className="hover:text-red-600 flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              <span>Report an issue</span>
            </a>
          )}

          <a
            href={`mailto:${GRIEVANCE_EMAIL}`}
            className="hover:text-emerald-700 flex items-center gap-1.5 transition"
            title="Grievance contact desk"
          >
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Contact: {GRIEVANCE_EMAIL}</span>
          </a>
        </div>

        {/* Brand & Attribution Lines */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-extrabold text-slate-800 text-sm">
              {APP_NAME} • {UNIVERSITY_NAME}
            </p>
            <p className="text-[11px] text-slate-500">
              Built for the PromptWars x Error Zero hackathon, Sapthagiri NPS University.
            </p>
          </div>

          <div className="space-y-1 sm:text-right">
            <p className="text-[11px] text-slate-500 max-w-md">
              Event details are posted by clubs. EVENTRA does not guarantee prizes, certificates or schedules.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
