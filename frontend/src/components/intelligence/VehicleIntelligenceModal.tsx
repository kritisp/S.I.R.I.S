import React, { useState, useEffect } from 'react';
import { Shield, Car, AlertTriangle, User, FileText, MapPin, Eye, ExternalLink, Activity, X } from 'lucide-react';
import { checkAnprPlate, AnprCheckResult } from '../../services/anprService';
import { useNavigate } from 'react-router-dom';

interface VehicleIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  plateNumber: string;
  onOpenTrail?: () => void;
  onOpenCctv?: () => void;
}

export function VehicleIntelligenceModal({
  isOpen,
  onClose,
  plateNumber,
  onOpenTrail,
  onOpenCctv
}: VehicleIntelligenceModalProps) {
  const [data, setData] = useState<AnprCheckResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && plateNumber) {
      setLoading(true);
      checkAnprPlate(plateNumber)
        .then(res => {
          setData(res);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, plateNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-surface border border-border-soft rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-text">
        {/* Header */}
        <div className="p-5 bg-surface-2 border-b border-border-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
              <Car size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-bg-elev px-2 py-0.5 rounded text-brand border border-border">
                  ANPR / VEHICLE INTELLIGENCE
                </span>
                <span className="text-[10px] font-mono text-text-dim">
                  PROVENANCE: AUTHORIZED POLICE RECORD
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-text mt-0.5 flex items-center gap-2">
                {plateNumber}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Activity size={28} className="animate-spin text-brand mx-auto" />
              <p className="text-xs text-text-dim font-mono">Querying Central ANPR Watchlist Engine...</p>
            </div>
          ) : data ? (
            <>
              {/* Alert Status Banner */}
              {data.alert ? (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-danger-bright shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-danger-bright uppercase tracking-wider flex items-center gap-2">
                      VEHICLE MATCH DETECTED · SEVERITY: {data.severity}
                    </div>
                    <p className="text-text leading-relaxed font-medium">
                      {data.instructions}
                    </p>
                    <div className="text-[10px] text-text-dim font-mono pt-1">
                      NOTE: Vehicle associated with investigation · Officer verification required
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3 text-xs">
                  <Shield size={18} className="text-success shrink-0" />
                  <div>
                    <div className="font-bold text-success">No Active Watchlist Flags</div>
                    <div className="text-text-dim text-[11px]">{data.instructions}</div>
                  </div>
                </div>
              )}

              {/* Vehicle Intel Metadata Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2">
                  <div className="text-[10px] uppercase font-bold text-text-dim flex items-center gap-1.5">
                    <FileText size={12} className="text-brand" /> Associated FIR Case
                  </div>
                  <div className="text-sm font-bold font-mono text-brand">{data.firCaseNumber || 'FIR-2026-0142'}</div>
                  <div className="text-xs text-text-dim">{data.originalCrime || 'Armed Robbery'}</div>
                  <div className="text-[10px] font-mono text-text-faint">District: {data.district}</div>
                </div>

                <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2">
                  <div className="text-[10px] uppercase font-bold text-text-dim flex items-center gap-1.5">
                    <User size={12} className="text-accent-bright" /> Associated Entity / Person
                  </div>
                  <div className="text-sm font-bold text-text">{data.associatedPerson || 'Rajesh Kumar'}</div>
                  <div className="text-xs text-text-dim">Role: Suspect / Repeat Offender</div>
                  <div className="text-[10px] font-mono text-text-faint font-semibold text-warning-bright">Status: Under Active Investigation</div>
                </div>
              </div>

              {/* Sightings & CCTV History */}
              <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-text-dim flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><MapPin size={13} className="text-danger-bright" /> ANPR Sighting Matrix</span>
                  <span className="text-[10px] font-mono text-brand">4 SIGHTINGS RECORDED</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-surface border border-border-soft flex items-center justify-between">
                    <div>
                      <div className="font-bold text-text">CAM-041 · Khandagiri Square</div>
                      <div className="text-[10px] text-text-dim">2026-08-21 21:10:00</div>
                    </div>
                    <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-0.5 rounded">94% MATCH</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface border border-border-soft flex items-center justify-between">
                    <div>
                      <div className="font-bold text-text">CAM-103 · Cuttack Sadar Checkpoint</div>
                      <div className="text-[10px] text-text-dim">2026-08-21 21:43:00</div>
                    </div>
                    <span className="text-[10px] font-bold bg-brand/20 text-brand px-2 py-0.5 rounded">LAST KNOWN</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-surface-2 border-t border-border-soft flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-text-faint italic">
            Demonstration Intelligence — Officer Verification Required
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/cases/CR-KHD-2026-00142');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text hover:text-brand transition-colors flex items-center gap-1.5"
            >
              <ExternalLink size={13} /> VIEW LINKED CASES
            </button>

            {onOpenTrail && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTrail();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand text-bg hover:bg-brand-bright transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <MapPin size={13} /> TRACE VEHICLE
              </button>
            )}

            {onOpenCctv && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCctv();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-accent-bright/10 text-accent-bright border border-accent-bright/30 hover:bg-accent-bright/20 transition-colors flex items-center gap-1.5"
              >
                <Eye size={13} /> VIEW CCTV
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
