import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Brain,
  Shield,
  Activity,
  PlusCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Astronaut } from '../types';
import { request } from '../api';

interface GravityMindViewProps {
  crew: Astronaut[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const GravityMindView: React.FC<GravityMindViewProps> = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut
}) => {
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [boneList, setBoneList] = useState<any[]>([]);
  const [mentalList, setMentalList] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'exercise' | 'mind' | 'bone'>('exercise');

  // Form states
  const [exerciseForm, setExerciseForm] = useState({
    exercise_type: 'ARED Advanced Resistive Exercise Device',
    duration_min: 60,
    discomfort: 1
  });

  const [mentalForm, setMentalForm] = useState({
    mood: 8,
    stress: 3,
    fatigue: 2,
    sleep_quality: 7,
    isolation: 2,
    concentration: 8,
    notes: ''
  });

  const [boneForm, setBoneForm] = useState({
    assessment_type: 'In-Flight Calibrated Ultrasound BMD Index',
    value: 0.985,
    unit: 'T-score',
    source: 'Ultrasound DEXA Proxy'
  });

  const [submitting, setSubmitting] = useState(false);

  const activeAstro = crew.find(a => a.id === selectedAstronautId) || crew[0];
  // Exercise Dashboard Calculations
const totalExerciseSessions = exerciseList.length;

const totalWorkoutMinutes = exerciseList.reduce(
  (total, exercise) => total + Number(exercise.duration_min || 0),
  0
);

const averageDiscomfort = exerciseList.length > 0
  ? (
      exerciseList.reduce(
        (total, exercise) => total + Number(exercise.discomfort || 0),
        0
      ) / exerciseList.length
    ).toFixed(1)
  : '0.0';

  const loadData = () => {
    if (!activeAstro) return;
    request(`/api/exercise/history?astronautId=${activeAstro.id}&limit=20`)
      .then(res => setExerciseList(res || []))
      .catch(err => console.error(err));

    request(`/api/mental/history?astronautId=${activeAstro.id}&limit=20`)
      .then(res => setMentalList(res || []))
      .catch(err => console.error(err));

    request(`/api/bone/history?astronautId=${activeAstro.id}&limit=20`)
      .then(res => setBoneList(res || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, [activeAstro?.id]);

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAstro) return;
    setSubmitting(true);
    try {
      await request('/api/exercise', {
        method: 'POST',
        body: { ...exerciseForm, astronautId: activeAstro.id }
      });
      loadData();
      alert('Exercise session recorded.');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAstro) return;
    setSubmitting(true);
    try {
      await request('/api/mental/checkin', {
        method: 'POST',
        body: { ...mentalForm, astronautId: activeAstro.id }
      });
      loadData();
      alert('MindSpace check-in saved.');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAstro) return;
    setSubmitting(true);
    try {
      await request('/api/bone', {
        method: 'POST',
        body: { ...boneForm, astronautId: activeAstro.id }
      });
      loadData();
      alert('Bone health assessment saved.');
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Dumbbell color="var(--cyan)" size={24} />
            GravityGuard & MindSpace Wellness
          </h1>
          <p className="page-subtitle">
            Musculoskeletal countermeasure adherence, bone mineral density, and psychological resilience tracking
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'exercise' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('exercise')}
          >
            Exercise Countermeasures
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'mind' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('mind')}
          >
            MindSpace Psychology
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'bone' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('bone')}
          >
            Bone Health DEXA
          </button>
        </div>
      </div>

      {activeTab === 'exercise' && (
  <>
    {/* Exercise Summary Cards */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      <div className="glass-card">
        <Activity color="var(--cyan)" size={24} />
        <h3>Total Exercise Sessions</h3>
        <h2>{totalExerciseSessions}</h2>
      </div>

      <div className="glass-card">
        <Dumbbell color="var(--cyan)" size={24} />
        <h3>Total Workout Minutes</h3>
        <h2>{totalWorkoutMinutes}</h2>
      </div>

      <div className="glass-card">
        <Activity color="var(--cyan)" size={24} />
        <h3>Average Discomfort</h3>
        <h2>{averageDiscomfort} / 10</h2>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Exercise Form */}
          <form onSubmit={handleExerciseSubmit} className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>
              Log Countermeasure Workout
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label>Exercise Device / Protocol</label>
                <select
                  value={exerciseForm.exercise_type}
                  onChange={e => setExerciseForm({ ...exerciseForm, exercise_type: e.target.value })}
                >
                  <option value="ARED Advanced Resistive Exercise Device">ARED (Deadlift / Squat / Bench Press)</option>
                  <option value="T2 Treadmill with Vibration Isolation">T2 Treadmill (Interval Running)</option>
                  <option value="CEVIS Cycle Ergometer">CEVIS Cycle Ergometer (Cardio Aerobic)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    value={exerciseForm.duration_min}
                    onChange={e => setExerciseForm({ ...exerciseForm, duration_min: +e.target.value })}
                  />
                </div>
                <div>
                  <label>Discomfort (0 - 10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={exerciseForm.discomfort}
                    onChange={e => setExerciseForm({ ...exerciseForm, discomfort: +e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Log Exercise Session'}
            </button>
          </form>

          {/* Exercise Logs */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>
              Recent Exercise Sessions
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Device</th>
                    <th>Duration</th>
                    <th>Discomfort</th>
                  </tr>
                </thead>
                <tbody>
                  {exerciseList.map(ex => (
                    <tr key={ex.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {new Date(ex.recorded_at).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{ex.exercise_type}</td>
                      <td>{ex.duration_min} min</td>
                      <td>{ex.discomfort} / 10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                  </div>
        </div>
      </>
      )}

      {activeTab === 'mind' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Mental Form */}
          <form onSubmit={handleMentalSubmit} className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>
              MindSpace Psychological Self-Assessment
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label>Mood (1 - 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={mentalForm.mood}
                  onChange={e => setMentalForm({ ...mentalForm, mood: +e.target.value })}
                />
              </div>
              <div>
                <label>Stress (1 - 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={mentalForm.stress}
                  onChange={e => setMentalForm({ ...mentalForm, stress: +e.target.value })}
                />
              </div>
              <div>
                <label>Fatigue (1 - 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={mentalForm.fatigue}
                  onChange={e => setMentalForm({ ...mentalForm, fatigue: +e.target.value })}
                />
              </div>
              <div>
                <label>Isolation / Confinement (1 - 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={mentalForm.isolation}
                  onChange={e => setMentalForm({ ...mentalForm, isolation: +e.target.value })}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Private Astronaut Notes</label>
                <textarea
                  rows={3}
                  value={mentalForm.notes}
                  onChange={e => setMentalForm({ ...mentalForm, notes: e.target.value })}
                  placeholder="Record confidential thoughts for mission psychologist..."
                />
              </div>
            </div>

            <button type="submit" className="btn btn-sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save MindSpace Check-in'}
            </button>
          </form>

          {/* Mental Logs */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>
              Recent Psychological Check-ins
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mood</th>
                    <th>Stress</th>
                    <th>Fatigue</th>
                    <th>Isolation</th>
                  </tr>
                </thead>
                <tbody>
                  {mentalList.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {new Date(m.recorded_at).toLocaleDateString()}
                      </td>
                      <td style={{ color: 'var(--health-green)', fontWeight: 700 }}>{m.mood}/10</td>
                      <td style={{ color: m.stress > 6 ? 'var(--health-orange)' : '#fff' }}>{m.stress}/10</td>
                      <td>{m.fatigue}/10</td>
                      <td>{m.isolation || 2}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bone' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Bone Form */}
          <form onSubmit={handleBoneSubmit} className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>
              Record Bone Health Assessment
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Smartwatches do not measure bone density. Enter calibrated clinician ultrasound or DEXA index measurements.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label>Assessment Type</label>
                <input
                  type="text"
                  value={boneForm.assessment_type}
                  onChange={e => setBoneForm({ ...boneForm, assessment_type: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Score Value</label>
                  <input
                    type="number"
                    step="any"
                    value={boneForm.value}
                    onChange={e => setBoneForm({ ...boneForm, value: +e.target.value })}
                  />
                </div>
                <div>
                  <label>Unit</label>
                  <input
                    type="text"
                    value={boneForm.unit}
                    onChange={e => setBoneForm({ ...boneForm, unit: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Assessment'}
            </button>
          </form>

          {/* Bone Logs */}
          <div className="glass-card">
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px' }}>
              Bone Mineral Density Timeline
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Assessment Type</th>
                    <th>Value</th>
                    <th>Instrument</th>
                  </tr>
                </thead>
                <tbody>
                  {boneList.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {new Date(b.assessed_at).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{b.assessment_type}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{b.value} {b.unit}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
