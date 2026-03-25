import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420, padding: '0 24px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', letterSpacing: 4, marginBottom: 8 }}>
            <span style={{ color: 'var(--accent)' }}>SKY</span>
            <span style={{ color: 'var(--text2)' }}>PORTAL</span>
          </div>
          <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: 3 }}>
            CYBERSECURITY TRAINING PLATFORM
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text2)',
            letterSpacing: 2, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ color: 'var(--accent)' }}>▸</span> AUTHENTICATE
          </h1>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              color: 'var(--red)', fontSize: '0.85rem', marginBottom: 20,
              fontFamily: 'var(--font-mono)'
            }}>
              ✗ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="USERNAME" value={form.username}
              onChange={v => setForm(f => ({...f, username: v}))}
              placeholder="your_handle" autoComplete="username" />
            <Field label="PASSWORD" type="password" value={form.password}
              onChange={v => setForm(f => ({...f, password: v}))}
              placeholder="••••••••" autoComplete="current-password" />

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--border2)' : 'var(--accent)',
              border: 'none', borderRadius: 'var(--radius)',
              color: loading ? 'var(--text3)' : '#000',
              fontFamily: 'var(--font-mono)', fontWeight: 'bold',
              fontSize: '0.9rem', letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition)',
              marginTop: 8
            }}>
              {loading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}
            </button>
          </form>

          <div style={{
            marginTop: 24, textAlign: 'center',
            color: 'var(--text3)', fontSize: '0.85rem'
          }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)' }}>Register here</Link>
          </div>
        </div>

        <div style={{
          textAlign: 'center', marginTop: 20,
          color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: 2
        }}>
          AUTHORIZED ACCESS ONLY
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem', color: 'var(--text3)', letterSpacing: 2, marginBottom: 8
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          width: '100%', padding: '10px 14px',
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', color: 'var(--text)',
          fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
          outline: 'none', transition: 'border-color var(--transition)'
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border2)'}
      />
    </div>
  );
}
