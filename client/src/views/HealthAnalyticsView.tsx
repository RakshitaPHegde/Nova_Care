import React, { useState, useEffect } from 'react';
import {
  LineChart as LucideLineChart,
  Calendar,
  Activity,
  Heart,
  TrendingUp,
  Brain,
  Sun,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Astronaut } from '../types';
import { request } from '../api';

interface HealthAnalyticsViewProps {
  crew: Astronaut[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const HealthAnalyticsView: React.FC<HealthAnalyticsViewProps> = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut
}) => {
  const [timeframeDays, setTimeframeDays] = useState(30);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const activeAstro = crew.find(a => a.id === selectedAstronautId) || crew[0];

  useEffect(() => {
    if (!activeAstro) return;
    setLoading(true);
    request(`/api/reports/analytics?astronautId=${activeAstro.id}&days=${timeframeDays}`)
      .then(res => setAnalyticsData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeAstro?.id, timeframeDays]);

  const vitals = (analyticsData?.vitalsHistory || []).map((v: any) => ({
    ...v,
    time: String(v.recorded_at).slice(5, 10)
  }));

  const mental = (analyticsData?.mentalHistory || []).map((m: any) => ({
    ...m,
    time: String(m.recorded_at).slice(5, 10)
  }));

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <LucideLineChart color="var(--cyan)" size={24} />
            Longitudinal Health Analytics & Trend Correlation
          </h1>
          <p className="page-subtitle">
            Aerospace physiological data modeling across multi-week mission timelines
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          <div style={{ display: 'flex', gap: '4px' }}>
            {[7, 30, 90].map(days => (
              <button
                key={days}
                className={`btn btn-sm ${timeframeDays === days ? '' : 'btn-secondary'}`}
                onClick={() => setTimeframeDays(days)}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 1: Cardiovascular In-Flight Adaptation (HR vs HRV) */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div className="card-title">
            <Heart size={16} color="var(--cyan)" />
            Cardiovascular Adaptation (Resting Heart Rate vs Autonomic HRV)
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Rolling {timeframeDays}-Day Window
          </span>
        </div>

        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vitals}>
              <CartesianGrid stroke="rgba(30, 58, 102, 0.4)" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
              <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-line)', borderRadius: 6, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="heart_rate" stroke="#00F0FF" strokeWidth={2} dot={false} name="Heart Rate (bpm)" />
              <Line type="monotone" dataKey="hrv" stroke="#3DDC97" strokeWidth={2} dot={false} name="HRV rMSSD (ms)" />
              <Line type="monotone" dataKey="spo2" stroke="#1D8CF8" strokeWidth={2} dot={false} name="SpO2 (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Sleep vs Stress Correlation + Respiratory & Temp */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>

        {/* Sleep vs Stress */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Brain size={16} color="var(--cyan)" />
              Sleep Duration vs Cognitive Stress Correlation
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Neurobehavioral Adaptation
            </span>
          </div>

          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mental}>
                <CartesianGrid stroke="rgba(30, 58, 102, 0.4)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-line)', borderRadius: 6, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="stress" stroke="#FF7A00" strokeWidth={2} dot={false} name="Stress Score (/10)" />
                <Line type="monotone" dataKey="fatigue" stroke="#FF2D55" strokeWidth={2} dot={false} name="Fatigue Score (/10)" />
                <Line type="monotone" dataKey="mood" stroke="#3DDC97" strokeWidth={2} dot={false} name="Mood (/10)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Respiratory & Core Temperature Stability */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={16} color="var(--cyan)" />
              Ventilation & Core Temperature Homeostasis
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Metabolic Regulation
            </span>
          </div>

          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vitals}>
                <CartesianGrid stroke="rgba(30, 58, 102, 0.4)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-line)', borderRadius: 6, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="respiratory_rate" stroke="#00F0FF" strokeWidth={2} dot={false} name="Resp Rate (br/min)" />
                <Line type="monotone" dataKey="body_temperature" stroke="#FFB800" strokeWidth={2} dot={false} name="Core Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
