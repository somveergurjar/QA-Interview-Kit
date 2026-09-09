import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, ShieldCheck, Lock, Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { NotesSample } from '../types.js';

interface SampleNotesProps {
  darkMode: boolean;
  onInitiatePurchase: () => void;
  purchased: boolean;
}

export default function SampleNotesView({ darkMode, onInitiatePurchase, purchased }: SampleNotesProps) {
  const [samples, setSamples] = useState<NotesSample[]>([]);
  const [selectedId, setSelectedId] = useState<string>('manual_notes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notes/samples')
      .then((res) => res.json())
      .then((data) => {
        setSamples(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching preview notes", err);
        setLoading(false);
      });
  }, []);

  const activeNotes = samples.find((s) => s.id === selectedId);

  return (
    <div className={`min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-gray-100' : 'bg-slate-50 text-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 inline-flex items-center gap-1.5 mb-3">
            <BookOpen className="w-3.5 h-3.5" /> Course Syllabus Previews
          </span>
          <h1 className="font-display text-4xl font-extrabold tracking-tight mb-4">
            Explore Free Sample Notes
          </h1>
          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Browse premium syllabus content modules. Try our samples below to assess material depth before purchasing!
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm font-semibold">Stitching course preview notes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar navigation */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className={`text-xs font-bold tracking-wider uppercase px-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Syllabus Topics
              </h3>
              <div className="space-y-1">
                {samples.map((sample) => {
                  const isInterviewQA = sample.id === 'interview_qas';
                  const isLiveInterviews = sample.id === 'live_interviews';
                  const isSelected = selectedId === sample.id;

                  return (
                    <button
                      key={sample.id}
                      onClick={() => setSelectedId(sample.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-all ${
                        isSelected
                          ? isLiveInterviews
                            ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-500/15'
                            : isInterviewQA
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/15'
                              : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : isLiveInterviews
                            ? darkMode
                              ? 'bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-rose-50/40 hover:bg-rose-50 text-rose-700 border border-rose-200/60'
                            : isInterviewQA
                              ? darkMode
                                ? 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-amber-50/40 hover:bg-amber-50 text-amber-700 border border-amber-200/60'
                              : darkMode
                                ? 'hover:bg-slate-800 text-gray-300'
                                : 'hover:bg-slate-100 text-gray-750'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <FileText className={`w-4 h-4 flex-shrink-0 ${
                          isLiveInterviews && !isSelected ? 'text-rose-500 animate-pulse' :
                          isInterviewQA && !isSelected ? 'text-amber-500' : ''
                        }`} />
                        <span className="truncate">{sample.title}</span>
                      </div>
                      {isLiveInterviews && (
                        <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-rose-500 text-white animate-pulse'
                        }`}>
                          LIVE
                        </span>
                      )}
                      {isInterviewQA && (
                        <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-amber-500 text-white animate-pulse'
                        }`}>
                          HOT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Promo Callout */}
              <div className={`p-5 rounded-2xl border ${
                darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-250 shadow-sm'
              }`}>
                <div className="flex gap-2 text-emerald-500 mb-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
                  <span className="font-bold text-sm tracking-tight">75% OFF Expiration Speed</span>
                </div>
                <p className="text-xs text-gray-450 leading-relaxed mb-4">
                  Unlock manual guidelines, code bundles, templates, and resume formatting engines instantly for ₹199!
                </p>
                {purchased ? (
                  <a
                    href="#/dashboard"
                    className="w-full text-center block py-2.5 bg-slate-200 text-slate-800 hover:bg-slate-300 rounded-xl transition text-xs font-bold"
                  >
                    Manage Dashboard
                  </a>
                ) : (
                  <button
                    onClick={onInitiatePurchase}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>Get Instant Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Note Previewer viewport */}
            <div className={`lg:col-span-8 rounded-2xl border p-6 sm:p-8 relative overflow-hidden transition-all min-h-[500px] ${
              darkMode ? 'bg-slate-850 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'
            }`}>
              {activeNotes && (
                <div className="space-y-6">
                  {/* Top indicators */}
                  <div className="flex items-center justify-between border-b border-dashed border-slate-205 dark:border-slate-800 pb-4">
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-emerald-500">
                      {activeNotes.title}
                    </h2>
                    <span className="text-xs font-mono text-gray-400">
                      Format: Markdown / PDF
                    </span>
                  </div>

                  {/* Accessible previews */}
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line space-y-4 font-sans text-gray-650 dark:text-gray-300">
                    {activeNotes.preview}
                  </div>

                  {/* Blurred locked sections */}
                  {purchased ? (
                    <div className={`mt-8 p-4 rounded-xl border flex items-center gap-3 ${
                      darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                    }`}>
                      <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                      <div className="text-xs">
                        <span className="font-bold">You are a Premium Member!</span> Download this document in full from your <a href="#/dashboard" className="underline font-bold hover:text-emerald-500">Dashboard Portal Now</a>.
                      </div>
                    </div>
                  ) : (
                    <div className="relative mt-8">
                      {/* Blurred Text simulation */}
                      <div className="space-y-3 blur-[3.5px] select-none opacity-45">
                        <h4 className="font-bold text-base">3. COMPLEX REGRESSION ACTIONS DETECTED</h4>
                        <p className="text-xs leading-relaxed">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at porttitor sem. Aliquam erat volutpat. Donec non diam tincidunt, sodales lorem ac, varius diam.
                        </p>
                        <h4 className="font-bold text-base">4. DYNAMIC INTEGRATIONS CODE BLOCK CONFIG</h4>
                        <p className="text-xs leading-relaxed">
                          Class definition test cases, assert equal values matching mock arrays. Setup headers inside playwright launch fixtures before parallel runs execute across selenium networks.
                        </p>
                      </div>

                      {/* Floating Locking Visual Overlay Card */}
                      <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-fadeIn ${
                        darkMode ? 'bg-slate-900/85 text-white' : 'bg-slate-50/90 text-gray-800'
                      }`}>
                        <div className="p-3 bg-emerald-500 text-white rounded-full inline-block shadow-lg mb-4">
                          <Lock className="w-6 h-6" />
                        </div>
                        <h3 className="font-display font-extrabold text-lg sm:text-xl mb-2 tracking-tight">
                          Premium Study Content Locked
                        </h3>
                        <p className="text-xs max-w-md mx-auto mb-5 leading-normal text-gray-400 dark:text-gray-300">
                          To protect proprietary testing workflows, complete notes, templates, scripts, Jenkins files, and interview manuals are restricted to paid customers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
                          <button
                            onClick={onInitiatePurchase}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                          >
                            <span>Unlock Instant Access to Everything</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href="#/pricing"
                            className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition text-center w-full sm:w-auto ${
                              darkMode ? 'border-slate-700 hover:bg-slate-800 text-gray-300' : 'border-slate-250 hover:bg-slate-100 text-gray-700'
                            }`}
                          >
                            Review Pricing Features
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
