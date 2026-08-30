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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text font-display flex items-center gap-2">
            <Building className="text-brand" /> Police Stations Registry
          </h2>
          <p className="text-sm text-text-dim mt-1">Statewide jurisdictional management and overview.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
            <input 
              type="text" 
              placeholder="Search stations..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border-soft rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:border-brand outline-none w-64"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-brand text-bg px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-bright transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Add Station
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 border-b border-border-soft text-text-dim text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Station Name</th>
                <th className="p-4 font-semibold">Code / ID</th>
                <th className="p-4 font-semibold">District</th>
                <th className="p-4 font-semibold">IIC / Admin</th>
                <th className="p-4 font-semibold">Active Cases</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {filteredStations.map(station => {
                const iic = state.users.find(u => u.stationId === station.id && u.role === 'STATION_ADMIN');
                const activeCases = state.cases.filter(c => c.stationId === station.id && c.status === 'INVESTIGATING').length;
                
                return (
                  <tr key={station.id} className="hover:bg-surface-hover transition-colors group">
                    <td className="p-4 font-bold text-text">{station.name}</td>
                    <td className="p-4 font-mono text-text-dim text-xs">{station.id}</td>
                    <td className="p-4 text-text flex items-center gap-2"><MapPin size={14} className="text-text-faint" /> {station.district}</td>
                    <td className="p-4 text-text">{iic ? iic.name : <span className="text-text-faint italic">Unassigned</span>}</td>
                    <td className="p-4 text-brand font-bold">{activeCases}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${station.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger-bright'}`}>
                        {station.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStations.length === 0 && (
            <div className="p-8 text-center text-text-dim">No stations found matching search.</div>
          )}
        </div>
      </div>

      {/* Add Station Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-border-soft rounded-2xl w-full max-w-lg shadow-glass overflow-hidden">
            <div className="p-6 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-text flex items-center gap-2">
                <Shield className="text-brand" size={20} /> Register New Station
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-dim hover:text-text">&times;</button>
            </div>
            
            <form onSubmit={handleAddStation} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">Station Name</label>
                  <input required type="text" value={newStation.name} onChange={e => setNewStation({...newStation, name: e.target.value})} className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">Station Code (ID)</label>
                  <input required type="text" value={newStation.id} onChange={e => setNewStation({...newStation, id: e.target.value})} className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text outline-none font-mono focus:border-brand" placeholder="e.g. OP-NEW-01" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">District</label>
                  <input required type="text" value={newStation.district} onChange={e => setNewStation({...newStation, district: e.target.value})} className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text outline-none focus:border-brand" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-dim uppercase mb-1">City</label>
                  <input required type="text" value={newStation.city} onChange={e => setNewStation({...newStation, city: e.target.value})} className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text outline-none focus:border-brand" />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-text-dim hover:text-text">Cancel</button>
                <button type="submit" className="bg-brand text-bg px-6 py-2 rounded-lg font-bold text-sm hover:bg-brand-bright">Register Station</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
