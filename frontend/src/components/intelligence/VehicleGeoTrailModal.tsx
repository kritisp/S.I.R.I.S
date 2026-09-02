import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Shield, AlertTriangle, Activity, X, ChevronRight, Eye } from 'lucide-react';
import { fetchVehicleGeoTrail, VehicleTrailResult } from '../../services/trailService';
import { useNavigate } from 'react-router-dom';
import { TacticalTrailMapView } from './TacticalTrailMapView';


interface VehicleGeoTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plateNumber?: string;
  onOpenCctv?: () => void;
}

export function VehicleGeoTrailModal({
  isOpen,
  onClose,
  plateNumber = 'OD-02-AB-1234',
  onOpenCctv
}: VehicleGeoTrailModalProps) {
  const [trailData, setTrailData] = useState<VehicleTrailResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchVehicleGeoTrail(plateNumber)
        .then(res => {
          setTrailData(res);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, plateNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-surface border border-border-soft rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0 text-text">
        {/* Modal Header */}
        <div className="p-5 bg-surface-2 border-b border-border-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger/10 text-danger-bright border border-danger/20">
              <Navigation size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-bg-elev px-2 py-0.5 rounded text-danger-bright border border-border">
                  VEHICLE GEO-TRAIL RECONSTRUCTION
                </span>
                <span className="text-[10px] font-mono text-success font-bold flex items-center gap-1">
                  <Activity size={10} className="animate-pulse" /> SPATIAL VECTOR RECONSTRUCTED
                </span>
              </div>
              <h2 className="text-xl font-bold font-mono text-text mt-0.5">
                Trajectory Matrix: {plateNumber}
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

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Demonstration Notice Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-warning-bright">
              <AlertTriangle size={15} />
              <span>Demonstration data — investigator verification required.</span>
            </div>
            <span className="text-[10px] text-text-dim">PROVENANCE: GRAPH DERIVED</span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Activity size={32} className="animate-spin text-brand mx-auto" />
              <p className="text-xs font-mono text-text-dim">Reconstructing camera hop sequence & distance telemetry...</p>
            </div>
          ) : trailData ? (
            <>
              {/* Telemetry Summary Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1">
                  <div className="text-[10px] font-mono text-text-dim uppercase">Total Hops</div>
                  <div className="text-xl font-bold font-mono text-brand">{trailData.totalHops} Cameras</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1">
                  <div className="text-[10px] font-mono text-text-dim uppercase">Distance Traversed</div>
                  <div className="text-xl font-bold font-mono text-text">{trailData.totalDistanceKm} km</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1">
                  <div className="text-[10px] font-mono text-text-dim uppercase">Duration</div>
                  <div className="text-xl font-bold font-mono text-text">{trailData.durationMinutes} mins</div>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1">
                  <div className="text-[10px] font-mono text-text-dim uppercase">Last Known Location</div>
                  <div className="text-xs font-bold text-success truncate">{trailData.lastKnownLocation.cameraName}</div>
                </div>
              </div>

              {/* Graphic Camera Hop Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim flex items-center justify-between">
                  <span>Camera Hop Sequence</span>
                  <span className="text-[10px] font-mono text-brand">DIRECTION: NORTHEAST VIA NH-16</span>
                </h3>

                <div className="space-y-2">
                  {trailData.trail.map((hop, idx) => (
                    <div
                      key={hop.hop}
                      onClick={() => setActiveHopIndex(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        activeHopIndex === idx
                          ? 'border-brand bg-brand/10 shadow-sm'
                          : 'border-border-soft bg-surface-2 hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          idx === 0 ? 'bg-danger/20 text-danger-bright border border-danger/40' :
                          idx === trailData.trail.length - 1 ? 'bg-success/20 text-success border border-success/40' :
                          'bg-surface text-brand border border-border'
                        }`}>
                          {hop.hop}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-text flex items-center gap-2">
                            <span>{hop.cameraId} · {hop.cameraName}</span>
                            {idx === 0 && <span className="text-[9px] bg-danger/20 text-danger-bright px-1.5 py-0.5 rounded font-mono font-bold">INCIDENT ORIGIN</span>}
                            {idx === trailData.trail.length - 1 && <span className="text-[9px] bg-success/20 text-success px-1.5 py-0.5 rounded font-mono font-bold">LAST KNOWN</span>}
                          </div>
                          <div className="text-[11px] font-mono text-text-dim mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Clock size={11} /> {new Date(hop.timestamp).toLocaleTimeString()}</span>
                            <span>Distance: {hop.distanceFromCrimeKm} km</span>
                            <span>Type: {hop.sightingType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-end font-mono text-xs">
                        <div className="text-right">
                          <div className="text-[10px] text-text-dim">CONFIDENCE</div>
                          <div className="font-bold text-success">{hop.confidence}%</div>
                        </div>
                        <ChevronRight size={16} className="text-text-dim" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GIS Map Vector Topology Leaflet Map */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-text-dim uppercase flex items-center justify-between">
                  <span>Interactive Leaflet GIS Tactical Topology</span>
                  <span className="text-brand font-bold">ODISHA HIGHWAY MATRIX</span>
                </div>
                <div className="h-64 rounded-xl border border-border-soft overflow-hidden shadow-inner">
                  <TacticalTrailMapView
                    trailData={trailData.trail.map(h => ({
                      hop: h.hop,
                      cameraId: h.cameraId,
                      cameraName: h.cameraName,
                      lat: h.latitude || (h.hop === 1 ? 20.2589 : h.hop === 2 ? 20.2741 : h.hop === 3 ? 20.3012 : 20.4625),
                      lng: h.longitude || (h.hop === 1 ? 85.7821 : h.hop === 2 ? 85.8012 : h.hop === 3 ? 85.8450 : 85.8820),
                      timestamp: h.timestamp,
                      confidence: h.confidence,
                      distanceFromCrimeKm: h.distanceFromCrimeKm,
                      sightingType: h.sightingType || 'ANPR'
                    }))}
                    highlightedHop={trailData.trail[activeHopIndex]?.hop}
                    onHopSelect={(hopNum) => {
                      const idx = trailData.trail.findIndex(x => x.hop === hopNum);
                      if (idx >= 0) setActiveHopIndex(idx);
                    }}
                  />
                </div>
              </div>

            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-2 border-t border-border-soft flex items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-text-faint">
            Source: S.I.R.I.S. Geo-Trail Reconstruction Engine
          </div>


          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/network');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text hover:text-brand transition-colors"
            >
              OPEN NETWORK GRAPH
            </button>

            {onOpenCctv && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCctv();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand text-bg hover:bg-brand-bright transition-colors flex items-center gap-1.5"
              >
                <Eye size={13} /> REVIEW CCTV FEEDS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
