import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const DIFF_COLOR = { Apprentice: '#00ff88', Practitioner: '#00e5ff', Expert: '#ff8c00' };
const DIFF_BG = { Apprentice: 'rgba(0,255,136,0.08)', Practitioner: 'rgba(0,229,255,0.08)', Expert: 'rgba(255,140,0,0.08)' };

export default function LabsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/labs').then(setCategories).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalLabs = categories.reduce((n, c) => n + c.labs.length, 0);
  const completedLabs = categories.reduce((n, c) => n + c.labs.filter(l => l.isCompleted).length, 0);

  const filtered = categories.map(cat => ({
    ...cat,
    labs: cat.labs.filter(lab => {
      const matchFilter = filter === 'all' || (filter === 'completed' && lab.isCompleted) || (filter === 'incomplete' && !lab.isCompleted);
      const matchSearch = !search || lab.title.toLowerCase().includes(search.toLowerCase()) || lab.description.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
  })).filter(cat => cat.labs.length > 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 3 }}>LOADING LABS...</div>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: '0.7rem', letterSpacing: 3, marginBottom: 8 }}>
          TRAINING MODULES
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Security Labs</h1>
        <div style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: 4 }}>
          {completedLabs} of {totalLabs} labs completed
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <input
          placeholder="Search labs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)',
            fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {['all', 'completed', 'incomplete'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px',
            background: filter === f ? 'var(--accent-dim)' : 'var(--surface)',
            border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', color: filter === f ? 'var(--accent)' : 'var(--text2)',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: 1,
            cursor: 'pointer', transition: 'all var(--transition)'
          }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Lab categories */}
      {filtered.map(cat => (
        <div key={cat.slug} style={{ marginBottom: 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            paddingBottom: 12, borderBottom: `1px solid ${cat.color}30`
          }}>
            <div style={{
              width: 8, height: 24, borderRadius: 2,
              background: cat.color || 'var(--accent)'
            }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: 1 }}>{cat.name}</h2>
            <span style={{
              padding: '2px 10px', borderRadius: 12,
              background: `${cat.color}15`, border: `1px solid ${cat.color}40`,
              color: cat.color, fontSize: '0.75rem', fontFamily: 'var(--font-mono)'
            }}>
              {cat.labs.filter(l => l.isCompleted).length}/{cat.labs.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {cat.labs.map(lab => <LabCard key={lab.id} lab={lab} catColor={cat.color} />)}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
          <div style={{ fontFamily: 'var(--font-mono)' }}>No labs match your filter</div>
        </div>
      )}
    </div>
  );
}

function LabCard({ lab, catColor }) {
  return (
    <Link to={`/labs/${lab.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${lab.isCompleted ? 'rgba(0,255,136,0.25)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)', padding: '20px',
        transition: 'all var(--transition)', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        height: '100%'
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = catColor || 'var(--accent)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 30px ${catColor || 'var(--accent)'}20`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = lab.isCompleted ? 'rgba(0,255,136,0.25)' : 'var(--border)';
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* Completed indicator */}
        {lab.isCompleted && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--green)', color: '#000',
            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
            padding: '3px 10px', borderBottomLeftRadius: 'var(--radius)',
            fontWeight: 'bold', letterSpacing: 1
          }}>SOLVED</div>
        )}

        {/* Active container indicator */}
        {lab.hasActiveContainer && (
          <div style={{
            position: 'absolute', top: lab.isCompleted ? 22 : 0, right: 0,
            background: 'rgba(255,140,0,0.9)', color: '#000',
            fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
            padding: '3px 10px', borderBottomLeftRadius: 'var(--radius)',
            fontWeight: 'bold', letterSpacing: 1
          }}>● ACTIVE</div>
        )}

        {/* Difficulty badge */}
        <div style={{
          display: 'inline-block', padding: '3px 10px',
          background: DIFF_BG[lab.difficulty],
          border: `1px solid ${DIFF_COLOR[lab.difficulty]}50`,
          borderRadius: 12, color: DIFF_COLOR[lab.difficulty],
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: 1,
          marginBottom: 12
        }}>
          {lab.difficulty?.toUpperCase()}
        </div>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.4, color: 'var(--text)' }}>
          {lab.title}
        </h3>
        <p style={{ color: 'var(--text3)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 14 }}>
          {lab.description.length > 100 ? lab.description.slice(0, 100) + '...' : lab.description}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text3)'
        }}>
          <span>⏱ {lab.timeoutMinutes}min</span>
          <span style={{ color: 'var(--accent)' }}>→ View Lab</span>
        </div>
      </div>
    </Link>
  );
}
