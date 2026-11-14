import React, { useState, useEffect } from 'react';
import {
  Compass,
  Satellite,
  PlusCircle,
  Calendar,
  Clock,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Mission } from '../types';
import { request } from '../api';

interface MissionManagementViewProps {
  userRole: string;
}

export const MissionManagementView: React.FC<MissionManagementViewProps> = ({ userRole }) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMission, setCurrentMission] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: 'AV-EXP-',
    targetOrbit: 'Lunar Distant Retrograde Orbit (DRO)',
    inclination: '51.6°',
    startAt: new Date().toISOString().slice(0, 16)
  });
  const [submitting, setSubmitting] = useState(false);

  const loadMissions = () => {
    request<Mission[]>('/api/missions')
      .then(res => setMissions(res || []))
      .catch(err => console.error(err));

    request('/api/missions/current')
      .then(res => setCurrentMission(res))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      await request('/api/missions', {
        method: 'POST',
        body: form
      });
      setShowAddModal(false);
      setForm({
        name: '',
        code: 'AV-EXP-',
        targetOrbit: 'Lunar Distant Retrograde Orbit (DRO)',
        inclination: '51.6°',
        startAt: new Date().toISOString().slice(0, 16)
      });
      loadMissions();
    } catch (err: any) {
      alert('Failed to create mission: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Compass color="var(--cyan)" size={24} />
            Mission Management & Orbital Trajectory Parameters
          </h1>
          <p className="page-subtitle">
            Mission Elapsed Time (MET), orbital coordinates, flight milestones, and telemetry configurations
          </p>
        </div>

        {userRole === 'medical' && (
          <button className="btn btn-sm" onClick={() => setShowAddModal(true)}>
            <PlusCircle size={14} /> New Flight Mission
          </button>
        )}
      </div>

      {/* Active Mission Highlight Card */}
      {currentMission && (
        <div className="glass-card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div className="card-title">
              <Satellite size={16} color="var(--cyan)" />
              Active Flight Operations · {currentMission.code}
            </div>
            <span className="badge badge-green">ACTIVE IN ORBIT</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            {currentMission.name}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(9, 15, 32, 0.6)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TARGET ORBIT:</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyan)' }}>
                {currentMission.target_orbit}
              </div>
            </div>

            <div style={{ background: 'rgba(9, 15, 32, 0.6)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ORBITAL INCLINATION:</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {currentMission.inclination}
              </div>
            </div>

            <div style={{ background: 'rgba(9, 15, 32, 0.6)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MISSION ELAPSED DAYS:</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                DAY {currentMission.missionElapsedDays || 30}
              </div>
            </div>

            <div style={{ background: 'rgba(9, 15, 32, 0.6)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TELEMETRY STATUS:</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--health-green)' }}>
                {currentMission.telemetryStatus || 'NOMINAL HIGH-RATE STREAM'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missions Registry List */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={16} color="var(--cyan)" />
            Flight Missions Registry
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Expedition History
          </span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mission Name</th>
                <th>Mission Code</th>
                <th>Orbit / Target</th>
                <th>Inclination</th>
                <th>Launch Date</th>
                <th>Crew Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {missions.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{m.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{m.code}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.target_orbit}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{m.inclination}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {new Date(m.start_at).toLocaleDateString()}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {m.crew_count ?? 4}
                  </td>
                  <td>
                    <span className={`badge ${m.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Mission Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Create New Flight Mission
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Define expedition parameters, orbital parameters, and telemetry profiles
            </p>

            <form onSubmit={handleCreateMission}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Mission Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Artemis Gateway Expedition 04"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label>Mission Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label>Orbital Inclination</label>
                  <input
                    type="text"
                    value={form.inclination}
                    onChange={e => setForm({ ...form, inclination: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Target Orbit / Trajectory</label>
                  <input
                    type="text"
                    value={form.targetOrbit}
                    onChange={e => setForm({ ...form, targetOrbit: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label>Launch Timestamp</label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={e => setForm({ ...form, startAt: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
