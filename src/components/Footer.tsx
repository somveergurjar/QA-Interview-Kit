import React from 'react';
import { Command, Mail, Globe, Sparkles, Phone } from 'lucide-react';
import { ContactInfo } from '../types.js';

interface FooterProps {
  darkMode: boolean;
  contact: ContactInfo | null;
}

export default function Footer({ darkMode, contact }: FooterProps) {
  return (
    <footer className={`border-t transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 border-slate-900 text-gray-400' : 'bg-slate-50 border-slate-200 text-gray-500'
    } py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <a href="#/" className="flex items-center space-x-2 font-display text-lg font-bold tracking-tight text-emerald-500">
            <span className="p-1.5 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Command className="w-4 h-4" />
            </span>
            <span>QA Interview Kit</span>
          </a>
          <p className="text-xs leading-relaxed">
            The premium study companion and master kit designed specifically for software QA manual testers transitioning into automation and SDET roles.
          </p>
          <div className="text-xs font-mono">
            Version 2.4.0 (2026 Ready)
          </div>
        </div>

        {/* Toolkit Directory Column */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-gray-900 dark:text-gray-100">
            Syllabus
          </h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#/samples" className="hover:text-emerald-500 transition">Manual & API Notes</a></li>
            <li><a href="#/samples" className="hover:text-emerald-500 transition">Playwright & Selenium Grid</a></li>
            <li><a href="#/samples" className="hover:text-emerald-500 transition">SQL & Command Cheat Sheets</a></li>
            <li><a href="#/samples" className="hover:text-emerald-500 transition">100+ Interview QA Banks</a></li>
          </ul>
        </div>

        {/* Resources & Support Column */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-gray-900 dark:text-gray-100">
            Support & Help
          </h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#/contact" className="hover:text-emerald-500 transition">Contact Us Form</a></li>
            <li>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                {contact?.support_email || 'support@qakit.com'}
              </span>
            </li>
            {contact?.phone && (
              <li>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {contact.phone}
                </span>
              </li>
            )}
            <li>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                {contact?.website || 'https://qakit.com'}
              </span>
            </li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4 text-gray-900 dark:text-gray-100">
            Legal Policies
          </h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#/privacy" className="hover:text-emerald-500 transition">Privacy Policy</a></li>
            <li><a href="#/terms" className="hover:text-emerald-500 transition">Terms & Conditions</a></li>
            <li><a href="#/refund" className="hover:text-emerald-500 transition">Refund & Cancellation Policy</a></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
        <p>&copy; {new Date().getFullYear()} QA Interview Kit. All rights reserved.</p>
        <div className="flex items-center gap-1 text-emerald-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Engineered for QA Career Transformations</span>
        </div>
      </div>
    </footer>
  );
}
