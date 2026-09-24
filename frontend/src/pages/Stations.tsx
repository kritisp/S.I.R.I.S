import React, { useState } from 'react';
import { Building, Plus, Search, Shield, MapPin } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { Station } from '../mockServices/types';
import { stationsApi } from '../services/api';

export function Stations() {
  const { state, dispatch } = useMockState();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newStation, setNewStation] = useState<Partial<Station>>({
    name: '',
    id: '',
    district: '',
    city: '',
    status: 'ACTIVE'
  });

  if (state.currentUser?.role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-danger-bright font-bold">UNAUTHORIZED ACCESS</div>;
  }

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.id) return;

    let createdStation: Station | null = null;
    try {
      createdStation = await stationsApi.createStation(newStation);
    } catch (err) {
      console.warn('Station creation API notice:', err);
    }

    dispatch({ 
      type: 'ADD_STATION', 
      payload: (createdStation || newStation) as Station 
    });
    
    setShowModal(false);
    setNewStation({ name: '', id: '', district: '', city: '', status: 'ACTIVE' });
  };

  const filteredStations = state.stations.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
            <Building size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] uppercase tracking-wider">
                Police Stations Registry
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20">
                STATEWIDE JURISDICTION
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8]">
              Odisha State Police · Station Jurisdiction Management &amp; Administrative Hierarchy
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#94A3B8]" size={14} />
            <input 
              type="text" 
              placeholder="Search stations..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg pl-8 pr-3 py-1.5 text-xs text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#94A3B8] focus:border-accent dark:focus:border-[#38BDF8] outline-none w-56 font-mono"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] px-3.5 py-1.5 rounded-lg font-bold font-mono text-xs uppercase flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Add Station
          </button>
        </div>
      </div>

      <div className="bg-surface dark:bg-[#0B0F17] rounded-xl overflow-hidden border border-border-soft dark:border-[#1E293B] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-2 dark:bg-[#0E1422] border-b border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 font-bold">Station Name</th>
                <th className="p-3.5 font-bold">Code / ID</th>
                <th className="p-3.5 font-bold">District</th>
                <th className="p-3.5 font-bold">IIC / Admin</th>
                <th className="p-3.5 font-bold">Active Cases</th>
                <th className="p-3.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/60 dark:divide-[#1E293B]">
              {filteredStations.map(station => {
                const iic = state.users.find(u => u.stationId === station.id && u.role === 'STATION_ADMIN');
                const activeCases = state.cases.filter(c => c.stationId === station.id && c.status === 'INVESTIGATING').length;
                
                return (
                  <tr key={station.id} className="hover:bg-surface-2 dark:hover:bg-[#0E1422] transition-colors group">
                    <td className="p-3.5 font-bold text-text dark:text-[#F8FAFC] font-sans">{station.name}</td>
                    <td className="p-3.5 font-mono text-text-dim dark:text-[#94A3B8] text-xs">{station.id}</td>
                    <td className="p-3.5 text-text dark:text-[#F8FAFC]">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-accent dark:text-[#38BDF8]" /> {station.district}
                      </span>
                    </td>
                    <td className="p-3.5 text-text dark:text-[#F8FAFC]">{iic ? iic.name : <span className="text-text-dim dark:text-[#94A3B8] italic">Unassigned</span>}</td>
                    <td className="p-3.5 text-accent dark:text-[#38BDF8] font-bold">{activeCases}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${station.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                        {station.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStations.length === 0 && (
            <div className="p-8 text-center text-text-dim dark:text-[#94A3B8] text-xs font-mono">No stations found matching search.</div>
          )}
        </div>
      </div>

      {/* Add Station Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border-soft dark:border-[#1E293B] flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-text dark:text-[#F8FAFC] flex items-center gap-2 uppercase">
                <Shield className="text-accent dark:text-[#38BDF8]" size={16} /> Register New Station
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]">&times;</button>
            </div>
            
            <form onSubmit={handleAddStation} className="p-4 space-y-3.5 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-dim dark:text-[#94A3B8] uppercase mb-1">Station Name</label>
                  <input required type="text" value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value})} className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg p-2 text-xs text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-dim dark:text-[#94A3B8] uppercase mb-1">Station Code (ID)</label>
                  <input required type="text" value={newStation.id} onChange={e => setNewStation({...newStation, id: e.target.value})} className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg p-2 text-xs text-text dark:text-[#F8FAFC] outline-none font-mono focus:border-accent dark:focus:border-[#38BDF8]" placeholder="e.g. OP-NEW-01" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-dim dark:text-[#94A3B8] uppercase mb-1">District</label>
                  <input required type="text" value={newStation.district} onChange={e => setNewStation({...newStation, district: e.target.value})} className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg p-2 text-xs text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-text-dim dark:text-[#94A3B8] uppercase mb-1">City</label>
                  <input required type="text" value={newStation.city} onChange={e => setNewStation({...newStation, city: e.target.value})} className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-lg p-2 text-xs text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8]" />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-border-soft dark:border-[#1E293B]">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-1.5 text-xs font-bold text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]">Cancel</button>
                <button type="submit" className="bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] px-4 py-1.5 rounded-lg font-bold font-mono text-xs uppercase cursor-pointer">Register Station</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
