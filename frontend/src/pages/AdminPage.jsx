import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [containers, setContainers] = useState([]);
  const [users, setUsers] = useState([]);
  const [labs, setLabs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [s, c, u, l] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/containers'),
        api.get('/admin/users'),
        api.get('/admin/labs'),
      ]);
      setStats(s); setContainers(c); setUsers(u); setLabs(l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const cleanup = async () => {
    await api.post('/admin/containers/cleanup');
    fetchData();
  };

  const toggleLab = async (id) => {
    await api.patch(`/admin/labs/${id}/toggle`);
    fetchData();
  };

  const TABS = ['overview', 'containers', 'users', 'labs'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 3 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontSize: '0.7rem', letterSpacing: 3, marginBottom: 8 }}>
          ⚡ ADMINISTRATOR
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px',
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === t ? 'var(--orange)' : 'transparent'}`,
            color: tab === t ? 'var(--orange)' : 'var(--text3)',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
            letterSpacing: 1, cursor: 'pointer',
            transition: 'all var(--transition)'
          }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <StatCard label="Users" value={stats?.totalUsers} color="var(--accent)" />
            <StatCard label="Active Labs" value={stats?.activeContainers} color="var(--orange)" />
            <StatCard label="Total Labs" value={stats?.totalLabs} color="var(--purple)" />
            <StatCard label="Completions" value={stats?.totalCompletions} color="var(--green)" />
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: 3, color: 'var(--text3)', marginBottom: 16 }}>
              RECENT FLAG ATTEMPTS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                  {['User', 'Lab', 'Flag', 'Result', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 400, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.recentAttempts?.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--accent)' }}>{a.username}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text2)' }}>{a.lab_title}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.submitted_flag}
                    </td>
                    <td style={{ padding: '8px 12px', color: a.is_correct ? 'var(--green)' : 'var(--red)' }}>
                      {a.is_correct ? '✓ CORRECT' : '✗ WRONG'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text3)' }}>
                      {new Date(a.attempted_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Containers */}
      {tab === 'containers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {containers.length} active container{containers.length !== 1 ? 's' : ''}
            </div>
            <button onClick={cleanup} style={{
              padding: '8px 16px', background: 'transparent',
              border: '1px solid var(--orange)', borderRadius: 'var(--radius)',
              color: 'var(--orange)', fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem', cursor: 'pointer'
            }}>CLEANUP EXPIRED</button>
          </div>
          <Table
            cols={['User', 'Lab', 'Port', 'Status', 'Started', 'Expires']}
            rows={containers.map(c => [
              <span style={{ color: 'var(--accent)' }}>{c.username}</span>,
              c.lab_title,
              <a href={c.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent2)', fontFamily: 'var(--font-mono)' }}>{c.host_port}</a>,
              <span style={{ color: c.status === 'running' ? 'var(--green)' : 'var(--orange)' }}>{c.status}</span>,
              new Date(c.started_at).toLocaleTimeString(),
              new Date(c.expires_at).toLocaleTimeString()
            ])}
          />
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <Table
          cols={['Username', 'Email', 'Role', 'Completed', 'Joined', 'Last Login']}
          rows={users.map(u => [
            <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{u.username}</span>,
            u.email,
            <span style={{ color: u.role === 'admin' ? 'var(--orange)' : 'var(--text2)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{u.role}</span>,
            <span style={{ color: 'var(--green)' }}>{u.completed_labs}</span>,
            new Date(u.created_at).toLocaleDateString(),
            u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'
          ])}
        />
      )}

      {/* Labs */}
      {tab === 'labs' && (
        <Table
          cols={['Title', 'Category', 'Difficulty', 'Completions', 'Active', 'Toggle']}
          rows={labs.map(l => [
            l.title,
            l.category_name,
            l.difficulty,
            <span style={{ color: 'var(--green)' }}>{l.completion_count}</span>,
            <span style={{ color: l.is_active ? 'var(--green)' : 'var(--red)' }}>{l.is_active ? 'YES' : 'NO'}</span>,
            <button onClick={() => toggleLab(l.id)} style={{
              padding: '4px 10px', background: 'transparent',
              border: `1px solid ${l.is_active ? 'var(--red)' : 'var(--green)'}`,
              borderRadius: 'var(--radius)',
              color: l.is_active ? 'var(--red)' : 'var(--green)',
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer'
            }}>
              {l.is_active ? 'DISABLE' : 'ENABLE'}
            </button>
          ])}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px'
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', color, fontSize: '1.8rem', fontWeight: 'bold', marginBottom: 4 }}>
        {value ?? '—'}
      </div>
      <div style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );
}

function Table({ cols, rows }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
            {cols.map(c => <th key={c} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text3)', fontWeight: 400, letterSpacing: 1, whiteSpace: 'nowrap' }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={cols.length} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text3)' }}>No data</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '10px 16px', color: 'var(--text2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
