import React, { useEffect, useState } from 'react';
import { Video, Mic, ArrowRight, User, Radio } from 'lucide-react';

const CAPTIONS = [
  'Interviewer: "Walk me through how you\'d design a test strategy for a payments API."',
  'You: "I\'d start with contract tests, then layer risk-based scenarios for retries and idempotency..."',
  'Interviewer: "How do you handle flaky UI tests in a CI pipeline?"',
  'You: "I isolate the flake, add explicit waits over sleeps, and quarantine it with a tracked ticket..."',
];

function useTypewriter(lines: string[], speed = 22, pause = 1800) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    const full = lines[lineIndex];
    if (text.length < full.length) {
      const t = setTimeout(() => setText(full.slice(0, text.length + 1)), speed + Math.random() * 18);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setText('');
      setLineIndex((i) => (i + 1) % lines.length);
    }, pause);
    return () => clearTimeout(t);
  }, [text, lineIndex, lines, speed, pause]);

  return { text, speaker: lines[lineIndex].startsWith('You') ? 'you' : 'interviewer' };
}

export default function LiveInterviewShowcase({ onCtaClick }: { onCtaClick: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const { text: caption, speaker } = useTypewriter(CAPTIONS);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const ss = (elapsed % 60).toString().padStart(2, '0');

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Copy side */}
        <div className="lg:col-span-5 space-y-5 animate-fadeInUp">
          <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white inline-flex items-center gap-1.5 btn-shine">
            <span className="live-rec-dot" /> Our Flagship Feature
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight leading-tight">
            Real 1-on-1 Live<br /> Mock Interviews
          </h2>
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Not another PDF. Get face-to-face on a live video call with a Principal QA/SDET architect —
            3 real 60-minute sessions with live coding critique, honest scorecards, and direct resume review.
            This is the difference between reading about interviews and actually surviving one.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['3 Live Sessions', 'Real Interviewers', 'Instant Feedback'].map((tag) => (
              <span key={tag} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={onCtaClick}
            className="btn-modern btn-shine mt-2 px-7 py-3.5 bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 flex items-center gap-2 hover:shadow-xl hover:shadow-rose-500/30 transition cursor-pointer"
          >
            <span>See Live Interview Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mock live call panel */}
        <div className="lg:col-span-7 animate-fadeInUp stagger-2">
          <div className="live-showcase-panel p-5 sm:p-6 shadow-2xl">
            {/* Call top bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-white">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span className="live-rec-dot" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400">Live Session</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400 tracking-widest">{mm}:{ss}</span>
            </div>

            {/* Two participant tiles */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Principal SDET · Interviewer', speaking: speaker === 'interviewer' },
                { label: 'You · Candidate', speaking: speaker === 'you' },
              ].map((p) => (
                <div
                  key={p.label}
                  className={`relative rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-colors duration-300 ${
                    p.speaking ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'
                  }`}
                  style={{ minHeight: '108px' }}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      p.speaking ? 'bg-emerald-500/20 text-emerald-400 avatar-pulse' : 'bg-slate-700/60 text-gray-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">{p.label}</span>
                  {/* waveform */}
                  <div className={`flex items-end gap-0.5 h-4 ${p.speaking ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="wave-bar"
                        style={{
                          height: `${6 + (i % 3) * 4}px`,
                          animationPlayState: p.speaking ? 'running' : 'paused',
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Live captions */}
            <div className="rounded-xl bg-black/30 border border-white/5 px-4 py-3 min-h-[52px] flex items-center">
              <p className="text-[12px] leading-relaxed text-gray-300 font-mono">
                {caption}
                <span className="terminal-cursor" />
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-5">
              <span className="p-2.5 rounded-full bg-white/5 text-gray-300"><Mic className="w-4 h-4" /></span>
              <span className="p-2.5 rounded-full bg-white/5 text-gray-300"><Video className="w-4 h-4" /></span>
              <span className="p-2.5 rounded-full bg-rose-500 text-white live-icon-radar">
                <Radio className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
