import React, { useState } from 'react';
import {
  AlertOctagon,
  CheckCircle,
  Clock,
  Filter,
  Check,
  FileCheck,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { HealthAlert } from '../types';
import { request } from '../api';

interface AlertsCenterViewProps {
  alerts: HealthAlert[];
  onAcknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  onRefreshAlerts: () => void;
  userRole: string;
}

export const AlertsCenterView: React.FC<AlertsCenterViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onRefreshAlerts,
  userRole
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [ackModalAlert, setAckModalAlert] = useState<HealthAlert | null>(null);
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredAlerts = alerts.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    return true;
  });

  const handleAcknowledge = async () => {
    if (!ackModalAlert) return;
    setSubmitting(true);
    try {
      await onAcknowledgeAlert(ackModalAlert.id, clinicianNotes);
      setAckModalAlert(null);
      setClinicianNotes('');
      onRefreshAlerts();
    } catch (err: any) {
      alert('Acknowledgement failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await request(`/api/alerts/${id}/resolve`, {
        method: 'PATCH',
        body: { notes: 'Resolved by Flight Surgeon review' }
      });
      onRefreshAlerts();
    } catch (err: any) {
      alert('Resolve alert failed: ' + err.message);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <AlertOctagon color="var(--health-orange)" size={24} />
            Medical Alerts & Telemetry Incident Operations
          </h1>
          <p className="page-subtitle">
            Real-time multi-indicator alert processing, escalation protocols, and clinician sign-offs
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterStatus === 'all' ? '' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('all')}
          >
            All Status ({alerts.length})
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'open' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('open')}
          >
            Open ({alerts.filter(a => a.status === 'open').length})
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'acknowledged' ? '' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('acknowledged')}
          >
            Acknowledged
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'resolved' ? '' : 'btn-secondary'}`}
            onClick={() => setFilterStatus('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Alert Severity Summary Strip */}
      <div className="grid-cols-4" style={{ marginBottom: '20px' }}>
        <div className="metric-tile critical">
          <div className="metric-name">
            <span>Critical Severity (Red)</span>
            <ShieldAlert size={16} color="var(--health-red)" />
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value" style={{ color: 'var(--health-red)' }}>
              {alerts.filter(a => a.severity === 'red').length}
            </span>
            <span className="metric-unit">ALERTS</span>
          </div>
          <div className="metric-delta">Requires Immediate Flight Surgeon Action</div>
        </div>

        <div className="metric-tile warning">
          <div className="metric-name">
            <span>Elevated Severity (Orange)</span>
            <AlertOctagon size={16} color="var(--health-orange)" />
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value" style={{ color: 'var(--health-orange)' }}>
              {alerts.filter(a => a.severity === 'orange').length}
            </span>
            <span className="metric-unit">ALERTS</span>
          </div>
          <div className="metric-delta">Multi-System Pattern Detected</div>
        </div>

        <div className="metric-tile watch">
          <div className="metric-name">
            <span>Medical Watch (Yellow)</span>
            <Clock size={16} color="var(--health-yellow)" />
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value" style={{ color: 'var(--health-yellow)' }}>
              {alerts.filter(a => a.severity === 'yellow').length}
            </span>
            <span className="metric-unit">ALERTS</span>
          </div>
          <div className="metric-delta">Individual Indicator Variance</div>
        </div>

        <div className="metric-tile nominal">
          <div className="metric-name">
            <span>Resolved Incidents</span>
            <CheckCircle size={16} color="var(--health-green)" />
          </div>
          <div className="metric-value-wrap">
            <span className="metric-value" style={{ color: 'var(--health-green)' }}>
              {alerts.filter(a => a.status === 'resolved').length}
            </span>
            <span className="metric-unit">RESOLVED</span>
          </div>
          <div className="metric-delta">Closed with Flight Surgeon Sign-off</div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle size={40} color="var(--health-green)" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ color: '#fff', fontSize: '16px' }}>No Alerts Match Current Filter</h3>
            <p style={{ fontSize: '13px' }}>All crew vitals and mission indicators are clear of violations.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isRed = alert.severity === 'red';
            const isOrange = alert.severity === 'orange';
            const alertColor = isRed ? 'var(--health-red)' : isOrange ? 'var(--health-orange)' : 'var(--health-yellow)';

            return (
              <div
                key={alert.id}
                className="glass-card"
                style={{
                  borderLeft: `5px solid ${alertColor}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge badge-${alert.severity}`}>
                      {alert.severity.toUpperCase()} PRIORITY
                    </span>
                    <span className={`badge ${alert.status === 'open' ? 'badge-red' : alert.status === 'acknowledged' ? 'badge-yellow' : 'badge-green'}`}>
                      STATUS: {alert.status.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {alert.title}
                    </h3>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Triggered: {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>

                {alert.astronaut_name && (
                  <div style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '8px' }}>
                    Astronaut: {alert.astronaut_name} ({alert.astronaut_callsign || 'CREW'})
                  </div>
                )}

                <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '12px' }}>
                  {alert.explanation}
                </p>

                {/* Evidence Details */}
                {Array.isArray(alert.evidence) && alert.evidence.length > 0 && (
                  <div style={{ background: 'rgba(9, 15, 32, 0.6)', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Telemetry Evidence Vectors:
                    </div>
                    <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {alert.evidence.map((ev: any, i: number) => (
                        <li key={i}>
                          <strong style={{ color: '#fff' }}>{ev.name || ev.metric}:</strong> {ev.reason || ev.impact} (observed: {ev.observed})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Actions */}
                {Array.isArray(alert.actions) && alert.actions.length > 0 && (
                  <div style={{ marginBottom: '14px', fontSize: '12px' }}>
                    <strong style={{ color: 'var(--cyan)' }}>Recommended Flight Surgeon Action: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{alert.actions.join(' · ')}</span>
                  </div>
                )}

                {/* Clinician Notes / Acknowledged By info */}
                {alert.acknowledged_by && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px', marginBottom: '10px' }}>
                    Acknowledged by: <strong style={{ color: '#fff' }}>{alert.acknowledged_by}</strong> at {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString() : 'N/A'}.
                    {alert.clinician_notes && <span> Note: "{alert.clinician_notes}"</span>}
                  </div>
                )}

                {/* Actions Bar */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {alert.status === 'open' && (
                    <button
                      className="btn btn-sm"
                      onClick={() => setAckModalAlert(alert)}
                    >
                      <Check size={13} /> Acknowledge Alert
                    </button>
                  )}

                  {alert.status === 'acknowledged' && userRole === 'medical' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResolve(alert.id)}
                    >
                      <FileCheck size={13} /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clinician Acknowledgement Modal */}
      {ackModalAlert && (
        <div className="modal-overlay" onClick={() => setAckModalAlert(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Flight Surgeon Alert Acknowledgement
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Alert: <strong style={{ color: '#fff' }}>{ackModalAlert.title}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label>Clinician Evaluation Notes & Protocol Log:</label>
              <textarea
                rows={4}
                placeholder="Enter clinical assessment, Space-to-Ground comms summary, or countermeasure directive..."
                value={clinicianNotes}
                onChange={e => setClinicianNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setAckModalAlert(null)}>
                Cancel
              </button>
              <button className="btn btn-sm" onClick={handleAcknowledge} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Sign & Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
