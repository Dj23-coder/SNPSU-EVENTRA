import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Award,
  Trophy,
  Phone,
  User,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { EventItem, EventType, EventStatus, ClashResult } from '../types';
import { checkVenueClash } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventItem) => void;
  initialEvent?: EventItem | null;
  mode: 'create' | 'edit' | 'duplicate';
}

const POSTER_PRESETS = [
  {
    name: 'Hackathon / Tech',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Workshop / Coding',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Cultural Fest',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Robotics / Drone',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Seminar / Talk',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Pitch / E-Cell',
    url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
  },
];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  mode,
}) => {
  const { currentUser, isAdmin, clubs } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('Competition');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [venue, setVenue] = useState('');
  const [certificateProvided, setCertificateProvided] = useState(true);
  const [prize, setPrize] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactWhatsApp, setContactWhatsApp] = useState('');
  const [status, setStatus] = useState<EventStatus>('Scheduled');
  const [statusNote, setStatusNote] = useState('');

  // Validation & Clash State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clash, setClash] = useState<ClashResult>({ hasClash: false, clashingEvents: [] });

  // Initialize or populate form on open
  useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        setTitle(mode === 'duplicate' ? `${initialEvent.title} (Copy)` : initialEvent.title);
        setClubId(initialEvent.clubId);
        setClubName(initialEvent.clubName);
        setShortDescription(initialEvent.shortDescription);
        setEventType(initialEvent.eventType);
        setDate(initialEvent.date);
        setStartTime(initialEvent.startTime);
        setEndTime(initialEvent.endTime);
        setVenue(initialEvent.venue);
        setCertificateProvided(initialEvent.certificateProvided);
        setPrize(initialEvent.prize || '');
        setRegistrationLink(initialEvent.registrationLink || '');
        setRegistrationDeadline(initialEvent.registrationDeadline || '');
        setPosterUrl(initialEvent.posterUrl || '');
        setContactName(initialEvent.contactName);
        setContactWhatsApp(initialEvent.contactWhatsApp);
        setStatus(mode === 'duplicate' ? 'Scheduled' : initialEvent.status);
        setStatusNote(mode === 'duplicate' ? '' : initialEvent.statusNote || '');
      } else {
        // Defaults for new event
        setTitle('');
        const activeClub = currentUser?.role === 'club' ? currentUser : clubs[0];
        setClubId(activeClub?.id || 'club-codecraft');
        setClubName(activeClub?.name || 'SNPSU CodeCraft');
        setShortDescription('');
        setEventType('Competition');

        // Tomorrow as default date
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const y = tom.getFullYear();
        const m = String(tom.getMonth() + 1).padStart(2, '0');
        const d = String(tom.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${d}`);

        setStartTime('10:00');
        setEndTime('16:00');
        setVenue('Sir M. Visvesvaraya Auditorium');
        setCertificateProvided(true);
        setPrize('');
        setRegistrationLink('');
        setRegistrationDeadline('');
        setPosterUrl('');
        setContactName(currentUser?.coordinatorName || 'Club Coordinator');
        setContactWhatsApp(currentUser?.contactPhone || '');
        setStatus('Scheduled');
        setStatusNote('');
      }
      setErrors({});
    }
  }, [isOpen, initialEvent, mode, currentUser, clubs]);

  // Venue Clash Checker runs whenever date, time or venue changes
  useEffect(() => {
    if (date && startTime && endTime && venue) {
      const clashResult = checkVenueClash({
        id: mode === 'edit' && initialEvent ? initialEvent.id : undefined,
        date,
        startTime,
        endTime,
        venue,
      });
      setClash(clashResult);
    } else {
      setClash({ hasClash: false, clashingEvents: [] });
    }
  }, [date, startTime, endTime, venue, initialEvent, mode]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = 'Event title is required';
    if (!shortDescription.trim()) {
      errs.shortDescription = 'Short description is required';
    } else if (shortDescription.length > 200) {
      errs.shortDescription = `Max 200 characters allowed (currently ${shortDescription.length})`;
    }

    if (!date) errs.date = 'Event date is required';
    if (!startTime) errs.startTime = 'Start time is required';
    if (!endTime) errs.endTime = 'End time is required';

    // Requirement: end time after start time
    if (startTime && endTime && endTime <= startTime) {
      errs.endTime = 'End time must be strictly after start time';
    }

    if (!venue.trim()) errs.venue = 'Venue is required';

    // Requirement: deadline before or on the event date
    if (registrationDeadline && date && registrationDeadline > date) {
      errs.registrationDeadline = 'Registration deadline must be on or before the event date';
    }

    // Requirement: contact name required
    if (!contactName.trim()) errs.contactName = 'Coordinator contact name is required';

    // Requirement: WhatsApp number must be valid 10-digit Indian number
    const cleanPhone = contactWhatsApp.replace(/\D/g, '');
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone) {
      errs.contactWhatsApp = 'Contact WhatsApp number is required';
    } else if (!indianPhoneRegex.test(cleanPhone)) {
      errs.contactWhatsApp = 'Must be a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)';
    }

    // Requirement: When Postponed or Venue Changed is selected, require a short "what changed" note
    if ((status === 'Postponed' || status === 'Venue Changed') && !statusNote.trim()) {
      errs.statusNote = `Please provide a short explanation for status "${status}" (e.g. "Moved to Auditorium" or "New date: 20 Oct")`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Determine target club & verification status
    const matchingClub = clubs.find(c => c.id === clubId);
    const verified = matchingClub ? matchingClub.isVerified : false;

    const eventPayload: EventItem = {
      id:
        mode === 'edit' && initialEvent
          ? initialEvent.id
          : `event-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      clubId,
      clubName: matchingClub ? matchingClub.name : clubName,
      isClubVerified: verified,
      shortDescription: shortDescription.trim(),
      eventType,
      date,
      startTime,
      endTime,
      venue: venue.trim(),
      certificateProvided,
      prize: prize.trim() || undefined,
      registrationLink: registrationLink.trim() || undefined,
      registrationDeadline: registrationDeadline || undefined,
      posterUrl: posterUrl.trim() || undefined,
      contactName: contactName.trim(),
      contactWhatsApp: contactWhatsApp.replace(/\D/g, '').slice(-10),
      status,
      statusNote:
        status === 'Postponed' || status === 'Venue Changed' ? statusNote.trim() : undefined,
      lastUpdated: new Date().toISOString(),
      createdAt:
        mode === 'edit' && initialEvent ? initialEvent.createdAt : new Date().toISOString(),
    };

    onSave(eventPayload);
    onClose();
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
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
              {mode === 'edit'
                ? 'Edit Campus Event'
                : mode === 'duplicate'
                ? 'Duplicate Event as Template'
                : 'Publish New Event'}
            </h3>
            <p className="text-xs text-emerald-200">
              SNPSU EVENTRA • Official Club Coordinator Portal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Clash Warning Banner if venue conflict detected */}
          {clash.hasClash && (
            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-red-900 uppercase tracking-wide">
                  ⚠️ Venue Clash Warning!
                </p>
                <p className="text-red-800">
                  Another event is already booked at <strong>{venue}</strong> during overlapping hours on{' '}
                  <strong>{date}</strong>:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-red-900 font-semibold">
                  {clash.clashingEvents.map(ce => (
                    <li key={ce.id}>
                      "{ce.title}" by {ce.clubName} ({ce.startTime} - {ce.endTime})
                    </li>
                  ))}
                </ul>
                <p className="text-slate-600 italic">
                  Consider selecting a different hall, date, or time slot to avoid room conflict.
                </p>
              </div>
            </div>
          )}

          {/* Basic Info: Title & Club */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. HackSapth 2026: 24hr Hackathon"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organizing Club *
              </label>
              {isAdmin ? (
                <select
                  value={clubId}
                  onChange={e => {
                    setClubId(e.target.value);
                    const found = clubs.find(c => c.id === e.target.value);
                    if (found) setClubName(found.name);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={clubName}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700"
                />
              )}
            </div>
          </div>

          {/* Short Description with Max 200 Chars Countdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Short Description (Max 200 Chars) *
              </label>
              <span
                className={`text-xs font-bold ${
                  shortDescription.length > 200
                    ? 'text-red-600'
                    : shortDescription.length >= 180
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}
              >
                {shortDescription.length}/200
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={200}
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
              placeholder="Brief summary of the event highlights, requirements, and target audience..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                errors.shortDescription
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />
            {errors.shortDescription && (
              <p className="text-xs text-red-600 mt-1">{errors.shortDescription}</p>
            )}
          </div>

          {/* Event Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Type *
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as EventType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Competition">Competition</option>
                <option value="Workshop">Workshop</option>
                <option value="Fest">Fest</option>
                <option value="Talk">Talk</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Event Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EventStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Scheduled">Scheduled (Normal)</option>
                <option value="Postponed">Postponed</option>
                <option value="Venue Changed">Venue Changed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Conditional "What Changed" Note requirement if Postponed or Venue Changed */}
          {(status === 'Postponed' || status === 'Venue Changed') && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                What Changed Note * (Required for {status})
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
                placeholder={
                  status === 'Postponed'
                    ? 'e.g. New date: 20 Oct due to lab internals'
                    : 'e.g. Moved to Auditorium 1 due to 400+ signups'
                }
                className={`w-full px-3.5 py-2 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.statusNote ? 'border-red-500' : 'border-amber-300'
                }`}
              />
              <p className="text-[11px] text-amber-800 mt-1">
                This note will be prominently highlighted on student event cards with the last updated time.
              </p>
              {errors.statusNote && (
                <p className="text-xs text-red-600 mt-1">{errors.statusNote}</p>
              )}
            </div>
          )}

          {/* Date & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.date ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.startTime ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-xs text-red-600 mt-1">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.endTime ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.endTime && <p className="text-xs text-red-600 mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Venue with Common Campus Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Venue *
            </label>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              placeholder="e.g. Sir M. Visvesvaraya Auditorium, CSE Lab 3, OAT"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                errors.venue ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {/* Quick Venue suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                'Sir M. Visvesvaraya Auditorium',
                'Seminar Hall 3, Block B',
                'Open Air Theatre (OAT)',
                'Computer Center Lab 2',
                'Sports Council Grounds',
              ].map(v => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setVenue(v)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-600 transition"
                >
                  {v}
                </button>
              ))}
            </div>
            {errors.venue && <p className="text-xs text-red-600 mt-1">{errors.venue}</p>}
          </div>

          {/* Certificate & Prize */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Certificate Provided?
                </p>
                <p className="text-[11px] text-slate-500">Official certificate of participation</p>
              </div>
              <button
                type="button"
                onClick={() => setCertificateProvided(!certificateProvided)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  certificateProvided ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    certificateProvided ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prize Details (Optional)
              </label>
              <input
                type="text"
                value={prize}
                onChange={e => setPrize(e.target.value)}
                placeholder="e.g. Cash prize ₹10,000 + Goodies"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Registration Link & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registration Link (Optional)
              </label>
              <input
                type="url"
                value={registrationLink}
                onChange={e => setRegistrationLink(e.target.value)}
                placeholder="https://forms.gle/... or unstop.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registration Deadline (Optional)
              </label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={e => setRegistrationDeadline(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  errors.registrationDeadline ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.registrationDeadline && (
                <p className="text-xs text-red-600 mt-1">{errors.registrationDeadline}</p>
              )}
            </div>
          </div>

          {/* Poster Image Link & Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Poster Image URL (Optional)
            </label>
            <input
              type="url"
              value={posterUrl}
              onChange={e => setPosterUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg (Leave empty for clean themed placeholder)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {/* Poster Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Presets:</span>
              {POSTER_PRESETS.map(p => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => setPosterUrl(p.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    posterUrl === p.url
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details (Coordinator Name & 10-digit WhatsApp) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Contact Coordinator & WhatsApp Integration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Coordinator Name *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Aditya Rao"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                    errors.contactName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.contactName && (
                  <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Number (10 Digits) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={contactWhatsApp}
                    onChange={e => setContactWhatsApp(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845012345"
                    className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
                      errors.contactWhatsApp ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.contactWhatsApp && (
                  <p className="text-xs text-red-600 mt-1">{errors.contactWhatsApp}</p>
                )}
              </div>
            </div>

            {/* Required Form Note */}
            <p className="text-[11px] text-emerald-800 font-medium">
              📌 <strong>Note:</strong> Use the official club coordinator number. Students will be able to message with a prefilled inquiry via wa.me, and your number will be masked on the card.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === 'edit'
                  ? 'Update Event'
                  : mode === 'duplicate'
                  ? 'Create Duplicate'
                  : 'Publish Event'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
