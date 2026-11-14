import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Globe2, RefreshCw, Satellite, Clock3, Gauge, MapPin } from 'lucide-react';
import { request } from '../api';

interface ISSData {
  dataType: string;
  simulated: boolean;
  source: string;
  fetchedAt: string;
  observationTime: string;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  visibility: string;
  footprintKm: number;
  cached?: boolean;
  _cachedAt?: number;
}

const formatNumber = (value?: number, digits = 2) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits })
    : '--';

export const ISSTrackerView: React.FC = () => {
  const [data, setData] = useState<ISSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadPosition = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);


    try {
      const result = await request<ISSData>('/api/nasa/iss/location');
      setData(result);
      setLastUpdated(new Date());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve the ISS position.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosition();
    const timer = window.setInterval(() => loadPosition(), 15000);
    return () => window.clearInterval(timer);
  }, [loadPosition]);

  const metrics = [
    { label: 'Altitude', value: formatNumber(data?.altitudeKm), unit: 'km', icon: Gauge },
    { label: 'Orbital velocity', value: formatNumber(data?.velocityKmh, 0), unit: 'km/h', icon: Activity },
    { label: 'Latitude', value: formatNumber(data?.latitude, 4), unit: '°', icon: MapPin },
    { label: 'Longitude', value: formatNumber(data?.longitude, 4), unit: '°', icon: Globe2 },
  ];

  return (
    <section className="space-intel-page">
      <div className="space-intel-heading">
        <div>
          <div className="space-intel-eyebrow"><Satellite size={14} /> ORBITAL INTELLIGENCE</div>
          <h1>International Space Station</h1>
          <p>Live orbital position and spacecraft telemetry from an external tracking source.</p>
        </div>
        <button className="space-intel-refresh" onClick={() => loadPosition(true)} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'space-spin' : ''} />
          {refreshing ? 'Refreshing' : 'Refresh position'}
        </button>
      </div>

      <div className="space-intel-status-row">
        <span className="space-source-badge live"><span /> LIVE ORBITAL DATA</span>
        <span className="space-intel-source">Source: {data?.source || 'ISS tracking service'}</span>
        <span className="space-intel-updated">
          <Clock3 size={13} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for position'}
        </span>
      </div>

      {error && <div className="space-intel-error">{error}</div>}

      <div className="iss-overview-card">
        <div className="iss-overview-copy">
          <span className="space-intel-eyebrow">CURRENT SPACECRAFT POSITION</span>
          <h2>ISS <span>·</span> NORAD 25544</h2>
          <p>
            {data
              ? `${formatNumber(data.latitude, 3)}° ${data.latitude >= 0 ? 'N' : 'S'}  /  ${formatNumber(Math.abs(data.longitude), 3)}° ${data.longitude >= 0 ? 'E' : 'W'}`
              : loading ? 'Acquiring orbital coordinates...' : 'Position unavailable'}
          </p>
          <div className="iss-orbit-visual">
            <div className="iss-orbit-ring ring-one" />
            <div className="iss-orbit-ring ring-two" />
            <div className="iss-orbit-earth"><Globe2 size={52} /></div>
            <div className="iss-orbit-satellite"><Satellite size={25} /></div>
          </div>
        </div>
        <div className="iss-overview-side">
          <div className="iss-visibility-label">CURRENT VISIBILITY</div>
          <div className={`iss-visibility-value ${data?.visibility === 'visible' ? 'is-visible' : ''}`}>
            {data?.visibility || (loading ? 'Acquiring' : '--')}
          </div>
          <p>Tracking status reported by the orbital position provider.</p>
          <div className="iss-side-divider" />
          <span className="iss-visibility-label">GROUND FOOTPRINT</span>
          <strong>{formatNumber(data?.footprintKm, 0)} <small>km</small></strong>
        </div>
      </div>

      <div className="space-intel-metric-grid">
        {metrics.map(({ label, value, unit, icon: Icon }) => (
          <article className="space-intel-metric" key={label}>
            <div className="space-intel-metric-top">
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <div className="space-intel-metric-value">{loading && !data ? '...' : value}<small> {unit}</small></div>
          </article>
        ))}
      </div>

      <div className="space-intel-info-grid">
        <article className="space-intel-panel">
          <h3>Observation details</h3>
          <div className="space-intel-detail-row">
            <span>Observation timestamp</span>
            <strong>{data?.observationTime ? new Date(data.observationTime).toLocaleString() : '--'}</strong>
          </div>
          <div className="space-intel-detail-row">
            <span>API retrieval time</span>
            <strong>{data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : '--'}</strong>
          </div>
          <div className="space-intel-detail-row">
            <span>Refresh cadence</span>
            <strong>15 seconds</strong>
          </div>
        </article>
        <article className="space-intel-panel">
          <h3>Data provenance</h3>
          <p className="space-intel-provenance">
            <span className="space-source-badge live"><span /> LIVE</span>
            Orbital coordinates are retrieved from the ISS tracking provider through the AstroVital backend.
          </p>
          <p className="space-intel-provenance-note">
            This tracker reports spacecraft position only. It does not represent live astronaut vital signs or medical measurements.
          </p>
        </article>
      </div>
    </section>
  );
};
