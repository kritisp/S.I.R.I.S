import React, { useState, useMemo } from 'react';
import { Users, Plus, Search, Shield, Briefcase, Trash2, Eye, Award, CheckCircle, Clock } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { User, CaseRecord } from '../mockServices/types';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';

export function Investigators() {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Profile Drawer / Popup State
  const [selectedProfileOfficer, setSelectedProfileOfficer] = useState<User | null>(null);
  
  // Reassignment Quick Modal State
  const [assigningCaseOfficer, setAssigningCaseOfficer] = useState<User | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [reassignTargetOfficerId, setReassignTargetOfficerId] = useState('');

  // Form State for new Officer
  const [newOfficerId, setNewOfficerId] = useState('');
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerRank, setNewOfficerRank] = useState('Sub-Inspector');
  const [newOfficerRole, setNewOfficerRole] = useState<'OFFICER' | 'STATION_ADMIN'>('OFFICER');
  const [newOfficerContact, setNewOfficerContact] = useState('');
  const [newOfficerStatus, setNewOfficerStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const myStationId = state.currentUser?.stationId || 'OP-BBSR-CAP';
  const myStationName = state.stations.find(s => s.id === myStationId)?.name || 'Khandagiri Police Station';

  if (state.currentUser?.role !== 'STATION_ADMIN') {
    return <div className="p-8 text-danger-bright font-bold">UNAUTHORIZED ACCESS</div>;
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName.trim() || !newOfficerId.trim()) return;

    let createdUserObj: User | null = null;
    try {
      createdUserObj = await usersApi.createUser({
        id: newOfficerId,
        name: newOfficerName,
        role: newOfficerRole,
        stationId: myStationId,
        status: newOfficerStatus,
        rank: newOfficerRank,
        password: 'Demo@123',
      });
    } catch (err) {
      console.warn('User creation API notice:', err);
    }

    const newUserObj: User = createdUserObj || {
      id: newOfficerId,
      name: newOfficerName,
      role: newOfficerRole,
      stationId: myStationId,
      status: newOfficerStatus,
      rank: newOfficerRank
    };

    dispatch({ type: 'ADD_USER', payload: newUserObj });
    
    // Clear form
    setNewOfficerId('');
    setNewOfficerName('');
    setNewOfficerRank('Sub-Inspector');
    setNewOfficerRole('OFFICER');
    setNewOfficerContact('');
    setNewOfficerStatus('ACTIVE');
    setShowModal(false);
  };

  const handleToggleDeactivate = async (officer: User) => {
    try {
      await usersApi.toggleUserStatus(officer.id);
    } catch (err) {
      console.warn('Toggle user status API notice:', err);
    }

    const updatedUser: User = {
      ...officer,
      status: officer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    };
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
  };

  // Reassignment confirmed
  const handleConfirmQuickReassign = () => {
    if (!selectedCaseId || !reassignTargetOfficerId) return;
    const targetCase = state.cases.find(c => c.id === selectedCaseId);
    if (targetCase) {
      const updatedCase: CaseRecord = {
        ...targetCase,
        investigatorId: reassignTargetOfficerId
      };
      dispatch({ type: 'UPDATE_CASE', payload: updatedCase });
      
      // Also add alert / log
      const logAlert = {
        id: `ALT-${Date.now()}`,
        type: 'PATTERN_DETECTED' as const,
        message: `${selectedCaseId} reassigned to ${state.users.find(u => u.id === reassignTargetOfficerId)?.name} by IIC Ramesh`,
        relatedCaseId: selectedCaseId,
        targetStationId: myStationId,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_ALERT', payload: logAlert });
    }
    setAssigningCaseOfficer(null);
    setSelectedCaseId('');
    setReassignTargetOfficerId('');
  };

  const stationOfficers = useMemo(() => {
    return state.users.filter(u => u.stationId === myStationId);
  }, [state.users, myStationId]);

  const filteredOfficers = useMemo(() => {
    return stationOfficers.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.rank && u.rank.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [stationOfficers, searchTerm]);

  // Compute officer stats
  const officerStats = useMemo(() => {
    return stationOfficers.map(officer => {
      const officerCases = state.cases.filter(c => c.investigatorId === officer.id);
      const activeCount = officerCases.filter(c => c.status === 'INVESTIGATING').length;
      const closedCount = officerCases.filter(c => c.status === 'SOLVED' || c.status === 'CLOSED').length;
      const pendingCount = officerCases.filter(c => c.status === 'PENDING').length;
      const total = activeCount + closedCount + pendingCount;
      const resRate = total > 0 ? Math.round((closedCount / total) * 100) : 75;
      
      // workload calculation
      const workloadPercent = Math.min(100, Math.round((activeCount * 2 + pendingCount) * 15 + 30));
      let workloadStatus: 'NORMAL' | 'HIGH WORKLOAD' | 'OVERLOADED' = 'NORMAL';
      if (workloadPercent > 80) workloadStatus = 'OVERLOADED';
      else if (workloadPercent > 60) workloadStatus = 'HIGH WORKLOAD';

      const avgTime = officer.id === 'INV-BBSR-001' ? 63 : officer.id === 'INV-BBSR-002' ? 57 : 71;

      return {
        officer,
        activeCount,
        closedCount,
        pendingCount,
        resRate,
        workloadPercent,
        workloadStatus,
        avgTime
      };
    });
  }, [stationOfficers, state.cases]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-4">
        <div>
          <h2 className="text-2xl font-bold text-text font-display flex items-center gap-2.5">
            <Users className="text-brand" size={24} /> Station Officers Module
          </h2>
          <p className="text-sm text-text-dim mt-1">
            Manage investigators, deploy cases, monitor workloads and analyze individual performance.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
            <input 
              type="text" 
              placeholder="Search officers..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border-soft rounded-lg pl-9 pr-4 py-2.5 text-xs text-text focus:border-brand outline-none w-60"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-brand text-bg px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-brand-bright transition-colors flex items-center gap-2"
          >
            <Plus size={15} /> Add Officer
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass rounded-2xl overflow-hidden border border-border-soft bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-2 border-b border-border-soft text-text-dim text-[10px] uppercase font-mono tracking-wider">
              <tr>
                <th className="p-4">Officer & Rank</th>
                <th className="p-4">Officer ID</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Active Cases</th>
                <th className="p-4 text-center">Closed</th>
                <th className="p-4 text-center">Pending</th>
                <th className="p-4 text-center">Avg Time</th>
                <th className="p-4 text-center">Res. Rate</th>
                <th className="p-4">Workload Status</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/50 font-mono">
              {filteredOfficers.map(officer => {
                const stats = officerStats.find(s => s.officer.id === officer.id);
                if (!stats) return null;
                
                return (
                  <tr key={officer.id} className="hover:bg-surface-hover/20 transition-colors">
                    <td className="p-4 font-bold text-text flex items-center gap-2.5 font-sans">
                      <div className="h-7 w-7 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center justify-center font-bold text-xs">
                        {officer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text">{officer.name}</div>
                        <div className="text-[9px] text-text-faint font-mono font-bold uppercase">{officer.rank || 'Officer'}</div>
                      </div>
                    </td>
                    <td className="p-4 text-text-dim text-xs font-semibold">{officer.id}</td>
                    <td className="p-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                        officer.role === 'STATION_ADMIN' 
                          ? 'bg-accent/20 text-accent-bright border border-accent/30' 
                          : 'bg-surface-2 text-text-dim border border-border-soft'
                      }`}>
                        {officer.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-center text-accent-bright font-bold">{stats.activeCount}</td>
                    <td className="p-4 text-center text-success font-bold">{stats.closedCount}</td>
                    <td className="p-4 text-center text-warning font-bold">{stats.pendingCount}</td>
                    <td className="p-4 text-center text-text-dim">{stats.avgTime} days</td>
                    <td className="p-4 text-center font-bold text-text">{stats.resRate}%</td>
                    <td className="p-4 font-sans">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-surface-2 rounded-full overflow-hidden shrink-0 border border-border-soft/40">
                          <div className={`h-full rounded-full ${
                            stats.workloadStatus === 'OVERLOADED' ? 'bg-danger-bright' :
                            stats.workloadStatus === 'HIGH WORKLOAD' ? 'bg-warning' : 'bg-success'
                          }`} style={{ width: `${stats.workloadPercent}%` }} />
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider ${
                          stats.workloadStatus === 'OVERLOADED' ? 'bg-danger/10 text-danger-bright border border-danger/30' :
                          stats.workloadStatus === 'HIGH WORKLOAD' ? 'bg-warning/10 text-warning border border-warning/30' :
                          'bg-success/10 text-success border border-success/30'
                        }`}>{stats.workloadStatus} ({stats.workloadPercent}%)</span>
                      </div>
                    </td>
                    <td className="p-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        officer.status === 'ACTIVE' 
                          ? 'bg-success/10 text-success border border-success/30' 
                          : 'bg-danger/10 text-danger-bright border border-danger/30'
                      }`}>
                        {officer.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-sans space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedProfileOfficer(officer)}
                        className="px-2 py-1 text-[10px] font-bold bg-surface-2 border border-border hover:bg-surface-hover text-text rounded-md transition-colors"
                      >
                        Profile
                      </button>
                      <button 
                        onClick={() => {
                          setAssigningCaseOfficer(officer);
                          setReassignTargetOfficerId(officer.id);
                        }}
                        className="px-2 py-1 text-[10px] font-bold bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand rounded-md transition-colors"
                      >
                        Assign
                      </button>
                      <button 
                        onClick={() => handleToggleDeactivate(officer)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                          officer.status === 'ACTIVE'
                            ? 'bg-danger/10 border border-danger/20 hover:bg-danger/20 text-danger-bright'
                            : 'bg-success/10 border border-success/20 hover:bg-success/20 text-success'
                        }`}
                      >
                        {officer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOfficers.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-text-faint italic font-sans">No officers found matching the search query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Officer Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddUser} className="bg-surface border border-border-soft rounded-2xl w-full max-w-lg shadow-glass overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                <Users className="text-brand" size={16} /> Add Station Investigator
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Station Code (Read-Only)</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="KHD-KND-014" 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text-faint outline-none font-mono cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Officer ID / Login ID</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. INV-KHD-045" 
                    value={newOfficerId} 
                    onChange={e => setNewOfficerId(e.target.value)} 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text outline-none font-mono focus:border-brand" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Officer Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. SI Priyadarshini Nayak" 
                    value={newOfficerName} 
                    onChange={e => setNewOfficerName(e.target.value)} 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text outline-none focus:border-brand" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Rank</label>
                  <select 
                    value={newOfficerRank} 
                    onChange={e => setNewOfficerRank(e.target.value)} 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text outline-none cursor-pointer focus:border-brand"
                  >
                    <option value="Inspector">Inspector</option>
                    <option value="Sub-Inspector">Sub-Inspector</option>
                    <option value="Asst. Sub-Inspector">Asst. Sub-Inspector</option>
                    <option value="Constable">Constable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Role Group</label>
                  <select 
                    value={newOfficerRole} 
                    onChange={e => setNewOfficerRole(e.target.value as any)} 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text outline-none cursor-pointer focus:border-brand"
                  >
                    <option value="OFFICER">Investigator (OFFICER)</option>
                    <option value="STATION_ADMIN">IIC Admin (STATION_ADMIN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Contact Number</label>
                  <input 
                    type="text" 
                    placeholder="+91-9439XXXXXX" 
                    value={newOfficerContact} 
                    onChange={e => setNewOfficerContact(e.target.value)} 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text outline-none focus:border-brand" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Initial Status</label>
                  <select 
                    value={newOfficerStatus} 
                    onChange={e => setNewOfficerStatus(e.target.value as any)} 
                    className="w-full bg-surface-2 border border-border rounded p-2 text-text outline-none cursor-pointer focus:border-brand"
                  >
                    <option value="ACTIVE">Active Deployment</option>
                    <option value="INACTIVE">Inactive / Reserved</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <p className="text-[10px] text-danger-bright font-mono uppercase tracking-wide">Credentials Note: Default password is set to Demo@123. No raw credentials are exposed.</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-border-soft flex justify-end gap-3 bg-surface-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-text-dim hover:text-text">Cancel</button>
              <button type="submit" className="bg-brand text-bg px-6 py-2 rounded-lg font-bold hover:bg-brand-bright transition-colors">Add Investigator</button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Profile Drawer/Popup ─── */}
      {selectedProfileOfficer && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-soft rounded-2xl w-full max-w-md shadow-glass overflow-hidden animate-fade-in text-xs">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand flex items-center gap-2">
                <Shield size={16} /> Officer Service File
              </h3>
              <button type="button" onClick={() => setSelectedProfileOfficer(null)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 border-b border-border-soft/60 pb-3">
                <div className="h-12 w-12 rounded-full bg-brand/10 border border-brand/35 text-brand flex items-center justify-center font-bold text-lg">
                  {selectedProfileOfficer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text leading-tight">{selectedProfileOfficer.name}</h4>
                  <p className="text-[10px] font-mono text-text-dim mt-0.5">{selectedProfileOfficer.rank} · ID: {selectedProfileOfficer.id}</p>
                </div>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-border-soft/40 pb-1.5">
                  <span className="text-text-dim">Assigned Station:</span>
                  <span className="font-bold text-text">{myStationName} (KHD-KND-014)</span>
                </div>
                <div className="flex justify-between border-b border-border-soft/40 pb-1.5">
                  <span className="text-text-dim">Contact Registry:</span>
                  <span className="font-bold text-text font-mono">+91-9439812402</span>
                </div>
                <div className="flex justify-between border-b border-border-soft/40 pb-1.5">
                  <span className="text-text-dim">Officer Role:</span>
                  <span className="font-mono text-accent-bright font-bold uppercase">{selectedProfileOfficer.role}</span>
                </div>
                <div className="flex justify-between border-b border-border-soft/40 pb-1.5">
                  <span className="text-text-dim">Activation Status:</span>
                  <span className={`font-mono font-bold uppercase ${selectedProfileOfficer.status === 'ACTIVE' ? 'text-success' : 'text-danger-bright'}`}>
                    {selectedProfileOfficer.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-[9px] text-text-dim">Active Cases under Investigation</h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {state.cases.filter(c => c.investigatorId === selectedProfileOfficer.id && c.status === 'INVESTIGATING').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedProfileOfficer(null); navigate(`/cases/${c.id}`); }}
                      className="p-2 bg-surface-2 hover:bg-surface-hover border border-border-soft/60 rounded-lg flex justify-between items-center cursor-pointer transition-colors"
                    >
                      <span className="font-mono font-bold text-text">{c.firNumber}</span>
                      <span className="text-text-dim truncate max-w-[200px] text-right">{c.title}</span>
                    </div>
                  ))}
                  {state.cases.filter(c => c.investigatorId === selectedProfileOfficer.id && c.status === 'INVESTIGATING').length === 0 && (
                    <p className="text-[10px] text-text-faint italic">No active investigations currently assigned.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border-soft flex justify-end bg-surface-2">
              <button type="button" onClick={() => setSelectedProfileOfficer(null)} className="bg-brand text-bg px-6 py-2 rounded-lg font-bold hover:bg-brand-bright">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Case Assignment quick modal ─── */}
      {assigningCaseOfficer && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-soft rounded-2xl w-full max-w-md shadow-glass overflow-hidden animate-fade-in text-xs space-y-4">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                <Briefcase className="text-brand" size={16} /> Deploy Case Assignment
              </h3>
              <button type="button" onClick={() => setAssigningCaseOfficer(null)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-surface-2 p-3 border border-border-soft rounded-lg">
                <p className="text-text-dim font-sans"><strong>Assigning to:</strong> {assigningCaseOfficer.name} ({assigningCaseOfficer.rank})</p>
                <p className="text-[10px] text-text-faint font-mono uppercase mt-1">ID: {assigningCaseOfficer.id}</p>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Select Case to Assign</label>
                <select 
                  value={selectedCaseId} 
                  onChange={e => setSelectedCaseId(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2.5 text-text outline-none cursor-pointer focus:border-brand"
                >
                  <option value="">-- Choose Active Station Case --</option>
                  {state.cases.filter(c => c.stationId === myStationId && c.investigatorId !== assigningCaseOfficer.id).map(c => (
                    <option key={c.id} value={c.id}>{c.firNumber} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">Current Investigator</label>
                <input 
                  type="text" 
                  readOnly 
                  value={
                    selectedCaseId 
                      ? (state.users.find(u => u.id === state.cases.find(c => c.id === selectedCaseId)?.investigatorId)?.name || 'Unassigned')
                      : 'None selected'
                  }
                  className="w-full bg-surface-2 border border-border rounded p-2 text-text-faint outline-none font-mono cursor-not-allowed"
                />
              </div>
            </div>
            <div className="p-5 border-t border-border-soft flex justify-end gap-3 bg-surface-2">
              <button type="button" onClick={() => setAssigningCaseOfficer(null)} className="px-4 py-2 font-bold text-text-dim hover:text-text">Cancel</button>
              <button 
                type="button" 
                onClick={handleConfirmQuickReassign} 
                disabled={!selectedCaseId}
                className="bg-brand text-bg px-6 py-2 rounded-lg font-bold hover:bg-brand-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
