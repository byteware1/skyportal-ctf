import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const DIFFICULTY_COLOR = { Apprentice: '#00ff88', Practitioner: '#00e5ff', Expert: '#ff8c00' };
const CATEGORY_ICONS = {
  'sql-injection': '🗄', 'xss': '💉', 'authentication': '🔐',
  'access-control': '🔓', 'cryptography': '🔑'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/progress'),
      api.get('/containers/my')
    ]).then(([prog, conts]) => {
      setProgress(prog);
      setContainers(conts);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  const pct = progress?.completionPercentage || 0;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.7rem', letterSpacing: 3, marginBottom: 8 }}>
          WELCOME BACK
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: 1 }}>
          <span style={{ color: 'var(--accent)' }}>{user?.username}</span>
          <span style={{ color: 'var(--text2)' }}>@skyportal</span>
        </h1>
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: 4 }}>
          {user?.role === 'admin' ? '⚡ PLATFORM ADMINISTRATOR' : '◉ SECURITY RESEARCHER'}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Labs Completed" value={progress?.completedLabs || 0} icon="✓" color="var(--green)" />
        <StatCard label="Total Labs" value={progress?.totalLabs || 0} icon="⬢" color="var(--accent)" />
        <StatCard label="Completion" value={`${pct}%`} icon="◎" color="var(--purple)" />
        <StatCard label="Active Sessions" value={containers.length} icon="▶" color="var(--orange)" />
      </div>

      {/* Progress bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: 2, color: 'var(--text2)' }}>
            OVERALL PROGRESS
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.9rem' }}>
            {progress?.completedLabs || 0} / {progress?.totalLabs || 0}
          </span>
        </div>
        <div style={{
          height: 8, background: 'var(--border2)', borderRadius: 4, overflow: 'hidden'
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--green))',
            borderRadius: 4, transition: 'width 1s ease',
            boxShadow: '0 0 10px rgba(0,229,255,0.4)'
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Category progress */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px'
        }}>
          <SectionTitle>CATEGORY PROGRESS</SectionTitle>
          {progress?.categories?.map(cat => (
            <CategoryRow key={cat.id} cat={cat} />
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active labs */}
          {containers.length > 0 && (
            <div style={{
              background: 'var(--surface)', border: '1px solid rgba(255,140,0,0.3)',
              borderRadius: 'var(--radius-lg)', padding: '24px'
            }}>
              <SectionTitle color="var(--orange)">⚡ ACTIVE SESSIONS</SectionTitle>
              {containers.map((c, i) => (
                <div key={i} style={{
                  padding: '12px', background: 'var(--bg2)',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  marginBottom: 8
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{c.labTitle}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--green)' }}>● {c.status}</span>
                    <span>port: {c.port}</span>
                    <span>expires: {new Date(c.expiresAt).toLocaleTimeString()}</span>
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{
                    display: 'inline-block', marginTop: 8, padding: '4px 10px',
                    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                    borderRadius: 'var(--radius)', color: 'var(--accent)',
                    fontSize: '0.75rem', fontFamily: 'var(--font-mono)'
                  }}>→ OPEN LAB</a>
                </div>
              ))}
            </div>
          )}

          {/* Recent completions */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px', flex: 1
          }}>
            <SectionTitle>RECENT COMPLETIONS</SectionTitle>
            {!progress?.recentCompletions?.length ? (
              <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '12px 0' }}>
                No completions yet. <Link to="/labs">Start a lab →</Link>
              </div>
            ) : (
              progress.recentCompletions.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--green-dim)', border: '1px solid var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: 'var(--green)', flexShrink: 0
                  }}>✓</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(c.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: DIFFICULTY_COLOR[c.difficulty], fontFamily: 'var(--font-mono)' }}>
                    {c.difficulty?.slice(0,3).toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 16, right: 16,
        fontSize: '1.2rem', opacity: 0.2, color
      }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-mono)', color, fontSize: '1.8rem', fontWeight: 'bold', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );
}

function CategoryRow({ cat }) {
  const pct = cat.total_labs > 0 ? Math.round((cat.completed_labs / cat.total_labs) * 100) : 0;
  const icon = CATEGORY_ICONS[cat.slug] || '🔧';
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon} {cat.name}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>
          {cat.completed_labs}/{cat.total_labs}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: cat.color || 'var(--accent)',
          borderRadius: 2, transition: 'width 0.8s ease'
        }} />
      </div>
    </div>
  );
}

function SectionTitle({ children, color = 'var(--text3)' }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: 3,
      color, marginBottom: 16
    }}>{children}</div>
  );
}

function PageLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 3 }}>LOADING...</div>
    </div>
  );
}
