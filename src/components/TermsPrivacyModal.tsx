import React from 'react';
import { X, ShieldCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { GRIEVANCE_EMAIL, UNIVERSITY_NAME, APP_NAME } from '../config/constants';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">Terms of Use & Privacy</h3>
              <p className="text-xs text-emerald-200">{APP_NAME} • {UNIVERSITY_NAME}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content in short plain language */}
        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-700 space-y-5 flex-1 leading-relaxed">
          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>1. Purpose of the App</span>
            </h4>
            <p>
              <strong>{APP_NAME}</strong> is the unified campus event discovery and notification hub for students and registered clubs at {UNIVERSITY_NAME}. It simplifies event information previously scattered across WhatsApp groups and paper notices.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              2. Club Responsibility & Content Accuracy
            </h4>
            <p>
              Authorized student clubs post their own notices. Clubs are strictly responsible for posting accurate, verified, and lawful information, including venues, timings, entry fees, and coordinator numbers.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              3. Prohibited Content
            </h4>
            <p>
              The platform strictly prohibits:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Hate speech, obscenity, defamation, or harassment.</li>
              <li>Fake, non-sanctioned, or unauthorized university events.</li>
              <li>Spam, commercial solicitations, or fraudulent payment links.</li>
              <li>Posters and media used without rightful copyright or permission.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              4. Admin Moderation Rights
            </h4>
            <p>
              The Student Affairs Administration reserves the right to review reports, instantly hide non-compliant events, and suspend club accounts that violate campus conduct policies.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              5. Prizes, Certificates & Schedule Changes
            </h4>
            <p>
              All prizes, cash awards, and certificates are the sole commitment of the organizing club or department, not the EVENTRA platform. Campus events are subject to schedule adjustments due to weather, exams, or university notices.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              6. Privacy & What Data Is Collected
            </h4>
            <p>
              We practice minimal data collection:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Students:</strong> No student login is required. All bookmarks and personal schedules are stored strictly on your local device.</li>
              <li><strong>Club Coordinators:</strong> We store the club official login email, coordinator name, and contact WhatsApp number solely for event inquiries. Coordinator numbers are masked on public cards.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              7. How AI (Gemini) Is Used
            </h4>
            <p>
              Gemini AI models are used to assist club coordinators by parsing messy WhatsApp drafts and reading poster graphics to pre-fill event forms. AI output is never published automatically; coordinators must review, verify, and consent before posting. For students, the Ask AI assistant queries only verified campus events.
            </p>
          </section>

          <section className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Grievance Redressal Contact</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              For content complaints, copyright issues, or reporting misconduct, please contact the Student Affairs Office grievance desk at:
            </p>
            <p className="font-bold text-emerald-700 text-xs sm:text-sm mt-1">
              <a href={`mailto:${GRIEVANCE_EMAIL}`} className="hover:underline">
                {GRIEVANCE_EMAIL}
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
