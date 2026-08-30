import React from 'react';
import { ShieldAlert, Lock, LogOut, ArrowRight, UserX, ShieldCheck, Mail } from 'lucide-react';

interface RoadblockScreenProps {
  userEmail: string;
  onSignOut: () => void;
}

export const RoadblockScreen: React.FC<RoadblockScreenProps> = ({ userEmail, onSignOut }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background Warning Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(225,29,72,0.15),rgba(255,255,255,0))]" />

      <div className="w-full max-w-lg bg-slate-900/95 border border-rose-800/60 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl space-y-6 relative z-10 text-center">
        {/* Security Shield Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border-2 border-rose-500/60 text-rose-400 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-md">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/80 text-rose-400 font-mono text-[11px] font-bold uppercase tracking-wider">
            <span>403 Access Denied · Unauthorized Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Restricted Production Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The Google account you signed in with is not authorized to access the Voxam YouTube Automation Factory.
          </p>
        </div>

        {/* User Identity Box */}
        <div className="p-4 bg-slate-950/90 border border-rose-900/50 rounded-2xl text-left space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
            <span className="text-slate-500 uppercase text-[10px] font-bold">Attempted Identity</span>
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800/60 text-[10px] font-extrabold flex items-center gap-1">
              <UserX className="w-3 h-3" />
              <span>UNAUTHORIZED</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs text-white font-bold truncate">{userEmail}</div>
              <div className="text-[10px] text-slate-500">Access Level: 0 (No Permissions)</div>
            </div>
          </div>
        </div>

        {/* Security Policy Information */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-left text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Roadblock Protections:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 font-mono text-[10px]">
            <li>Frontend dashboard and pipeline controls are completely locked.</li>
            <li>Browser request bypasses & API dispatches are cryptographically rejected by server-side middleware.</li>
            <li>Firestore database documents and video vaults are shielded by access control rules.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onSignOut}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>

          <a
            href="mailto:devmeziem@gmail.com?subject=Voxam%20Access%20Request&body=Hello,%20I%20would%20like%20to%20request%20access%20to%20the%20Voxam%20Production%20Hub%20for%20my%20account:%20"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono py-1"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Contact Owner (devmeziem@gmail.com) for Access</span>
          </a>
        </div>
      </div>
    </div>
  );
};
