import React, { useEffect, useState } from 'react';
import {
  SearchAlert,
  Activity,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Astronaut } from '../types';
import { request } from '../api';

interface AnomalyDetectionViewProps {
  crew: Astronaut[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const AnomalyDetectionView: React.FC<AnomalyDetectionViewProps> = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut
}) => {
  const [twinData, setTwinData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeAstro = crew.find(a => a.id === selectedAstronautId) || crew[0];

  useEffect(() => {
    if (!activeAstro) return;
    setLoading(true);

    Promise.all([
      request(`/api/digital-twin?astronautId=${activeAstro.id}`),
      request(`/api/analysis/history?astronautId=${activeAstro.id}&limit=20`)
    ])
      .then(([twin, hist]) => {
        setTwinData(twin);
        setAnomalies(hist);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeAstro?.id]);

  const metrics = twinData?.metrics || [];

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SearchAlert color="var(--cyan)" size={24} />
            Explainable Anomaly Detection & Digital Twin
          </h1>
          <p className="page-subtitle">
            Controlled baseline deviation z-scores and machine-learning telemetry anomaly classification
          </p>
        </div>

        <select
          style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
          value={activeAstro?.id}
          onChange={e => onSelectAstronaut(e.target.value)}
        >
          {crew.map(c => (
            <option key={c.id} value={c.id}>
              {c.display_name} ({c.callsign})
            </option>
          ))}
        </select>
      </div>

      {/* Overview & Explainability Architecture Card */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">
            <Layers size={16} color="var(--cyan)" />
            Controlled Digital Twin Baseline Model (v{twinData?.baselineVersion ?? 1}.0)
          </div>
          <span className="badge badge-green">
            CALIBRATED PERSONAL PHYSIOLOGY
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
          Personal baselines are calibrated from the earliest validated flight days and locked against adaptive degradation. Deviations are quantified in standard deviation units (Z-scores). A metric with |Z| &ge; 2.0 flags clinical review; concurrent multi-system Z-score deviations activate compound alerts.
        </p>

        {/* Digital Twin Z-Score Distribution Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Telemetry Metric</th>
                <th>Current Observed</th>
                <th>Personal Baseline (Mean ± SD)</th>
                <th>Z-Score Deviation</th>
                <th>7-Day Rolling (Mean ± SD)</th>
                <th>14-Day Trajectory Slope</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Calibrating digital twin...</td></tr>
              ) : (
                metrics.map((m: any) => {
                  const z = m.zScore;
                  const isSevere = z != null && Math.abs(z) >= 2.5;
                  const isElevated = z != null && Math.abs(z) >= 1.8;
                  const zColor = isSevere ? 'var(--health-red)' : isElevated ? 'var(--health-orange)' : 'var(--health-green)';

                  return (
                    <tr key={m.metric}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {m.metric.replace('_', ' ').toUpperCase()}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                        {m.current != null ? `${m.current} ${m.unit}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {m.baselineMean != null ? `${m.baselineMean} ± ${m.baselineStd}` : '—'}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: zColor,
                            background: isSevere ? 'rgba(255,45,85,0.15)' : isElevated ? 'rgba(255,122,0,0.15)' : 'transparent',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          {z != null ? (z > 0 ? `+${z} σ` : `${z} σ`) : '0.0 σ'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {m.rollingMean7 != null ? `${m.rollingMean7} ± ${m.rollingStd7}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: m.slope14 > 0.5 ? 'var(--health-orange)' : m.slope14 < -0.5 ? 'var(--cyan)' : 'var(--text-muted)' }}>
                        {m.slope14 != null ? `${m.slope14 > 0 ? '+' : ''}${m.slope14} /day` : '0.00'}
                      </td>
                      <td>
                        <span className={`badge ${isSevere ? 'badge-red' : isElevated ? 'badge-orange' : 'badge-green'}`}>
                          {isSevere ? 'ANOMALOUS' : isElevated ? 'ELEVATED' : 'NOMINAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Anomaly Logs with Explainability Breakdown */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={16} color="var(--cyan)" />
            Historical Anomaly Detections & Evidence Logs
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Telemetry Incident Chronology
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            No anomalous events recorded for this astronaut.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {anomalies.map((an: any) => {
              const ev = an.evidence || {};
              const factors = ev.contributingFactors || [];
              const severity = ev.severity || 'yellow';

              return (
                <div
                  key={an.id}
                  style={{
                    background: 'rgba(9, 15, 32, 0.7)',
                    border: '1px solid var(--border-line)',
                    borderLeft: `4px solid ${severity === 'red' ? 'var(--health-red)' : severity === 'orange' ? 'var(--health-orange)' : 'var(--health-yellow)'}`,
                    borderRadius: '6px',
                    padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${severity}`}>
                        {ev.riskCategory || 'ANOMALY'}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                        Risk Score: {ev.riskScore ?? an.score}/100
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(an.detected_at).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '10px' }}>
                    {ev.explanation || 'Multi-indicator deviation detected.'}
                  </p>

                  {/* Factor Evidence Pills */}
                  {factors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                      {factors.map((f: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-line)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        >
                          <strong style={{ color: '#fff' }}>{f.name}:</strong> {f.observed} {f.unit} (baseline: {f.baseline})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
