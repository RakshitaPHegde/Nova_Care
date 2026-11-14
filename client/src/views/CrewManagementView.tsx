import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Search,
  Filter,
  Activity,
  Award,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Astronaut } from '../types';
import { request } from '../api';

interface CrewManagementViewProps {
  crew: Astronaut[];
  onSelectAstronaut: (id: string) => void;
  onRefreshCrew: () => void;
  userRole: string;
}

export const CrewManagementView: React.FC<CrewManagementViewProps> = ({
  crew,
  onSelectAstronaut,
  onRefreshCrew,
  userRole
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAstro, setEditAstro] = useState<Astronaut | null>(null);

  const [addForm, setAddForm] = useState({
    displayName: '',
    callsign: '',
    roleTitle: 'Mission Specialist',
    bloodType: 'O+',
    flightHours: 500,
    assignedSeat: 'Flight Deck 03',
    avatarColor: '#00F0FF'
  });

  const [submitting, setSubmitting] = useState(false);

  const filteredCrew = crew.filter(c => {
    const matchesSearch =
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.callsign && c.callsign.toLowerCase().includes(search.toLowerCase())) ||
      (c.role_title && c.role_title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.displayName) return;
    setSubmitting(true);
    try {
      await request('/api/crew', {
        method: 'POST',
        body: addForm
      });
      setShowAddModal(false);
      setAddForm({
        displayName: '',
        callsign: '',
        roleTitle: 'Mission Specialist',
        bloodType: 'O+',
        flightHours: 500,
        assignedSeat: 'Flight Deck 03',
        avatarColor: '#00F0FF'
      });
      onRefreshCrew();
    } catch (err: any) {
      alert('Failed to add astronaut: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAstro) return;
    setSubmitting(true);
    try {
      await request(`/api/crew/${editAstro.id}`, {
        method: 'PATCH',
        body: {
          displayName: editAstro.display_name,
          callsign: editAstro.callsign,
          roleTitle: editAstro.role_title,
          bloodType: editAstro.blood_type,
          flightHours: editAstro.flight_hours,
          assignedSeat: editAstro.assigned_seat,
          status: editAstro.status,
          avatarColor: editAstro.avatar_color
        }
      });
      setEditAstro(null);
      onRefreshCrew();
    } catch (err: any) {
      alert('Failed to update astronaut: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users color="var(--cyan)" size={24} />
            Flight Crew Manifest & Personnel Management
          </h1>
          <p className="page-subtitle">
            Astronaut medical clearances, flight deck seating assignments, and readiness statuses
          </p>
        </div>

        {userRole === 'medical' && (
          <button className="btn btn-sm" onClick={() => setShowAddModal(true)}>
            <UserPlus size={14} /> Add Crew Member
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '20px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search by astronaut name, callsign, or mission role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="nominal">Nominal</option>
              <option value="watch">Medical Watch</option>
              <option value="warning">Warning / Alert</option>
              <option value="eva">EVA Assigned</option>
              <option value="rest">Crew Rest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Crew Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Astronaut</th>
              <th>Callsign</th>
              <th>Flight Role</th>
              <th>Assigned Seat</th>
              <th>Flight Hours</th>
              <th>Blood Type</th>
              <th>Readiness Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCrew.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No crew members found matching filter</td></tr>
            ) : (
              filteredCrew.map(member => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          backgroundColor: member.avatar_color || '#00F0FF',
                          color: '#000',
                          fontWeight: 800,
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {member.callsign?.slice(0, 2) || member.display_name.slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 700, color: '#fff' }}>
                        {member.display_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 600 }}>
                    {member.callsign || '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {member.role_title}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {member.assigned_seat || 'Unassigned'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    {member.flight_hours ?? 0} hrs
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>
                    {member.blood_type || 'O+'}
                  </td>
                  <td>
                    <span className={`badge ${member.status === 'nominal' ? 'badge-green' : member.status === 'watch' ? 'badge-yellow' : 'badge-orange'}`}>
                      {member.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectAstronaut(member.id)}
                        title="View Dossier"
                      >
                        Dossier
                      </button>

                      {userRole === 'medical' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditAstro(member)}
                          title="Edit Profile"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Astronaut Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Add Astronaut Crew Member
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Register new astronaut profile into flight roster
            </p>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label>Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.displayName}
                    onChange={e => setAddForm({ ...addForm, displayName: e.target.value })}
                  />
                </div>
                <div>
                  <label>Callsign</label>
                  <input
                    type="text"
                    value={addForm.callsign}
                    onChange={e => setAddForm({ ...addForm, callsign: e.target.value })}
                  />
                </div>
                <div>
                  <label>Role / Flight Position</label>
                  <input
                    type="text"
                    value={addForm.roleTitle}
                    onChange={e => setAddForm({ ...addForm, roleTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label>Assigned Seat / Station</label>
                  <input
                    type="text"
                    value={addForm.assignedSeat}
                    onChange={e => setAddForm({ ...addForm, assignedSeat: e.target.value })}
                  />
                </div>
                <div>
                  <label>Blood Type</label>
                  <select
                    value={addForm.bloodType}
                    onChange={e => setAddForm({ ...addForm, bloodType: e.target.value })}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
                <div>
                  <label>Cumulative Flight Hours</label>
                  <input
                    type="number"
                    value={addForm.flightHours}
                    onChange={e => setAddForm({ ...addForm, flightHours: +e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Add Astronaut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Astronaut Modal */}
      {editAstro && (
        <div className="modal-overlay" onClick={() => setEditAstro(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Edit Astronaut Profile
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Update manifest status and seating assignment for {editAstro.display_name}
            </p>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={editAstro.display_name}
                    onChange={e => setEditAstro({ ...editAstro, display_name: e.target.value })}
                  />
                </div>
                <div>
                  <label>Callsign</label>
                  <input
                    type="text"
                    value={editAstro.callsign || ''}
                    onChange={e => setEditAstro({ ...editAstro, callsign: e.target.value })}
                  />
                </div>
                <div>
                  <label>Role Title</label>
                  <input
                    type="text"
                    value={editAstro.role_title || ''}
                    onChange={e => setEditAstro({ ...editAstro, role_title: e.target.value })}
                  />
                </div>
                <div>
                  <label>Assigned Seat</label>
                  <input
                    type="text"
                    value={editAstro.assigned_seat || ''}
                    onChange={e => setEditAstro({ ...editAstro, assigned_seat: e.target.value })}
                  />
                </div>
                <div>
                  <label>Readiness Status</label>
                  <select
                    value={editAstro.status}
                    onChange={e => setEditAstro({ ...editAstro, status: e.target.value as any })}
                  >
                    <option value="nominal">Nominal</option>
                    <option value="watch">Medical Watch</option>
                    <option value="warning">Warning</option>
                    <option value="eva">EVA Assigned</option>
                    <option value="rest">Rest</option>
                  </select>
                </div>
                <div>
                  <label>Flight Hours</label>
                  <input
                    type="number"
                    value={editAstro.flight_hours || 0}
                    onChange={e => setEditAstro({ ...editAstro, flight_hours: +e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditAstro(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
