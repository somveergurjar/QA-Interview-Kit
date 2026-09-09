import React from 'react';
import { Lock, LockOpen } from 'lucide-react';

export default function FloatingAccessButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex items-center group">
      {/* Slide-out label */}
      <span className="fab-label mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-lg opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        Get Instant Access
      </span>

      <button
        onClick={onClick}
        aria-label="Get instant access"
        className="fab-access-btn relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer"
      >
        <span className="fab-ring" />
        <span className="fab-ring fab-ring-delay" />
        <span className="fab-core">
          <span className="lock-icon-wrap">
            <span className="icon-lock">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <span className="icon-unlock">
              <LockOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
