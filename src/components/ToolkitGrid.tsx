import React from 'react';
import {
  FileText, Code, Database, GitBranch, Terminal, HelpCircle,
  UserCircle, Sheet, Bug, Award, Compass, Zap, CheckCircle2,
  Sparkles, Layers, Cpu, Activity, Workflow, Video
} from 'lucide-react';
import { ToolkitItemContent } from '../types.js';

// Icons stay fixed per item id — only the text content is admin-editable
const ICON_MAP: Record<string, any> = {
  manual_notes: FileText,
  programming_oop_notes: Code,
  api_notes: Terminal,
  selenium_notes: Code,
  playwright_notes: Zap,
  framework_arch_notes: Layers,
  sql_notes: Database,
  git_notes: GitBranch,
  cicd_notes: Workflow,
  performance_k6_notes: Activity,
  ai_testing_notes: Cpu,
  interview_qas: HelpCircle,
  live_interviews: Video
};

interface ToolkitGridProps {
  items: ToolkitItemContent[];
  onLearnMore?: (id: string) => void;
  darkMode: boolean;
}

export default function ToolkitGrid({ items, onLearnMore, darkMode }: ToolkitGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((kit) => {
        const IconComponent = ICON_MAP[kit.id] || FileText;
        let badgeColor = '';
        switch (kit.category) {
          case 'Manual':
            badgeColor = 'bg-sky-500/10 text-sky-500 dark:bg-sky-500/20';
            break;
          case 'Automation':
            badgeColor = 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20';
            break;
          case 'Templates':
            badgeColor = 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20';
            break;
          case 'Career':
            badgeColor = 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20';
            break;
        }

        const isInterviewQA = kit.id === 'interview_qas';
        const isLiveInterviews = kit.id === 'live_interviews';

        return (
          <div
            key={kit.id}
            id={`kit-card-${kit.id}`}
            className={`flex flex-col rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden group ${
              isLiveInterviews
                ? darkMode
                  ? 'bg-slate-900/95 border-rose-500/60 hover:border-rose-400 ring-1 ring-rose-500/30 card-live-beam card-live-glow scale-[1.015]'
                  : 'bg-rose-50/20 border-rose-300 hover:border-rose-400 ring-1 ring-rose-400/30 card-live-beam card-live-glow scale-[1.015]'
              : isInterviewQA
                ? darkMode
                  ? 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/30'
                  : 'bg-amber-50/20 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.12)] hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/30'
                : darkMode
                  ? 'bg-slate-850/80 border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-900/40'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100/50'
            }`}
          >
            {/* Soft accent glow on hover */}
            {isLiveInterviews ? (
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-bl-full translate-x-6 -translate-y-6 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-500" />
            ) : isInterviewQA ? (
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full translate-x-6 -translate-y-6 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-500" />
            ) : (
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full translate-x-6 -translate-y-6 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform duration-500" />
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isLiveInterviews
                    ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
                    : badgeColor
                }`}>
                  {kit.category}
                </span>
                {isLiveInterviews && (
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white flex items-center gap-1.5 btn-shine">
                    <span className="live-rec-dot" /> 1-ON-1 LIVE
                  </span>
                )}
                {isInterviewQA && (
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> KEY Q&A
                  </span>
                )}
              </div>
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isLiveInterviews
                  ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 live-icon-radar'
                  : isInterviewQA
                    ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400'
                    : darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-50 text-emerald-600'
              }`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <h3 className={`font-display font-bold text-lg mb-2 tracking-tight ${
              isLiveInterviews
                ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                : isInterviewQA
                  ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                  : ''
            }`}>
              {kit.title}
            </h3>

            <p className={`text-sm leading-relaxed mb-5 flex-grow ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {kit.description}
            </p>

            <div className={`border-t border-dashed pt-4 mt-auto flex items-center justify-between ${
              isLiveInterviews
                ? 'border-rose-500/20'
                : isInterviewQA
                  ? 'border-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800'
            }`}>
              <span className={`text-xs flex items-center gap-1 font-semibold ${
                isLiveInterviews
                  ? 'text-rose-500 dark:text-rose-400'
                  : isInterviewQA
                    ? 'text-amber-500 dark:text-amber-400'
                    : darkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {isLiveInterviews ? (
                  <span className="flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-450 px-2 py-0.5 rounded text-[10px] font-bold">
                    ● 3 Sessions Included
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 animate-bounce" /> Fully Indexed
                  </>
                )}
              </span>
              {onLearnMore ? (
                <button
                  onClick={() => onLearnMore(kit.id)}
                  className={`text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                    isLiveInterviews
                      ? 'text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300'
                      : isInterviewQA
                        ? 'text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300'
                        : 'text-slate-700 hover:text-emerald-500 dark:text-gray-300 dark:hover:text-emerald-400'
                  }`}
                >
                  View Sample Notes &rarr;
                </button>
              ) : (
                <a
                  href="#/samples"
                  className={`text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                    isLiveInterviews
                      ? 'text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300'
                      : isInterviewQA
                        ? 'text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300'
                        : 'text-slate-700 hover:text-emerald-500 dark:text-gray-300 dark:hover:text-emerald-400'
                  }`}
                >
                  View Previews &rarr;
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
