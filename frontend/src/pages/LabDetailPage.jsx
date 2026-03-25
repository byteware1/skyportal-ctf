import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

const DIFF_COLOR = { Apprentice: '#00ff88', Practitioner: '#00e5ff', Expert: '#ff8c00' };

export default function LabDetailPage() {
  const { slug } = useParams();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [flag, setFlag] = useState('');
  const [flagResult, setFlagResult] = useState(null);
  const [hints, setHints] = useState([]);
  const [revealedHints, setRevealedHints] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [labHost] = useState(window.location.hostname);

  const fetchLab = useCallback(async () => {
    try {
      const data = await api.get(`/labs/${slug}`);
      setLab(data);
      setHints(data.hints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchLab(); }, [fetchLab]);

  // Countdown timer
  useEffect(() => {
    if (!lab?.containerExpiresAt) return;
    const tick = () => {
      const diff = new Date(lab.containerExpiresAt) - Date.now();
      if (diff <= 0) { setTimeLeft(null); fetchLab(); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lab?.containerExpiresAt, fetchLab]);

  const startLab = async () => {
    setActionLoading(true);
    try {
      await api.post(`/containers/start/${slug}`);
      await fetchLab();
    } catch (err) {
      alert(err.message || 'Failed to start lab');
    } finally {
      setActionLoading(false);
    }
  };

  const stopLab = async () => {
    if (!window.confirm('Stop this lab? Your progress in the container will be lost.')) return;
    setActionLoading(true);
    try {
      await api.post(`/containers/stop/${slug}`);
      await fetchLab();
    } catch (err) {
      alert(err.message || 'Failed to stop lab');
    } finally {
      setActionLoading(false);
    }
  };

  const submitFlag = async (e) => {
    e.preventDefault();
    if (!flag.trim()) return;
    try {
      const result = await api.post('/flags/submit', { labSlug: slug, flag: flag.trim() });
      setFlagResult(result);
      if (result.correct) {
        fetchLab();
        setFlag('');
      }
    } catch (err) {
      setFlagResult({ correct: false, message: err.message });
    }
  };

  const getHint = async (index) => {
    if (revealedHints[index]) return;
    try {
      const data = await api.post(`/labs/${slug}/hint/${index}`);
      setRevealedHints(prev => ({ ...prev, [index]: data.hint }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 3 }}>LOADING...</div>
    </div>
  );

  if (!lab) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: 'var(--red)' }}>Lab not found. <Link to="/labs">← Back to Labs</Link></div>
    </div>
  );

  const labUrl = lab.containerPort ? `http://${labHost}:${lab.containerPort}` : null;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>
        <Link to="/labs" style={{ color: 'var(--accent)' }}>Labs</Link>
        <span style={{ margin: '0 8px' }}>›</span>
        <span style={{ color: 'var(--text3)' }}>{lab.category?.name}</span>
        <span style={{ margin: '0 8px' }}>›</span>
        <span style={{ color: 'var(--text)' }}>{lab.title}</span>
      </div>

      {/* Header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <Badge color={lab.category?.color}>{lab.category?.name}</Badge>
              <Badge color={DIFF_COLOR[lab.difficulty]}>{lab.difficulty}</Badge>
              {lab.isCompleted && <Badge color="var(--green)">✓ SOLVED</Badge>}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>{lab.title}</h1>
            <p style={{ color: 'var(--text2)', lineHeight: 1.7, maxWidth: 600 }}>{lab.description}</p>
          </div>

          {/* Timer */}
          {timeLeft && (
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--orange)',
              borderRadius: 'var(--radius)', padding: '12px 20px', textAlign: 'center',
              minWidth: 100
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.65rem', letterSpacing: 2, marginBottom: 4 }}>
                EXPIRES IN
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontSize: '1.4rem', fontWeight: 'bold' }}>
                {timeLeft}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left column */}
        <div>
          {/* Objectives */}
          {lab.objectives?.length > 0 && (
            <Section title="OBJECTIVES">
              {lab.objectives.map((obj, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                    marginTop: 2
                  }}>{i + 1}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.9rem', lineHeight: 1.6 }}>{obj}</div>
                </div>
              ))}
            </Section>
          )}

          {/* Hints */}
          {hints.length > 0 && (
            <Section title="HINTS">
              {hints.map((_, i) => (
                <div key={i} style={{
                  marginBottom: 8, border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: revealedHints[i] ? 'rgba(0,136,255,0.08)' : 'var(--bg2)',
                    borderBottom: revealedHints[i] ? '1px solid rgba(0,136,255,0.2)' : 'none'
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                      💡 Hint {i + 1}
                    </span>
                    {!revealedHints[i] && (
                      <button onClick={() => getHint(i)} style={{
                        padding: '4px 12px', background: 'transparent',
                        border: '1px solid rgba(0,136,255,0.4)', borderRadius: 'var(--radius)',
                        color: 'var(--accent2)', fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem', cursor: 'pointer'
                      }}>REVEAL</button>
                    )}
                  </div>
                  {revealedHints[i] && (
                    <div style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      {revealedHints[i]}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Flag submission */}
          <Section title="SUBMIT FLAG">
            {lab.isCompleted ? (
              <div style={{
                padding: '16px', background: 'var(--green-dim)',
                border: '1px solid var(--green)', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <span style={{ fontSize: '1.5rem' }}>🎉</span>
                <div>
                  <div style={{ color: 'var(--green)', fontWeight: 600 }}>Lab Completed!</div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    Solved on {new Date(lab.completedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: 14 }}>
                  Found the flag? Submit it here. Flags are in the format <code style={{ color: 'var(--accent)', background: 'var(--bg2)', padding: '2px 6px', borderRadius: 3, fontSize: '0.8rem' }}>FLAG{'{'} ... {'}'}</code>
                </p>
                <form onSubmit={submitFlag} style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={flag}
                    onChange={e => { setFlag(e.target.value); setFlagResult(null); }}
                    placeholder="FLAG{...}"
                    style={{
                      flex: 1, padding: '10px 14px',
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)', fontSize: '0.9rem', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button type="submit" style={{
                    padding: '10px 20px',
                    background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--radius)', color: '#000',
                    fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                    fontSize: '0.85rem', cursor: 'pointer', letterSpacing: 1
                  }}>SUBMIT</button>
                </form>
                {flagResult && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: flagResult.correct ? 'var(--green-dim)' : 'var(--red-dim)',
                    border: `1px solid ${flagResult.correct ? 'var(--green)' : 'var(--red)'}`,
                    color: flagResult.correct ? 'var(--green)' : 'var(--red)',
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem'
                  }}>
                    {flagResult.correct ? '✓' : '✗'} {flagResult.message}
                  </div>
                )}
              </>
            )}
          </Section>
        </div>

        {/* Right column - Lab control */}
        <div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px', position: 'sticky', top: 24
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: 3, color: 'var(--text3)', marginBottom: 16 }}>
              LAB ENVIRONMENT
            </div>

            {/* Status */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: lab.hasActiveContainer ? 'var(--green)' : 'var(--text3)',
                  boxShadow: lab.hasActiveContainer ? '0 0 6px var(--green)' : 'none',
                  animation: lab.hasActiveContainer ? 'pulse 2s infinite' : 'none'
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                  {lab.hasActiveContainer ? 'RUNNING' : 'IDLE'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                Timeout: {lab.timeoutMinutes} minutes
              </div>
            </div>

            {/* Lab URL */}
            {lab.hasActiveContainer && labUrl && (
              <div style={{
                marginBottom: 16, padding: '10px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text3)', letterSpacing: 2, marginBottom: 6 }}>
                  LAB URL
                </div>
                <a href={labUrl} target="_blank" rel="noreferrer" style={{
                  color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem', wordBreak: 'break-all'
                }}>
                  {labUrl}
                </a>
              </div>
            )}

            {/* Actions */}
            {!lab.hasActiveContainer ? (
              <button onClick={startLab} disabled={actionLoading} style={{
                width: '100%', padding: '12px',
                background: actionLoading ? 'var(--border2)' : 'var(--accent)',
                border: 'none', borderRadius: 'var(--radius)',
                color: '#000', fontFamily: 'var(--font-mono)',
                fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: 1,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition)'
              }}>
                {actionLoading ? '[ LAUNCHING... ]' : '▶  START LAB'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href={labUrl} target="_blank" rel="noreferrer" style={{
                  display: 'block', padding: '12px', textAlign: 'center',
                  background: 'var(--green-dim)', border: '1px solid var(--green)',
                  borderRadius: 'var(--radius)', color: 'var(--green)',
                  fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                  fontSize: '0.9rem', letterSpacing: 1, textDecoration: 'none'
                }}>
                  ↗  OPEN LAB
                </a>
                <button onClick={stopLab} disabled={actionLoading} style={{
                  padding: '10px', background: 'transparent',
                  border: '1px solid var(--red)', borderRadius: 'var(--radius)',
                  color: 'var(--red)', fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem', letterSpacing: 1, cursor: 'pointer'
                }}>
                  ■  STOP LAB
                </button>
              </div>
            )}

            <div style={{
              marginTop: 20, padding: '12px',
              background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.15)',
              borderRadius: 'var(--radius)', fontSize: '0.75rem', color: 'var(--text3)',
              fontFamily: 'var(--font-mono)', lineHeight: 1.6
            }}>
              ⚠ Labs run in isolated Docker containers. Auto-deleted after timeout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: 3, color: 'var(--text3)', marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12,
      background: `${color}15`, border: `1px solid ${color}40`,
      color, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: 1
    }}>
      {children}
    </span>
  );
}
