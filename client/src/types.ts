export interface Astronaut {
  id: string;
  user_id?: string | null;
  mission_id?: string | null;
  display_name: string;
  callsign?: string;
  role_title?: string;
  blood_type?: string;
  flight_hours?: number;
  status: 'nominal' | 'watch' | 'warning' | 'critical' | 'rest' | 'eva';
  assigned_seat?: string;
  avatar_color?: string;
  mission_name?: string;
  mission_code?: string;
  created_at?: string;
  latest_vitals?: HealthMetric;
  open_alerts?: number;
  max_severity?: 'green' | 'yellow' | 'orange' | 'red';
  latest_risk_score?: number;
}

export interface HealthMetric {
  id?: string;
  astronaut_id?: string;
  heart_rate?: number;
  hrv?: number;
  spo2?: number;
  respiratory_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  body_temperature?: number;
  sleep_hours?: number;
  activity_level?: number;
  recorded_at: string;
  source?: string;
  data_quality?: string;
  isSimulated?: boolean;
}

export interface Baseline {
  metric_name: string;
  mean: number;
  std_dev: number;
  sample_count: number;
  version: number;
}

export interface ContributingFactor {
  name: string;
  metric: string;
  observed: number | string;
  unit: string;
  baseline: number | string | null;
  zScore: number | null;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  weightPercent: number;
  impact: string;
}

export interface RiskAssessment {
  status: 'nominal' | 'warning';
  riskScore: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  severity: 'green' | 'yellow' | 'orange' | 'red';
  contributingFactors: ContributingFactor[];
  explanation: string;
  recommendedActions: string[];
  modelVersion: string;
  evaluatedAt: string;
  experimentalMl?: {
    score?: number;
    flagged?: boolean;
    model?: string;
    note?: string;
    label?: string;
  } | null;
  disclaimer: string;
  alert?: HealthAlert | null;
}

export interface HealthAlert {
  id: string;
  astronaut_id: string;
  astronaut_name?: string;
  astronaut_callsign?: string;
  severity: 'green' | 'yellow' | 'orange' | 'red';
  title: string;
  explanation: string;
  evidence: any;
  actions: string[];
  status: 'open' | 'acknowledged' | 'resolved';
  clinician_notes?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface EnvironmentalReading {
  id?: string;
  radiation_usv_h: number;
  cumulative_dose_msv: number;
  cabin_temp_c: number;
  humidity_pct: number;
  co2_ppm: number;
  cabin_pressure_kpa: number;
  oxygen_pct: number;
  instrument?: string;
  source?: string;
  recorded_at: string;
  isSimulated?: boolean;
}

export interface Mission {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'planned' | 'completed' | 'standby';
  target_orbit: string;
  inclination: string;
  start_at: string;
  end_at?: string | null;
  protocol_config?: any;
  crew_count?: number;
  missionElapsedDays?: number;
}

export interface MissionEvent {
  id: string;
  mission_id?: string;
  astronaut_id?: string;
  astronaut_name?: string;
  astronaut_callsign?: string;
  event_type: 'eva' | 'exercise' | 'medical_alert' | 'checkin' | 'telemetry_anomaly' | 'protocol_review' | 'solar_event' | 'sleep_cycle';
  title: string;
  description?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  created_at: string;
}

export interface AssistantMessage {
  id: string;
  astronaut_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources: string[];
  created_at: string;
}

export interface SimulatorStatus {
  isRunning: boolean;
  activeScenario: string | null;
  scenarioTargetId: string | null;
  scenarioTicksRemaining: number;
  cadenceMs: number;
  isSimulated: boolean;
  engine: string;
}
