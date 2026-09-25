import React from 'react';
import { Sparkles, Brain, Scale, ShieldAlert, ArrowUpRight, Compass, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

interface AIIntelligenceInsightsProps {
  caseId: string;
  firNumber?: string;
  workspaceData?: any;
}

export function AIIntelligenceInsights({ caseId, firNumber, workspaceData }: AIIntelligenceInsightsProps) {
  const isBurglary = (firNumber || caseId).includes('0001') || (firNumber || caseId).includes('0817') || (firNumber || caseId).includes('KHD');
  const isCuttack = (firNumber || caseId).includes('0981') || (firNumber || caseId).includes('CTC');
  const isSaheedNagar = (firNumber || caseId).includes('0031') || (firNumber || caseId).includes('SAH');
  const isNayapalli = (firNumber || caseId).includes('0045') || (firNumber || caseId).includes('NAY');

  return (
    <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4 font-sans select-none shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-soft pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand/15 text-brand border border-brand/30">
            <Brain size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-text flex items-center gap-2">
              S.I.R.I.S. AI INTELLIGENCE &amp; STRATEGIC INSIGHTS
            </h3>
            <p className="text-[11px] text-text-dim">
              Automated syndicate topology, modus operandi markers, and strategic lead generation
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/20">
          NEURAL REASONING v2.4
        </span>
      </div>

      {/* Grid of 3 Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {/* Card 1: Modus Operandi Profile */}
        <div className="p-4 bg-surface-2 rounded-xl border border-border-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-brand flex items-center gap-1">
              <Compass size={12} /> Modus Operandi Signature
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand/10 text-brand border border-brand/20">
              92% FINGERPRINT
            </span>
          </div>

          <h4 className="text-xs font-bold text-text font-mono">
            {isBurglary ? 'Night Commercial Safe Breach & NH-16 Corridor Escape' :
             isCuttack ? 'Armed Jewelry Incursion & Madhupatna Meltdown Ring' :
             isSaheedNagar ? 'Commercial Hydraulic Shutter Extraction' :
             isNayapalli ? 'Darknet Telegram UPI-Crypto Mule Layering' :
             'Organized Cross-District Infiltration Pattern'}
          </h4>

          <ul className="text-[11px] text-text-dim space-y-1.5 font-mono">
            <li className="flex items-start gap-1.5">
              <span className="text-success font-bold">•</span>
              <span>Forced entry concentrated between 02:00 AM - 04:00 AM.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-success font-bold">•</span>
              <span>Disabling CCTV DVR power circuits before safe vault compromise.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-success font-bold">•</span>
              <span>Immediate cross-jurisdiction vehicular movement towards NH-16.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Syndicate Hierarchy & Role Resolution */}
        <div className="p-4 bg-surface-2 rounded-xl border border-border-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-accent-bright flex items-center gap-1">
              <Brain size={12} /> Syndicate Hierarchy
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-accent-bright/10 text-accent-bright border border-accent-bright/20">
              3 TIERS RESOLVED
            </span>
          </div>

          <h4 className="text-xs font-bold text-text font-mono">
            Key Role Distribution across Gang Members
          </h4>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between p-1.5 rounded bg-surface border border-border-soft">
              <span className="text-text font-bold">Safe Intruder / Breaker:</span>
              <span className="text-pink-400">Bikram Das (Suspect)</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-surface border border-border-soft">
              <span className="text-text font-bold">Getaway Driver:</span>
              <span className="text-cyan-400">Driver OD-02-AB-1234</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-surface border border-border-soft">
              <span className="text-text font-bold">Pawn / Hawala Receiver:</span>
              <span className="text-amber-400">Ramesh Sahu (Cuttack)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Recommended Field Action & Legal Proofs */}
        <div className="p-4 bg-surface-2 rounded-xl border border-border-soft space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-purple-400 flex items-center gap-1">
              <Scale size={12} /> Strategic Follow-ups
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              HIGH PRIORITY
            </span>
          </div>

          <h4 className="text-xs font-bold text-text font-mono">
            Required Actions for Section 173 BNSS Charge Sheet
          </h4>

          <ul className="text-[11px] text-text-dim space-y-1.5 font-mono">
            <li className="flex items-start gap-1.5">
              <ChevronRight size={13} className="text-brand shrink-0 mt-0.5" />
              <span>Issue Section 91 CrPC notice to Cuttack PS for seized gold inspection.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <ChevronRight size={13} className="text-brand shrink-0 mt-0.5" />
              <span>Request Airtel CAF record &amp; IMEI search for +91 98610 99882.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <ChevronRight size={13} className="text-brand shrink-0 mt-0.5" />
              <span>Submit FSL hydraulic tool impression comparison report.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
