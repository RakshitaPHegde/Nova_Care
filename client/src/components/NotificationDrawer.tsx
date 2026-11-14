import React from 'react';
import { X, AlertOctagon, CheckCircle2, Clock } from 'lucide-react';
import { HealthAlert } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: HealthAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onViewAlertsCenter: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledgeAlert,
  onViewAlertsCenter
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(5, 8, 17, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '380px',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border-line)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={18} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
              Notifications & Alerts
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} color="var(--health-green)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 600 }}>All Systems Nominal</p>
              <p style={{ fontSize: '12px' }}>No unacknowledged alerts or telemetry violations.</p>
            </div>
          ) : (
            alerts.map(a => (
              <div
                key={a.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${a.severity === 'red' ? 'var(--health-red)' : a.severity === 'orange' ? 'var(--health-orange)' : 'var(--health-yellow)'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className={`badge badge-${a.severity}`}>
                    {a.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} />
                    {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff', marginBottom: '4px' }}>
                  {a.title}
                </div>

                {a.astronaut_name && (
                  <div style={{ fontSize: '11px', color: 'var(--cyan)', marginBottom: '4px' }}>
                    Astronaut: {a.astronaut_name} ({a.astronaut_callsign || 'CREW'})
                  </div>
                )}

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {a.explanation}
                </p>

                {a.status === 'open' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => onAcknowledgeAlert(a.id)}
                  >
                    Acknowledge Alert
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-line)' }}>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              onClose();
              onViewAlertsCenter();
            }}
          >
            Open Alerts Operations Center
          </button>
        </div>
      </div>
    </div>
  );
};
