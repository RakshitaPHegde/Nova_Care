import React, { useState } from 'react';
import {
  Satellite,
  UserCheck,
  Shield,
  KeyRound,
  Mail,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { request } from '../api';

interface LoginViewProps {
  onLoginSuccess: (authData: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [roleTitle, setRoleTitle] = useState('Mission Specialist');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister ? { email, password, name, callsign, roleTitle } : { email, password };

      const res = await request(endpoint, {
        method: 'POST',
        body
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('role', res.role);
      if (res.astronaut) {
        localStorage.setItem('astronautId', res.astronaut.id);
        localStorage.setItem('astronautName', res.astronaut.display_name);
        localStorage.setItem('callsign', res.astronaut.callsign || '');
      }

      onLoginSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email: demoEmail, password: 'demo1234' }
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('role', res.role);
      if (res.astronaut) {
        localStorage.setItem('astronautId', res.astronaut.id);
        localStorage.setItem('astronautName', res.astronaut.display_name);
        localStorage.setItem('callsign', res.astronaut.callsign || '');
      }

      onLoginSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at 50% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 60%), #050811'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          border: '1px solid var(--border-line)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.1)',
          padding: '32px'
        }}
      >
        {/* NASA Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div className="nasa-logo-badge" style={{ fontSize: '13px', padding: '4px 10px' }}>NASA</div>
            <span style={{ fontSize: '12px', letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              BioTelemetry Console
            </span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
            ASTROVITAL
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Autonomous AI Astronaut Health Telemetry Platform
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 45, 85, 0.15)',
              border: '1px solid var(--health-red)',
              borderRadius: '6px',
              padding: '10px 14px',
              color: 'var(--health-red)',
              fontSize: '12px',
              marginBottom: '18px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <>
              <div>
                <label>Astronaut Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Cmdr. Sarah Vance"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Flight Callsign</label>
                  <input
                    type="text"
                    placeholder="VALKYRIE"
                    value={callsign}
                    onChange={e => setCallsign(e.target.value)}
                  />
                </div>
                <div>
                  <label>Position / Role</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label>Mission Account Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="astro@demo.space"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label>Security Clearance Key / Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Authenticating...' : isRegister ? 'Register Flight Credentials' : 'Authenticate Console'}
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Already registered? Sign in' : 'Create new astronaut profile'}
          </button>
        </div>

        {/* 1-Click Demo Login Shortcuts */}
        <div style={{ borderTop: '1px solid var(--border-line)', marginTop: '24px', paddingTop: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px', letterSpacing: '0.5px' }}>
            ⚡ Instant 1-Click Demo Sign-in
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('astro@demo.space')}
              disabled={loading}
              title="Sign in as Commander Sarah Vance"
            >
              👩‍🚀 Cmdr. Vance (Astro)
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('medical@demo.space')}
              disabled={loading}
              title="Sign in as Flight Surgeon Dr. Hayes"
            >
              🩺 Flight Surgeon
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('pilot@demo.space')}
              disabled={loading}
              title="Sign in as Pilot Marcus Chen"
            >
              🚀 Pilot Chen
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDemoLogin('engineer@demo.space')}
              disabled={loading}
              title="Sign in as Engineer David Okafor"
            >
              🛠️ Eng. Okafor
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: 'var(--text-muted)' }}>
          SECURE MISSION TERMINAL · ENCRYPTION: TLS 1.3 / AES-256-GCM
        </div>
      </div>
    </div>
  );
};
