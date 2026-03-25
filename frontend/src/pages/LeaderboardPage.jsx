import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/leaderboard').then(setLeaders).catch(console.error).finally(() => setLoading(false));
  }, []);

  const myRank = leaders.findIndex(l => l.username === user?.username) + 1;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.7rem', letterSpacing: 3, marginBottom: 8 }}>
          HALL OF FAME
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Leaderboard</h1>
        {myRank > 0 && (
          <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: 4 }}>
            Your rank: #{myRank}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', padding: 40 }}>
          LOADING...
        </div>
      ) : leaders.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏆</div>
          <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            No completions yet. Be the first to solve a lab!
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden'
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 120px 160px',
            padding: '14px 20px',
            background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            letterSpacing: 2, color: 'var(--text3)'
          }}>
            <span>RANK</span><span>HANDLE</span><span>SOLVED</span><span>LAST SOLVE</span>
          </div>

          {leaders.map((leader, i) => {
            const isMe = leader.username === user?.username;
            const rankColor = i < 3 ? RANK_COLORS[i] : 'var(--text3)';
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 120px 160px',
                padding: '16px 20px', alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                background: isMe ? 'rgba(0,229,255,0.04)' : 'transparent',
                borderLeft: isMe ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background var(--transition)'
              }}>
                {/* Rank */}
                <div style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 'bold',
                  color: rankColor, fontSize: i < 3 ? '1.1rem' : '0.9rem'
                }}>
                  {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
                </div>

                {/* Username */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `linear-gradient(135deg, hsl(${leader.username.charCodeAt(0) * 5}deg 60% 50%), hsl(${leader.username.charCodeAt(0) * 10}deg 80% 60%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 'bold', color: '#000', flexShrink: 0
                  }}>
                    {leader.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: isMe ? 'var(--accent)' : 'var(--text)' }}>
                      {leader.username}
                      {isMe && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>[YOU]</span>}
                    </div>
                  </div>
                </div>

                {/* Solved */}
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 'bold' }}>
                  {leader.completedLabs} labs
                </div>

                {/* Last solve */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text3)' }}>
                  {leader.lastCompletion ? new Date(leader.lastCompletion).toLocaleDateString() : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
