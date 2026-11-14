import React, { useState, useEffect, useRef } from 'react';
import {
  BotMessageSquare,
  Send,
  User,
  ShieldAlert,
  Sparkles,
  Trash2,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Astronaut, AssistantMessage } from '../types';
import { request } from '../api';

interface AiMedicalAssistantViewProps {
  crew: Astronaut[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const AiMedicalAssistantView: React.FC<AiMedicalAssistantViewProps> = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeAstro = crew.find(a => a.id === selectedAstronautId) || crew[0];

  const fetchHistory = () => {
    if (!activeAstro) return;
    request<AssistantMessage[]>(`/api/assistant/history?astronautId=${activeAstro.id}`)
      .then(res => setMessages(res || []))
      .catch(err => console.error('Failed to load chat history:', err));
  };

  useEffect(() => {
    fetchHistory();
  }, [activeAstro?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (questionToSend?: string) => {
    const q = questionToSend || inputQuestion;
    if (!q.trim() || !activeAstro) return;

    setInputQuestion('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: AssistantMessage = {
      id: 'temp-' + Date.now(),
      astronaut_id: activeAstro.id,
      role: 'user',
      content: q,
      sources: [],
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await request('/api/assistant/query', {
        method: 'POST',
        body: {
          question: q,
          astronautId: activeAstro.id
        }
      });

      const aiMsg: AssistantMessage = {
        id: 'resp-' + Date.now(),
        astronaut_id: activeAstro.id,
        role: 'assistant',
        content: res.answer,
        sources: res.sources || [],
        created_at: res.timestamp || new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      alert('Assistant query error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!activeAstro || !confirm('Clear all conversation history for this astronaut?')) return;
    try {
      await request(`/api/assistant/history?astronautId=${activeAstro.id}`, { method: 'DELETE' });
      setMessages([]);
    } catch (err: any) {
      alert('Clear failed: ' + err.message);
    }
  };

  const samplePrompts = [
    'Summarize my current health status',
    'Evaluate my resting heart rate trend',
    'Why is there an active medical alert?',
    'What are the station atmospheric conditions?',
    'Review NASA Protocol DEMO-SLEEP-01',
    'What are the fatigue countermeasures?'
  ];

  return (
    <div className="page-view" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '12px' }}>
        <div>
          <h1 className="page-title">
            <BotMessageSquare color="var(--cyan)" size={24} />
            Flight Surgeon AI Medical Copilot
          </h1>
          <p className="page-subtitle">
            Autonomous medical intelligence grounded in telemetry, baseline deviations, and NASA protocols
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

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleClearHistory}
            title="Clear Chat History"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Chat Area Container */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <BotMessageSquare size={48} color="var(--cyan)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>
                AstroVital Flight Surgeon AI Ready
              </h3>
              <p style={{ fontSize: '13px', maxWidth: '480px', margin: '8px auto 20px', lineHeight: '1.5' }}>
                Ask questions regarding real-time biometrics, sleep debt, active risk scores, station environmental conditions, or approved NASA flight health protocols.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    className="scenario-pill"
                    onClick={() => handleSend(p)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(m => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {isUser ? <User size={12} /> : <BotMessageSquare size={12} color="var(--cyan)" />}
                    <span>{isUser ? 'You' : 'Flight Surgeon AI'}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    style={{
                      background: isUser ? 'rgba(0, 240, 255, 0.15)' : 'var(--bg-panel)',
                      border: `1px solid ${isUser ? 'var(--cyan)' : 'var(--border-line)'}`,
                      borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      boxShadow: isUser ? '0 0 15px rgba(0, 240, 255, 0.1)' : 'none'
                    }}
                  >
                    {m.content}
                  </div>

                  {/* Sources tag for assistant */}
                  {!isUser && Array.isArray(m.sources) && m.sources.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {m.sources.map((s, i) => (
                        <span key={i} style={{ fontSize: '10px', color: 'var(--cyan)', background: 'var(--cyan-dim)', padding: '2px 6px', borderRadius: '4px' }}>
                          Source: {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', fontSize: '12px', fontStyle: 'italic' }}>
              <BotMessageSquare size={14} className="animate-spin" /> Analyzing flight telemetry and protocols...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length > 0 && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-line)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {samplePrompts.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                className="scenario-pill"
                onClick={() => handleSend(p)}
                style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-line)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(9, 14, 28, 0.95)'
          }}
        >
          <input
            type="text"
            placeholder={`Ask Flight Surgeon AI about ${activeAstro?.display_name}'s vitals, protocols, or environment...`}
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            disabled={loading}
            style={{ flex: 1 }}
          />

          <button
            type="submit"
            className="btn"
            disabled={loading || !inputQuestion.trim()}
            style={{ width: 'auto', padding: '0 20px' }}
          >
            <Send size={15} /> Ask
          </button>
        </form>
      </div>
    </div>
  );
};
