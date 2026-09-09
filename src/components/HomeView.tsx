import React, { useState, useEffect } from 'react';
import {
  Zap, Clock, ArrowRight, ShieldCheck, Download, Users, Mail, Phone,
  HelpCircle, ChevronRight, MessageSquare, Star, FileText, Globe, CheckCircle, MapPin
} from 'lucide-react';
import { ConfigData, Testimonial, SiteContent } from '../types.js';
import ToolkitGrid from './ToolkitGrid.js';
import TerminalAnimation from './TerminalAnimation.js';
import LiveInterviewShowcase from './LiveInterviewShowcase.js';
import ScrollReveal from './ScrollReveal.js';

interface HomeViewProps {
  onLearnMoreNote: (id: string) => void;
  onInitiatePurchase: () => void;
  config: ConfigData | null;
  purchased: boolean;
  darkMode: boolean;
  siteContent: SiteContent | null;
}

export default function HomeView({ onLearnMoreNote, onInitiatePurchase, config, purchased, darkMode, siteContent }: HomeViewProps) {
  // Countdown Timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (config) {
      const durationMs = config.timer_duration_hours * 60 * 60 * 1000;
      const startTimeStamp = new Date(config.start_time).getTime();
      const nowTimeStamp = Date.now();
      const elapsedMs = nowTimeStamp - startTimeStamp;
      const remainingMs = elapsedMs >= 0 ? durationMs - (elapsedMs % durationMs) : durationMs;
      return Math.max(0, Math.floor(remainingMs / 1000));
    }
    return 1200; // default 20 mins
  });
  const [activeTab, setActiveTab] = useState<'what-is-this' | 'who-is-this-for' | 'guarantee'>('what-is-this');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  // Contact Form Inputs
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Handle continuous dynamic timer countdown syncing
  useEffect(() => {
    const updateTimer = () => {
      if (config) {
        const durationMs = config.timer_duration_hours * 60 * 60 * 1000;
        const startTimeStamp = new Date(config.start_time).getTime();
        const nowTimeStamp = Date.now();
        const elapsedMs = nowTimeStamp - startTimeStamp;
        const remainingMs = elapsedMs >= 0 ? durationMs - (elapsedMs % durationMs) : durationMs;
        setSecondsLeft(Math.max(0, Math.floor(remainingMs / 1000)));
      } else {
        setSecondsLeft((prev) => (prev <= 1 ? 1200 : prev - 1));
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [config]);

  // Load Approved Testimonials
  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        setTestimonials(data);
      })
      .catch((err) => {
        console.error("Error loading home testimonials", err);
      });
  }, []);

  // Format countdown output to HH:MM:SS
  const formatTime = (secs: number) => {
    if (secs <= 0) return 'Offer expired';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rSecs = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${rSecs.toString().padStart(2, '0')}`;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSuccess(false);
    }, 4000);
  };

  const faqs = siteContent?.home.faqs || [];
  const personas = siteContent?.home.personas || [];
  const toolkitItems = siteContent?.toolkitItems || [];
  const heroTag = siteContent?.home.hero_tag || 'Crack Your Software QA Rounds';
  const heroTitle = siteContent?.home.hero_title || 'The Ultimate QA Interview Kit';
  const heroSubtitle = siteContent?.home.hero_subtitle || 'Master software testing step-by-step.';
  const contact = siteContent?.contact;

  const pricingAmount = config ? config.amount : 199;
  const originalAmount = config ? config.original_amount : 1999;
  const isExpired = secondsLeft <= 0;

  return (
    <div className={`transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-gray-100' : 'bg-slate-50 text-gray-800'}`}>
      
      {/* Countdown Timer Strip Header */}
      {!isExpired ? (
        <div className="bg-red-500 text-white font-semibold text-center text-xs py-2 px-4 shadow flex items-center justify-center gap-1.5 animate-fadeIn">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Limited Time Launch Price Discount! <strong>Offer expires in:</strong> <span className="font-mono text-sm bg-red-650 px-2 py-0.5 rounded font-bold">{formatTime(secondsLeft)}</span></span>
        </div>
      ) : (
        <div className="bg-slate-700 text-white font-semibold text-center text-xs py-2 px-4 shadow">
          <span>Official Launch Offer has expired. Pricing configs update momentarily.</span>
        </div>
      )}

      {/* Hero section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-1/4 left-1/3 w-[28rem] h-[28rem] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl -z-10 pointer-events-none animate-floatSlow" />
        <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl -z-10 pointer-events-none animate-floatSlower" />

        <div className="max-w-7xl mx-auto text-center">
          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 inline-flex items-center gap-1.5 mb-6 animate-fadeInUp">
            <Zap className="w-3.5 h-3.5" /> {heroTag}
          </span>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none mb-6 animate-fadeInUp stagger-1 text-gradient-brand">
            {heroTitle}
          </h1>

          <p className={`text-base sm:text-lg max-w-3xl mx-auto mb-10 leading-relaxed animate-fadeInUp stagger-2 ${darkMode ? 'text-gray-400' : 'text-gray-650'}`}>
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fadeInUp stagger-3">
            {purchased ? (
              <a
                href="#/dashboard"
                className="btn-modern px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl flex items-center gap-2 transition"
              >
                <span>Navigate Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={onInitiatePurchase}
                className="btn-modern btn-shine px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/15 flex items-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 transition cursor-pointer"
              >
                <span>Get Instant Access (₹{pricingAmount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <a
              href="#/samples"
              className={`btn-modern px-8 py-4 text-sm font-bold rounded-xl border transition ${
                darkMode ? 'border-slate-800 hover:bg-slate-850 text-gray-200' : 'border-slate-200 hover:bg-slate-100 text-gray-700'
              }`}
            >
              Browse Sample Notes First &rarr;
            </a>
          </div>

          {/* Live-typing terminal — signature "this is a real QA product" touch */}
          <div className="mb-16">
            <TerminalAnimation />
          </div>

          {/* Social Proof badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 text-xs font-mono tracking-wider animate-fadeInUp stagger-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-emerald-500">12,000+</span>
              <span className="text-gray-400">Total QA Placed</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-emerald-500">4.9 / 5</span>
              <span className="text-gray-400">Customer Rating</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-emerald-500">₹199 Early-bird</span>
              <span className="text-gray-400">75% Price Drop Today</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-emerald-500">7-Day Warranty</span>
              <span className="text-gray-400">Guaranteed Refunds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship: 1-on-1 Live Mock Interview showcase */}
      <ScrollReveal variant="zoom-in">
        <LiveInterviewShowcase onCtaClick={() => onLearnMoreNote('live_interviews')} />
      </ScrollReveal>

      {/* Toolkit elements grid */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 border-t border-b ${
        darkMode ? 'bg-slate-900/40 border-slate-950' : 'bg-slate-50 border-slate-100'
      }`}>
        <ScrollReveal variant="fade-up" className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 inline-block mb-3">
              Comprehensive Package Notes
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
              Step Into High-Paying Tech Roles
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Every tool, boilerplate, manual script, and study document included in the ₹199 kit. No monthly bills or unexpected fees.
            </p>
          </div>

          <ToolkitGrid items={toolkitItems} onLearnMore={onLearnMoreNote} darkMode={darkMode} />
        </ScrollReveal>
      </section>

      {/* Tabbed Promo Information */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="slide-right" className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
              Invest in Your Software Testing Career Transition
            </h2>

            {/* Selector triggers tab changes */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold pb-1.5">
              <button
                onClick={() => setActiveTab('what-is-this')}
                className={`py-2 border-b-2 transition ${
                  activeTab === 'what-is-this' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-gray-400'
                }`}
              >
                What is this?
              </button>
              <button
                onClick={() => setActiveTab('who-is-this-for')}
                className={`py-2 border-b-2 transition ${
                  activeTab === 'who-is-this-for' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-gray-400'
                }`}
              >
                Who is this for?
              </button>
              <button
                onClick={() => setActiveTab('guarantee')}
                className={`py-2 border-b-2 transition ${
                  activeTab === 'guarantee' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-gray-400'
                }`}
              >
                100% Refund Warranty
              </button>
            </div>

            {activeTab === 'what-is-this' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed animate-fadeIn">
                The QA Interview Kit is a compiled, curated catalog of notes and spreadsheets answering software testing challenges. It simplifies manual test planning strategies, teaches robust API postman methods, configures modern CI/CD servers, and features 100+ practical interview QAs.
              </p>
            )}

            {activeTab === 'who-is-this-for' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed animate-fadeIn">
                Ideal for Junior Manual Testers seeking intermediate levels of automation, engineering graduates preparing for technical interview drills, and SDET specialists updating their playwright, jenkins pipeline, or automation script portfolios.
              </p>
            )}

            {activeTab === 'guarantee' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed animate-fadeIn">
                Try the PDF notes risk-free. If you do not feel our guides and automated execution models justify the cost, let us know within 7 days. We will issue a complete refund without questions. No risk, massive career upside!
              </p>
            )}

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <span className="p-1 rounded-full bg-emerald-500 text-white"><CheckCircle className="w-4 h-4" /></span>
                <span className="text-sm font-semibold">Immediate lifetime access to all files</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="p-1 rounded-full bg-emerald-500 text-white"><CheckCircle className="w-4 h-4" /></span>
                <span className="text-sm font-semibold">ATS-optimizing SDET resume templates</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="p-1 rounded-full bg-emerald-500 text-white"><CheckCircle className="w-4 h-4" /></span>
                <span className="text-sm font-semibold">Standard industry bug ticket mock reports</span>
              </div>
            </div>
          </div>

          {/* Pricing Box visual */}
          <div className="lg:col-span-6 flex justify-center">
            <div className={`w-full max-w-sm rounded-3xl border p-8 flex flex-col relative overflow-hidden ${
              darkMode ? 'bg-slate-850 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
            }`}>
              {/* Badge */}
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-6 rotate-45 translate-x-7 translate-y-3">
                POPULAR
              </div>

              <div className="mb-6">
                <h3 className="font-display font-bold text-lg mb-1 tracking-tight">Full Toolkit Access</h3>
                <p className="text-xs text-gray-400">No recurring costs. Pay once, read forever.</p>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-emerald-500">₹{pricingAmount}</span>
                <span className="text-sm text-gray-400 line-through">₹{originalAmount}</span>
                <span className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">75% OFF TODAY</span>
              </div>

              <hr className={`border-dashed mb-6 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`} />

              <ul className="space-y-4 mb-8 text-xs font-semibold flex-grow">
                {["Manual + API master sheets", "Playwright + Selenium automated setups", "SQL queries, joins and normalize notes", "100+ company QA sample interviews", "ATS ready resume templates", "All Future Updates (Free)"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {purchased ? (
                <a
                  href="#/dashboard"
                  className="w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-lg"
                >
                  Manage Dash Downloads
                </a>
              ) : (
                <button
                  onClick={onInitiatePurchase}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 text-sm cursor-pointer"
                >
                  Buy Now & Instant Download
                </button>
              )}
            </div>
          </div>

        </ScrollReveal>
      </section>

      {/* Customer Testimonials Display */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 border-t border-b ${
        darkMode ? 'bg-slate-900/30 border-slate-950' : 'bg-slate-50 border-slate-150'
      }`}>
        <ScrollReveal variant="zoom-out" className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 inline-block mb-3">
              Success Stories
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
              Loved by Thousands of QA Professionals
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Check true reviews from manual analysts who utilized our files to land high-impact automation or SDET roles globally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.map((t) => (
                <div
                  key={t.id}
                  className={`p-6 rounded-2xl border flex flex-col relative ${
                    darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-4 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 fill-current ${i < t.rating ? 'text-amber-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className={`text-sm leading-relaxed mb-6 flex-grow italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    "{t.comment}"
                  </p>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{t.user_name}</h4>
                    <span className="text-xs text-gray-400 font-mono italic">{t.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-xs text-gray-500">Fetching approved testimonials...</p>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* PLATFORM COMPARISON & CONVERSION COPYWRITING SECTION */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 border-b ${
        darkMode ? 'bg-slate-900/40 border-slate-950' : 'bg-slate-50 border-slate-100'
      }`}>
        <ScrollReveal variant="zoom-out" className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 inline-block mb-3">
              Market Intelligence & Evaluation
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
              How the QA Interview Kit Compares
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't waste months on generalized, outdated material. See how the Interview Kit delivers real-world senior automation expertise vs. generic alternatives.
            </p>
          </div>

          {/* 1. Comparison Table */}
          <div className={`overflow-x-auto rounded-2xl border shadow-sm mb-16 ${
            darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
          }`}>
            <table className="w-full text-left border-collapse min-w-[1000px] text-xs">
              <thead>
                <tr className={darkMode ? 'bg-slate-950/80 text-gray-200 border-b border-slate-800' : 'bg-slate-100/80 text-gray-700 border-b border-slate-200'}>
                  <th className={`p-4 font-bold border-b text-left align-middle w-48 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Platform</th>
                  <th className={`p-4 font-bold border-b text-left align-middle w-32 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Est. Price</th>
                  <th className={`p-4 font-bold border-b text-center align-middle w-28 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>AI Testing</th>
                  <th className={`p-4 font-bold border-b text-center align-middle w-28 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Flaky Tests</th>
                  <th className={`p-4 font-bold border-b text-center align-middle w-28 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Contract (Pact)</th>
                  <th className={`p-4 font-bold border-b text-center align-middle w-28 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Chaos Eng</th>
                  <th className={`p-4 font-bold border-b text-center align-middle w-32 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Real Projects</th>
                  <th className={`p-4 font-bold border-b text-center align-middle w-32 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Interview Q&As</th>
                  <th className={`p-4 font-bold border-b text-left align-middle ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>Verdict</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                <tr className={darkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-100/50'}>
                  <td className={`p-4 font-bold align-middle ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Udemy QA Courses</td>
                  <td className={`p-4 align-middle ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>$15 - $150</td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className={`p-4 align-middle leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Surface level. High volume but lacks complex or modern SDET engineering patterns context.</td>
                </tr>
                <tr className={darkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-100/50'}>
                  <td className={`p-4 font-bold align-middle ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Coursera Specializations</td>
                  <td className={`p-4 align-middle ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>$39 - $79/mo</td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className={`p-4 align-middle leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Highly academic theory syllabus. Drags on for months with university-style slides.</td>
                </tr>
                <tr className={darkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-100/50'}>
                  <td className={`p-4 font-bold align-middle ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>YouTube Tutorials</td>
                  <td className={`p-4 align-middle ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>Free</td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className={`p-4 align-middle leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Extremely fragmented. You waste dozens of hours connecting outdated code nuggets.</td>
                </tr>
                <tr className={darkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-100/50'}>
                  <td className={`p-4 font-bold align-middle ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Careerist Bootcamp</td>
                  <td className={`p-4 align-middle ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>$3,000 - $5,000</td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-[10.5px] text-rose-400 border-rose-500/20 rotate-0' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>✓ Covered</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className={`p-4 align-middle leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Exorbitantly priced. Heavily markets outdated basic instructions at premium loans.</td>
                </tr>
                <tr className={darkMode ? 'hover:bg-slate-900/30' : 'hover:bg-slate-100/50'}>
                  <td className={`p-4 font-bold align-middle ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Random Blogs / Medium</td>
                  <td className={`p-4 align-middle ${darkMode ? 'text-gray-300' : 'text-gray-655'}`}>Free / $5/mo</td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>~ Partial</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>✕ Missing</span>
                  </td>
                  <td className={`p-4 align-middle leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>High-level insights with zero executable codebase environments or CI trace flows.</td>
                </tr>
                <tr className={`${darkMode ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 bg-opacity-70 text-emerald-950 font-semibold border-2 border-emerald-500'}`}>
                  <td className={`p-4 font-extrabold align-middle ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>🏆 QA Interview Kit</td>
                  <td className={`p-4 font-extrabold align-middle ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Highly Affordable</td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    }`}>✓ Covered</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    }`}>✓ Covered</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    }`}>✓ Covered</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    }`}>✓ Covered</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    }`}>✓ Covered</span>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-bold rounded-full border w-24 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    }`}>✓ Covered</span>
                  </td>
                  <td className={`p-4 font-bold align-middle leading-relaxed ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>Winner: 100% focused on modern high-salary SDET architectures & execution.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Why Each Alternative Falls Short */}
          <div className="mb-16">
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight mb-8 text-left">
              Why Traditional Alternatives Fall Short
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-2 text-emerald-500">Udemy Course Pitfalls</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Most Udemy QA bestsellers (like generic "Selenium Masterclasses") are severely bloated with 50+ hours of basic programming syntax. They teach you how to write basic click-and-type scripts, but entirely bypass crucial engineering patterns like parallel test runtime thread-safety, contract protection with Pact, and non-deterministic LLM output validation that modern high-paying jobs demand.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-2 text-emerald-500">Coursera Academic Bloat</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Coursera specialized certifications drag on for months to justify recursive monthly subscription billing. They lean heavily on academic slides, complex dry testing theorems, and out-dated waterfall models. When you arrive at an actual tech interview, they haven't taught you how to read a Grafana dashboard, trace an API bottleneck, or write defensive selectors.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-2 text-emerald-500">The YouTube Integration Maze</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Free tutorials are disjointed, fragmented, and notoriously outdated. A 2021 video on Playwright or Selenium won't help you bypass custom multi-factor authentication or model dynamic microservice schemas. You spend more time troubleshooting broken environments and mismatched versions than actually mastering professional testing.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-2 text-emerald-500">Careerist Bootcamp Debt</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Promising quick career pivots, these bootcamps lock you into multi-thousand-dollar contracts or aggressive Income Share Agreements (ISAs). Yet their actual curricula are identical to standard manuals. They sell basic instructions at an premium markup and ignore highly complex SDET-level automation, chaos engineering, and continuous integration pipelines.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-2 text-emerald-500">Scattered Blog Posts</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Medium posts and engineering blogs are excellent for hyper-specific questions, but they lack a cohesive system. They describe concepts in isolation without a real production app to practice on. The QA Interview Kit bridges this gap by tying every single pattern directly to a fully functioning production model.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/10 border-emerald-100'}`}>
                <h4 className="font-bold text-sm mb-2 text-emerald-500">🚀 The QA Interview Kit Advantage</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-emerald-350' : 'text-emerald-950 font-medium'}`}>
                  We skip the filler. Every document, script, and sheet in this kit is distilled into reference-heavy mock interview answer sheets and real codebases. You instantly grasp how to write secure JWT API scripts, inject network chaos, and structure bulletproof POM patterns without wasting hundreds of hours.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Who Should Buy This Kit */}
          <div className="mb-16">
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight mb-8 text-left">
              Who is This Kit Engineered For?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {personas.map((persona, idx) => {
                const PersonaIcon = [Users, Zap, Star][idx % 3];
                const accent = idx % 2 === 0 ? 'emerald' : 'amber';
                return (
                  <div key={idx} className={`p-6 rounded-2xl border relative overflow-hidden ${darkMode ? 'bg-slate-900/55 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 ${darkMode ? `bg-${accent}-500/5` : `bg-${accent}-50`}`}></div>
                    <PersonaIcon className={`w-8 h-8 mb-4 ${accent === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <h4 className="font-bold text-sm mb-2">{persona.title}</h4>
                    <div className={`text-xs font-mono mb-3 tracking-wider uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{persona.level}</div>
                    <p className={`text-xs leading-relaxed relative z-10 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Exact Pain Point:</span> {persona.pain_point}
                      <br /><br />
                      <span className={`font-bold ${accent === 'emerald' ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : (darkMode ? 'text-amber-400' : 'text-amber-700')}`}>What You Gain:</span> {persona.gain}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Objection Busters */}
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight mb-8 text-left">
              Objection Busters — Clearing Your Doubts
            </h3>
            <div className="space-y-4 max-w-4xl mr-auto text-left">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/55 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p className={`text-xs font-extrabold mb-1 uppercase tracking-wider font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Objection: "I can just find all of this info online or use ChatGPT."</p>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-bold font-sans block mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Our Response:</span>
                  Sure, you can search public pages or prompt LLMs. But ChatGPT can't give you a unified, working framework integrated with a single mock production app (the hospital management model) to test out live code on. General models lack deep operational context, frequently hallucinate invalid methods, and cannot provide verified answer paths with structured PDFs, Sheets, and actual CI files assembled in one cohesive, error-free suite. We save you months of random trial-and-error.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/55 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p className={`text-xs font-extrabold mb-1 uppercase tracking-wider font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Objection: "Is this kit suitable for absolute beginners with zero coding experience?"</p>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-bold font-sans block mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Our Response:</span>
                  Yes, absolutely. We don't assume you are a senior programmer on day one. Our roadmap begins with the fundamental building blocks of standard UI element structures, basic REST API endpoints, and simple manual test logs. We then map those concepts directly to our parallel side-by-side Java and TypeScript scripts, so you understand the exact logic behind every automated click.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/55 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <p className={`text-xs font-extrabold mb-1 uppercase tracking-wider font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Objection: "I am a manual QA and have never done automation. Is it too difficult?"</p>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-bold font-sans block mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Our Response:</span>
                  We engineered this kit specifically for the transitioning manual tester. Instead of overwhelming you with deep object-oriented theory, we show you side-by-side comparative playbooks. You get direct templates with pre-configured dependencies, allowing you to run your first test suite in under 3 minutes.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/55 border-slate-800' : 'bg-white border-slate-200'}`}>
                <p className={`text-xs font-extrabold mb-1 uppercase tracking-wider font-mono ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Objection: "This seems too good to be true for this price. How do I know the quality is high?"</p>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-bold font-sans block mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Our Response:</span>
                  This kit was created by seasoned Principal SDETs and Engineering Managers from top-tier tech companies. We do not maintain expensive sales calls or massive marketing teams, letting us pass 100% of the cost savings directly to you. We are so confident in the depth of our content that we back it with a 7-day, 100% money-back guarantee. If you don't feel your interview confidence skyrocket, we will issue a full refund immediately.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <ScrollReveal variant="slide-left">
          <div className="text-center mb-16">
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-2xl inline-block mb-3">
              <HelpCircle className="w-6 h-6" />
            </span>
            <h2 className="font-display font-bold text-3xl tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`p-5 rounded-2xl border transition ${
                  darkMode ? 'bg-slate-850/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <h3 className="font-display font-bold text-base mb-2 text-emerald-500 flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className={`text-sm leading-relaxed pl-7 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Inline Contact Section */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 border-t ${
        darkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
      }`}>
        <ScrollReveal variant="fade-up" className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-4">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
              Get in Touch
            </h2>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Have questions about team licenses, custom corporate training, or payment gateway processes? Fill out our service inquiry form.
            </p>
            <div className="space-y-2.5 text-xs font-semibold pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>{contact?.support_email || 'support@qakit.com'}</span>
              </div>
              {contact?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>{contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>{contact?.website || 'https://qakit.com'}</span>
              </div>
              {contact?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <span>{contact.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7">
            {contactSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center animate-fadeIn">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500 animate-bounce" />
                <h4 className="font-bold mb-1">Message Dispatched!</h4>
                <p className="text-xs">Thank you for hitting our lines. A core test technician will correspond back in 2 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your Name"
                    className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-250 text-gray-800'
                    }`}
                    required
                  />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Your Email"
                    className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-250 text-gray-800'
                    }`}
                    required
                  />
                </div>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Your Inquiry Details..."
                  rows={4}
                  className={`w-full text-xs p-4 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-250 text-gray-800'
                  }`}
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold transition text-xs text-white rounded-xl cursor-pointer shadow"
                >
                  Send Inquiry Now
                </button>
              </form>
            )}
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
