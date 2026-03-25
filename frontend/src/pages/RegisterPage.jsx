import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (v) => setForm(f => ({...f, [key]: v}));

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden', padding: '24px'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(153,69,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', letterSpacing: 4, marginBottom: 8 }}>
            <span style={{ color: 'var(--accent)' }}>SKY</span>
            <span style={{ color: 'var(--text2)' }}>PORTAL</span>
          </div>
          <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: 3 }}>
            CREATE YOUR ACCOUNT
          </div>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '32px',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text2)',
            letterSpacing: 2, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ color: 'var(--green)' }}>▸</span> NEW OPERATIVE
          </h1>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              color: 'var(--red)', fontSize: '0.85rem', marginBottom: 20,
              fontFamily: 'var(--font-mono)'
            }}>✗ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="HANDLE (USERNAME)" value={form.username} onChange={set('username')} placeholder="h4x0r_name" />
            <Field label="EMAIL" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            <Field label="PASSWORD" type="password" value={form.password} onChange={set('password')} placeholder="min. 8 characters" />
            <Field label="CONFIRM PASSWORD" type="password" value={form.confirm} onChange={set('confirm')} placeholder="repeat password" />

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--border2)' : 'var(--green)',
              border: 'none', borderRadius: 'var(--radius)',
              color: '#000', fontFamily: 'var(--font-mono)',
              fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: 2,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition)', marginTop: 8
            }}>
              {loading ? '[ CREATING ACCOUNT... ]' : '[ REGISTER ]'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--accent)' }}>Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem', color: 'var(--text3)', letterSpacing: 2, marginBottom: 6
      }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
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
