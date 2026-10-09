import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Calendar,
  Bookmark,
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { EventItem, EventRegistration } from '../types';
import { registerForEvent } from '../services/storageService';
import { getGoogleCalendarUrl, formatDisplayDate, formatTime12h } from '../services/calendarService';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onRegisteredSuccess: (reg: EventRegistration) => void;
  onSaveToSchedule: (eventId: string) => void;
  isBookmarked: boolean;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  event,
  onRegisteredSuccess,
  onSaveToSchedule,
  isBookmarked,
}) => {
  const [fullName, setFullName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [consent, setConsent] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedReg, setConfirmedReg] = useState<EventRegistration | null>(null);

  if (!isOpen || !event) return null;

  // Check seat limit & deadline
  const currentCount = event.seatsBooked ?? 0;
  const isFull = Boolean(event.maxSeats && currentCount >= event.maxSeats);
  const isCancelled = event.status === 'Cancelled';
  const isDeadlinePassed = Boolean(
    event.registrationDeadline &&
    new Date().toISOString().split('T')[0] > event.registrationDeadline
  );

  const seatsLeft = event.maxSeats ? Math.max(0, event.maxSeats - currentCount) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !usn.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!consent) {
      setErrorMsg('You must agree to share registration details with the organizing club.');
      return;
    }

    const res = registerForEvent({
      eventId: event.id,
      fullName: fullName.trim(),
      usn: usn.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      department,
      year,
    });

    if (!res.success) {
      setErrorMsg(res.message || 'Registration failed.');
      return;
    }

    if (res.registration) {
      setConfirmedReg(res.registration);
      onRegisteredSuccess(res.registration);
    }
  };

  const googleCalUrl = getGoogleCalendarUrl(event);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F1B2D] text-white flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-lg text-white">
              Event Registration
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              {event.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* CONFIRMATION SCREEN */}
          {confirmedReg ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle className="w-7 h-7" />
              </div>

              <div>
                <h4 className="font-heading font-bold text-xl text-slate-900">
                  Registration Confirmed
                </h4>
                <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  Your seat is reserved for <strong>{event.title}</strong>. A confirmation has been registered for {confirmedReg.email}.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
                <p><strong>Participant:</strong> {confirmedReg.fullName} ({confirmedReg.usn})</p>
                <p><strong>Organized by:</strong> {event.clubName}</p>
                <p><strong>Date & Time:</strong> {formatDisplayDate(event.date)} at {formatTime12h(event.startTime)} (IST)</p>
                <p><strong>Venue:</strong> {event.venue}</p>
              </div>

              {/* Action Buttons on Confirmation */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#0F1B2D] hover:bg-[#1A2B44] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition btn-press"
                >
                  <Calendar className="w-4 h-4 text-[#C59A3F]" />
                  <span>Add to Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={() => onSaveToSchedule(event.id)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition btn-press ${
                    isBookmarked
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                  <span>{isBookmarked ? 'Saved to Schedule' : 'Save to My Schedule'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isCancelled || isDeadlinePassed || isFull ? (
            /* CLOSED OR FULL STATE */
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-lg text-slate-900">
                {isCancelled
                  ? 'Event Cancelled'
                  : isFull
                  ? 'Registrations Full'
                  : 'Registration Closed'}
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {isCancelled
                  ? 'This event was cancelled by the organizing club.'
                  : isFull
                  ? `All ${event.maxSeats} available seats have been booked.`
                  : 'The registration deadline for this event has passed.'}
              </p>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                >
                  Back to Event
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Capacity Banner if applicable */}
              {seatsLeft !== null && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span className="font-semibold">Seat Availability:</span>
                  <span className="font-bold text-amber-950">
                    {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left of {event.maxSeats}
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Sahana Murthy"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    USN / Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={usn}
                    onChange={e => setUsn(e.target.value)}
                    placeholder="e.g. 1SG23CS045"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@snpsu.edu.in"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845012345"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option>Computer Science & Engineering</option>
                    <option>Information Science & Engineering</option>
                    <option>Electronics & Communication</option>
                    <option>Mechanical Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Biotechnology</option>
                    <option>Management Studies (MBA/BBA)</option>
                    <option>Science & Humanities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs text-slate-600 leading-normal">
                    I agree to share these details with the organising club ({event.clubName}) and university administration for event coordination.
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0F1B2D] hover:bg-[#1A2B44] text-white text-xs font-bold transition btn-press shadow-xs"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
