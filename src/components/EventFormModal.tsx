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
  Sparkles,
  Upload,
  FileText,
  Tag,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';
import { EventItem, EventType, EventStatus, ClashResult, ExtractedEventData, RegistrationType } from '../types';
import { checkVenueClash } from '../services/storageService';
import { parseNoticeWithGemini, parsePosterWithGemini, compressImageInBrowser } from '../services/aiService';
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

  // Active Tab: 'form' | 'notice-reader' | 'poster-reader'
  const [activeTab, setActiveTab] = useState<'form' | 'notice-reader' | 'poster-reader'>('form');

  // AI Extraction State for side-by-side review
  const [noticeDraftText, setNoticeDraftText] = useState('');
  const [posterDraftPreview, setPosterDraftPreview] = useState<string | null>(null);
  const [originalSourcePreview, setOriginalSourcePreview] = useState<{
    type: 'notice' | 'poster';
    content: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [clubId, setClubId] = useState('');
  const [clubName, setClubName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('Competition');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [venue, setVenue] = useState('');
  const [entryFee, setEntryFee] = useState('Free');
  const [certificateProvided, setCertificateProvided] = useState(true);
  const [prize, setPrize] = useState('');
  const [registrationType, setRegistrationType] = useState<RegistrationType>('in_app');
  const [maxSeats, setMaxSeats] = useState<string>('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactWhatsApp, setContactWhatsApp] = useState('');
  const [status, setStatus] = useState<EventStatus>('Scheduled');
  const [statusNote, setStatusNote] = useState('');

  // Mandatory Club Consent Checkbox
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [copiedFormHelper, setCopiedFormHelper] = useState(false);

  const handleCopyFormQuestions = () => {
    const questionsText = `Suggested Google Form Questions for "${title || 'Campus Event'}":
1. Full Name (Short answer - Required)
2. University Serial Number (USN / Roll No) (Short answer - Required, uppercase)
3. College Email Address (Short answer - Required, e.g. name@sapthagiri.edu.in)
4. WhatsApp Contact Number (Short answer - Required, 10 digits)
5. Department / Branch (Dropdown or Multiple choice - Required: CSE, ISE, ECE, ME, BT, etc.)
6. Year of Study (Multiple choice - Required: 1st Year, 2nd Year, 3rd Year, 4th Year)
7. Agreement & Consent (Checkbox - Required: "I agree to share these details with the organizing club and abide by university event conduct guidelines.")`;

    navigator.clipboard.writeText(questionsText);
    setCopiedFormHelper(true);
    setTimeout(() => setCopiedFormHelper(false), 2500);
  };

  // Poster Image upload state
  const [uploadedImageInfo, setUploadedImageInfo] = useState<{ sizeKb: number } | null>(null);

  // Validation & Clash State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clash, setClash] = useState<ClashResult>({ hasClash: false, clashingEvents: [] });

  // Reset or populate on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('form');
      setOriginalSourcePreview(null);
      setNoticeDraftText('');
      setPosterDraftPreview(null);
      setAiError(null);
      setUploadedImageInfo(null);
      setConsentConfirmed(mode === 'edit'); // default checked only if existing event

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
        setEntryFee(initialEvent.entryFee || 'Free');
        setCertificateProvided(initialEvent.certificateProvided);
        setPrize(initialEvent.prize || '');
        const initialRegType: RegistrationType =
          initialEvent.registrationType ||
          (initialEvent.registrationLink ? 'external' : 'none');
        setRegistrationType(initialRegType);
        setMaxSeats(initialEvent.maxSeats ? String(initialEvent.maxSeats) : '');
        setRegistrationLink(initialEvent.registrationLink || '');
        setRegistrationDeadline(initialEvent.registrationDeadline || '');
        setPosterUrl(initialEvent.posterUrl || '');
        setContactName(initialEvent.contactName);
        setContactWhatsApp(initialEvent.contactWhatsApp);
        setStatus(mode === 'duplicate' ? 'Scheduled' : initialEvent.status);
        setStatusNote(mode === 'duplicate' ? '' : initialEvent.statusNote || '');
      } else {
        setTitle('');
        const activeClub = currentUser?.role === 'club' ? currentUser : clubs[0];
        setClubId(activeClub?.id || 'club-codecraft');
        setClubName(activeClub?.name || 'SNPSU CodeCraft');
        setShortDescription('');
        setEventType('Competition');

        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const y = tom.getFullYear();
        const m = String(tom.getMonth() + 1).padStart(2, '0');
        const d = String(tom.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${d}`);

        setStartTime('10:00');
        setEndTime('16:00');
        setVenue('Sir M. Visvesvaraya Auditorium');
        setEntryFee('Free');
        setCertificateProvided(true);
        setPrize('');
        setRegistrationType('in_app');
        setMaxSeats('');
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

  // Venue Clash Checker
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

  // Handle Gemini Notice Extraction
  const handleParseNotice = async () => {
    if (!noticeDraftText.trim()) {
      setAiError('Please paste a WhatsApp notice or circular text.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const extracted: ExtractedEventData = await parseNoticeWithGemini(noticeDraftText);

      if (extracted.error) {
        setAiError(extracted.error);
        return;
      }

      // Populate form with extracted fields (keep empty if not stated)
      if (extracted.title) setTitle(extracted.title);
      if (extracted.type && ['Competition', 'Workshop', 'Fest', 'Talk', 'Other'].includes(extracted.type)) {
        setEventType(extracted.type as EventType);
      }
      if (extracted.description) setShortDescription(extracted.description.slice(0, 200));
      if (extracted.date) setDate(extracted.date);
      if (extracted.start_time) setStartTime(extracted.start_time);
      if (extracted.end_time) setEndTime(extracted.end_time);
      if (extracted.venue) setVenue(extracted.venue);
      if (extracted.deadline) setRegistrationDeadline(extracted.deadline);
      if (extracted.fee) setEntryFee(extracted.fee);
      if (extracted.certificate) {
        setCertificateProvided(extracted.certificate.toLowerCase() === 'yes');
      }
      if (extracted.prize) setPrize(extracted.prize);
      if (extracted.registration_link) {
        setRegistrationLink(extracted.registration_link);
        setRegistrationType('external');
      }
      if (extracted.contact_name) setContactName(extracted.contact_name);
      if (extracted.contact) setContactWhatsApp(extracted.contact.replace(/\D/g, '').slice(-10));

      setOriginalSourcePreview({
        type: 'notice',
        content: noticeDraftText,
      });

      setActiveTab('form');
    } catch (err: any) {
      setAiError(err.message || 'Failed to extract event notice with Gemini.');
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Gemini Poster Extraction
  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAiError('Poster file exceeds 2 MB limit. Please select a smaller image.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const { dataUrl, sizeKb } = await compressImageInBrowser(file);
      setPosterDraftPreview(dataUrl);

      const extracted: ExtractedEventData = await parsePosterWithGemini(dataUrl, file.type || 'image/jpeg');

      if (extracted.error) {
        setAiError(extracted.error);
        return;
      }

      if (extracted.title) setTitle(extracted.title);
      if (extracted.type && ['Competition', 'Workshop', 'Fest', 'Talk', 'Other'].includes(extracted.type)) {
        setEventType(extracted.type as EventType);
      }
      if (extracted.description) setShortDescription(extracted.description.slice(0, 200));
      if (extracted.date) setDate(extracted.date);
      if (extracted.start_time) setStartTime(extracted.start_time);
      if (extracted.end_time) setEndTime(extracted.end_time);
      if (extracted.venue) setVenue(extracted.venue);
      if (extracted.deadline) setRegistrationDeadline(extracted.deadline);
      if (extracted.fee) setEntryFee(extracted.fee);
      if (extracted.certificate) {
        setCertificateProvided(extracted.certificate.toLowerCase() === 'yes');
      }
      if (extracted.prize) setPrize(extracted.prize);
      if (extracted.registration_link) {
        setRegistrationLink(extracted.registration_link);
        setRegistrationType('external');
      }
      if (extracted.contact_name) setContactName(extracted.contact_name);
      if (extracted.contact) setContactWhatsApp(extracted.contact.replace(/\D/g, '').slice(-10));

      // Also set compressed poster URL as event poster!
      setPosterUrl(dataUrl);
      setUploadedImageInfo({ sizeKb });

      setOriginalSourcePreview({
        type: 'poster',
        content: dataUrl,
      });

      setActiveTab('form');
    } catch (err: any) {
      setAiError(err.message || 'Failed to process poster image.');
    } finally {
      setAiLoading(false);
    }
  };

  // Handle Direct Poster Image Upload (browser compression < 200KB)
  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Poster file exceeds 2 MB limit.');
      return;
    }

    try {
      const { dataUrl, sizeKb } = await compressImageInBrowser(file);
      setPosterUrl(dataUrl);
      setUploadedImageInfo({ sizeKb });
    } catch (err) {
      alert('Failed to compress poster image.');
    }
  };

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

    if (startTime && endTime && endTime <= startTime) {
      errs.endTime = 'End time must be strictly after start time';
    }

    if (!venue.trim()) errs.venue = 'Venue is required';

    if (registrationDeadline && date && registrationDeadline > date) {
      errs.registrationDeadline = 'Registration deadline must be on or before the event date';
    }

    if (!contactName.trim()) errs.contactName = 'Coordinator contact name is required';

    const cleanPhone = contactWhatsApp.replace(/\D/g, '');
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone) {
      errs.contactWhatsApp = 'Contact WhatsApp number is required';
    } else if (!indianPhoneRegex.test(cleanPhone)) {
      errs.contactWhatsApp = 'Must be a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)';
    }

    // Link safety: Google Form links must start with https://docs.google.com/forms or https://forms.gle
    if (registrationType === 'external') {
      const trimmedLink = registrationLink.trim();
      if (!trimmedLink) {
        errs.registrationLink = 'Google Form link is required';
      } else if (
        !trimmedLink.startsWith('https://docs.google.com/forms') &&
        !trimmedLink.startsWith('https://forms.gle')
      ) {
        errs.registrationLink = 'Link must start with https://docs.google.com/forms or https://forms.gle';
      }
    }

    if (registrationType === 'in_app' && maxSeats.trim()) {
      const seatsNum = Number(maxSeats.trim());
      if (isNaN(seatsNum) || !Number.isInteger(seatsNum) || seatsNum <= 0) {
        errs.maxSeats = 'Maximum seats must be a positive whole number';
      }
    }

    if (posterUrl.trim() && !posterUrl.startsWith('https://') && !posterUrl.startsWith('data:image/')) {
      errs.posterUrl = 'Poster image link must start with https://';
    }

    if ((status === 'Postponed' || status === 'Venue Changed') && !statusNote.trim()) {
      errs.statusNote = `Please provide a short explanation for status "${status}"`;
    }

    // Consent Checkbox Requirement
    if (!consentConfirmed) {
      errs.consent = 'You must confirm the club authorization statement before posting.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchingClub = clubs.find(c => c.id === clubId);
    const verified = matchingClub ? matchingClub.isVerified : false;

    const parsedSeats =
      registrationType === 'in_app' && maxSeats.trim() ? parseInt(maxSeats.trim(), 10) : undefined;

    const eventPayload: EventItem = {
      id:
        mode === 'edit' && initialEvent
          ? initialEvent.id
          : `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
      entryFee: entryFee.trim() || 'Free',
      certificateProvided,
      prize: prize.trim() || undefined,
      registrationType,
      registrationLink: registrationType === 'external' ? (registrationLink.trim() || undefined) : undefined,
      registrationDeadline: registrationDeadline || undefined,
      maxSeats: parsedSeats,
      seatsBooked: initialEvent?.seatsBooked ?? 0,
      posterUrl: posterUrl.trim() || undefined,
      contactName: contactName.trim(),
      contactWhatsApp: contactWhatsApp.replace(/\D/g, '').slice(-10),
      status,
      statusNote:
        status === 'Postponed' || status === 'Venue Changed' ? statusNote.trim() : undefined,
      interestedCount: initialEvent?.interestedCount ?? 0,
      viewsCount: initialEvent?.viewsCount ?? 1,
      calendarClicksCount: initialEvent?.calendarClicksCount ?? 0,
      lastUpdated: new Date().toISOString(),
      createdAt:
        mode === 'edit' && initialEvent ? initialEvent.createdAt : new Date().toISOString(),
    };

    onSave(eventPayload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
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
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Helper Bar Tabs */}
        {mode !== 'edit' && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Smart Pre-Fill (Gemini AI):</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  activeTab === 'form'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Standard Form
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('notice-reader');
                  setAiError(null);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition ${
                  activeTab === 'notice-reader'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notice Reader</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('poster-reader');
                  setAiError(null);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition ${
                  activeTab === 'poster-reader'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Poster Reader</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto">
          {/* NOTICE READER TAB */}
          {activeTab === 'notice-reader' && (
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Notice Reader: Paste Messy WhatsApp Notice</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Paste the raw circular text or WhatsApp forward. Gemini extracts title, dates, timings, venue, registration links, prizes and contact numbers.
                </p>
              </div>

              {aiError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <textarea
                rows={8}
                value={noticeDraftText}
                onChange={e => setNoticeDraftText(e.target.value)}
                placeholder="Paste event notice here...&#10;&#10;e.g.:&#10;*SNPSU CODING CLUB ANNOUNCEMENT*&#10;Hey folks! We are thrilled to host CodeWar 2026 on 15th October at CSE Lab 3 from 10 AM to 4 PM. Free entry, ₹10k prize pool & certificates for all! Register at https://forms.gle/... Contact Rahul: 9845012345."
                className="w-full p-4 rounded-2xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Back to Form
                </button>

                <button
                  type="button"
                  onClick={handleParseNotice}
                  disabled={aiLoading || !noticeDraftText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{aiLoading ? 'Extracting with Gemini...' : 'Extract Fields & Review'}</span>
                </button>
              </div>
            </div>
          )}

          {/* POSTER READER TAB */}
          {activeTab === 'poster-reader' && (
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <span>Poster Reader: Upload Event Poster Image</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Upload an event banner or flyer (max 2 MB). Gemini OCR will parse the text and graphics to pre-fill the form.
                </p>
              </div>

              {aiError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-emerald-500 transition bg-slate-50">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Click to upload poster image (JPG, PNG, WebP)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Maximum file size: 2 MB</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePosterUpload}
                  disabled={aiLoading}
                  className="mt-4 text-xs mx-auto block file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                />
              </div>

              {aiLoading && (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Analyzing poster text, venue, dates and contacts with Gemini...</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Back to Form
                </button>
              </div>
            </div>
          )}

          {/* MAIN FORM TAB (WITH OPTIONAL SIDE-BY-SIDE REVIEW) */}
          {activeTab === 'form' && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Original source preview if populated via AI */}
              {originalSourcePreview && (
                <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Original Source (Review)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOriginalSourcePreview(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Hide original
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Review extracted fields on the right. Empty fields are highlighted with an indicator so you can complete them.
                  </p>

                  {originalSourcePreview.type === 'notice' ? (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {originalSourcePreview.content}
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-slate-200 max-h-96 overflow-y-auto">
                      <img
                        src={originalSourcePreview.content}
                        alt="Original Poster"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Right Column: Event Form */}
              <form
                onSubmit={handleSubmit}
                className={`space-y-5 ${
                  originalSourcePreview ? 'lg:col-span-7' : 'lg:col-span-12'
                }`}
              >
                {/* Clash Warning */}
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
                        Consider selecting a different hall or timing to avoid double-booking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Title & Club */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Event Title * {!title && <span className="text-amber-500 font-normal">(empty)</span>}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. HackSapth 2026: 24hr Hackathon"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        errors.title
                          ? 'border-red-500 focus:ring-red-200'
                          : !title
                          ? 'border-amber-300 bg-amber-50/20'
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
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700"
                      />
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Short Description (Max 200 Chars) * {!shortDescription && <span className="text-amber-500 font-normal">(empty)</span>}
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
                    placeholder="Brief summary of highlights, topics, or eligibility..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                      errors.shortDescription
                        ? 'border-red-500'
                        : !shortDescription
                        ? 'border-amber-300 bg-amber-50/20'
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Scheduled">Scheduled (Normal)</option>
                      <option value="Postponed">Postponed</option>
                      <option value="Venue Changed">Venue Changed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Status Note requirement if Postponed or Venue Changed */}
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
                          ? 'e.g. New date: 20 Oct due to exams'
                          : 'e.g. Moved to Auditorium 1 due to 400+ registrations'
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-xs sm:text-sm bg-white"
                    />
                    {errors.statusNote && (
                      <p className="text-xs text-red-600 mt-1">{errors.statusNote}</p>
                    )}
                  </div>
                )}

                {/* Date & Timings in IST */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Date (IST) * {!date && <span className="text-amber-500 font-normal">(empty)</span>}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm ${
                        errors.date ? 'border-red-500' : !date ? 'border-amber-300 bg-amber-50/20' : 'border-slate-300'
                      }`}
                    />
                    {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Start Time (IST) *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm ${
                        errors.startTime ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.startTime && (
                      <p className="text-xs text-red-600 mt-1">{errors.startTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      End Time (IST) *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm ${
                        errors.endTime ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.endTime && <p className="text-xs text-red-600 mt-1">{errors.endTime}</p>}
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Venue * {!venue && <span className="text-amber-500 font-normal">(empty)</span>}
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. Sir M. Visvesvaraya Auditorium, CSE Lab 3, OAT"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                      errors.venue ? 'border-red-500' : !venue ? 'border-amber-300 bg-amber-50/20' : 'border-slate-300'
                    }`}
                  />
                  {errors.venue && <p className="text-xs text-red-600 mt-1">{errors.venue}</p>}
                </div>

                {/* Entry Fee & Prize */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Entry Fee *
                    </label>
                    <input
                      type="text"
                      value={entryFee}
                      onChange={e => setEntryFee(e.target.value)}
                      placeholder="e.g. Free or ₹100 per team"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Prize Details (Optional)
                    </label>
                    <input
                      type="text"
                      value={prize}
                      onChange={e => setPrize(e.target.value)}
                      placeholder="e.g. Cash prize ₹10,000 + Trophies"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Certificate */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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

                {/* Registration Setting Section */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Registration *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Choose how students register to participate in this event
                    </p>
                  </div>

                  {/* 3 Registration Modes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegistrationType('none')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        registrationType === 'none'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">None</span>
                        {registrationType === 'none' && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Open entry, no registration needed
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegistrationType('external')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        registrationType === 'external'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Google Form</span>
                        {registrationType === 'external' && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Paste Google Form link
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegistrationType('in_app')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        registrationType === 'in_app'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">In-App Registration</span>
                        {registrationType === 'in_app' && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Direct 1-tap form on EVENTRA
                      </p>
                    </button>
                  </div>

                  {/* Conditional Fields based on Registration Type */}
                  {registrationType === 'external' && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Google Form Link *
                          </label>
                          <input
                            type="url"
                            value={registrationLink}
                            onChange={e => setRegistrationLink(e.target.value)}
                            placeholder="https://forms.gle/... or https://docs.google.com/forms/..."
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                              errors.registrationLink ? 'border-red-500' : 'border-slate-300'
                            }`}
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Must begin with https://docs.google.com/forms or https://forms.gle
                          </p>
                          {errors.registrationLink && (
                            <p className="text-xs text-red-600 mt-1">{errors.registrationLink}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Registration Deadline (Optional)
                          </label>
                          <input
                            type="date"
                            value={registrationDeadline}
                            onChange={e => setRegistrationDeadline(e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                              errors.registrationDeadline ? 'border-red-500' : 'border-slate-300'
                            }`}
                          />
                          {errors.registrationDeadline && (
                            <p className="text-xs text-red-600 mt-1">{errors.registrationDeadline}</p>
                          )}
                        </div>
                      </div>

                      {/* Form Helper & Club Note */}
                      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            <p className="font-bold text-blue-950 flex items-center gap-1.5">
                              <span>Form helper for Google Forms</span>
                            </p>
                            <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                              Responses are collected in Google Forms. EVENTRA cannot see them.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyFormQuestions}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-100/70 text-blue-900 text-xs font-bold shadow-2xs transition active:scale-95 shrink-0"
                          >
                            {copiedFormHelper ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied Questions!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-blue-600" />
                                <span>Copy Suggested Questions</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-blue-700/90 leading-relaxed">
                          Click Copy to get recommended fields (Name, USN, College Email, Phone, Department, Year, Consent) formatted to paste into Google Forms.
                        </p>
                      </div>
                    </div>
                  )}

                  {registrationType === 'in_app' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Maximum Seats (Optional)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={maxSeats}
                          onChange={e => setMaxSeats(e.target.value)}
                          placeholder="e.g. 50 (leave empty for unlimited)"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                            errors.maxSeats ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Closes automatically once seat count is reached
                        </p>
                        {errors.maxSeats && (
                          <p className="text-xs text-red-600 mt-1">{errors.maxSeats}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Registration Deadline (Optional)
                        </label>
                        <input
                          type="date"
                          value={registrationDeadline}
                          onChange={e => setRegistrationDeadline(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                            errors.registrationDeadline ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Registration closes automatically after this date
                        </p>
                        {errors.registrationDeadline && (
                          <p className="text-xs text-red-600 mt-1">{errors.registrationDeadline}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {registrationType === 'none' && (
                    <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200">
                      ✓ No registration required. Students can directly attend at the venue.
                    </p>
                  )}
                </div>

                {/* Poster Image: URL or Direct Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Poster Image (URL or Upload)
                    </label>
                    {uploadedImageInfo && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                        Compressed: {uploadedImageInfo.sizeKb} KB
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="url"
                      value={posterUrl.startsWith('data:') ? '' : posterUrl}
                      onChange={e => {
                        setPosterUrl(e.target.value);
                        setUploadedImageInfo(null);
                      }}
                      placeholder="https://... or upload below"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />

                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Poster (Max 2MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleManualImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {errors.posterUrl && (
                    <p className="text-xs text-red-600">{errors.posterUrl}</p>
                  )}

                  {/* Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                    {POSTER_PRESETS.map(p => (
                      <button
                        type="button"
                        key={p.name}
                        onClick={() => {
                          setPosterUrl(p.url);
                          setUploadedImageInfo(null);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                          posterUrl === p.url
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coordinator & WhatsApp Number */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-bold">
                    <Info className="w-4 h-4 text-emerald-700" />
                    <span>Coordinator Contact Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Coordinator Name * {!contactName && <span className="text-amber-500 font-normal">(empty)</span>}
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        placeholder="e.g. Aditya Rao"
                        className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm bg-white ${
                          errors.contactName ? 'border-red-500' : !contactName ? 'border-amber-300' : 'border-slate-300'
                        }`}
                      />
                      {errors.contactName && (
                        <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        WhatsApp Number (10 Digits) * {!contactWhatsApp && <span className="text-amber-500 font-normal">(empty)</span>}
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
                          className={`w-full pl-12 pr-3.5 py-2 rounded-xl border text-xs sm:text-sm bg-white ${
                            errors.contactWhatsApp ? 'border-red-500' : !contactWhatsApp ? 'border-amber-300' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {errors.contactWhatsApp && (
                        <p className="text-xs text-red-600 mt-1">{errors.contactWhatsApp}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 font-medium">
                    <span className="font-semibold text-slate-900">Note:</span> Use the official club coordinator number. Never displayed in plain text on cards; masked as +91 98450 ••••• for student inquiries.
                  </p>
                </div>

                {/* MANDATORY CLUB CONSENT CHECKBOX (SECTION D.5) */}
                <div className={`p-4 rounded-2xl border transition ${
                  errors.consent
                    ? 'border-red-500 bg-red-50/60'
                    : consentConfirmed
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-300 bg-slate-50'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentConfirmed}
                      onChange={e => {
                        setConsentConfirmed(e.target.checked);
                        if (e.target.checked) {
                          setErrors(prev => {
                            const clone = { ...prev };
                            delete clone.consent;
                            return clone;
                          });
                        }
                      }}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        Mandatory Club Authorization & Accuracy Declaration *
                      </span>
                      <span className="text-slate-600 mt-0.5 block leading-relaxed">
                        "I confirm this event is official, the details are accurate, and I have the right to use the poster and contact details."
                      </span>
                    </div>
                  </label>
                  {errors.consent && (
                    <p className="text-xs text-red-600 font-semibold mt-2 pl-7">
                      ⚠️ {errors.consent}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!consentConfirmed}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 flex items-center gap-2"
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
          )}
        </div>
      </div>
    </div>
  );
};
