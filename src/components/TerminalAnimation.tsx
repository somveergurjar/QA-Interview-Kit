import React, { useEffect, useState } from 'react';

type LineKind = 'command' | 'pass' | 'info' | 'comment' | 'success';

interface CodeLine {
  text: string;
  kind: LineKind;
}

const SCRIPT: CodeLine[] = [
  { text: '$ npm run test:qa-interview-kit', kind: 'command' },
  { text: '// Running Selenium + API regression suite...', kind: 'comment' },
  { text: '✓ should render login form', kind: 'pass' },
  { text: '✓ should verify OTP within 6 digits', kind: 'pass' },
  { text: 'assert(response.status).toBe(200) // OK', kind: 'info' },
  { text: '✓ should unlock premium notes after payment', kind: 'pass' },
  { text: '✓ 24 passed, 0 failed (2.8s)', kind: 'success' },
  { text: 'You are ready for your next SDET interview 🚀', kind: 'success' },
];

const KIND_CLASS: Record<LineKind, string> = {
  command: 'text-gray-400',
  comment: 'text-gray-500 italic',
  pass: 'text-emerald-400',
  info: 'text-indigo-300',
  success: 'text-emerald-400 font-bold',
};

export default function TerminalAnimation() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<CodeLine[]>([]);

  useEffect(() => {
    if (lineIndex >= SCRIPT.length) {
      const resetTimer = setTimeout(() => {
        setVisibleLines([]);
        setLineIndex(0);
        setCharIndex(0);
      }, 2600);
      return () => clearTimeout(resetTimer);
    }

    const current = SCRIPT[lineIndex];
    if (charIndex <= current.text.length) {
      const typeTimer = setTimeout(() => {
        setVisibleLines((prev) => {
          const next = [...prev];
          next[lineIndex] = { ...current, text: current.text.slice(0, charIndex) };
          return next;
        });
        setCharIndex((c) => c + 1);
      }, 18 + Math.random() * 22);
      return () => clearTimeout(typeTimer);
    } else {
      const nextLineTimer = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      }, current.kind === 'command' ? 250 : 120);
      return () => clearTimeout(nextLineTimer);
    }
  }, [lineIndex, charIndex]);

  const isTyping = lineIndex < SCRIPT.length;

  return (
    <div className="terminal-panel w-full max-w-md mx-auto text-left overflow-hidden animate-fadeInUp stagger-4">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-3 text-[10px] text-gray-500 tracking-wide">qa-interview-kit — zsh</span>
      </div>
      <div className="p-4 min-h-[190px] text-[12px] leading-relaxed space-y-1.5">
        {visibleLines.map((line, idx) => (
          <div key={idx} className={KIND_CLASS[line.kind]}>
            {line.text}
            {isTyping && idx === lineIndex && <span className="terminal-cursor" />}
          </div>
        ))}
        {!isTyping && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}
