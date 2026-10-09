import React from 'react';
import { Mail, Phone, MapPin, AlertTriangle, FileText, Info } from 'lucide-react';
import { GRIEVANCE_EMAIL, UNIVERSITY_NAME, APP_NAME, CAMPUS_LOCATION } from '../config/constants';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenReportIssue?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenReportIssue }) => {
  return (
    <footer className="mt-20 bg-white border-t border-neutral-200 text-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Top Section: University Brand, Contact, Social Media Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pb-10 border-b border-neutral-200">
          {/* Brand Left (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {UNIVERSITY_NAME}
            </h3>
            <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">
              {APP_NAME} • Campus Student Events Portal
            </p>
            <p className="text-xs text-neutral-600 max-w-sm pt-2 leading-relaxed">
              Empowering students through experiential learning, technical workshops, national hackathons, cultural festivals and competitive sports leagues.
            </p>
          </div>

          {/* Contact Center (4 cols) */}
          <div className="md:col-span-4 space-y-2 text-xs text-neutral-600">
            <p className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Contact
            </p>
            <p className="leading-relaxed">
              {CAMPUS_LOCATION}
            </p>
            <p className="font-medium text-neutral-800 pt-1">
              +91 (080) 2837 2800 • +91 98450 12345
            </p>
            <p className="text-neutral-600">
              info@snpsu.edu.in • events@snpsu.edu.in
            </p>
          </div>

          {/* Social Media Links Right (3 cols) */}
          <div className="md:col-span-3 space-y-2">
            <p className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Social media links
            </p>
            <div className="flex items-center gap-3 pt-1">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-black hover:text-black transition"
                title="Facebook"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-black hover:text-black transition"
                title="Instagram"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-black hover:text-black transition"
                title="LinkedIn"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-700 hover:border-black hover:text-black transition"
                title="YouTube"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Middle Section: 4 Institutional Columns Matching Reference Screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          {/* About Column */}
          <div className="space-y-2.5">
            <p className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              About
            </p>
            <ul className="space-y-1.5 text-neutral-600">
              <li className="hover:text-black transition-colors cursor-pointer">About SNPSU</li>
              <li className="hover:text-black transition-colors cursor-pointer">Leadership & Deans</li>
              <li className="hover:text-black transition-colors cursor-pointer">Alumni Network</li>
              <li className="hover:text-black transition-colors cursor-pointer">Campus Life</li>
              <li className="hover:text-black transition-colors cursor-pointer">News & Announcements</li>
              <li className="hover:text-black transition-colors cursor-pointer">Careers & Vacancies</li>
              <li className="hover:text-black transition-colors cursor-pointer">Contact Administration</li>
            </ul>
          </div>

          {/* Education Column */}
          <div className="space-y-2.5">
            <p className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Education
            </p>
            <ul className="space-y-1.5 text-neutral-600">
              <li className="hover:text-black transition-colors cursor-pointer">Academic Departments</li>
              <li className="hover:text-black transition-colors cursor-pointer">Undergraduate Programs</li>
              <li className="hover:text-black transition-colors cursor-pointer">Postgraduate Degrees</li>
              <li className="hover:text-black transition-colors cursor-pointer">Institutes & Centers</li>
              <li className="hover:text-black transition-colors cursor-pointer">Academic Calendar</li>
              <li className="hover:text-black transition-colors cursor-pointer">Examination Cell</li>
            </ul>
          </div>

          {/* Admission Column */}
          <div className="space-y-2.5">
            <p className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Admission
            </p>
            <ul className="space-y-1.5 text-neutral-600">
              <li className="hover:text-black transition-colors cursor-pointer">Undergraduate Admission</li>
              <li className="hover:text-black transition-colors cursor-pointer">Graduate Admission</li>
              <li className="hover:text-black transition-colors cursor-pointer">International Affairs Office</li>
              <li className="hover:text-black transition-colors cursor-pointer">Merit Scholarships</li>
              <li className="hover:text-black transition-colors cursor-pointer">Campus Tours & Visits</li>
            </ul>
          </div>

          {/* Research Column */}
          <div className="space-y-2.5">
            <p className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Research
            </p>
            <ul className="space-y-1.5 text-neutral-600">
              <li className="hover:text-black transition-colors cursor-pointer">Research Overview</li>
              <li className="hover:text-black transition-colors cursor-pointer">R&D Innovation Cell</li>
              <li className="hover:text-black transition-colors cursor-pointer">Centers of Excellence</li>
              <li className="hover:text-black transition-colors cursor-pointer">Faculty Publications</li>
              <li className="hover:text-black transition-colors cursor-pointer">Central University Library</li>
            </ul>
          </div>
        </div>

        {/* Mandatory Verification & Hackathon Disclaimer Banner */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-700">
          <div className="flex items-center gap-2 text-left">
            <Info className="w-4 h-4 text-neutral-900 shrink-0" />
            <span>
              <strong>Official Student Events Notice:</strong> Always verify schedules, venues, and registration deadlines with official notices.
            </span>
          </div>

          <div className="flex items-center gap-4 text-neutral-600 shrink-0">
            <button
              onClick={onOpenTerms}
              className="hover:text-black font-medium transition"
            >
              Terms & Privacy
            </button>
            <span>•</span>
            <a
              href={`mailto:${GRIEVANCE_EMAIL}?subject=EVENTRA%20Issue%20Report`}
              className="hover:text-red-600 font-medium transition"
            >
              Report an Issue
            </a>
          </div>
        </div>

        {/* Bottom Legal Copyright Line Matching Reference Screenshot */}
        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <p>
            © Copyright 2026 {UNIVERSITY_NAME}, Inc. All rights reserved. Various trademarks held by their respective owners.
          </p>
          <p>
            Built for PromptWars × Error Zero hackathon • {APP_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
};
